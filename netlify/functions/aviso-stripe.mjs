// Stripe avisa aquí cuando alguien paga. Apuntamos su correo y lo que ha
// comprado en Supabase, y así puede entrar en «Mis cursos».
import Stripe from "stripe";
import { json, supabaseAdmin } from "./_comun.mjs";

export default async (req) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const cuerpo = await req.text();
  let evento;
  try {
    evento = await stripe.webhooks.constructEventAsync(
      cuerpo,
      req.headers.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return json({ error: "Firma no válida" }, 400);
  }

  // «completed» llega al pagar con tarjeta o PayPal. Con algunos métodos el
  // dinero se confirma después y llega «async_payment_succeeded».
  const tipos = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (!tipos.includes(evento.type)) return json({ ok: true });

  const s = evento.data.object;
  // «no_payment_required» = pedido de 0 € con un cupón del 100 %: también da acceso.
  if (!["paid", "no_payment_required"].includes(s.payment_status)) {
    return json({ ok: true, pendiente: true });
  }

  const correo = (s.customer_details?.email || "").trim().toLowerCase();
  const compra = s.metadata?.compra;
  if (!correo || !compra) return json({ error: "Faltan datos" }, 400);

  const { error } = await supabaseAdmin()
    .from("compras")
    .upsert(
      { correo, compra, sesion_stripe: s.id, importe: (s.amount_total || 0) / 100 },
      { onConflict: "sesion_stripe" }
    );
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
};

export const config = { path: "/api/aviso-stripe" };
