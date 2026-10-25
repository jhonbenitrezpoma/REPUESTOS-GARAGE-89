/* =====================================================================
   js/supabase.js  ·  CAPA DE DATOS
   - Si config.js trae URL + KEY de Supabase  -> usa Supabase (Postgres + Auth + RLS)
   - Si no                                    -> MODO DEMO (localStorage)
   Ambas implementaciones exponen EXACTAMENTE la misma interfaz (window.Data.api),
   así app.js no sabe ni le importa de dónde vienen los datos.
   ===================================================================== */
(() => {
'use strict';
const C = window.CONFIG, S = window.SEED;
const DEMO = !(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function enriquecer(rows, marcas, cats) {
  const M = Object.fromEntries(marcas.map(m => [m.id, m.nombre]));
  const K = Object.fromEntries(cats.map(c => [c.id, c.nombre]));
  return rows.map(r => ({ ...r, marca: M[r.marca_id] || '—', categoria: K[r.categoria_id] || '—',
    precio: Number(r.precio), stock: Number(r.stock), stock_minimo: Number(r.stock_minimo) }));
}
const camposRepuesto = r => ({ codigo:r.codigo, nombre:r.nombre, marca_id:r.marca_id, categoria_id:r.categoria_id, tipo:r.tipo,
  fabricante:r.fabricante || null, modelos:r.modelos || null, precio:r.precio, stock_minimo:r.stock_minimo,
  ubicacion:r.ubicacion || null, imagen_url:r.imagen_url || null });

/* ---------- MODO DEMO ---------- */
function demoApi() {
  const KEY = 'inv_repuestos_demo_v1', UKEY = 'inv_repuestos_demo_user';
  let db, userMem = null;
  const seed = () => {
    const marcas = S.marcas.map((n, i) => ({ id:i + 1, nombre:n }));
    const categorias = S.categorias.map((n, i) => ({ id:i + 1, nombre:n }));
    const repuestos = S.repuestos.map(r => {
      const { marca, categoria, ...rest } = r;
      return { ...rest, imagen_url:'', marca_id:marcas.find(m => m.nombre === marca).id, categoria_id:categorias.find(c => c.nombre === categoria).id };
    });
    return { marcas, categorias, repuestos, movimientos:[], seq:1 };
  };
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!db || !db.repuestos) db = seed();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  const mover = (codigo, tipo, cantidad, nota) => {
    const r = db.repuestos.find(x => x.codigo === codigo);
    if (!r) throw new Error('Repuesto no existe');
    const n = tipo === 'ENTRADA' ? r.stock + cantidad : tipo === 'SALIDA' ? r.stock - cantidad : cantidad;
    if (n < 0) throw new Error(`Stock insuficiente: hay ${r.stock} y se intenta sacar ${cantidad}`);
    r.stock = n;
    db.movimientos.unshift({ id:db.seq++, codigo, tipo, cantidad, stock_resultante:n, nota, usuario:'admin@demo.com', fecha:new Date().toISOString() });
    save();
  };
  return {
    async cargar() { return { marcas:db.marcas, categorias:db.categorias, repuestos:enriquecer(db.repuestos, db.marcas, db.categorias) }; },
    async crear(r, stockInicial) {
      if (db.repuestos.some(x => x.codigo === r.codigo)) throw new Error('Ya existe un repuesto con ese código');
      db.repuestos.push({ ...camposRepuesto(r), stock:0 }); save();
      if (stockInicial > 0) mover(r.codigo, 'ENTRADA', stockInicial, 'Stock inicial');
    },
    async actualizar(r) { Object.assign(db.repuestos.find(x => x.codigo === r.codigo), camposRepuesto(r)); save(); },
    async eliminar(codigo) { db.repuestos = db.repuestos.filter(x => x.codigo !== codigo); db.movimientos = db.movimientos.filter(m => m.codigo !== codigo); save(); },
    async mover(...a) { mover(...a); },
    async movimientos() { return db.movimientos.slice(0, 200); },
    async nuevaOpcion(tabla, nombre) {
      if (db[tabla].some(x => norm(x.nombre) === norm(nombre))) throw new Error('Ya existe');
      const id = Math.max(0, ...db[tabla].map(x => x.id)) + 1; db[tabla].push({ id, nombre }); save(); return id;
    },
    async sesion() { try { return JSON.parse(localStorage.getItem(UKEY)); } catch (e) { return userMem; } },
    async login(email, pass) {
      if (email.trim().toLowerCase() !== 'admin@demo.com' || pass !== 'admin123') throw new Error('Demo: usa admin@demo.com / admin123');
      userMem = { email:'admin@demo.com', nombre:'Administrador Demo', rol:'ADMIN' };
      try { localStorage.setItem(UKEY, JSON.stringify(userMem)); } catch (e) {}
    },
    async registro() { throw new Error('El registro está desactivado en modo demo'); },
    async logout() { userMem = null; try { localStorage.removeItem(UKEY); } catch (e) {} },
    reset() { db = seed(); save(); }
  };
}

/* ---------- SUPABASE ---------- */
function sbApi() {
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  const check = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  async function todo(tabla, orden) {          // pagina de 1000 en 1000
    let out = [], desde = 0;
    for (;;) {
      const page = check(await sb.from(tabla).select('*').order(orden).range(desde, desde + 999));
      out = out.concat(page);
      if (page.length < 1000) return out;
      desde += 1000;
    }
  }
  const mover = async (codigo, tipo, cantidad, nota) => check(await sb.from('movimientos').insert({ codigo, tipo, cantidad, nota: nota || null }));
  return {
    async cargar() {
      const [marcas, categorias, repuestos] = await Promise.all([todo('marcas', 'nombre'), todo('categorias', 'nombre'), todo('repuestos', 'codigo')]);
      return { marcas, categorias, repuestos:enriquecer(repuestos, marcas, categorias) };
    },
    async crear(r, stockInicial) {
      check(await sb.from('repuestos').insert({ ...camposRepuesto(r), stock:0 }));
      if (stockInicial > 0) await mover(r.codigo, 'ENTRADA', stockInicial, 'Stock inicial');
    },
    async actualizar(r) { const { codigo, ...resto } = camposRepuesto(r); check(await sb.from('repuestos').update(resto).eq('codigo', codigo)); },
    async eliminar(codigo) { check(await sb.from('repuestos').delete().eq('codigo', codigo)); },
    mover,
    async movimientos() { return check(await sb.from('movimientos').select('*').order('fecha', { ascending:false }).limit(200)); },
    async nuevaOpcion(tabla, nombre) { return check(await sb.from(tabla).insert({ nombre }).select('id').single()).id; },
    async sesion() {
      const { data:{ session } } = await sb.auth.getSession();
      if (!session) return null;
      const { data:p } = await sb.from('perfiles').select('nombre,rol').eq('id', session.user.id).maybeSingle();
      return { email:session.user.email, nombre:p?.nombre || session.user.email, rol:p?.rol || 'CLIENTE' };
    },
    async login(email, pass) { check(await sb.auth.signInWithPassword({ email, password:pass })); },
    async registro(email, pass, nombre) {
      const d = check(await sb.auth.signUp({ email, password:pass, options:{ data:{ nombre } } }));
      return d.session ? 'ok' : 'confirmar';
    },
    async logout() { await sb.auth.signOut(); }
  };
}
const api = DEMO ? demoApi() : sbApi();

window.Data = { api, DEMO, norm };
})();
