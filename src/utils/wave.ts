// Genera una forma de onda falsa y determinista, solo decorativa (como un clip de audio en Live).
export function wave(seed: number): string {
  let x = (seed * 9301) % 233;
  let d = "";
  for (let i = 0; i < 60; i++) {
    x = (x * 9301 + 49297) % 233280;
    const h = 2 + (x / 233280) * 7 * (i % 8 === 0 ? 1.8 : 1);
    d += `M${i * 4 + 1} ${9 - h}V${9 + h}`;
  }
  return `<svg class="wave" viewBox="0 0 240 18" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="2"/></svg>`;
}
