// Cursos de pago y packs.
//
// Los datos viven en cursos.json y packs.json (los usan también las funciones
// de Netlify que cobran y dan acceso). Para cambiar un precio, el título de una
// lección o qué lecciones son gratis, toca esos archivos.
//
// Cada lección tiene:
//   titulo  → lo que se ve en el temario
//   video   → el ID del vídeo en Bunny Stream (vacío = «vídeo en camino»)
//   gratis  → true = cualquiera puede verla sin comprar (lección de muestra)
//   modulo  → opcional. Nombre del módulo: el temario pinta un título cada vez que cambia.
//             La numeración de las lecciones sigue siendo seguida en todo el curso.
import cursosJson from "./cursos.json";
import packsJson from "./packs.json";

export type Leccion = { titulo: string; video: string; gratis: boolean; modulo?: string };
export type Curso = {
  titulo: string;
  subtitulo: string;
  nivel: string;
  precio: number;
  color: string;
  portada: string;
  proximamente: boolean;
  provisional: boolean;
  /** Módulos anunciados que aún no tienen lecciones: salen al final del temario con «Próximamente». */
  modulosProximamente?: string[];
  lecciones: Leccion[];
};
export type Pack = {
  titulo: string;
  subtitulo: string;
  precio: number;
  cursos: string[];
  provisional: boolean;
};

export const cursos = cursosJson as Record<string, Curso>;
export const packs = packsJson as Record<string, Pack>;

export const listaCursos = Object.entries(cursos).map(([slug, c]) => ({ slug, ...c }));
export const listaPacks = Object.entries(packs).map(([slug, p]) => ({ slug, ...p }));

export function euros(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: n % 1 ? 2 : 0 }) + " €";
}

/** Precio de todos los cursos de un pack comprados por separado. */
export function precioSuelto(p: Pack): number {
  return p.cursos.reduce((s, c) => s + (cursos[c]?.precio ?? 0), 0);
}

/** «Módulo 0 · Desde cero» → { num: "Módulo 0", titulo: "Desde cero" }. Sin número: solo título. */
export function partirModulo(m: string): { num: string; titulo: string } {
  const r = m.match(/^(M[oó]dulo\s+\S+)\s*·\s*(.+)$/i);
  return r ? { num: r[1], titulo: r[2] } : { num: "", titulo: m };
}

/** HTML de la cabecera de un módulo (lo usan el temario y «Mis cursos»). */
export function cabeceraModulo(lecciones: Leccion[], i: number): string {
  const m = lecciones[i].modulo;
  if (!m || m === lecciones[i - 1]?.modulo) return "";
  let n = 0, pend = 0;
  for (let j = i; j < lecciones.length && lecciones[j].modulo === m; j++) lecciones[j].video ? n++ : pend++;
  const { num, titulo } = partirModulo(m);
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<li class="modulo-cab"><button type="button" class="modulo-btn" aria-expanded="true">` +
    `<span class="modulo-num">${esc(num || "Módulo")}</span>` +
    `<span class="modulo-tit">${esc(titulo)}</span><span class="modulo-n">${n ? `${n} ${n === 1 ? "lección" : "lecciones"}` : ""}${n && pend ? " · " : ""}${pend ? `${pend} próximamente` : ""}</span>` +
    `<span class="modulo-flecha" aria-hidden="true"></span></button></li>`;
}

/** Cabecera de un módulo que aún no tiene lecciones («Próximamente»). */
export function cabeceraProximamente(m: string): string {
  const { num, titulo } = partirModulo(m);
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<li class="modulo-cab proximamente"><div class="modulo-btn">` +
    `<span class="modulo-num">${esc(num || "Módulo")}</span>` +
    `<span class="modulo-tit">${esc(titulo)}</span><span class="modulo-pronto">Próximamente</span></div></li>`;
}

/** Lecciones que ya tienen vídeo (las demás salen como «Próximamente» y no cuentan). */
export function leccionesHechas(lecciones: Leccion[]): number {
  return lecciones.filter((l) => l.video).length;
}
