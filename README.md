# 🏍️ Moto Repuestos — Inventario (CF Moto · Suzuki · Bajaj · Alternos)

Aplicación web **estática** (HTML + CSS + JavaScript) con **Supabase** como backend (base de datos Postgres + login + seguridad).
Se publica gratis en **GitHub Pages**. No hay servidor propio ni paso de compilación.

## Arquitectura

```
Navegador ── index.html + css/styles.css + js/*.js   (GitHub Pages, estático)
                 │
                 └── HTTPS ──► Supabase  (Postgres + Auth + RLS)
```

```
inventario-repuestos/
├── index.html            Estructura de la página y sprite de iconos SVG
├── css/styles.css        Tema motero (variables de color en :root)
├── js/config.js          ← ÚNICO archivo que editas: URL/KEY de Supabase, nombre, moneda
├── js/supabase.js        Capa de datos: Supabase real o modo demo (misma interfaz)
├── js/app.js             Interfaz: vistas, filtros, formularios, rutas
├── js/seed.js            36 repuestos de ejemplo
├── supabase/schema.sql   Tablas, triggers, políticas RLS y datos iniciales
├── .nojekyll             Evita que GitHub Pages procese los archivos con Jekyll
└── README.md
```

**Decisiones de diseño**
- **Seguridad en la base de datos, no en el navegador.** La clave `anon` es pública por diseño; lo que protege los datos son las políticas RLS de `schema.sql`: todos *leen* el catálogo, solo `ADMIN` escribe.
- **El stock solo cambia por movimientos** (entrada / salida / ajuste). Un *trigger* en Postgres recalcula el stock, impide negativos y registra usuario y fecha. Es auditable y no hay condiciones de carrera.
- **Capa de datos intercambiable:** sin credenciales funciona en *modo demo* (localStorage) con la misma interfaz.

---

## Paso 0 · Probar en tu PC (modo demo)

Abre `index.html` con doble clic, o mejor con un servidor local:

```bash
cd inventario-repuestos
python3 -m http.server 8080      # luego abre http://localhost:8080
```
Entra con **admin@demo.com / admin123**.

## Paso 1 · Crear el proyecto en Supabase

1. Entra a <https://supabase.com> → **New project** (guarda la contraseña de la base de datos).
2. Menú **SQL Editor → New query**. Pega **todo** el contenido de `supabase/schema.sql` → **Run**.
   Debe terminar con *Success*. Crea tablas, seguridad y los 36 repuestos de ejemplo.
3. Menú **Authentication → Users → Add user → Create new user**. Pon tu correo y contraseña y marca **Auto Confirm User**.
4. Vuelve al **SQL Editor** y conviértete en administrador (cambia el correo):
   ```sql
   update public.perfiles set rol = 'ADMIN'
   where id = (select id from auth.users where email = 'tu-correo@gmail.com');
   ```
5. Menú **Project Settings → API**. Copia:
   - **Project URL**
   - **anon public** key (⚠️ nunca la `service_role`)

## Paso 2 · Configurar la app

Edita `js/config.js`:

```js
window.CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',
  NEGOCIO: 'MotoRepuestos',
  MONEDA: 'COP', LOCALE: 'es-CO',
  WHATSAPP: '573001234567'      // opcional
};
```
Recarga la página: desaparece la franja amarilla de "MODO DEMO" y ya usas Supabase.
Entra con el correo del paso 1.3 → verás **Panel** y **Movimientos**.

## Paso 3 · Subir a GitHub

1. Crea un repositorio vacío en <https://github.com/new> (ej. `inventario-repuestos`, público).
2. En tu PC, dentro de la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Inventario de repuestos de motos"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/inventario-repuestos.git
   git push -u origin main
   ```
   (Sin Git: en GitHub usa **Add file → Upload files** y arrastra todo el contenido de la carpeta, incluida `.nojekyll`.)

## Paso 4 · Publicar con GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. **Source:** *Deploy from a branch* → **Branch:** `main` / `/ (root)` → **Save**.
3. Espera ~1 minuto. Tu sitio queda en `https://TU_USUARIO.github.io/inventario-repuestos/`.
4. En Supabase: **Authentication → URL Configuration → Site URL** = esa dirección (necesario para los correos de confirmación).

## Actualizar después

Cambia lo que necesites y:
```bash
git add . && git commit -m "describe el cambio" && git push
```
GitHub Pages republica solo en ~1 minuto.

---

## Uso diario

| Quiero… | Dónde |
|---|---|
| Ver / buscar repuestos | Inicio: busca por código, nombre, moto (“Pulsar”) o fabricante (“NGK”) |
| Agregar un repuesto | Panel → **Nuevo repuesto** |
| Registrar compra o venta | Panel → botón **⇄** → Entrada / Salida |
| Corregir por conteo físico | **⇄** → Ajuste (la cantidad es el *nuevo stock total*) |
| Nueva marca o categoría (Honda, Yamaha…) | Botón **+** dentro del formulario |
| Exportar a Excel | Panel → **Exportar CSV** (respeta los filtros activos) |
| Ver quién movió qué | **Movimientos** |

## Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| "No se pudo conectar con Supabase" | URL o KEY mal copiadas en `config.js`, o no ejecutaste `schema.sql` |
| Entro pero no veo **Panel** | Tu usuario no es ADMIN: repite el paso 1.4 con tu correo exacto |
| "Invalid login credentials" | Usuario sin confirmar: marca *Auto Confirm* o confirma por correo |
| Sitio sin estilos en Pages | Revisa que subiste la carpeta `css/` y que las rutas distinguen mayúsculas |
| Cambié `config.js` y no se nota | Caché: recarga forzada con `Ctrl + Shift + R` |
| 404 en GitHub Pages | Espera 1–2 min o revisa Settings → Pages (branch `main`, root) |

## Personalizar el estilo

Todos los colores están en `:root` al inicio de `css/styles.css` (`--naranja`, `--amarillo`, `--asfalto`…). Cambiando 2–3 variables cambia todo el tema. Colores por marca: clases `.m-suzuki`, `.m-bajaj`… (una por marca, en minúsculas y con guiones).

> Los precios y existencias incluidos son de ejemplo: edítalos o bórralos antes de usar en producción.
