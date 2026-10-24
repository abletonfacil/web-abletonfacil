export const CATEGORIAS = {
  bateria: { nombre: "Batería y ritmo", color: "var(--c-bateria)" },
  bajo: { nombre: "Bajo y graves", color: "var(--c-bajo)" },
  sampling: { nombre: "Sampling y warp", color: "var(--c-sampling)" },
  mezcla: { nombre: "Mezcla", color: "var(--c-mezcla)" },
  sonido: { nombre: "Sonido y efectos", color: "var(--c-sonido)" },
  teoria: { nombre: "Armonía y teoría", color: "var(--c-teoria)" },
  compo: { nombre: "Composición", color: "var(--c-compo)" },
  flujo: { nombre: "Flujo en Ableton", color: "var(--c-flujo)" },
} as const;

export type CategoriaKey = keyof typeof CATEGORIAS;
