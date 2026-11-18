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
import cursosJson from "./cursos.json";
import packsJson from "./packs.json";

export type Leccion = { titulo: string; video: string; gratis: boolean };
export type Curso = {
  titulo: string;
  subtitulo: string;
  nivel: string;
  precio: number;
  color: string;
  portada: string;
  proximamente: boolean;
  provisional: boolean;
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
