// Qué se enseña en la web pública mientras no haya productos ni lecciones reales.
//
// Los datos de ejemplo NO se borran: siguen en productos.json y en las fichas.
// Para volver a enseñarlos, cambia MOSTRAR_EJEMPLOS a true.
import productos from "./productos.json";

export const MOSTRAR_EJEMPLOS = false;

// Lecciones de pago de ejemplo. Mientras estén ocultas, sus fichas se ven
// como las demás (gratis, sin «De pago» ni «Desbloquear por 5 €»).
export const LECCIONES_PAGO_DE_EJEMPLO = ["mezcla-apagada", "loop-tema"];

export const KOFI = "https://ko-fi.com/abletonfacil";

type Producto = {
  tipo: string;
  nombre: string;
  descripcion: string;
  precio: string;
  enlace: string;
  /** Ruta de la foto dentro de public/, p. ej. "/productos/mastil.png". Opcional. */
  imagen?: string;
  /**
   * Opcional. Sin este campo la imagen se ve entera dentro de un marco 16:9.
   * Con él, la imagen llena el marco y se recorta; el valor dice qué parte se queda:
   * "center" (el centro), "50% 60%" (centrado y un poco por debajo de la mitad)...
   */
  imagenEncuadre?: string;
  ejemplo?: boolean;
};

/** Estilo de la foto según su encuadre (ver imagenEncuadre). */
export function estiloImagen(p: { imagenEncuadre?: string }): string | undefined {
  return p.imagenEncuadre ? `object-fit:cover;object-position:${p.imagenEncuadre}` : undefined;
}

const todos = productos as Record<string, Producto>;

/** Productos que se pueden enseñar (sin los de ejemplo, salvo que se activen). */
export const productosVisibles: [string, Producto][] = Object.entries(todos).filter(
  ([, p]) => MOSTRAR_EJEMPLOS || !p.ejemplo
);

/** Devuelve el producto si se puede enseñar; si no, null. */
export function productoVisible(clave?: string): Producto | null {
  if (!clave) return null;
  const p = todos[clave];
  if (!p) return null;
  return MOSTRAR_EJEMPLOS || !p.ejemplo ? p : null;
}

/** El acceso que se enseña en la web: las lecciones de pago de ejemplo salen como gratis. */
export function accesoVisible(f: { slug: string; acceso: "gratis" | "pago" }): "gratis" | "pago" {
  if (f.acceso === "pago" && !MOSTRAR_EJEMPLOS && LECCIONES_PAGO_DE_EJEMPLO.includes(f.slug)) {
    return "gratis";
  }
  return f.acceso;
}
