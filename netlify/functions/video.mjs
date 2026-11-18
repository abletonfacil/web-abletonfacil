// Da el enlace del reproductor de una lección.
// Lecciones gratis: a cualquiera. Lecciones de pago: solo a quien ha comprado
// el curso (o un pack que lo incluya).
import { cursos, comprasQueDanAcceso, enlaceBunny, json, supabaseAdmin } from "./_comun.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const curso = url.searchParams.get("curso");
  const n = Number(url.searchParams.get("leccion"));
  const leccion = cursos[curso]?.lecciones?.[n];
  if (!leccion) return json({ error: "Esa lección no existe" }, 404);
  if (!leccion.video) return json({ error: "Vídeo en camino" }, 404);

  if (!leccion.gratis) {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Entra con tu correo para ver esta lección" }, 401);

    const db = supabaseAdmin();
    const { data, error } = await db.auth.getUser(token);
    if (error || !data?.user?.email) return json({ error: "Sesión caducada. Vuelve a entrar" }, 401);

    const { count } = await db
      .from("compras")
      .select("id", { count: "exact", head: true })
      .eq("correo", data.user.email.toLowerCase())
      .in("compra", comprasQueDanAcceso(curso));
    if (!count) return json({ error: "Esta lección es del curso completo" }, 403);
  }

  return json({ url: enlaceBunny(leccion.video) });
};

export const config = { path: "/api/video" };
