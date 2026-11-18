// Utilidades compartidas por las funciones de los cursos.
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import cursos from "../../src/data/cursos.json";
import packs from "../../src/data/packs.json";

export { cursos, packs };

export function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/** Cliente de Supabase con permisos de administrador (solo en el servidor). */
export function supabaseAdmin() {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !clave) throw new Error("Falta configurar Supabase");
  return createClient(url, clave, { auth: { persistSession: false } });
}

/** Lo que se puede comprar: un curso o un pack. */
export function articulo(slug) {
  if (cursos[slug] && !cursos[slug].proximamente) return { tipo: "curso", ...cursos[slug] };
  if (packs[slug]) return { tipo: "pack", ...packs[slug] };
  return null;
}

/** Compras que dan acceso a un curso: el propio curso o cualquier pack que lo incluya. */
export function comprasQueDanAcceso(curso) {
  return [curso, ...Object.entries(packs).filter(([, p]) => p.cursos.includes(curso)).map(([s]) => s)];
}

/** Enlace firmado y temporal al reproductor de Bunny Stream. */
export function enlaceBunny(videoId, horas = 6) {
  const biblioteca = process.env.BUNNY_LIBRARY_ID;
  const clave = process.env.BUNNY_TOKEN_KEY;
  if (!biblioteca) throw new Error("Falta configurar Bunny");
  const base = `https://iframe.mediadelivery.net/embed/${biblioteca}/${videoId}`;
  if (!clave) return base;
  const caduca = Math.floor(Date.now() / 1000) + horas * 3600;
  const token = createHash("sha256").update(clave + videoId + caduca).digest("hex");
  return `${base}?token=${token}&expires=${caduca}`;
}
