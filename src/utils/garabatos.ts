// Garabatos «a boli», como en el libro: dibujos de línea con un filtro que
// tiembla un poco (filtro #boli, definido en Base.astro). Se usan con set:html.

const svg = (w: number, h: number, cuerpo: string, clase = "") =>
  `<svg class="gar ${clase}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#boli)" aria-hidden="true">${cuerpo}</svg>`;

const texto = (x: number, y: number, t: string, tam = 17) =>
  `<text x="${x}" y="${y}" font-family="Caveat, cursive" font-size="${tam}" fill="currentColor" stroke="none">${t}</text>`;

export const flecha = (w = 90, h = 60) =>
  svg(w, h, `<path d="M6 10 C ${w * 0.45} 0, ${w * 0.75} ${h * 0.3}, ${w - 14} ${h - 12}"/><path d="M${w - 30} ${h - 14} L${w - 12} ${h - 10} L${w - 14} ${h - 30}"/>`);

export const subrayado = (w = 300) =>
  svg(w, 24, `<path d="M4 14 C ${w * 0.25} 4, ${w * 0.5} 20, ${w * 0.75} 10 S ${w - 30} 8, ${w - 4} 12"/><path d="M${w * 0.15} 20 C ${w * 0.4} 14, ${w * 0.7} 22, ${w * 0.9} 16" stroke-width="1.4" opacity=".7"/>`, "subr");

export const circulo = (w = 240, h = 60) =>
  svg(w, h, `<path d="M${w * 0.55} 6 C ${w * 0.95} 4, ${w - 4} ${h * 0.6}, ${w * 0.6} ${h - 6} S 6 ${h * 0.8}, 8 ${h * 0.45} S ${w * 0.35} 3, ${w * 0.7} 9"/>`, "circ");

export const perilla = () => {
  let marcas = "";
  for (let i = 0; i < 11; i++) {
    const a = ((-225 + i * 27) * Math.PI) / 180;
    marcas += `<path d="M${(45 + Math.cos(a) * 30).toFixed(1)} ${(50 + Math.sin(a) * 30).toFixed(1)} L${(45 + Math.cos(a) * 36).toFixed(1)} ${(50 + Math.sin(a) * 36).toFixed(1)}"/>`;
  }
  return svg(90, 100, `<circle cx="45" cy="50" r="24"/><path d="M45 50 L58 32"/>${marcas}${texto(22, 96, "CUTOFF")}`);
};

export const cascos = () =>
  svg(110, 100, `<path d="M16 62 C 16 20, 94 20, 94 62"/><rect x="8" y="58" width="20" height="32" rx="7"/><rect x="82" y="58" width="20" height="32" rx="7"/><path d="M94 80 C 108 96, 70 100, 60 92"/>`);

export const bombo = () =>
  svg(110, 110, `<circle cx="55" cy="55" r="44"/><circle cx="55" cy="55" r="30"/><path d="M55 11 V20 M55 90 V99 M11 55 H20 M90 55 H99"/>${texto(34, 62, "BUM", 20)}`);

export const cable = (w = 170) =>
  svg(w, 70, `<path d="M4 20 C 40 70, 70 -10, 110 40 S ${w - 40} 60, ${w - 20} 30"/><rect x="${w - 22}" y="22" width="18" height="14" rx="3"/>`);

export const onda = (w = 170) => {
  let d = "M4 30";
  for (let i = 0; i < Math.floor(w / 6); i++) {
    const a = Math.sin(i * 0.7) * Math.exp(-i / 30) * 24 * (i % 2 ? 1 : -1);
    d += ` L${6 + i * 6} ${(30 + a).toFixed(1)}`;
  }
  return svg(w, 60, `<path d="${d}"/>`);
};

export const estrella = () =>
  svg(40, 40, `<path d="M20 4 L24 16 L37 16 L26 24 L30 37 L20 29 L10 37 L14 24 L3 16 L16 16 Z"/>`);

// Cacharros míticos, dibujados a boli
export const ns10 = () =>
  svg(110, 160, `<rect x="10" y="8" width="90" height="144" rx="4"/><circle cx="55" cy="40" r="11"/><circle cx="55" cy="40" r="4"/><circle cx="55" cy="102" r="34"/><circle cx="55" cy="102" r="30" fill="currentColor" fill-opacity=".18" stroke-width="1.2"/><circle cx="55" cy="102" r="9"/>${texto(18, 146, "NS-10", 15)}`);

export const minimoog = () => {
  let teclas = "";
  for (let i = 0; i <= 18; i++) teclas += `<path d="M${22 + i * 10} 96 V126"/>`;
  for (let i = 0; i < 18; i++) if (![2, 6, 9, 13, 16].includes(i % 18)) teclas += `<rect x="${28 + i * 10}" y="96" width="5" height="17" fill="currentColor" stroke="none"/>`;
  let perillas = "";
  for (let f = 0; f < 2; f++) for (let c = 0; c < 9; c++) perillas += `<circle cx="${36 + c * 18}" cy="${34 + f * 22}" r="5"/>`;
  return svg(220, 136, `<path d="M14 82 L26 14 H200 L210 82 Z"/>${perillas}<rect x="8" y="84" width="204" height="44" rx="4"/><rect x="12" y="96" width="8" height="30" rx="2"/>${teclas}${texto(150, 76, "Minimoog", 15)}`);
};

export const mpc = () => {
  let pads = "";
  for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) pads += `<rect x="${50 + c * 22}" y="${70 + f * 22}" width="17" height="17" rx="3"/>`;
  return svg(150, 170, `<rect x="6" y="6" width="138" height="158" rx="8"/><rect x="16" y="16" width="64" height="34" rx="2" fill="currentColor" fill-opacity=".12"/><circle cx="110" cy="33" r="13"/><path d="M110 33 L118 25"/>${pads}<path d="M16 74 h22 M16 90 h22 M16 106 h22 M16 122 h22"/>${texto(16, 156, "MPC", 16)}`);
};

export const casete = () =>
  svg(160, 104, `<rect x="6" y="6" width="148" height="92" rx="8"/><rect x="20" y="16" width="120" height="44" rx="4"/><circle cx="52" cy="38" r="12"/><circle cx="108" cy="38" r="12"/><path d="M52 30 v16 M44 38 h16 M108 30 v16 M100 38 h16"/><path d="M40 98 L48 74 H112 L120 98"/>${texto(30, 58, "mix_final_v7_DEF", 12)}`);

export const sm57 = () =>
  svg(70, 180, `<path d="M24 6 h22 a4 4 0 0 1 4 4 v40 a4 4 0 0 1 -4 4 h-22 a4 4 0 0 1 -4 -4 v-40 a4 4 0 0 1 4 -4 z"/><path d="M24 16 h22 M24 26 h22 M24 36 h22 M24 46 h22"/><path d="M22 54 L28 150 H42 L48 54"/><rect x="27" y="150" width="16" height="22" rx="3"/>${texto(8, 120, "SM57", 15)}`);

export const r808 = () => {
  let c = "";
  for (let i = 0; i < 8; i++) c += `<circle cx="${100 + i * 15}" cy="22" r="5"/>`;
  for (let i = 0; i < 16; i++) c += `<rect x="${12 + i * 13}" y="78" width="9" height="20" rx="2" ${i % 4 === 0 ? 'fill="currentColor" fill-opacity=".35"' : ""}/>`;
  for (let i = 0; i < 10; i++) c += `<circle cx="${22 + i * 21}" cy="54" r="7"/><path d="M${22 + i * 21} 54 L${26 + i * 21} 48"/>`;
  return svg(230, 120, `<rect x="6" y="10" width="218" height="100" rx="6"/><path d="M6 34 H224"/>${texto(14, 28, "TR-808", 18)}${c}`);
};

export const tocadiscos = () =>
  svg(200, 140, `<rect x="6" y="10" width="188" height="122" rx="6"/><circle cx="82" cy="70" r="50"/><circle cx="82" cy="70" r="36" stroke-width="1" opacity=".6"/><circle cx="82" cy="70" r="12"/><circle cx="82" cy="70" r="2" fill="currentColor"/><circle cx="168" cy="30" r="8"/><path d="M168 30 L160 98 L132 112"/><rect x="152" y="104" width="30" height="10" rx="2"/><path d="M178 60 V120" stroke-width="3"/>`);

export const DIBUJOS = { flecha, perilla, cascos, bombo, cable, onda, estrella, ns10, minimoog, mpc, casete, sm57, r808, tocadiscos };
export type Dibujo = keyof typeof DIBUJOS;
