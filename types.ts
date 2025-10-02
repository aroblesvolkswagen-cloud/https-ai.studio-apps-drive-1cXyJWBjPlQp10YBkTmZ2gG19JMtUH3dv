export enum Role {
  Admin = 'Administrador de Calidad',
  Operator = 'Operador',
  Reader = 'Lector (Ventas/Planeación)',
  Warehouse = 'Almacén',
}

export interface User {
  name: string;
  role: Role;
  modules: Module[];
}

export interface Employee {
  id: string; // Employee number
  name: string;
  position: string;
  email: string;
  phone: string;
  hireDate: string; // Date string
  role: Role;
  modules: Module[];
  status: 'Active' | 'Archived';
  archivedAt: string | null;
  deletedAt: string | null;
}

export enum InventoryCategory {
  RawMaterial = 'Materia Prima',
  WorkInProgress = 'Producto en Proceso',
  FinishedGood = 'Producto Terminado',
}

export enum Module {
  Home = 'Inicio',
  Dashboard = 'Dashboard',
  OrderManagement = 'Gestión de Órdenes',
  ScrapControl = 'Control de Scrap',
  InventoryAndMaterials = 'Inventarios y Materiales',
  MachineManagement = 'Gestión de Máquinas',
  EmployeeManagement = 'Gestión de Empleados',
  FMEA = 'Análisis FMEA',
  Settings = 'Ajustes',
  Trash = 'Papelera',
}

export enum JobType {
  PrintedLabel = 'Etiqueta Impresa',
  WhiteLabel = 'Etiqueta Blanca',
  ShrinkSleeve = 'Manga Termoencogible',
  FlexiblePackaging = 'Empaque Flexible',
  Other = 'Otro',
}

export enum FinishType {
  Lamination = 'Laminado',
  Varnish = 'Barniz UV',
  HotStamping = 'Hot Stamping',
  ColdFoil = 'Cold Foil',
  Embossing = 'Embossing',
  None = 'Ninguno',
}

export interface Machine {
    id: string;
    name: string;
    type: 'Flexo' | 'Digital' | 'Híbrida' | 'Otra';
    status: 'Operativa' | 'En Mantenimiento' | 'Fuera de Servicio' | 'Archivada';
    maxWidth: number; // in mm
    maxSpeed: number; // in m/min
    colorStations: number;
    lastMaintenance: string; // Date string
    nextMaintenance: string; // Date string
    totalHoursAvailable: number;
    totalHoursOperational: number;
    archivedAt: string | null;
    deletedAt: string | null;
}

export type Uom = 'g' | 'kg' | 'm' | 'unit' | 'labels' | 'h' | 'kWh';
export type MaterialType = 'ink' | 'paper' | 'adhesive' | 'liner' | 'varnish' | 'labelStock' | 'solvent' | 'mro' | 'tool' | 'service' | 'misc';
// FIX: Added 'per_h' and 'per_kWh' to the PricingMode type to support service and energy materials.
export type PricingMode = 'per_g' | 'per_kg' | 'per_m' | 'per_unit' | 'per_roll' | 'per_h' | 'per_kWh';


export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  uomBase: Uom;
  pricing: {
    mode: PricingMode;
    price: number;
    lengthMetersPerRoll?: number;
    labelsPerRoll?: number;
    weightKgPerRoll?: number;
  };
  basisWeight_g_m2?: number;
  width_mm?: number;
  supplierId?: string;
  costMethod?: 'standard' | 'fifo' | 'avg';
  stdCost?: number;
  status: 'Active' | 'Archived';
  archivedAt: string | null;
  deletedAt: string | null;
}


export interface OrderMaterialUsage {
  materialId: string;
  qty: number;
  unit: Uom;
  note?: string;
  source?: 'plan' | 'actual';
}


export type ProductionStatus = 'Nueva' | 'En Progreso' | 'Pausada' | 'Completada' | 'Cancelada' | 'Pendiente' | 'Archivada';

export interface Ink {
  id: string;
  name: string;
  pricePerGram: number;
  hex: string;
}

export interface InkUsageComponent {
  name: string;
  weight: number;
  cost: number;
  hex: string;
  percentage: number;
}

export interface InkUsage {
  inkId: string;
  name: string;
  hex?: string;
  type: 'new' | 'reused';
  consumption: number;
  leftover: number;
  pricePerGram: number;
  clicheId?: string;
  components?: InkUsageComponent[];
}

export interface RoutingOperation {
  id: string;
  machineId: string;
  setupTime_h: number;
  runTime_h?: number;
  runSpeed_m_per_h?: number;
  operatorCategory?: string;
  scrapPlanned_pct?: number;
}

export interface Tooling {
  id: string;
  name: string;
  purchaseCost: number;
  amortizationUnits: number;
  unit: 'labels' | 'm';
}

export enum ProductionEventType {
  Setup = 'Inicio de Setup',
  Run = 'Inicio de Corrida',
  Pause = 'Pausa',
  Resume = 'Reanudación',
  GoodProduction = 'Producción Buena',
  Scrap = 'Registro de Scrap',
  Complete = 'Orden Completada',
  Modification = 'Modificación de Orden',
}

export interface ProductionEvent {
  id: string;
  timestamp: string;
  type: ProductionEventType;
  operatorId: string;
  machineId: string;
  notes?: string;
  // Optional quantity for 'GoodProduction' and 'Scrap' events
  quantity?: number;
  unit?: Uom;
  scrapEntryId?: string; // Link to the specific scrap entry
}


export interface ProductionOrder {
  id: string;
  productName?: string;
  operatorId?: string;
  machineId?: string;
  status: ProductionStatus;
  completionDate?: string;
  materials: OrderMaterialUsage[];
  routing?: RoutingOperation[];
  tooling?: Tooling[];
  labelsPerMeter?: number;
  labelsPlanned?: number;
  labelsActual?: number;
  metersPlanned?: number;
  metersActual?: number;
  goodQty?: { g?: number; m?: number; labels?: number; unit?: number };
  targetCost?: number;
  actualCost?: number;
  
  // Progress tracking
  quantityProduced: number; // This exists, will be updated by events
  linearMetersProduced?: number;
  progressPercentage?: number;
  events: ProductionEvent[];

  // Merged fields from previous structure
  client: string;
  product: string;
  inks: InkUsage[];
  quantity: number;
  quantityUnit: string;
  surface: number;
  surfaceUnit: string;
  calculationMode?: 'manual' | 'auto';
  labelLength?: number;
  labelWidth?: number;
  labelsAcross?: number;
  labelGapX?: number; // default 3.175
  labelGapY?: number; // default 3.175
  isColorJob?: boolean;
  inkCoverage?: number;
  linearMetersRequired?: number;
  targetInkWeight?: number;
  jobType?: JobType;
  substrate?: string;
  finishes?: FinishType[];
  numberOfColors?: number;
  complexityRating?: 'Baja' | 'Media' | 'Alta' | 'Experta';
  
  // Archiving
  archivedAt: string | null;
  deletedAt: string | null;
}

export interface ScrapEntry {
  id: string;
  orderId?: string;
  materialId: string;
  category: MaterialType;
  cause?: string;
  date: string;
  unitCaptured: Uom;
  qty: number;
  operatorId?: string;
  machineId?: string;
  cost: number;
  note?: string;
}

export interface Targets {
  global: { qtyPct?: number; costPct?: number };
  byShift?: Record<'A'|'B'|'C', { qtyPct?: number; costPct?: number }>;
  byOperator?: Record<string, { qtyPct?: number; costPct?: number }>;
  byMachine?: Record<string, { qtyPct?: number; costPct?: number }>;
  byMaterialType?: Partial<Record<MaterialType, { qtyPct?: number; costPct?: number }>>;
  byCause?: Record<string, { qtyPct?: number; costPct?: number }>;
}

export interface RateTables {
  laborRates: Record<string, number>; // categoría → $/h
  machineRates: Record<string, number>; // machineId → $/h
  energyRatePerKWh?: number;
  overheadPerOrder?: number;
  overheadPerHour?: number;
}


export interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  category: InventoryCategory;
  opId?: string;
  quantity: number;
  unit: string;
  location: string;
  costPerUnit: number;
  minStock: number;
  supplier?: string;
}

export interface FmeaRow {
  id: number;
  processStep: string;
  potentialFailureMode: string;
  potentialEffect: string;
  severity: number;
  potentialCause: string;
  occurrence: number;
  currentControls: string;
  detection: number;
  rpn: number;
  recommendedAction: string;
}

export interface FmeaDocument {
  id: string;
  name: string;
  scope: string;
  team: string[];
  rows: FmeaRow[];
}

export interface InkFormulaComponent {
  inkId: string;
  name: string;
  percentage: number;
}

export interface InkFormula {
  id: string; // e.g., 'PAN-4572C'
  name: string;
  targetHex: string;
  components: InkFormulaComponent[];
}

export interface OperatorPerformanceData {
  operatorId: string;
  operator: string;
  ordersCompleted: number;
  scrapCost: number;
  avgCostEfficiency: number;
}

export interface PantoneComponent {
  name: string;
  percentage: number;
  hex: string;
  role: string;
}

export interface PantoneFormulaResult {
    pantoneName: string;
    hex: string;
    description: string;
    components: PantoneComponent[];
}