// Stripe avisa aquí cuando alguien paga. Apuntamos su correo y lo que ha
// comprado en Supabase, y así puede entrar en «Mis cursos». Si luego se le
// devuelve el dinero entero (o pierdes una reclamación), se le quita el acceso.
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

  // Devolución completa o reclamación perdida: se quita el acceso a esa compra.
  if (evento.type === "charge.refunded" || evento.type === "charge.dispute.closed") {
    return quitarAcceso(stripe, evento);
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

/**
 * Quita de Supabase la compra ligada a un cobro devuelto entero o a una
 * reclamación que se ha perdido. Una devolución parcial (un descuento que
 * devuelves a mano, por ejemplo) no quita el acceso.
 */
async function quitarAcceso(stripe, evento) {
  let cobro;
  if (evento.type === "charge.refunded") {
    cobro = evento.data.object;
    if (!cobro.refunded) return json({ ok: true, parcial: true });
  } else {
    const reclamacion = evento.data.object;
    if (reclamacion.status !== "lost") return json({ ok: true, reclamacion: reclamacion.status });
    cobro = { payment_intent: reclamacion.payment_intent };
  }
  if (!cobro.payment_intent) return json({ ok: true, sinPago: true });

  // Del cobro a la sesión de pago, que es lo que guardamos en «compras».
  const sesiones = await stripe.checkout.sessions.list({ payment_intent: cobro.payment_intent, limit: 1 });
  const sesion = sesiones.data[0];
  if (!sesion) return json({ ok: true, sinSesion: true });

  const { error } = await supabaseAdmin().from("compras").delete().eq("sesion_stripe", sesion.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, accesoQuitado: sesion.id });
}

export const config = { path: "/api/aviso-stripe" };
