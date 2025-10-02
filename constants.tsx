import React from 'react';
import { Role, Module, Ink, InventoryItem, ScrapEntry, Machine, FmeaDocument, Employee, InventoryCategory, InkFormula, JobType, FinishType, ProductionOrder, Material, RateTables, Targets } from './types';

export const USER_ROLES = [
  Role.Admin,
  Role.Operator,
  Role.Reader,
  Role.Warehouse,
];

export const INK_CATALOG: Ink[] = [
    // Original Colors
    { id: 'PAN-186C', name: 'Pantone 186 C', pricePerGram: 0.05, hex: '#C8102E' },
    { id: 'PAN-BLK6C', name: 'Pantone Black 6 C', pricePerGram: 0.04, hex: '#2D2926' },
    { id: 'PAN-CG8C', name: 'Pantone Cool Gray 8 C', pricePerGram: 0.045, hex: '#838486' },
    { id: 'PAN-286C', name: 'Pantone 286 C', pricePerGram: 0.055, hex: '#003DA5' },
    { id: 'PAN-485C', name: 'Pantone 485 C', pricePerGram: 0.06, hex: '#DA291C' },
    { id: 'PAN-347C', name: 'Pantone 347 C', pricePerGram: 0.052, hex: '#009A44' },
    { id: 'PAN-YLW012C', name: 'Pantone Yellow 012 C', pricePerGram: 0.048, hex: '#FEDD00' },
    { id: 'PAN-TRANSWHT', name: 'Pantone Transparent White', pricePerGram: 0.03, hex: '#FFFFFF' },
    { id: 'PAN-ORG021C', name: 'Pantone Orange 021 C', pricePerGram: 0.058, hex: '#F76900' },
    { id: 'PAN-GRNC', name: 'Pantone Green C', pricePerGram: 0.053, hex: '#00A95C' },
    { id: 'PAN-REFBLUC', name: 'Pantone Reflex Blue C', pricePerGram: 0.056, hex: '#001489' },
    { id: 'PAN-RUBRED', name: 'Pantone Rubine Red C', pricePerGram: 0.062, hex: '#CE0058' },
    { id: 'PAN-WARMRED', name: 'Pantone Warm Red C', pricePerGram: 0.061, hex: '#F9423A' },
    { id: 'PAN-PURPLE', name: 'Pantone Purple C', pricePerGram: 0.065, hex: '#6B2F91' },
    { id: 'PAN-BLUE072', name: 'Pantone Blue 072 C', pricePerGram: 0.057, hex: '#00209F' },
    { id: 'PAN-PROCBLUE', name: 'Pantone Process Blue C', pricePerGram: 0.054, hex: '#0085CA' },
    { id: 'PAN-VIOLC', name: 'Pantone Violet C', pricePerGram: 0.066, hex: '#8F00FF' },
    { id: 'PAN-RHODRED', name: 'Pantone Rhodamine Red C', pricePerGram: 0.063, hex: '#E0007C' },
    { id: 'PAN-PROCBLACK', name: 'Pantone Process Black C', pricePerGram: 0.04, hex: '#231F20' },
    { id: 'PAN-293C', name: 'Pantone 293 C', pricePerGram: 0.056, hex: '#005BBB' },
    { id: 'PAN-109C', name: 'Pantone 109 C', pricePerGram: 0.049, hex: '#FFD100' },
    { id: 'PAN-355C', name: 'Pantone 355 C', pricePerGram: 0.053, hex: '#009639' },
    // Expanded Catalog
    { id: 'PAN-1795C', name: 'Pantone 1795 C', pricePerGram: 0.059, hex: '#D42E12' },
    { id: 'PAN-200C', name: 'Pantone 200 C', pricePerGram: 0.061, hex: '#BA0C2F' },
    { id: 'PAN-7408C', name: 'Pantone 7408 C', pricePerGram: 0.050, hex: '#FFB81C' },
    { id: 'PAN-137C', name: 'Pantone 137 C', pricePerGram: 0.055, hex: '#FFA300' },
    { id: 'PAN-361C', name: 'Pantone 361 C', pricePerGram: 0.054, hex: '#62B543' },
    { id: 'PAN-3278C', name: 'Pantone 3278 C', pricePerGram: 0.057, hex: '#00A388' },
    { id: 'PAN-300C', name: 'Pantone 300 C', pricePerGram: 0.058, hex: '#0072CE' },
    { id: 'PAN-2736C', name: 'Pantone 2736 C', pricePerGram: 0.063, hex: '#262262' },
    { id: 'PAN-2607C', name: 'Pantone 2607 C', pricePerGram: 0.067, hex: '#662D91' },
    { id: 'PAN-226C', name: 'Pantone 226 C', pricePerGram: 0.064, hex: '#D0006F' },
    { id: 'PAN-424C', name: 'Pantone 424 C', pricePerGram: 0.046, hex: '#939598' },
    { id: 'PAN-431C', name: 'Pantone 431 C', pricePerGram: 0.048, hex: '#4F5D73' },
    { id: 'PAN-4625C', name: 'Pantone 4625 C', pricePerGram: 0.051, hex: '#582C23' },
    { id: 'PAN-871C', name: 'Pantone 871 C (Gold)', pricePerGram: 0.08, hex: '#AF9B60' },
    { id: 'PAN-877C', name: 'Pantone 877 C (Silver)', pricePerGram: 0.075, hex: '#8A8D8F' },
    { id: 'PAN-032C', name: 'Pantone 032 C', pricePerGram: 0.06, hex: '#EF3340' },
    { id: 'PAN-151C', name: 'Pantone 151 C', pricePerGram: 0.057, hex: '#FF8200' },
    { id: 'PAN-376C', name: 'Pantone 376 C', pricePerGram: 0.052, hex: '#84BD00' },
    { id: 'PAN-2925C', name: 'Pantone 2925 C', pricePerGram: 0.055, hex: '#00A9E0' },
    { id: 'PAN-2727C', name: 'Pantone 2727 C', pricePerGram: 0.061, hex: '#414099' },
    { id: 'PAN-2592C', name: 'Pantone 2592 C', pricePerGram: 0.066, hex: '#8660A5' },
    { id: 'PAN-1925C', name: 'Pantone 1925 C', pricePerGram: 0.062, hex: '#D41B5B' },
    { id: 'PAN-WG7C', name: 'Pantone Warm Gray 7 C', pricePerGram: 0.044, hex: '#A7A8AA' },
    { id: 'PAN-419C', name: 'Pantone 419 C (Black)', pricePerGram: 0.042, hex: '#000000' },
    { id: 'PAN-YLWC', name: 'Pantone Yellow C', pricePerGram: 0.048, hex: '#FFDE00' },
    { id: 'PAN-541C', name: 'Pantone 541 C', pricePerGram: 0.058, hex: '#004B87' },
    { id: 'PAN-7462C', name: 'Pantone 7462 C', pricePerGram: 0.059, hex: '#006778' },
    { id: 'PAN-7549C', name: 'Pantone 7549 C', pricePerGram: 0.050, hex: '#F3E5AB' },
    { id: 'PAN-1585C', name: 'Pantone 1585 C', pricePerGram: 0.056, hex: '#EA7600' },
    { id: 'PAN-390C', name: 'Pantone 390 C', pricePerGram: 0.051, hex: '#B5AC19' },
    { id: 'PAN-7686C', name: 'Pantone 7686 C', pricePerGram: 0.060, hex: '#0038A8' },
];

export const INITIAL_INK_FORMULAS: InkFormula[] = [
    {
        id: 'PAN-4572C',
        name: 'Pantone 4572 C',
        targetHex: '#5B5A4B',
        components: [
            { inkId: 'PAN-BLK6C', name: 'PANTONE Black C', percentage: 50.0 },
            { inkId: 'PAN-YLW012C', name: 'PANTONE Yellow 012 C', percentage: 46.9 },
            { inkId: 'PAN-TRANSWHT', name: 'PANTONE Transparent White', percentage: 3.1 },
        ]
    },
    {
        id: 'PAN-CG9C',
        name: 'Pantone Cool Gray 9 C',
        targetHex: '#75787B',
        components: [
            { inkId: 'PAN-BLK6C', name: 'PANTONE Black C', percentage: 75.0 },
            { inkId: 'PAN-TRANSWHT', name: 'PANTONE Transparent White', percentage: 25.0 },
        ]
    },
    {
        id: 'PAN-GRASSGRN',
        name: 'Pantone Grass Green C',
        targetHex: '#009A44',
        components: [
            { inkId: 'PAN-GRNC', name: 'Pantone Green C', percentage: 87.5 },
            { inkId: 'PAN-YLW012C', name: 'PANTONE Yellow 012 C', percentage: 12.5 },
        ]
    },
    {
        id: 'PAN-DEEPPURPLE',
        name: 'Pantone Deep Purple C',
        targetHex: '#5A2D82',
        components: [
            { inkId: 'PAN-PURPLE', name: 'Pantone Purple C', percentage: 80.0 },
            { inkId: 'PAN-BLK6C', name: 'PANTONE Black C', percentage: 20.0 },
        ]
    },
    {
        id: 'PAN-BRIGHTORANGE',
        name: 'Pantone Bright Orange C',
        targetHex: '#FF7F00',
        components: [
            { inkId: 'PAN-ORG021C', name: 'Pantone Orange 021 C', percentage: 50.0 },
            { inkId: 'PAN-WARMRED', name: 'Pantone Warm Red C', percentage: 50.0 },
        ]
    }
];

export const JOB_TYPES: JobType[] = Object.values(JobType);
export const FINISH_TYPES: FinishType[] = Object.values(FinishType);

export const UNITS_OF_MEASURE = [
    'unidades', 'kg', 'g', 'L', 'mL', 'm', 'm²', 'rollos', 'millares', 'galones'
];

export const QUANTITY_UNITS = ['millares', 'unidades', 'cajas'];
export const SURFACE_UNITS = ['m²', 'cm²', 'ft²'];


export const TEXT_INPUT_STYLE = "input-glass w-full";

// Engineering Constants
export const LABEL_GAP_MM = 3.175; // Standard gap between labels
export const WASTE_FACTOR_WHITE = 1.01; // 1% waste for non-color jobs
export const WASTE_FACTOR_COLOR = 1.1; // 10% waste for color jobs
export const DEFAULT_INK_COVERAGE_G_PER_M2 = 1.5; // Standard ink laydown for flexo


export const INITIAL_INVENTORY: InventoryItem[] = [
    // Producto Terminado (PT)
    { id: 'P001', sku: 'NISSAN-ETQ-001', productName: 'Etiqueta Puerta Nissan 1', category: InventoryCategory.FinishedGood, opId: 'OP-NISSAN-001', quantity: 50, unit: 'millares', location: 'A1-R2', costPerUnit: 12.50, minStock: 25 },
    { id: 'P002', sku: 'NISSAN-ETQ-002', productName: 'Etiqueta Puerta Nissan 2', category: InventoryCategory.FinishedGood, opId: 'OP-NISSAN-002', quantity: 15, unit: 'millares', location: 'A1-R3', costPerUnit: 12.50, minStock: 20 },
    { id: 'P003', sku: 'BOSCH-SEN-015', productName: 'Sensor ABS Bosch', category: InventoryCategory.FinishedGood, opId: 'OP-BOSCH-015', quantity: 120, unit: 'unidades', location: 'B2-R1', costPerUnit: 25.00, minStock: 50 },
    
    // Materia Prima (MP)
    { id: 'MP001', sku: 'TINTA-ROJA-01', productName: 'Tinta Roja Pantone 485C', category: InventoryCategory.RawMaterial, quantity: 5.5, unit: 'kg', location: 'T1-R1', costPerUnit: 60.00, minStock: 2, supplier: 'Sun Chemical' },
    { id: 'MP002', sku: 'SUSTR-PP-BCO', productName: 'Polipropileno Blanco 60mic', category: InventoryCategory.RawMaterial, quantity: 3500, unit: 'm²', location: 'S2-R5', costPerUnit: 1.20, minStock: 1000, supplier: 'Avery Dennison' },

    // Producto en Proceso (PP)
    { id: 'PP001', sku: 'WIP-ETQ-FORD', productName: 'Etiqueta Puerta Ford (impresa sin suajar)', category: InventoryCategory.WorkInProgress, opId: 'OP-WIP-001', quantity: 10, unit: 'rollos', location: 'WIP-AREA-1', costPerUnit: 75.00, minStock: 0 },
];

export const INITIAL_EMPLOYEES: Employee[] = [
    { id: 'ADM-001', name: 'Admin Calidad', position: 'Administrador de Calidad', role: Role.Admin, email: 'admin.calidad@venki.com', phone: '55-0000-0001', hireDate: '2019-01-01', modules: Object.values(Module), status: 'Active', archivedAt: null, deletedAt: null },
    { id: 'ALM-001', name: 'Juan Almacenista', position: 'Jefe de Almacén', role: Role.Warehouse, email: 'almacen@venki.com', phone: '55-0000-0002', hireDate: '2020-05-15', modules: [Module.Home, Module.InventoryAndMaterials], status: 'Active', archivedAt: null, deletedAt: null },
    { id: 'OP-001', name: 'Carlos Prensista', position: 'Operador de Prensa', role: Role.Operator, email: 'carlos.p@venki.com', phone: '55-0000-0003', hireDate: '2021-03-10', modules: [Module.Home, Module.OrderManagement, Module.ScrapControl], status: 'Active', archivedAt: null, deletedAt: null },
    { id: 'INV-001', name: 'Usuario Invitado', position: 'Invitado', role: Role.Reader, email: 'invitado@venki.com', phone: 'N/A', hireDate: '2024-01-01', modules: [Module.Home, Module.Dashboard, Module.InventoryAndMaterials], status: 'Active', archivedAt: null, deletedAt: null },
];

export const INITIAL_SCRAP: ScrapEntry[] = [
    { id: 'S001', orderId: 'OP-NISSAN-001', materialId: 'MAT-INK-485C', category: 'ink', cause: 'Tinta Incorrecta', date: '2023-10-26', unitCaptured: 'g', qty: 250, operatorId: 'OP-001', machineId: 'G-ECS340', cost: 15.00 },
    { id: 'S002', orderId: 'OP-BOSCH-015', materialId: 'MAT-PAPER-001', category: 'paper', cause: 'Registro Mal', date: '2023-10-26', unitCaptured: 'm', qty: 50, operatorId: 'OP-001', machineId: 'G-ECS340', cost: 60.00 },
    { id: 'S003', orderId: 'OP-NISSAN-002', materialId: 'MAT-ADH-002', category: 'adhesive', cause: 'Adhesivo', date: '2023-10-27', unitCaptured: 'm', qty: 100, operatorId: 'OP-001', machineId: 'MA-P5', cost: 30.00 },
    { id: 'S004', orderId: 'OP-HP-001', materialId: 'MAT-INK-186C', category: 'ink', cause: 'Tinta Incorrecta', date: '2023-10-28', unitCaptured: 'g', qty: 200, operatorId: 'ADM-001', machineId: 'HP-I6900', cost: 10.00 },
    { id: 'S005', orderId: 'OP-BOSCH-015', materialId: 'MAT-PAPER-001', category: 'paper', cause: 'Error de Maquinaria', date: '2023-10-29', unitCaptured: 'm', qty: 30, operatorId: 'OP-001', machineId: 'G-ECS340', cost: 36.00 },
    { id: 'S006', orderId: 'OP-NISSAN-001', materialId: 'MAT-LABELS-001', category: 'labelStock', cause: 'Registro Mal', date: '2023-10-30', unitCaptured: 'labels', qty: 8000, operatorId: 'ADM-001', machineId: 'MA-P5', cost: 100.00 },
];

export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = [
    {
        id: 'OP-WIP-001',
        client: 'Ford',
        product: 'Etiqueta Puerta Ford',
        productName: 'Etiqueta Puerta Ford',
        quantity: 20,
        quantityUnit: 'rollos',
        surface: 5000,
        surfaceUnit: 'm²',
        inks: [{ inkId: 'PAN-BLK6C', name: 'Pantone Black 6 C', type: 'new', consumption: 500, leftover: 0, pricePerGram: 0.04 }],
        machineId: 'MA-P5',
        operatorId: 'OP-001',
        status: 'En Progreso',
        quantityProduced: 0,
        targetCost: 100.00,
        jobType: JobType.PrintedLabel,
        substrate: 'Polipropileno Blanco',
        finishes: [FinishType.Varnish],
        numberOfColors: 1,
        complexityRating: 'Baja',
        materials: [],
        events: [],
        archivedAt: null,
        deletedAt: null,
    },
    {
        id: 'OP-NISSAN-001',
        client: 'Nissan',
        product: 'Etiqueta Puerta Nissan 1',
        productName: 'Etiqueta Puerta Nissan 1',
        quantity: 50,
        quantityUnit: 'millares',
        surface: 1200,
        surfaceUnit: 'm²',
        inks: [
            { inkId: 'PAN-485C', name: 'Pantone 485 C', hex: '#DA291C', type: 'new', consumption: 1500, leftover: 100, pricePerGram: 0.06 },
            { inkId: 'PAN-BLK6C', name: 'Pantone Black 6 C', hex: '#2D2926', type: 'new', consumption: 800, leftover: 50, pricePerGram: 0.04 }
        ],
        machineId: 'G-ECS340',
        operatorId: 'OP-001',
        status: 'Completada',
        quantityProduced: 0,
        targetCost: 250.00,
        jobType: JobType.PrintedLabel,
        substrate: 'Papel Couche',
        finishes: [FinishType.Lamination, FinishType.Varnish],
        numberOfColors: 2,
        complexityRating: 'Media',
        materials: [],
        events: [],
        archivedAt: null,
        deletedAt: null,
    },
    {
        id: 'OP DEMO',
        client: 'EJEMPLO DEMO',
        product: 'ETIQUETA FONDEADA',
        productName: 'ETIQUETA FONDEADA',
        quantity: 35,
        quantityUnit: 'millares',
        surface: 7279.29,
        surfaceUnit: 'm²',
        inks: [],
        machineId: 'MA-P5',
        operatorId: 'INV-001',
        status: 'Pendiente',
        quantityProduced: 0,
        targetCost: 5400.00,
        actualCost: 78.83,
        jobType: JobType.PrintedLabel,
        materials: [],
        events: [],
        archivedAt: null,
        deletedAt: null,
    },
    {
        id: 'order-1',
        client: 'Cliente A',
        product: 'Pedido Cliente A',
        productName: 'Pedido Cliente A',
        quantity: 10000,
        quantityUnit: 'unidades',
        labelsPlanned: 10000,
        metersPlanned: 5000,
        labelsPerMeter: 2,
        inks: [],
        status: 'Pendiente',
        machineId: 'MA-P5',
        operatorId: 'OP-001',
        surface: 0,
        surfaceUnit: 'm²',
        quantityProduced: 0,
        materials: [],
        events: [],
        archivedAt: null,
        deletedAt: null,
    }
];

export const INITIAL_SCRAP_CAUSES: string[] = [
    'Tinta Incorrecta',
    'Registro Mal',
    'Adhesivo',
    'Corte',
    'Falta de Material',
    'Error de Maquinaria'
];

export const INITIAL_MACHINES: Machine[] = [
    { id: 'MA-P5', name: 'Mark Andy P5', type: 'Flexo', status: 'Operativa', maxWidth: 330, maxSpeed: 150, colorStations: 8, lastMaintenance: '2023-10-01', nextMaintenance: '2024-04-01', totalHoursAvailable: 160, totalHoursOperational: 120, archivedAt: null, deletedAt: null },
    { id: 'G-ECS340', name: 'Gallus ECS 340', type: 'Flexo', status: 'Operativa', maxWidth: 340, maxSpeed: 165, colorStations: 10, lastMaintenance: '2023-09-15', nextMaintenance: '2024-03-15', totalHoursAvailable: 160, totalHoursOperational: 135, archivedAt: null, deletedAt: null },
    { id: 'HP-I6900', name: 'HP Indigo 6900', type: 'Digital', status: 'En Mantenimiento', maxWidth: 340, maxSpeed: 40, colorStations: 7, lastMaintenance: '2023-10-25', nextMaintenance: '2023-11-25', totalHoursAvailable: 160, totalHoursOperational: 60, archivedAt: null, deletedAt: null },
];

export const INITIAL_FMEAS: FmeaDocument[] = [
    {
        id: 'PFMEA-001',
        name: 'PFMEA - Proceso de Impresión Flexográfica',
        scope: 'Desde la preparación de tinta hasta el producto final en la máquina Mark Andy P5.',
        team: ['Admin Calidad'],
        rows: [
            { id: 1, processStep: 'Preparación de Tinta', potentialFailureMode: 'Tinta Incorrecta', potentialEffect: 'Color fuera de especificación, scrap masivo', severity: 8, potentialCause: 'Error del operador al mezclar', occurrence: 3, currentControls: 'Doble chequeo de fórmula', detection: 6, rpn: 144, recommendedAction: 'Implementar sistema de código de barras para verificar componentes.' },
            { id: 2, processStep: 'Montaje de Placa', potentialFailureMode: 'Registro Mal', potentialEffect: 'Imagen borrosa, scrap', severity: 7, potentialCause: 'Placa mal montada en cilindro', occurrence: 4, currentControls: 'Inspección visual inicial', detection: 5, rpn: 140, recommendedAction: 'Usar sistema de montaje con cámaras.' },
            { id: 3, processStep: 'Impresión', potentialFailureMode: 'Adhesivo en superficie', potentialEffect: 'Problemas de embobinado, quejas de cliente', severity: 9, potentialCause: 'Fuga de adhesivo por los bordes (bleeding)', occurrence: 2, currentControls: 'Limpieza manual del operador', detection: 7, rpn: 126, recommendedAction: 'Evaluar un adhesivo con menor fluidez.' }
        ]
    }
];


export const INITIAL_MATERIALS: Material[] = [
    { id: 'MAT-PAPER-001', name: 'Papel Couche 80g', type: 'paper', uomBase: 'kg', pricing: { mode: 'per_kg', price: 2.5 }, basisWeight_g_m2: 80, width_mm: 330, status: 'Active', archivedAt: null, deletedAt: null },
    { id: 'MAT-PP-001', name: 'Polipropileno Blanco 60mic', type: 'labelStock', uomBase: 'm', pricing: { mode: 'per_roll', price: 350, lengthMetersPerRoll: 1000 }, width_mm: 340, status: 'Active', archivedAt: null, deletedAt: null },
    { id: 'MAT-INK-485C', name: 'Tinta Pantone 485C', type: 'ink', uomBase: 'g', pricing: { mode: 'per_g', price: 0.06 }, status: 'Active', archivedAt: null, deletedAt: null },
    { id: 'MAT-CLICHE-001', name: 'Cliché Estándar', type: 'tool', uomBase: 'unit', pricing: { mode: 'per_unit', price: 150 }, status: 'Active', archivedAt: null, deletedAt: null },
];

export const INITIAL_RATE_TABLES: RateTables = {
    laborRates: { 'default': 15, 'prensista_A': 20, 'ayudante': 12 },
    machineRates: { 'MA-P5': 50, 'G-ECS340': 65, 'HP-I6900': 80 },
    overheadPerOrder: 25,
    overheadPerHour: 10,
};

export const INITIAL_TARGETS: Targets = {
    global: { qtyPct: 2.5, costPct: 3.0 },
    byOperator: { 'OP-001': { qtyPct: 2.0, costPct: 2.5 } },
    byMachine: { 'MA-P5': { qtyPct: 3.0, costPct: 3.5 } },
    byMaterialType: { 'ink': { qtyPct: 5.0, costPct: 5.0 }, 'paper': { qtyPct: 1.5, costPct: 2.0 } },
    byCause: { 'Tinta Incorrecta': { qtyPct: 0.5, costPct: 1.0 } },
};


export const MACHINE_TYPES: Machine['type'][] = ['Flexo', 'Digital', 'Híbrida', 'Otra'];
export const MACHINE_STATUSES: Machine['status'][] = ['Operativa', 'En Mantenimiento', 'Fuera de Servicio'];


export const ICONS: { [key: string]: React.JSX.Element } = {
  [Module.Home]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  [Module.Dashboard]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6M9 12l2-2m0 0l2-2m-2 2v2m0-2l2 2m-2-2l-2-2" /></svg>,
  [Module.OrderManagement]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4H7zM10 21v-2m0 0V5m0 14h2M12 5h2m-2 0h-2m2 14v-2m0 0V5" /></svg>,
  [Module.ScrapControl]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  [Module.InventoryAndMaterials]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  [Module.MachineManagement]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  [Module.EmployeeManagement]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  [Module.FMEA]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8.25V15.75L12 12L3 8.25Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12L21 17.25V6.75L12 12Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12H21" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9.75L12 12" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 14.25L12 12" /></svg>,
  [Module.Trash]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  Logout: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Check: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
  Alert: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.226 2.85-1.226 3.486 0l5.58 10.792c.636 1.226-.45 2.609-1.743 2.609H4.42c-1.293 0-2.379-1.383-1.743-2.609l5.58-10.792zM10 14a1 1 0 100-2 1 1 0 000 2zm0-7a1 1 0 00-1 1v2a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
  Spinner: <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
  Edit: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>,
  Adjust: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Money: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 1v1m0-1c-1.11 0-2.08.402-2.599 1M12 8c1.11 0 2.08.402 2.599 1M15 9.599A3.987 3.987 0 0012 8m0 0V6m0 12v-2m1.5-8.5a4 4 0 01-3 0m3 0a4 4 0 00-3 0m0 0V6m0 0a2 2 0 10-4 0v2m4 0a2 2 0 114 0v-2m-4 8a2 2 0 10-4 0v-2m4 0a2 2 0 114 0v-2" /></svg>,
  Trash: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Export: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  View: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 4.5 10 4.5s6.268.443 9.542 5.5c.27.522.27 1.478 0 2C16.268 17.057 10.478 17.5 10 17.5s-6.268-.443-9.542-5.5c-.27-.522-.27-1.478 0-2zM10 15a5 5 0 100-10 5 5 0 000 10z" clipRule="evenodd" /></svg>,
  Question: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 .863-.27 1.66-.744 2.267l-1.163 1.163c-.22 .22-.22 .577 0 .797l1.163 1.163c.474.474.744 1.404.744 2.267 0 2.21-1.79 4-4 4-1.742 0-3.223-.835-3.772-2M10 12h4" /></svg>,
  History: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};
