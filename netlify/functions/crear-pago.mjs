// Crea la página de pago de Stripe para un curso o un pack.
// La llama el botón «Comprar» de la web.
import Stripe from "stripe";
import { articulo, json } from "./_comun.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  if (!process.env.STRIPE_SECRET_KEY) return json({ error: "El pago aún no está conectado" }, 503);

  const { slug } = await req.json().catch(() => ({}));
  const a = articulo(slug);
  if (!a) return json({ error: "Ese curso no existe" }, 404);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const web = process.env.URL_WEB || new URL(req.url).origin;

  const sesion = await stripe.checkout.sessions.create({
    mode: "payment",
    // Sin «payment_method_types»: Stripe enseña los métodos activados en su
    // panel (tarjeta, Apple Pay, Google Pay, PayPal, Klarna…).
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(a.precio * 100),
          product_data: {
            name: a.tipo === "pack" ? a.titulo : `Curso: ${a.titulo}`,
            description: a.subtitulo,
          },
        },
      },
    ],
    allow_promotion_codes: true, // casilla para cupones de descuento
    customer_creation: "always",
    metadata: { compra: slug },
    success_url: `${web}/compra-ok?s={CHECKOUT_SESSION_ID}`,
    cancel_url: `${web}/cursos/${a.tipo === "pack" ? "" : slug}`,
    locale: "es",
  });

  return json({ url: sesion.url });
};

export const config = { path: "/api/crear-pago" };
