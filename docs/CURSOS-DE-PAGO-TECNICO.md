# Cursos de pago de abletonfacil: documentación técnica

Documento para un programador que tenga que entender, mantener o ampliar la venta de cursos de la web. Recoge qué se montó, por qué y cómo está configurado cada servicio. Última actualización: 18 de noviembre de 2026.

Estado: **primera versión en la rama `cursos-de-pago`**, sin publicar. Las cuentas de los servicios están creadas, pero todavía no se han metido las claves en Netlify ni se ha hecho una compra de prueba completa.

---

## 1. Resumen

La web (Astro, sitio estático en Netlify) vende cursos en vídeo. El alumno:

1. Ve el catálogo y la página de cada curso, con una o dos lecciones de muestra gratis.
2. Paga en Stripe Checkout (página alojada por Stripe).
3. Stripe avisa a la web por webhook y la web apunta su correo y lo que compró en Supabase.
4. El alumno entra en «Mis cursos» con su correo, mediante un enlace mágico (sin contraseña) de Supabase Auth.
5. Cada vez que abre una lección, la web pide al servidor un enlace firmado y temporal al reproductor de Bunny Stream. El servidor solo lo da si el alumno ha comprado ese curso, o un pack que lo incluya.

No hay servidor propio: la lógica de servidor son tres **Netlify Functions**.

```
Navegador ──► /cursos, /cursos/[slug]           (HTML estático, Astro)
   │
   ├─ «Comprar» ──► POST /api/crear-pago ──► Stripe Checkout ──► /compra-ok
   │                                              │
   │                         webhook ◄────────────┘
   │                     POST /api/aviso-stripe ──► Supabase: tabla compras
   │
   ├─ «Mis cursos» ──► Supabase Auth (enlace mágico por correo)
   │                   lee sus filas de «compras» (RLS)
   │
   └─ Lección ──► GET /api/video?curso=&leccion=  (con el token de Supabase)
                  comprueba la compra ──► URL firmada de Bunny (iframe)
```

## 2. Decisiones y por qué

| Decisión | Alternativas descartadas | Motivo |
| --- | --- | --- |
| Todo dentro de la web propia | Hotmart, Teachable, Thinkific, Podia, Kajabi | Marca propia, sin comisión de plataforma, mismo diseño que la web. |
| **Bunny Stream** para los vídeos | YouTube oculto, Vimeo, Cloudflare Stream | Barato (pago por uso), reproductor incluido, URLs firmadas, MediaCage DRM opcional. |
| **Stripe Checkout** para cobrar | Ko-fi, PayPal directo, Lemon Squeezy | Tarjeta, Apple Pay, Google Pay, Klarna y otros pagos a plazos. Cupones nativos. Ko-fi sigue solo para propinas. |
| **Stripe Managed Payments** (Stripe como *merchant of record*) | Llevar el IVA por cuenta propia (OSS) | El dueño no quiere gestionar el IVA europeo de cada país. Cuesta un 3,5 % extra por venta. Se puede desactivar con una variable de entorno. |
| **Supabase** (Auth + Postgres) | Netlify Identity, Memberstack, Auth0 | Plan gratuito suficiente, enlace mágico por correo, RLS para que cada alumno solo vea lo suyo. |
| Acceso por **enlace mágico** | Usuario y contraseña | Sin contraseñas que recordar ni que recuperar. |
| Catálogo en **JSON dentro del repo** | Productos creados en el panel de Stripe | Una sola fuente de verdad para web y funciones. El precio se manda a Stripe en cada sesión con `price_data`. |
| Netlify Functions | Servidor propio, Astro SSR | El sitio sigue siendo estático. Solo tres endpoints. |

## 3. Archivos

Todo en el repo `abletonfacil/web-abletonfacil`, rama `cursos-de-pago`.

| Archivo | Qué hace |
| --- | --- |
| `src/data/cursos.json` | Cursos: título, subtítulo, nivel, precio (€), color, portada, `proximamente`, `provisional` y `lecciones[]` (`titulo`, `video` = GUID de Bunny, `gratis`). **El índice de la lección en el array es su identificador.** |
| `src/data/packs.json` | Packs: título, precio y `cursos[]` (slugs). |
| `src/data/cursos.ts` | Tipos y utilidades para las páginas (`listaCursos`, `euros()`, `precioSuelto()`). |
| `src/pages/cursos/index.astro` | Catálogo y bloque del pack. |
| `src/pages/cursos/[slug].astro` | Página de curso: reproductor, temario (gratis / con candado) y caja de compra. Se genera una página por curso. |
| `src/pages/mis-cursos.astro` | Zona del alumno (todo en el navegador): formulario de acceso, lista de cursos comprados (`?` sin parámetro) y vista del curso (`?curso=slug`). |
| `src/pages/compra-ok.astro` | Página de vuelta tras pagar. |
| `src/components/Temario.astro`, `Reproductor.astro`, `CursoCard.astro` | Piezas de interfaz. |
| `src/scripts/cursos.ts` | Navegador: cliente de Supabase, botón de compra, carga de lecciones en el reproductor. |
| `netlify/functions/_comun.mjs` | Utilidades de servidor: cliente admin de Supabase, búsqueda de curso o pack, compras que dan acceso, firma de URLs de Bunny. |
| `netlify/functions/crear-pago.mjs` | `POST /api/crear-pago`: crea la sesión de Stripe Checkout. |
| `netlify/functions/aviso-stripe.mjs` | `POST /api/aviso-stripe`: webhook de Stripe. Apunta la compra. |
| `netlify/functions/video.mjs` | `GET /api/video`: devuelve la URL firmada del reproductor si hay permiso. |
| `netlify.toml` | `node_bundler = "esbuild"` para empaquetar las funciones con los JSON. |
| `supabase/esquema.sql` | Tabla `compras`, índice, RLS, política y `grant`. |
| `.env.example` | Lista de variables de entorno. |
| `src/styles/global.css` | Estilos de cursos al final, bloque «Cursos de pago». |
| `src/components/Header.astro` | Enlaces «Cursos» y «Mis cursos». En el móvil se oculta «Problemas» para que quepa. |

## 4. Flujos en detalle

### 4.1 Compra

1. Botón `data-comprar="<slug>"` → `fetch POST /api/crear-pago` con `{ slug }`.
2. `crear-pago.mjs`:
   - Busca el slug en cursos (si no es `proximamente`) o en packs.
   - Crea `stripe.checkout.sessions.create` con:
     - `mode: "payment"`, un `line_item` con `price_data` en EUR (precio del JSON × 100).
     - `product_data.tax_code: "txcd_20060158"`: curso online pregrabado, en streaming, sin descarga. Es obligatorio para Managed Payments.
     - `tax_behavior: "inclusive"`: el precio del JSON es el precio final con IVA. Sin esto Stripe sumaba el IVA encima (59 € → 71,39 € en la prueba del 18/11).
     - `allow_promotion_codes: true` (cupones creados en el panel de Stripe).
     - `managed_payments: { enabled: true }`, salvo que `STRIPE_MANAGED_PAYMENTS=no`.
     - `metadata.compra = slug`.
     - `success_url = URL_WEB/compra-ok?s={CHECKOUT_SESSION_ID}` y `cancel_url` a la página del curso.
     - No se pasa `payment_method_types`: Stripe muestra los métodos activados en su panel.
   - Devuelve `{ url }` y el navegador redirige.
3. Si falta `STRIPE_SECRET_KEY`, responde 503 «El pago aún no está conectado» y la web lo muestra en un aviso.

### 4.2 Registro de la compra (webhook)

1. Stripe llama a `POST /api/aviso-stripe` con los eventos `checkout.session.completed` y `checkout.session.async_payment_succeeded`.
2. Se verifica la firma con `stripe.webhooks.constructEventAsync(cuerpo_crudo, cabecera stripe-signature, STRIPE_WEBHOOK_SECRET)`.
3. Si `payment_status === "paid"`, hace `upsert` en `compras` con `{ correo (minúsculas), compra: metadata.compra, sesion_stripe, importe }`, con `onConflict: "sesion_stripe"`. Así es idempotente aunque Stripe reenvíe el evento.
4. Los pagos asíncronos (algunos métodos a plazos o bancarios) llegan primero como `completed` con `unpaid`: se ignoran y se apuntan con `async_payment_succeeded`.

### 4.3 Acceso del alumno

1. `/mis-cursos` crea el cliente de Supabase con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`, que se inyectan en el build.
2. Sin sesión: formulario de correo → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href, shouldCreateUser: true } })`.
3. Al volver del enlace, supabase-js recoge la sesión de la URL.
4. Con sesión: `select compra from compras`. La política RLS solo devuelve las filas cuyo `correo` coincide con el `email` del JWT. Los packs se expanden a sus cursos en el navegador, con `packs.json`.
5. El correo de compra y el de acceso tienen que ser el mismo. Se comparan en minúsculas.

### 4.4 Reproducción de una lección

1. El navegador llama a `GET /api/video?curso=<slug>&leccion=<índice>`, con `Authorization: Bearer <access_token de Supabase>` si hay sesión.
2. `video.mjs`:
   - Si la lección no existe → 404. Si no tiene `video` → 404 «Vídeo en camino».
   - Si **no** es `gratis`: valida el token con `supabase.auth.getUser(token)` usando la clave de servicio, y cuenta las filas de `compras` con ese correo y `compra IN (curso, packs que lo incluyen)`. Si no hay ninguna → 403.
   - Devuelve la URL del iframe de Bunny: `https://iframe.mediadelivery.net/embed/{BUNNY_LIBRARY_ID}/{videoId}`. Si existe `BUNNY_TOKEN_KEY`, le añade `?token=SHA256_hex(clave + videoId + caduca)&expires=caduca` (6 horas).
3. El navegador pinta el iframe.

Las lecciones gratis pasan también por la función, para que funcionen igual cuando se active la seguridad por token en Bunny.

## 5. Modelo de datos (Supabase)

```sql
create table public.compras (
  id bigint generated always as identity primary key,
  correo text not null,          -- en minúsculas
  compra text not null,          -- slug de curso o de pack
  sesion_stripe text unique,     -- id de la sesión de Checkout (idempotencia)
  importe numeric,               -- € cobrados (amount_total / 100)
  creada timestamptz not null default now()
);
create index compras_correo on public.compras (lower(correo));
alter table public.compras enable row level security;
create policy "ver mis compras" on public.compras
  for select to authenticated
  using (lower(correo) = lower(auth.jwt() ->> 'email'));
grant select on public.compras to authenticated;
```

- Desde la web nadie puede escribir: las escrituras solo las hace la función, con la `service_role key`, que se salta RLS.
- Para dar acceso a mano (un regalo, un alumno antiguo): `insert into public.compras (correo, compra) values ('alumno@correo.com', 'groove-y-swing');`.

## 6. Variables de entorno (Netlify → Site configuration → Environment variables)

| Variable | Dónde se usa | De dónde sale |
| --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | Navegador (build) y funciones | Supabase → Project Settings → API. Valor: `https://xzxetmabrnolhvocjpmk.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Navegador (build) | Supabase → API → `anon` / publishable key |
| `SUPABASE_SERVICE_KEY` | Funciones (secreta) | Supabase → API → `service_role` / secret key |
| `STRIPE_SECRET_KEY` | Funciones (secreta) | Stripe → Developers → API keys. `sk_test_…` en pruebas, `sk_live_…` en real |
| `STRIPE_WEBHOOK_SECRET` | `aviso-stripe` (secreta) | Stripe → Developers → Webhooks → el endpoint → Signing secret (`whsec_…`) |
| `STRIPE_MANAGED_PAYMENTS` | `crear-pago` | `si` (por defecto) o `no` para llevar el IVA por cuenta propia |
| `BUNNY_LIBRARY_ID` | `video` | `813262` |
| `BUNNY_TOKEN_KEY` | `video` (secreta) | Bunny → Stream → biblioteca → Security → Token authentication key. Vacía = sin firma |
| `URL_WEB` | `crear-pago` | `https://abletonfacil.netlify.app` (o el dominio propio) |

Las variables `PUBLIC_*` se incrustan al compilar: si cambian, hay que volver a desplegar. Para desarrollo local: copiar `.env.example` como `.env`, que está en `.gitignore`.

## 7. Configuración de cada servicio (lo ya hecho)

### Stripe
- Cuenta «Ableton Fácil». En el alta se eligió: «Aceptar pagos por Internet», «Bienes digitales», **Managed Payments** («Deja que nos encarguemos») y configuración desde el Dashboard. Sin Connect («Crear una plataforma») ni suscripciones.
- **Los cobros reales no están activados.** Falta rellenar «Activar Payments» (datos del titular, tipo de empresa, banco), pendiente de la gestoría.
- Pendiente: crear el webhook, activar Klarna u otros métodos de pago, comprobar si PayPal está disponible con Managed Payments y crear los cupones.
- Managed Payments: Stripe revisa la cuenta antes de habilitarlo. Requiere `tax_code` elegible. Puede emitir reembolsos en los primeros 60 días para evitar contracargos.

### Bunny Stream
- Prueba gratuita desde el 18/11/2026 (14 días, 20 $ de crédito). Después: prepago, con un mínimo de 1 $ al mes.
- Biblioteca `cursos-abletonfacil`, **ID 813262**, región principal Frankfurt, **sin replicación geográfica** (no se puede quitar una vez creada; añadir sí).
- Vídeos subidos:
  - Groove & Swing, lección 1 «Qué es un compás»: `0297207f-32bb-410d-b622-36adbd40b511`
  - Groove & Swing, lección 14 «Entender el swing»: `675034a9-bfb2-4142-b6d2-8d87965265de`
- **Seguridad sin activar todavía.** Ahora mismo cualquiera con el GUID puede incrustar el vídeo. Pendiente: Allowed domains (dominio de la web) y Embed View Token Authentication, y luego meter `BUNNY_TOKEN_KEY` en Netlify.

### Supabase
- Organización y proyecto `abletonfacil`, plan Free, región eu-west-1 (Irlanda).
- Al crear el proyecto se dejaron activadas «Habilitar la API de datos» y «Conceder acceso a la API a las nuevas tablas». La opción «RLS automático» quedó desmarcada: la tabla `compras` activa RLS en su propio SQL.
- SQL de la sección 5 ejecutado.
- Authentication → URL Configuration:
  - Site URL: `https://abletonfacil.netlify.app`
  - Redirect URLs: `https://abletonfacil.netlify.app/**`, `https://*--abletonfacil.netlify.app/**` (vistas previas de Netlify), `http://localhost:4321/**`
- Pendiente: SMTP propio (el correo de serie de Supabase tiene un límite de envíos muy bajo y no sirve para producción) y plantilla del correo de acceso en español.

### Netlify
- Sitio ya publicado desde `main`. Las vistas previas de los pull requests están protegidas con contraseña (401): Stripe no puede llamar al webhook ahí. Para probar, o se desactiva esa protección o se usa Stripe CLI (`stripe listen --forward-to`) en local con `netlify dev`.

## 8. Cómo probar de principio a fin

1. Meter las variables de la sección 6, con las claves **de prueba** de Stripe.
2. En Stripe (modo de prueba) → Webhooks → añadir endpoint `https://<dominio>/api/aviso-stripe` con los eventos `checkout.session.completed` y `checkout.session.async_payment_succeeded`. Copiar el *signing secret* a `STRIPE_WEBHOOK_SECRET`.
3. Desplegar.
4. Comprobar que en `/cursos/groove-y-swing` las lecciones 1 y 14 se reproducen sin entrar.
5. Comprar con la tarjeta de prueba `4242 4242 4242 4242` (cualquier fecha futura y cualquier CVC). Comprobar que aparece la fila en `compras`.
6. Entrar en `/mis-cursos` con ese correo, abrir el enlace y comprobar que se ven las lecciones.
7. Con otro correo, comprobar que una lección de pago devuelve 403.

## 9. Cómo añadir o cambiar contenido

- **Subir una lección:** subir el vídeo a la biblioteca de Bunny, copiar su Video ID y ponerlo en `video` de la lección correspondiente en `cursos.json`.
- **Lección gratis:** `"gratis": true`.
- **Precio:** cambiar `precio` en el JSON. No hay que tocar Stripe, porque el precio viaja en cada sesión.
- **Curso nuevo:** añadir una entrada a `cursos.json` con slug nuevo. La página se genera sola.
- **Curso aún no a la venta:** `"proximamente": true` (no se puede comprar).
- **Pack:** añadir una entrada a `packs.json`. Quien lo compre tendrá acceso a todos sus cursos.
- **Cupones:** Stripe → Productos → Cupones / Códigos promocionales. El campo para introducirlos ya sale en el pago.
- **Ojo:** la lección se identifica por su posición en el array. No reordenar lecciones de un curso ya vendido sin revisar que no cambie lo que ve cada alumno. Se podría migrar a IDs fijos si hiciera falta.

## 10. Puntos débiles conocidos y mejoras pendientes

1. **Reembolsos:** si se devuelve un pago en Stripe, el acceso **no** se quita. Falta escuchar `charge.refunded` (o `checkout.session` + `refund`) y borrar o marcar la fila.
2. **Correo distinto:** si el alumno paga con un correo y quiere entrar con otro, no tendrá acceso. Hoy se resuelve a mano con un `insert` o un `update`.
3. **SMTP de Supabase:** imprescindible antes de vender (límite de envíos del correo de serie).
4. **Seguridad de Bunny sin activar** (ver sección 7).
5. **Versión de la API de Stripe:** `managed_payments` apareció en versiones de 2026. La librería instalada (`stripe` 23.1.0) usa por defecto la versión `2026-10-28.endive`. Si Stripe rechaza el parámetro, revisar la versión de la cuenta o pasar `apiVersion` explícita.
6. **Temario de Producción Electrónica provisional:** en la carpeta de origen, las lecciones 6 y 7 aparecen duplicadas con nombres distintos.
7. **Psicoacústica:** marcada como `proximamente`, sin lecciones.
8. **Textos legales:** faltan condiciones de compra (desistimiento en contenido digital) y revisar el aviso legal y la privacidad (se tratan correos de clientes).
9. **Dominio propio** recomendado antes de vender. Al cambiarlo hay que actualizar `URL_WEB`, la Site URL y las Redirect URLs de Supabase, los dominios permitidos de Bunny y el webhook de Stripe.
10. No hay panel de administración: las ventas se ven en Stripe y los accesos en la tabla de Supabase.

## 11. Historial de esta parte

- **18/11/2026:** decisión de arquitectura. Primera versión de las páginas y las funciones. Cambio a Managed Payments. Creación de las cuentas de Stripe (modo de prueba), Bunny (biblioteca y dos vídeos) y Supabase (proyecto, tabla y URLs). Código en la rama `cursos-de-pago`, con copia en `WEB abletonfacil\cursos-de-pago\` (git bundle + zip).
