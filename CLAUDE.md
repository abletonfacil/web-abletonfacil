# Web de abletonfacil

Web donde el usuario escribe el problema que tiene con Ableton Live y encuentra la solución: el reel, los pasos y lo que suele venir después. No es un curso lineal. Cada problema es una **ficha**, y las fichas se enlazan entre sí.

El dueño es Antonio (abletonfacil en Instagram y TikTok). No programa: explícale lo que haces en lenguaje llano y en español de España. Nunca le hables en inglés.

## Referencia visual

`referencia/prototipo.html` es el prototipo aprobado. La web real tiene que verse y comportarse igual: mismos colores, tipografías, buscador, fichas como clips de colores, panel de ficha, tienda y botón de Ko-fi. Ábrelo y cópialo antes de diseñar nada.

## Tecnología

- **Astro**, sitio estático. Fichas como *content collection* desde `src/content/fichas/*.md` (copia ahí las de `fichas/`).
- Buscador en el navegador con **Fuse.js**. Busca en título, `otras_formas`, categoría y resumen. Normaliza tildes y mayúsculas. Debe aguantar faltas («vateria», «compresion»).
- Sin base de datos, sin login y sin pagos propios en esta fase.
- Código en GitHub. Publicación en Vercel o Netlify (plan gratuito).

## Marca (no se cambia sin preguntar)

- Fondo `#1d1d1e`, paneles `#262627` y `#2f2f30`, líneas `#3b3b3c`, texto `#ececea`, texto secundario `#a3a39f`.
- Acento único: amarillo `#E8DC3C` con texto `#14141A` encima. Rojo `#FF3B30` solo para errores.
- Colores de categoría (como clips de Live): batería `#FFA529`, bajo `#F7F47C`, sampling `#F4A3BD`, mezcla `#8BC5FF`, sonido `#03C3D5`, teoría `#B9A4FF`, composición `#8FE388`, flujo `#FFAD56`.
- Tipografías: Inter Tight (títulos), Inter (texto), JetBrains Mono (etiquetas y parámetros de Live).
- Tema oscuro único.

## Páginas

1. **Portada** (`/`): buscador grande, «Lo más buscado», problemas por categoría, tienda resumida.
2. **Ficha** (`/problema/[slug]`): página propia para cada ficha, para que Google la indexe. Título, respuesta corta, vídeo incrustado, pasos, relacionadas, producto recomendado y propina.
3. **Categoría** (`/categoria/[categoria]`).
4. **Tienda** (`/tienda`).
5. **Sobre mí** (`/sobre-mi`).
6. **Aviso legal, privacidad y cookies**: textos base, marcados como pendientes de revisar.

En el pie de todas las páginas: «Ableton y Live son marcas registradas de Ableton AG. abletonfacil no está afiliada a Ableton.» No uses nunca el logo de Ableton ni la palabra «oficial».

## La ficha

Frontmatter de cada archivo:

| Campo | Qué es |
| --- | --- |
| `titulo` | El problema como lo diría el usuario: «No sé…», «Mi … suena…» |
| `slug` | URL de la ficha |
| `categoria` | `bateria`, `bajo`, `sampling`, `mezcla`, `sonido`, `teoria`, `compo`, `flujo` |
| `nivel` | Principiante o Intermedio |
| `acceso` | `gratis` o `pago` |
| `video` | Enlace de Instagram o YouTube. Vacío si aún no hay vídeo |
| `serie` | Opcional, p. ej. «Ableton Live desde 0 #5» |
| `otras_formas` | Cómo lo buscaría un principiante. Es lo que más pesa en el buscador |
| `relacionadas` | Slugs de 3 fichas |
| `producto` | Clave del producto recomendado (ver `src/data/productos`) |
| `ejemplo` | `true` si el contenido es provisional |

El cuerpo es la respuesta corta y luego `## Paso a paso`. Los parámetros de Live van entre comillas invertidas y se pintan como pastillas.

Las fichas con `ejemplo: true` las escribió Claude, no Antonio. Muestra en la ficha una etiqueta discreta «Borrador» hasta que él las revise.

## Vídeos

- Instagram: incrustado oficial (`blockquote.instagram-media` + `//www.instagram.com/embed.js`), cargado solo cuando la ficha está en pantalla.
- YouTube: iframe ligero (miniatura y botón de play; el iframe se carga al pulsar), desde `youtube-nocookie.com`.
- Sin vídeo: hueco con «Vídeo en camino».

## Ko-fi

- Perfil y tienda: https://ko-fi.com/abletonfacil
- Widget flotante de propinas en todas las páginas, con este código, cambiando el texto y los colores a la marca:

```html
<script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'></script>
<script>
  kofiWidgetOverlay.draw('abletonfacil', {
    'type': 'floating-chat',
    'floating-chat.donateButton.text': 'Invítame a un café',
    'floating-chat.donateButton.background-color': '#E8DC3C',
    'floating-chat.donateButton.text-color': '#14141A'
  });
</script>
```

- Lecciones de pago y productos: botón que lleva al producto de Ko-fi. Ko-fi cobra y entrega el enlace al vídeo y los archivos. La web no gestiona pagos.

## Productos

Ahora mismo son de ejemplo. Guárdalos en `src/data/productos.json` con nombre, tipo, descripción, precio, enlace y `ejemplo: true`, para que Antonio solo tenga que cambiar los datos:

- `rackBateria`: Effect Rack · Rack «Pegada» para batería · 6 €
- `rackBajo`: Effect Rack · Rack de bus de bajo · 6 €
- `midiAcordes`: Pack MIDI · Progresiones que funcionan · 8 €
- `proyecto`: Proyecto de Live · Tema completo desglosado · 12 €

## Búsquedas sin resultado

Cuando no hay resultados, la ficha ofrece «Pedir este vídeo». En esta fase guarda la petición con un formulario de Netlify Forms (o el equivalente gratuito si se publica en Vercel) para que a Antonio le lleguen. Es su banco de ideas de reels.

## Textos

- Español de España, tú, léxico peninsular.
- Frases cortas, voz activa, sin guiones largos, sin clichés ni relleno.
- Tono cercano y con algo de humor, como los reels.

## Cómo trabajar con Antonio

- Antes de cambiar algo grande, explícale en dos frases qué vas a hacer.
- Después de cada paso, dile cómo verlo (comando o enlace) y qué debería ver.
- Guarda en Git con mensajes en español.
- Para añadir una ficha nueva le basta con copiar un `.md`, rellenarlo y subirlo. Explícale cómo la primera vez.

## Fases

1. **Ahora:** todo lo de arriba, publicado con un enlace provisional.
2. Después: lecciones de pago reales, búsqueda por significado, generar la ficha desde el guion de cada reel.
3. Más adelante: membresía, asistente que responde con el contenido de la web, vídeos protegidos con login.
