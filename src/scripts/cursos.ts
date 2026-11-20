// Código del navegador para los cursos: comprar, ver lecciones y entrar con el correo.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_SB = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const CLAVE_SB = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  URL_SB && CLAVE_SB ? createClient(URL_SB, CLAVE_SB) : null;

export function aviso(texto: string) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = texto;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/** Botones «Comprar»: piden a la web la página de pago de Stripe y van allí. */
export function activarCompra() {
  document.querySelectorAll<HTMLButtonElement>("[data-comprar]").forEach((b) => {
    b.addEventListener("click", async () => {
      const original = b.textContent;
      b.disabled = true;
      b.textContent = "Abriendo el pago…";
      try {
        const r = await fetch("/api/crear-pago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: b.dataset.comprar }),
        });
        const d = await r.json().catch(() => ({}));
        if (d.url) {
          location.href = d.url;
          return;
        }
        aviso(d.error || "El pago aún no está conectado");
      } catch {
        aviso("El pago aún no está conectado");
      }
      b.disabled = false;
      b.textContent = original;
    });
  });
}

/** Pone en el reproductor la lección n del curso. */
export async function verLeccion(curso: string, n: number, titulo: string, moverPagina = true) {
  const caja = document.querySelector<HTMLElement>("[data-reproductor]");
  if (!caja) return;
  caja.querySelector(".rep-titulo")!.textContent = titulo;
  const pantalla = caja.querySelector<HTMLElement>(".rep-pantalla")!;
  pantalla.innerHTML = `<span class="rep-msg">Cargando…</span>`;
  document.querySelectorAll("[data-leccion]").forEach((el) =>
    el.toggleAttribute("aria-current", Number((el as HTMLElement).dataset.leccion) === n)
  );
  // En el móvil la lista va debajo del vídeo: al elegir una lección, sube al vídeo.
  if (moverPagina && window.matchMedia("(max-width: 900px)").matches) {
    pantalla.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const cabeceras: Record<string, string> = {};
  const sesion = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (sesion) cabeceras.Authorization = `Bearer ${sesion.access_token}`;

  try {
    const r = await fetch(`/api/video?curso=${curso}&leccion=${n}`, { headers: cabeceras });
    const d = await r.json().catch(() => ({}));
    if (d.url) {
      // Al entrar en la página la lección se carga quieta; al elegirla, arranca sola.
      const src = `${d.url}${d.url.includes("?") ? "&" : "?"}autoplay=${moverPagina ? "true" : "false"}`;
      pantalla.innerHTML = `<iframe src="${src}" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      return;
    }
    pantalla.innerHTML = `<span class="rep-msg">${d.error || "Vídeo en camino"}</span>`;
  } catch {
    pantalla.innerHTML = `<span class="rep-msg">Vídeo en camino</span>`;
  }
  if (moverPagina) pantalla.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/** Clic en una lección del temario. */
export function activarTemario(curso: string, puedeVer: (gratis: boolean) => boolean) {
  document.querySelectorAll<HTMLElement>("[data-leccion]").forEach((el) => {
    el.addEventListener("click", () => {
      const n = Number(el.dataset.leccion);
      const gratis = el.dataset.gratis === "true";
      if (puedeVer(gratis)) {
        verLeccion(curso, n, el.dataset.titulo || "");
      } else {
        document.querySelector("#comprar")?.scrollIntoView({ behavior: "smooth", block: "center" });
        aviso("Esta lección es del curso completo");
      }
    });
  });
}
