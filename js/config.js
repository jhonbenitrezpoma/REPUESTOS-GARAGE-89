// =====================================================================
//  CONFIGURACIÓN  (edita solo este archivo)
//  - Deja SUPABASE_URL y SUPABASE_ANON_KEY vacíos => MODO DEMO
//    (los datos se guardan solo en tu navegador, sirve para probar).
//  - La "anon key" es pública por diseño; la seguridad la dan las
//    políticas RLS de supabase/schema.sql. NUNCA pongas la service_role.
// =====================================================================
window.CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  NEGOCIO: 'REPUESTOS GARAGE 89',
  MONEDA: 'COP',          // código ISO: COP, PEN, USD, MXN...
  LOCALE: 'es-CO',        // formato de números: es-CO, es-PE, es-MX...
  WHATSAPP: ''            // opcional: 573001234567 (con código de país, sin +)
};
