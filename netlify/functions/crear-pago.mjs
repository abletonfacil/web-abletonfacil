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
          // El precio de la web es el final, con el IVA ya dentro: Stripe no
          // suma nada encima, separa el IVA de esos euros.
          tax_behavior: "inclusive",
          product_data: {
            name: a.tipo === "pack" ? a.titulo : `Curso: ${a.titulo}`,
            description: a.subtitulo,
            // Categoría fiscal: curso online grabado, en streaming, sin descarga.
            // Managed Payments la necesita para calcular el IVA de cada país.
            tax_code: "txcd_20060158",
          },
        },
      },
    ],
    allow_promotion_codes: true, consent_collection: { terms_of_service: "required" }, custom_text: { terms_of_service_acceptance: { message: "Entiendo que el acceso es inmediato y renuncio al derecho de desistimiento. Acepto las [condiciones de compra](https://abletonfacil.com/condiciones-de-compra)." } }, // cupones y aceptación de condiciones
    // Managed Payments: Stripe es el vendedor oficial y se encarga del IVA,
    // el fraude y las reclamaciones (+3,5 % por venta), pero no admite PayPal
    // ni pago a plazos en España. Con STRIPE_MANAGED_PAYMENTS=no lo apagamos
    // a propósito (desde 2026 Stripe lo activa solo en algunas cuentas si no
    // se le dice que no) y salen los métodos del panel: PayPal, Klarna, SeQura…
    managed_payments: { enabled: process.env.STRIPE_MANAGED_PAYMENTS !== "no" },
    metadata: { compra: slug },
    success_url: `${web}/compra-ok?s={CHECKOUT_SESSION_ID}`,
    cancel_url: `${web}/cursos/${a.tipo === "pack" ? "" : slug}`,
    locale: "es",
  });

  return json({ url: sesion.url });
};

export const config = { path: "/api/crear-pago" };
