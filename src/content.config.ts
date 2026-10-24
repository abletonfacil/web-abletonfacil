import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Lee los archivos directamente de la carpeta /fichas de la raíz del proyecto.
// Así Antonio solo tiene que copiar un .md ahí: no hace falta duplicarlo dentro de src/.
const fichas = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./fichas" }),
  schema: z.object({
    titulo: z.string(),
    slug: z.string(),
    categoria: z.enum([
      "bateria",
      "bajo",
      "sampling",
      "mezcla",
      "sonido",
      "teoria",
      "compo",
      "flujo",
    ]),
    nivel: z.enum(["Principiante", "Intermedio"]),
    acceso: z.enum(["gratis", "pago"]),
    video: z.string().optional().default(""),
    serie: z.string().optional(),
    otras_formas: z.array(z.string()).default([]),
    relacionadas: z.array(z.string()).default([]),
    producto: z.string().optional(),
    ejemplo: z.boolean().default(false),
  }),
});

export const collections = { fichas };
