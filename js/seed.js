// Datos de ejemplo (precios en COP, referenciales). Se usan en modo demo y para el seed de Supabase.
window.SEED = {
  marcas: ['CF Moto', 'Suzuki', 'Bajaj', 'Alternos'],
  categorias: ['Motor', 'Frenos', 'Transmisión', 'Eléctrico', 'Suspensión', 'Filtros y Lubricantes', 'Carrocería', 'Llantas y Rines'],
  repuestos: [
    // ---------- CF MOTO ----------
    { codigo:'CFM-001', nombre:'Pastillas de freno delanteras', marca:'CF Moto', categoria:'Frenos', tipo:'ORIGINAL', fabricante:'CF Moto', modelos:'150NK, 250NK, 300SR', precio:68000, stock:12, stock_minimo:4, ubicacion:'A-01' },
    { codigo:'CFM-002', nombre:'Pastillas de freno traseras', marca:'CF Moto', categoria:'Frenos', tipo:'ORIGINAL', fabricante:'CF Moto', modelos:'150NK, 250NK, 300SR', precio:54000, stock:9, stock_minimo:4, ubicacion:'A-01' },
    { codigo:'CFM-003', nombre:'Filtro de aceite', marca:'CF Moto', categoria:'Filtros y Lubricantes', tipo:'ORIGINAL', fabricante:'CF Moto', modelos:'250NK, 300SR, 450SR', precio:32000, stock:25, stock_minimo:8, ubicacion:'B-02' },
    { codigo:'CFM-004', nombre:'Kit de arrastre (cadena + piñón + catalina)', marca:'CF Moto', categoria:'Transmisión', tipo:'ORIGINAL', fabricante:'CF Moto', modelos:'250NK, 300NK', precio:285000, stock:4, stock_minimo:2, ubicacion:'C-03' },
    { codigo:'CFM-005', nombre:'Bujía iridium', marca:'CF Moto', categoria:'Motor', tipo:'ORIGINAL', fabricante:'CF Moto', modelos:'450SR, 650MT', precio:46000, stock:14, stock_minimo:6, ubicacion:'B-01' },
    { codigo:'CFM-006', nombre:'Disco de freno delantero', marca:'CF Moto', categoria:'Frenos', tipo:'ORIGINAL', fabricante:'CF Moto', modelos:'650MT, 650NK', precio:395000, stock:2, stock_minimo:2, ubicacion:'A-02' },
    { codigo:'CFM-007', nombre:'Retenedor de horquilla (par)', marca:'CF Moto', categoria:'Suspensión', tipo:'ORIGINAL', fabricante:'CF Moto', modelos:'250NK, 300SR', precio:78000, stock:6, stock_minimo:2, ubicacion:'D-01' },
    { codigo:'CFM-008', nombre:'Faro delantero LED', marca:'CF Moto', categoria:'Eléctrico', tipo:'ORIGINAL', fabricante:'CF Moto', modelos:'250NK', precio:520000, stock:1, stock_minimo:1, ubicacion:'E-01' },
    // ---------- SUZUKI ----------
    { codigo:'SUZ-001', nombre:'Pastillas de freno delanteras', marca:'Suzuki', categoria:'Frenos', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'Gixxer 150, GN125, AX4', precio:42000, stock:18, stock_minimo:6, ubicacion:'F-01' },
    { codigo:'SUZ-002', nombre:'Filtro de aceite', marca:'Suzuki', categoria:'Filtros y Lubricantes', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'Gixxer 150, DR650, V-Strom 650', precio:28000, stock:30, stock_minimo:10, ubicacion:'F-02' },
    { codigo:'SUZ-003', nombre:'Filtro de aire', marca:'Suzuki', categoria:'Filtros y Lubricantes', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'GN125, Best 125', precio:24000, stock:15, stock_minimo:5, ubicacion:'F-02' },
    { codigo:'SUZ-004', nombre:'Kit de arrastre 428H', marca:'Suzuki', categoria:'Transmisión', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'GN125, Best 125, AX4', precio:96000, stock:8, stock_minimo:3, ubicacion:'G-01' },
    { codigo:'SUZ-005', nombre:'Bobina de encendido', marca:'Suzuki', categoria:'Eléctrico', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'Gixxer 150', precio:88000, stock:5, stock_minimo:2, ubicacion:'H-01' },
    { codigo:'SUZ-006', nombre:'Kit de empaques de motor', marca:'Suzuki', categoria:'Motor', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'GN125', precio:112000, stock:3, stock_minimo:2, ubicacion:'F-03' },
    { codigo:'SUZ-007', nombre:'Amortiguador trasero (par)', marca:'Suzuki', categoria:'Suspensión', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'GN125, AX4', precio:185000, stock:0, stock_minimo:2, ubicacion:'G-02' },
    { codigo:'SUZ-008', nombre:'Manigueta de freno', marca:'Suzuki', categoria:'Frenos', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'Gixxer 150, GN125', precio:22000, stock:10, stock_minimo:4, ubicacion:'F-04' },
    { codigo:'SUZ-009', nombre:'Cadena de tiempo', marca:'Suzuki', categoria:'Motor', tipo:'ORIGINAL', fabricante:'Suzuki', modelos:'DR650', precio:140000, stock:2, stock_minimo:1, ubicacion:'F-03' },
    // ---------- BAJAJ ----------
    { codigo:'BAJ-001', nombre:'Pastillas de freno delanteras', marca:'Bajaj', categoria:'Frenos', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Pulsar NS160, Pulsar 200NS, Dominar 400', precio:46000, stock:20, stock_minimo:6, ubicacion:'J-01' },
    { codigo:'BAJ-002', nombre:'Zapatas de freno traseras', marca:'Bajaj', categoria:'Frenos', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Boxer CT100, Platina 100, Discover 125', precio:19000, stock:28, stock_minimo:10, ubicacion:'J-01' },
    { codigo:'BAJ-003', nombre:'Kit de arrastre 428H', marca:'Bajaj', categoria:'Transmisión', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Pulsar NS160, Pulsar 180', precio:98000, stock:9, stock_minimo:3, ubicacion:'K-01' },
    { codigo:'BAJ-004', nombre:'Kit de arrastre 428 (CT100)', marca:'Bajaj', categoria:'Transmisión', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Boxer CT100, Platina 100', precio:72000, stock:11, stock_minimo:4, ubicacion:'K-01' },
    { codigo:'BAJ-005', nombre:'Filtro de aceite', marca:'Bajaj', categoria:'Filtros y Lubricantes', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Pulsar 200NS, Dominar 400', precio:26000, stock:22, stock_minimo:8, ubicacion:'J-02' },
    { codigo:'BAJ-006', nombre:'Clutch (juego de discos)', marca:'Bajaj', categoria:'Transmisión', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Pulsar NS160, Pulsar 200NS', precio:135000, stock:4, stock_minimo:2, ubicacion:'K-02' },
    { codigo:'BAJ-007', nombre:'Regulador / rectificador', marca:'Bajaj', categoria:'Eléctrico', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Pulsar NS160, Pulsar 200NS', precio:78000, stock:3, stock_minimo:2, ubicacion:'L-01' },
    { codigo:'BAJ-008', nombre:'Kit de pistón y anillos', marca:'Bajaj', categoria:'Motor', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Boxer CT100, Discover 125', precio:88000, stock:6, stock_minimo:2, ubicacion:'K-03' },
    { codigo:'BAJ-009', nombre:'Guaya de acelerador', marca:'Bajaj', categoria:'Motor', tipo:'ORIGINAL', fabricante:'Bajaj', modelos:'Boxer CT100, Platina 100', precio:14000, stock:1, stock_minimo:4, ubicacion:'K-04' },
    // ---------- ALTERNOS ----------
    { codigo:'ALT-001', nombre:'Bujía CR8E (compatible varias)', marca:'Alternos', categoria:'Motor', tipo:'ALTERNO', fabricante:'NGK', modelos:'Pulsar 200NS, Gixxer 150, 250NK', precio:18000, stock:40, stock_minimo:15, ubicacion:'M-01' },
    { codigo:'ALT-002', nombre:'Aceite 20W-50 mineral 1L', marca:'Alternos', categoria:'Filtros y Lubricantes', tipo:'ALTERNO', fabricante:'Motul', modelos:'Universal 4T', precio:42000, stock:36, stock_minimo:12, ubicacion:'M-02' },
    { codigo:'ALT-003', nombre:'Aceite 10W-40 sintético 1L', marca:'Alternos', categoria:'Filtros y Lubricantes', tipo:'ALTERNO', fabricante:'Castrol', modelos:'Universal 4T', precio:58000, stock:24, stock_minimo:10, ubicacion:'M-02' },
    { codigo:'ALT-004', nombre:'Cadena 428H x 120 eslabones', marca:'Alternos', categoria:'Transmisión', tipo:'ALTERNO', fabricante:'DID', modelos:'125-160cc universal', precio:65000, stock:14, stock_minimo:5, ubicacion:'N-01' },
    { codigo:'ALT-005', nombre:'Pastillas de freno universales (delanteras)', marca:'Alternos', categoria:'Frenos', tipo:'ALTERNO', fabricante:'Vesrah', modelos:'Pulsar, Gixxer, NK compatibles', precio:32000, stock:16, stock_minimo:6, ubicacion:'N-02' },
    { codigo:'ALT-006', nombre:'Llanta 90/90-17 trasera', marca:'Alternos', categoria:'Llantas y Rines', tipo:'ALTERNO', fabricante:'Pirelli', modelos:'Pulsar, Gixxer, 150-200cc', precio:185000, stock:7, stock_minimo:3, ubicacion:'P-01' },
    { codigo:'ALT-007', nombre:'Llanta 110/70-17 delantera', marca:'Alternos', categoria:'Llantas y Rines', tipo:'ALTERNO', fabricante:'Michelin', modelos:'Pulsar NS, 250NK, Gixxer', precio:240000, stock:5, stock_minimo:2, ubicacion:'P-01' },
    { codigo:'ALT-008', nombre:'Bombillo LED H4 (par)', marca:'Alternos', categoria:'Eléctrico', tipo:'ALTERNO', fabricante:'Osram', modelos:'Universal', precio:48000, stock:20, stock_minimo:6, ubicacion:'M-03' },
    { codigo:'ALT-009', nombre:'Batería YTX7A-BS 12V', marca:'Alternos', categoria:'Eléctrico', tipo:'ALTERNO', fabricante:'Yuasa', modelos:'GN125, Gixxer 150, Pulsar 180', precio:125000, stock:6, stock_minimo:3, ubicacion:'M-04' },
    { codigo:'ALT-010', nombre:'Espejos retrovisores (par)', marca:'Alternos', categoria:'Carrocería', tipo:'ALTERNO', fabricante:'Genérico', modelos:'Universal 8mm/10mm', precio:36000, stock:18, stock_minimo:6, ubicacion:'P-02' }
  ]
};
