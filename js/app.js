/* =====================================================================
   js/app.js  ·  INTERFAZ (vistas, eventos, rutas)
   Los datos vienen de window.Data.api (js/supabase.js).
   ===================================================================== */
(() => {
'use strict';
const C = window.CONFIG;
const { api, DEMO, norm } = window.Data;

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dec = ['COP','CLP','PYG'].includes(C.MONEDA) ? 0 : 2;
const money = n => new Intl.NumberFormat(C.LOCALE, { style:'currency', currency:C.MONEDA, minimumFractionDigits:dec, maximumFractionDigits:dec }).format(n || 0);
const fecha = d => new Date(d).toLocaleString(C.LOCALE, { dateStyle:'short', timeStyle:'short' });
const ico = (n, cls = '') => `<svg class="ico ${cls}"><use href="#i-${n}"/></svg>`;
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ICONO_CAT = { 'Motor':'motor', 'Frenos':'freno', 'Transmisión':'cadena', 'Eléctrico':'rayo', 'Suspensión':'resorte',
  'Filtros y Lubricantes':'aceite', 'Carrocería':'moto', 'Llantas y Rines':'rueda' };
const iconoCat = c => ICONO_CAT[c] || 'llave';

function toast(msg, tipo = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${tipo === 'error' ? 'error' : ''}`;
  el.textContent = msg;
  $('#toast').appendChild(el);
  setTimeout(() => el.remove(), tipo === 'error' ? 6000 : 3000);
}

/* ---------- estado ---------- */
const st = { marcas:[], categorias:[], repuestos:[], movs:[], user:null,
  q:'', marca:'Todas', categoria:'Todas', tipo:'Todos', soloDisp:false, soloAlerta:false };
const esAdmin = () => st.user && st.user.rol === 'ADMIN';
const ruta = () => (location.hash.replace(/^#\/?/, '') || 'catalogo');
const enLista = () => ['admin', 'catalogo'].includes(ruta());

function filtrar() {
  const q = norm(st.q);
  return st.repuestos.filter(r =>
    (st.marca === 'Todas' || r.marca === st.marca) &&
    (st.categoria === 'Todas' || r.categoria === st.categoria) &&
    (st.tipo === 'Todos' || r.tipo === st.tipo) &&
    (!st.soloDisp || r.stock > 0) &&
    (!st.soloAlerta || r.stock <= r.stock_minimo) &&
    (!q || norm([r.codigo, r.nombre, r.modelos, r.fabricante, r.marca, r.categoria].join(' ')).includes(q)));
}
function estado(r) {
  const nivel = r.stock <= 0 ? 'out' : r.stock <= r.stock_minimo ? 'low' : 'ok';
  const txt = nivel === 'out' ? 'Agotado' : nivel === 'low' ? `Stock bajo · ${r.stock}` : `Stock · ${r.stock}`;
  const pct = r.stock <= 0 ? 0 : Math.min(100, Math.round(r.stock / Math.max(1, r.stock_minimo * 3) * 100));
  return { nivel, txt, pct };
}
const gauge = e => `<div class="gauge ${e.nivel}" title="Nivel de stock"><i style="width:${e.pct}%"></i></div>`;
const tagMarca = m => `<span class="tagm m-${slug(m)}">${esc(m)}</span>`;

/* =====================================================================
   VISTAS
   ===================================================================== */
function renderHeader() {
  const r = ruta();
  const m = /^([A-Z][a-z]+)(.*)$/.exec(C.NEGOCIO || '');
  const logo = m ? `${esc(m[1])}<em>${esc(m[2])}</em>` : esc(C.NEGOCIO);
  const cuenta = st.user
    ? `${esAdmin() ? `<a href="#/admin" class="link">${ico('panel')} Panel</a><a href="#/movimientos" class="link">${ico('reloj')} Movimientos</a>` : ''}
       <span class="who">${ico('user')} ${esc(st.user.nombre)}</span>
       <button data-act="logout" class="btn btn-ghost btn-sm">Salir</button>`
    : `<a href="#/login" class="btn btn-primary btn-sm">${ico('candado')} Iniciar sesión</a>`;
  const conteo = n => (n === 'Todas' ? st.repuestos : st.repuestos.filter(x => x.marca === n)).length;
  const tabs = ['Todas', ...st.marcas.map(x => x.nombre)].map(n =>
    `<button data-act="marca" data-id="${esc(n)}" class="tab ${st.marca === n ? 'active' : ''}">${esc(n === 'Todas' ? 'Todas las marcas' : n)}<small>${conteo(n)}</small></button>`).join('');
  const buscador = r === 'login' ? '<div style="flex:1"></div>' : `
    <form class="search" onsubmit="return false">
      <label>${ico('buscar')}<input id="q" type="search" value="${esc(st.q)}" placeholder="Buscar por código, repuesto, moto o fabricante…" autocomplete="off"></label>
      <select id="selCat" aria-label="Categoría"><option value="Todas">Todas las categorías</option>
        ${st.categorias.map(c => `<option ${st.categoria === c.nombre ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select>
    </form>`;
  $('#hdr').innerHTML = `<header class="topbar">
    <div class="topbar__row">
      <a href="#/" class="brand">${ico('moto')}<span>${logo}</span></a>
      ${buscador}<div class="account">${cuenta}</div></div>
    ${r === 'login' ? '' : `<nav class="tabs"><div class="tabs__row">${tabs}</div></nav>`}</header>`;
}

const vacio = () => `<div class="empty">${ico('caja')}<h3>Sin resultados</h3><p>No encontramos repuestos con esos filtros.</p>
  <button data-act="limpiar" class="btn btn-ghost btn-sm">Limpiar filtros</button></div>`;

function filtrosBar(admin) {
  const t = (v, l) => `<button data-act="tipo" data-id="${v}" class="chip ${st.tipo === v ? 'active' : ''}">${l}</button>`;
  return `<div class="filters"><span class="lbl">Tipo</span>${t('Todos', 'Todos')}${t('ORIGINAL', 'Originales')}${t('ALTERNO', 'Alternos')}
    <label class="check"><input type="checkbox" data-act="soloDisp" ${st.soloDisp ? 'checked' : ''}> Solo disponibles</label>
    ${admin ? `<label class="check"><input type="checkbox" data-act="soloAlerta" ${st.soloAlerta ? 'checked' : ''}> Solo stock bajo / agotado</label>` : ''}</div>`;
}

function media(r) {
  return `<div class="card__media">${ico(iconoCat(r.categoria))}${r.imagen_url ? `<img src="${esc(r.imagen_url)}" alt="${esc(r.nombre)}" loading="lazy" onerror="this.remove()">` : ''}</div>`;
}

function vistaCatalogo() {
  const lista = filtrar();
  $('#app').innerHTML = `
    <section class="hero"><h1>Tu moto no para,<br><span>nuestros repuestos tampoco</span></h1>
      <p>Originales y alternos para CF Moto, Suzuki, Bajaj y más. Encuentra la pieza exacta para tu máquina.</p><div class="checker"></div></section>
    <div class="section-head"><div><h2>Catálogo <span>de repuestos</span></h2><p><b>${lista.length}</b> resultado(s)</p></div></div>
    ${filtrosBar(false)}
    ${lista.length ? `<div class="grid-cards">${lista.map(r => { const e = estado(r); return `
      <article class="card m-${slug(r.marca)}">
        <div style="position:relative">${media(r)}
          <div class="card__tags">${tagMarca(r.marca)}<span class="tagt ${r.tipo === 'ALTERNO' ? 'alt' : ''}">${r.tipo}</span></div></div>
        <div class="card__body">
          <div class="card__code">${esc(r.codigo)} · ${esc(r.categoria)}</div>
          <h3 class="card__title">${esc(r.nombre)}</h3>
          <div class="card__fit">${ico('moto')}<span>${esc(r.modelos || 'Universal')}</span></div>
          <div class="card__foot">
            <div class="row-between"><div class="price"><small>Precio</small>${money(r.precio)}</div><span class="badge ${e.nivel}">${e.txt}</span></div>
            ${gauge(e)}
            <button data-act="detalle" data-id="${esc(r.codigo)}" class="btn btn-ghost btn-block btn-sm">${ico('info')} Ver detalle</button>
          </div></div></article>`; }).join('')}</div>` : vacio()}`;
}

function vistaAdmin() {
  if (!esAdmin()) return vistaAcceso();
  const total = st.repuestos.length;
  const unidades = st.repuestos.reduce((a, r) => a + r.stock, 0);
  const valor = st.repuestos.reduce((a, r) => a + r.stock * r.precio, 0);
  const alertas = st.repuestos.filter(r => r.stock <= r.stock_minimo).length;
  const kpi = (i, k, l, v) => `<div class="kpi" style="--k:${k}"><div class="kpi__ico">${ico(i)}</div><div><span>${l}</span><h3>${v}</h3></div></div>`;
  const lista = filtrar();
  $('#app').innerHTML = `
    <div class="kpis">
      ${kpi('cajas', '#2f8cff', 'Referencias', total)}
      ${kpi('caja', '#2ecc71', 'Unidades en stock', unidades)}
      ${kpi('dinero', '#ffc400', 'Valor del inventario', money(valor))}
      ${kpi('alerta', '#ff4d4f', 'Stock bajo / agotado', alertas)}</div>
    <div class="section-head"><div><h2>Gestión <span>de inventario</span></h2><p>${lista.length} de ${total} repuestos</p></div>
      <div class="actions"><button data-act="csv" class="btn btn-ghost">${ico('csv')} Exportar CSV</button>
        <button data-act="nuevo" class="btn btn-primary">${ico('mas')} Nuevo repuesto</button></div></div>
    ${filtrosBar(true)}
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>Repuesto</th><th>Marca</th><th>Categoría</th><th>Compatible con</th><th>Ubic.</th><th class="r">Precio</th><th>Stock</th><th class="c">Acciones</th></tr></thead>
      <tbody>${lista.map(r => { const e = estado(r), id = esc(r.codigo); return `
        <tr><td><div class="nm">${esc(r.nombre)}</div><div class="sub">${id} · ${r.tipo === 'ALTERNO' ? 'Alterno' : 'Original'}${r.fabricante ? ' · ' + esc(r.fabricante) : ''}</div></td>
          <td>${tagMarca(r.marca)}</td><td>${esc(r.categoria)}</td><td class="fit">${esc(r.modelos)}</td><td class="mono">${esc(r.ubicacion)}</td>
          <td class="r"><b>${money(r.precio)}</b></td>
          <td><div class="stockcell"><span class="badge ${e.nivel}">${e.txt}</span>${gauge(e)}</div></td>
          <td class="c"><button data-act="stock" data-id="${id}" title="Entrada / salida" class="iconbtn ok">${ico('swap')}</button>
            <button data-act="editar" data-id="${id}" title="Editar" class="iconbtn edit">${ico('editar')}</button>
            <button data-act="borrar" data-id="${id}" title="Eliminar" class="iconbtn del">${ico('basura')}</button></td></tr>`; }).join('')}</tbody></table>
      ${lista.length ? '' : vacio()}</div>`;
}

async function vistaMovimientos() {
  if (!esAdmin()) return vistaAcceso();
  $('#app').innerHTML = '<p style="color:var(--suave)">Cargando…</p>';
  try { st.movs = await api.movimientos(); } catch (e) { toast(e.message, 'error'); }
  const cls = { ENTRADA:'ok', SALIDA:'out', AJUSTE:'low' };
  $('#app').innerHTML = `<div class="section-head"><div><h2>Historial <span>de movimientos</span></h2><p>Últimos 200 movimientos de stock</p></div></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Código</th><th>Tipo</th><th>Cant.</th><th>Stock resultante</th><th>Nota</th><th>Usuario</th></tr></thead>
    <tbody>${st.movs.map(m => `<tr><td>${fecha(m.fecha)}</td><td class="mono">${esc(m.codigo)}</td><td><span class="badge ${cls[m.tipo]}">${m.tipo}</span></td>
      <td>${m.cantidad}</td><td><b>${m.stock_resultante ?? ''}</b></td><td style="color:var(--suave)">${esc(m.nota)}</td><td>${esc(m.usuario)}</td></tr>`).join('')}</tbody></table>
    ${st.movs.length ? '' : `<div class="empty">${ico('reloj')}<h3>Sin movimientos</h3><p>Registra entradas y salidas desde el panel.</p></div>`}</div>`;
}

const vistaAcceso = () => { $('#app').innerHTML = `<div class="empty">${ico('candado')}<h3>Zona restringida</h3><p>Solo para administradores del taller.</p>
  <a href="#/login" class="btn btn-primary btn-sm">Iniciar sesión</a></div>`; };

let modoRegistro = false;
function vistaLogin() {
  $('#app').innerHTML = `<div class="auth"><div class="auth__head">${ico('moto')}<h1>${modoRegistro ? 'Crear cuenta' : 'Entrar al taller'}</h1></div>
    <form data-form="auth">
      ${modoRegistro ? `<div class="field"><label>Nombre</label><input name="nombre" required></div>` : ''}
      <div class="field"><label>Correo</label><input name="email" type="email" required value="${DEMO && !modoRegistro ? 'admin@demo.com' : ''}"></div>
      <div class="field"><label>Contraseña</label><input name="pass" type="password" required minlength="6" ${DEMO && !modoRegistro ? 'value="admin123"' : ''}></div>
      <button class="btn btn-primary btn-block">${modoRegistro ? 'Registrarme' : 'Arrancar'}</button></form>
    ${DEMO ? '' : `<button data-act="modoReg" class="linkbtn">${modoRegistro ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}</button>`}</div>`;
}

/* ---------- modales ---------- */
function abrirModal(titulo, cuerpo, clase = '') {
  const m = $('#modal');
  m.innerHTML = `<div class="modal ${clase}"><div class="modal__head"><h3>${titulo}</h3><button data-act="cerrar" class="modal__x" aria-label="Cerrar">&times;</button></div>${cuerpo}</div>`;
  m.classList.remove('hidden');
}
const cerrarModal = () => { const m = $('#modal'); m.classList.add('hidden'); m.innerHTML = ''; };

function modalDetalle(codigo) {
  const r = st.repuestos.find(x => x.codigo === codigo); if (!r) return;
  const e = estado(r);
  const wa = C.WHATSAPP ? `https://wa.me/${encodeURIComponent(C.WHATSAPP)}?text=${encodeURIComponent(`Hola, me interesa el repuesto ${r.codigo} - ${r.nombre}`)}` : '';
  abrirModal(esc(r.nombre), `${media(r)}<div class="modal__body">
    <div style="display:flex;gap:8px;flex-wrap:wrap">${tagMarca(r.marca)}<span class="tagt ${r.tipo === 'ALTERNO' ? 'alt' : ''}" style="background:#0d0e10">${r.tipo}</span><span class="badge ${e.nivel}">${e.txt}</span></div>
    <dl class="dl"><div><dt>Código</dt><dd>${esc(r.codigo)}</dd></div><div><dt>Categoría</dt><dd>${esc(r.categoria)}</dd></div>
      <div><dt>Fabricante</dt><dd>${esc(r.fabricante) || '—'}</dd></div><div><dt>Precio</dt><dd class="price">${money(r.precio)}</dd></div>
      <div class="full"><dt>Compatible con</dt><dd>${esc(r.modelos) || 'Universal'}</dd></div>
      ${esAdmin() ? `<div><dt>Ubicación</dt><dd>${esc(r.ubicacion) || '—'}</dd></div>` : ''}</dl>
    ${wa ? `<a href="${wa}" target="_blank" rel="noopener" class="btn btn-ok btn-block">${ico('whats')} Consultar por WhatsApp</a>` : ''}</div>`, 'md');
}

function modalRepuesto(codigo) {
  const nuevo = !codigo;
  const r = nuevo ? { tipo:'ORIGINAL', stock:0, stock_minimo:2, precio:'', marca_id:st.marcas[0]?.id, categoria_id:st.categorias[0]?.id } : st.repuestos.find(x => x.codigo === codigo);
  const sel = (name, arr, val, tabla) => `<div class="with-btn"><select name="${name}">${arr.map(o => `<option value="${o.id}" ${o.id == val ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('')}</select>
    <button type="button" data-act="nuevaOpcion" data-id="${tabla}" title="Agregar nueva">${ico('mas')}</button></div>`;
  const f = (l, n, v, x = '', cls = '') => `<div class="field ${cls}"><label>${l}</label><input name="${n}" value="${esc(v)}" ${x}></div>`;
  abrirModal(nuevo ? 'Nuevo repuesto' : 'Editar repuesto', `<form data-form="repuesto" data-nuevo="${nuevo ? 1 : 0}" class="form-grid">
    ${f('Código *', 'codigo', r.codigo, `required maxlength="30" style="text-transform:uppercase" ${nuevo ? '' : 'readonly'}`)}
    ${f('Nombre *', 'nombre', r.nombre, 'required')}
    <div class="field"><label>Marca *</label>${sel('marca_id', st.marcas, r.marca_id, 'marcas')}</div>
    <div class="field"><label>Categoría *</label>${sel('categoria_id', st.categorias, r.categoria_id, 'categorias')}</div>
    <div class="field"><label>Tipo</label><select name="tipo"><option value="ORIGINAL" ${r.tipo === 'ORIGINAL' ? 'selected' : ''}>Original</option><option value="ALTERNO" ${r.tipo === 'ALTERNO' ? 'selected' : ''}>Alterno</option></select></div>
    ${f('Fabricante', 'fabricante', r.fabricante, 'placeholder="NGK, Motul, DID…"')}
    ${f('Modelos compatibles', 'modelos', r.modelos, 'placeholder="Pulsar NS160, Gixxer 150, 250NK"', 'full')}
    ${f('Precio *', 'precio', r.precio, 'type="number" min="0" step="any" required')}
    ${f(nuevo ? 'Stock inicial' : 'Stock actual (usa ⇄ para cambiarlo)', 'stock', r.stock, `type="number" min="0" ${nuevo ? '' : 'disabled'}`)}
    ${f('Stock mínimo (alerta)', 'stock_minimo', r.stock_minimo, 'type="number" min="0"')}
    ${f('Ubicación', 'ubicacion', r.ubicacion, 'placeholder="Estante A-01"')}
    ${f('URL de imagen (opcional)', 'imagen_url', r.imagen_url, 'type="url" placeholder="https://…"', 'full')}
    <div class="full form-actions"><button type="button" data-act="cerrar" class="btn btn-ghost">Cancelar</button><button class="btn btn-primary">Guardar</button></div></form>`);
}

function modalStock(codigo) {
  const r = st.repuestos.find(x => x.codigo === codigo); if (!r) return;
  abrirModal('Movimiento de stock', `<form data-form="stock" data-codigo="${esc(codigo)}" class="modal__body">
    <p><b>${esc(r.nombre)}</b> <span style="color:var(--tenue)">(${esc(r.codigo)})</span><br><span style="color:var(--suave)">Stock actual: <b>${r.stock}</b></span></p>
    <div class="seg">${[['ENTRADA', 'Entrada +'], ['SALIDA', 'Salida −'], ['AJUSTE', 'Ajuste =']].map(([v, t], i) =>
      `<label><input type="radio" name="tipo" value="${v}" class="sr-only" ${i === 0 ? 'checked' : ''}><div>${t}</div></label>`).join('')}</div>
    <div class="field"><label>Cantidad * (en ajuste = nuevo stock)</label><input name="cantidad" type="number" min="0" required></div>
    <div class="field"><label>Nota</label><input name="nota" placeholder="Compra proveedor, venta mostrador, conteo físico…"></div>
    <div class="form-actions"><button type="button" data-act="cerrar" class="btn btn-ghost">Cancelar</button><button class="btn btn-ok">Registrar</button></div></form>`, 'sm');
}

/* =====================================================================
   CONTROL
   ===================================================================== */
async function recargar() { const d = await api.cargar(); st.marcas = d.marcas; st.categorias = d.categorias; st.repuestos = d.repuestos; }
async function route() {
  const r = ruta();
  if (r === 'login' && st.user) { location.hash = '#/'; return; }
  renderHeader();
  if (r === 'login') vistaLogin();
  else if (r === 'admin') vistaAdmin();
  else if (r === 'movimientos') await vistaMovimientos();
  else vistaCatalogo();
  window.scrollTo(0, 0);
}
const pintar = () => (ruta() === 'admin' ? vistaAdmin() : ruta() === 'catalogo' ? vistaCatalogo() : null);

function descargarCSV() {
  const cols = ['codigo','nombre','marca','categoria','tipo','fabricante','modelos','precio','stock','stock_minimo','ubicacion'];
  const cel = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [cols.join(','), ...filtrar().map(r => cols.map(c => cel(r[c])).join(','))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }));
  a.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(a.href);
}

document.addEventListener('click', async e => {
  if (e.target.id === 'modal') return cerrarModal();
  const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT') return;
  const id = b.dataset.id;
  try {
    switch (b.dataset.act) {
      case 'cerrar': cerrarModal(); break;
      case 'marca': st.marca = id; if (!enLista()) location.hash = '#/'; else { renderHeader(); pintar(); } break;
      case 'tipo': st.tipo = id; pintar(); break;
      case 'limpiar': Object.assign(st, { q:'', marca:'Todas', categoria:'Todas', tipo:'Todos', soloDisp:false, soloAlerta:false }); renderHeader(); pintar(); break;
      case 'detalle': modalDetalle(id); break;
      case 'nuevo': modalRepuesto(); break;
      case 'editar': modalRepuesto(id); break;
      case 'stock': modalStock(id); break;
      case 'csv': descargarCSV(); break;
      case 'borrar':
        if (!confirm(`¿Eliminar el repuesto ${id}? También se borra su historial de movimientos.`)) break;
        await api.eliminar(id); await recargar(); renderHeader(); pintar(); toast('Repuesto eliminado'); break;
      case 'nuevaOpcion': {
        const nombre = (prompt(id === 'marcas' ? 'Nombre de la nueva marca (ej. Yamaha):' : 'Nombre de la nueva categoría:') || '').trim();
        if (!nombre) break;
        const prev = Object.fromEntries(new FormData($('form[data-form="repuesto"]')));
        const nid = await api.nuevaOpcion(id, nombre); await recargar(); renderHeader();
        prev[id === 'marcas' ? 'marca_id' : 'categoria_id'] = nid;
        const esNuevo = $('form[data-form="repuesto"]').dataset.nuevo === '1';
        modalRepuesto(esNuevo ? undefined : prev.codigo);
        const f2 = $('form[data-form="repuesto"]');
        for (const [k, v] of Object.entries(prev)) if (f2.elements[k] && !f2.elements[k].disabled && !f2.elements[k].readOnly) f2.elements[k].value = v;
        break; }
      case 'logout': await api.logout(); st.user = null; location.hash = '#/'; await route(); break;
      case 'modoReg': modoRegistro = !modoRegistro; vistaLogin(); break;
      case 'resetDemo': if (confirm('¿Restablecer los datos de demostración?')) { api.reset(); await recargar(); await route(); toast('Datos demo restablecidos'); } break;
    }
  } catch (err) { toast(err.message, 'error'); }
});

document.addEventListener('change', e => {
  if (e.target.id === 'selCat') { st.categoria = e.target.value; if (!enLista()) location.hash = '#/'; else pintar(); }
  else if (e.target.dataset.act === 'soloDisp') { st.soloDisp = e.target.checked; pintar(); }
  else if (e.target.dataset.act === 'soloAlerta') { st.soloAlerta = e.target.checked; pintar(); }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'q') return;
  st.q = e.target.value;
  if (!enLista()) location.hash = '#/'; else pintar();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });

document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(f));
  const btn = f.querySelector('button:not([type=button])'); if (btn) btn.disabled = true;
  try {
    if (f.dataset.form === 'auth') {
      if (modoRegistro) {
        const res = await api.registro(fd.email.trim(), fd.pass, fd.nombre.trim());
        if (res === 'confirmar') { toast('Cuenta creada. Revisa tu correo para confirmarla.'); modoRegistro = false; vistaLogin(); return; }
      } else await api.login(fd.email.trim(), fd.pass);
      st.user = await api.sesion();
      toast(`Bienvenido, ${st.user?.nombre || ''}`);
      location.hash = esAdmin() ? '#/admin' : '#/'; await route();
    } else if (f.dataset.form === 'repuesto') {
      const r = { codigo:fd.codigo.trim().toUpperCase(), nombre:fd.nombre.trim(), marca_id:Number(fd.marca_id), categoria_id:Number(fd.categoria_id), tipo:fd.tipo,
        fabricante:fd.fabricante.trim(), modelos:fd.modelos.trim(), precio:Number(fd.precio), stock_minimo:Number(fd.stock_minimo || 0), ubicacion:fd.ubicacion.trim(), imagen_url:fd.imagen_url.trim() };
      if (f.dataset.nuevo === '1') await api.crear(r, Number(fd.stock || 0)); else await api.actualizar(r);
      cerrarModal(); await recargar(); renderHeader(); pintar(); toast('Repuesto guardado');
    } else if (f.dataset.form === 'stock') {
      await api.mover(f.dataset.codigo, fd.tipo, Number(fd.cantidad), fd.nota.trim());
      cerrarModal(); await recargar(); renderHeader(); pintar(); toast('Movimiento registrado');
    }
  } catch (err) { toast(err.message, 'error'); if (btn) btn.disabled = false; }
});

window.addEventListener('hashchange', route);

(async function init() {
  document.title = `${C.NEGOCIO} · Inventario de Repuestos`;
  $('#ftr').textContent = `© ${new Date().getFullYear()} ${C.NEGOCIO} · Repuestos CF Moto, Suzuki, Bajaj y alternos`;
  if (DEMO) {
    const b = $('#demoBanner'); b.classList.remove('hidden');
    b.innerHTML = `MODO DEMO · datos guardados solo en este navegador · entra con <b>admin@demo.com / admin123</b> · para usar Supabase completa <code>js/config.js</code> <button data-act="resetDemo">Restablecer datos</button>`;
  }
  try { await recargar(); st.user = await api.sesion(); }
  catch (err) { renderHeader(); $('#app').innerHTML = `<div class="alert-box"><b>No se pudo conectar con Supabase.</b><br>${esc(err.message)}<br><br>Revisa <code>js/config.js</code> y que ejecutaste <code>supabase/schema.sql</code>.</div>`; return; }
  await route();
})();
})();
