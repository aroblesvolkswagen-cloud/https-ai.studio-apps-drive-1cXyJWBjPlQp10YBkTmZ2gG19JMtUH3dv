import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  User,
  Role,
  Module,
  InventoryItem,
  ScrapEntry,
  ProductionOrder,
  Machine,
  FmeaDocument,
  Employee,
  InkFormula,
  InkUsageComponent,
  Material,
  RateTables,
  Targets,
  ProductionEvent,
  ProductionEventType
} from './types';
import {
  INITIAL_INVENTORY,
  INITIAL_SCRAP,
  INITIAL_SCRAP_CAUSES,
  INITIAL_MACHINES,
  INITIAL_FMEAS,
  INITIAL_EMPLOYEES,
  INITIAL_INK_FORMULAS,
  INITIAL_PRODUCTION_ORDERS,
  INK_CATALOG,
  INITIAL_MATERIALS,
  INITIAL_RATE_TABLES,
  INITIAL_TARGETS
} from './constants';
import { getPantoneFormula } from './services/geminiService';
import { orderTotalCost, scrapCost } from "./utils/cost";

// --- Helper function for progress recalculation ---
const recalculateOrderProgress = (order: ProductionOrder): Partial<ProductionOrder> => {
    let totalQuantityFromLabels = 0;
    let totalQuantityFromMeters = 0;
    let totalMetersFromMeters = 0;
    let totalMetersFromLabels = 0;

    for (const event of order.events) {
        if (event.type === ProductionEventType.GoodProduction && event.quantity) {
            if (event.unit === 'labels') {
                totalQuantityFromLabels += event.quantity;
            } else if (event.unit === 'm') {
                totalMetersFromMeters += event.quantity;
            }
        }
    }

    if (order.labelsPerMeter && order.labelsPerMeter > 0) {
        totalQuantityFromMeters = totalMetersFromMeters * order.labelsPerMeter;
        totalMetersFromLabels = totalQuantityFromLabels / order.labelsPerMeter;
    }
    
    const finalTotalQuantity = totalQuantityFromLabels + totalQuantityFromMeters;
    const finalTotalMeters = totalMetersFromMeters + totalMetersFromLabels;

    let targetQuantity = order.labelsPlanned || 0;
    if (!targetQuantity && order.quantity) {
      targetQuantity = order.quantity * (order.quantityUnit === 'millares' ? 1000 : 1);
    }
    

    const progressPercentage = targetQuantity > 0 ? (finalTotalQuantity / targetQuantity) * 100 : 0;
    
    return {
        quantityProduced: finalTotalQuantity,
        linearMetersProduced: finalTotalMeters,
        progressPercentage: Math.min(progressPercentage, 100) // Cap at 100%
    };
};


// Define the shape of the state that will be persisted
interface PersistedState {
  adminPassword: string;
  inventoryItems: InventoryItem[];
  scrapEntries: ScrapEntry[];
  productionOrders: ProductionOrder[];
  scrapCauses: string[];
  machines: Machine[];
  fmeas: FmeaDocument[];
  employees: Employee[];
  inkFormulas: InkFormula[];
  // New persisted state for costing
  materials: Material[];
  // rateTables is not persisted per user request
  targets: Targets;
}

interface AppState extends PersistedState {
  // Auth State
  user: User | null;
  authError: string | null;

  // UI State
  activeModule: Module;
  isMobileMenuOpen: boolean;
  scrapControlInitialFilter: { type: 'operator'; value: string } | null;
  notification: { message: string, type: 'success' | 'error' } | null;
  confirmDialog: { title: string, message: string, onConfirm: () => void, onCancel?: () => void } | null;
  rateTables: RateTables; // Keep in-memory for calculations
}

interface AppActions {
  // Auth Actions
  login: (employee: Employee, password?: string) => void;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;

  // UI Actions
  setActiveModule: (module: Module) => void;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  setScrapControlInitialFilter: (filter: { type: 'operator'; value: string } | null) => void;
  setNotification: (notification: { message: string, type: 'success' | 'error' }) => void;
  clearNotification: () => void;
  showConfirm: (dialog: { title: string, message: string, onConfirm: () => void, onCancel?: () => void }) => void;
  hideConfirm: () => void;

  // Data Actions
  setInventoryItems: (items: InventoryItem[]) => void;
  setScrapEntries: (entries: ScrapEntry[]) => void;
  setProductionOrders: (orders: ProductionOrder[]) => void;
  updateProductionOrder: (order: ProductionOrder, changeLog?: string) => void;
  addProductionOrder: (order: ProductionOrder) => void;
  setScrapCauses: (causes: string[]) => void;
  setMachines: (machines: Machine[]) => void;
  setFmeas: (fmeas: FmeaDocument[]) => void;
  setEmployees: (employees: Employee[]) => void;
  setInkFormulas: (formulas: InkFormula[]) => void;
  addInkFormula: (formula: InkFormula) => void;
  fetchAndUpdateInkFormula: (orderId: string, inkId: string) => Promise<void>;
  // New actions for costing system
  setMaterials: (materials: Material[]) => void;
  setTargets: (targets: Targets) => void;
  addScrap: (entryInput: Partial<ScrapEntry>) => void;
  recomputeOrderCost: (orderId: string) => void;
  setOrderStatus: (orderId: string, status: ProductionOrder['status']) => void;
  setOrderTargetCost: (orderId: string, targetCost: number) => void;
  logProductionEvent: (orderId: string, eventData: Omit<ProductionEvent, 'id' | 'timestamp'>) => void;
  archiveItem: (id: string, type: 'order' | 'employee' | 'machine') => void;
  deleteItem: (id: string, type: 'order' | 'employee' | 'machine' | 'material') => void;
  restoreItem: (id: string, type: 'order' | 'employee' | 'machine' | 'material') => void;
  purgeItem: (id: string, type: 'order' | 'employee' | 'machine' | 'material') => void;
}

const STORAGE_KEY = 'venki-quality-hub-data';
const STORAGE_VERSION = 5; // Versioning for future migrations

// Safe storage utility to avoid crashes in non-browser environments (SSR)
const safeStorage = (): Storage => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  // Return a mock storage object if localStorage is not available
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } as unknown as Storage;
};

// Initial state creator, allows us to run logic before creating the store
const getInitialState = () => {
  // Use structuredClone for a deep copy to prevent any mutation of constants.
  const initialOrders = structuredClone(INITIAL_PRODUCTION_ORDERS);
  const initialScrap = structuredClone(INITIAL_SCRAP);
  const ordersToUpdate = new Set<string>();

  const finalOrders = initialOrders.map(order => {
    const relatedScraps = initialScrap.filter(s => s.orderId === order.id);
    let newEvents: ProductionEvent[] = [];

    if (relatedScraps.length > 0) {
      relatedScraps.forEach(scrap => {
        const eventExists = order.events.some(e => e.scrapEntryId === scrap.id);
        if (!eventExists && scrap.operatorId && scrap.machineId) {
          newEvents.push({
            id: `E-SCRAP-${scrap.id}`,
            timestamp: new Date(scrap.date).toISOString(),
            type: ProductionEventType.Scrap,
            operatorId: scrap.operatorId,
            machineId: scrap.machineId,
            quantity: scrap.qty,
            unit: scrap.unitCaptured,
            notes: `Causa: ${scrap.cause}`,
            scrapEntryId: scrap.id,
          });
          ordersToUpdate.add(order.id);
        }
      });
    }

    if (newEvents.length > 0) {
      return { ...order, events: [...order.events, ...newEvents] };
    }
    return order;
  });

  // Recalculate progress for affected orders
  const recalculatedOrders = finalOrders.map(order => {
    if (ordersToUpdate.has(order.id)) {
      const progressUpdates = recalculateOrderProgress(order);
      return { ...order, ...progressUpdates };
    }
    return order;
  });

  return {
    adminPassword: '1234',
    inventoryItems: structuredClone(INITIAL_INVENTORY),
    scrapEntries: initialScrap,
    productionOrders: recalculatedOrders,
    scrapCauses: structuredClone(INITIAL_SCRAP_CAUSES),
    machines: structuredClone(INITIAL_MACHINES),
    fmeas: structuredClone(INITIAL_FMEAS),
    employees: structuredClone(INITIAL_EMPLOYEES),
    inkFormulas: structuredClone(INITIAL_INK_FORMULAS),
    materials: structuredClone(INITIAL_MATERIALS),
    targets: structuredClone(INITIAL_TARGETS),
  };
};


export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // --- Persisted State (Initial values for first-time load) ---
      ...getInitialState(),

      // --- Non-persisted State (Resets on page load) ---
      user: null,
      authError: null,
      activeModule: Module.Home,
      isMobileMenuOpen: false,
      scrapControlInitialFilter: null,
      notification: null,
      confirmDialog: null,
      rateTables: INITIAL_RATE_TABLES,
      
      // --- Actions ---
      login: (employee, password) => {
          set({ authError: null });
          const { adminPassword } = get();
          if (employee.role === Role.Admin) {
              if (password === adminPassword) {
                  set({ user: { name: employee.name, role: employee.role, modules: employee.modules } });
              } else {
                  set({ authError: 'Contraseña incorrecta para el administrador.' });
              }
          } else {
              set({ user: { name: employee.name, role: employee.role, modules: employee.modules } });
          }
      },
      logout: () => {
          set({ user: null, authError: null, activeModule: Module.Home });
      },
      changePassword: (oldPassword, newPassword) => {
          const { user, adminPassword } = get();
          if (user?.role === Role.Admin && oldPassword === adminPassword) {
              set({ adminPassword: newPassword });
              return true;
          }
          return false;
      },

      setActiveModule: (module) => set({ activeModule: module }),
      setIsMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
      setScrapControlInitialFilter: (filter) => set({ scrapControlInitialFilter: filter }),
      setNotification: (notification) => set({ notification }),
      clearNotification: () => set({ notification: null }),
      showConfirm: (dialog) => set({ confirmDialog: dialog }),
      hideConfirm: () => set({ confirmDialog: null }),
      
      // Data setters are immutable and trigger persistence automatically.
      setInventoryItems: (items) => set({ inventoryItems: [...items] }),
      setScrapEntries: (entries) => set({ scrapEntries: [...entries] }),
      setProductionOrders: (orders) => set({ productionOrders: [...orders] }),
      updateProductionOrder: (order, changeLog) => {
        set(state => ({ productionOrders: state.productionOrders.map(o => o.id === order.id ? order : o) }));
        if (changeLog && order.id) {
            get().logProductionEvent(order.id, {
                type: ProductionEventType.Modification,
                operatorId: get().user?.name || 'Sistema',
                machineId: order.machineId || 'N/A',
                notes: changeLog,
            });
        }
      },
      addProductionOrder: (order) => {
          set(state => ({ productionOrders: [...state.productionOrders, order] }));
      },
      setScrapCauses: (causes) => set({ scrapCauses: [...causes] }),
      setMachines: (machines) => set({ machines: [...machines] }),
      setFmeas: (fmeas) => set({ fmeas: [...fmeas] }),
      setEmployees: (employees) => set({ employees: [...employees] }),
      setInkFormulas: (formulas) => set({ inkFormulas: [...formulas] }),
      setMaterials: (materials) => set({ materials: [...materials] }),
      setTargets: (tg) => set({ targets: { ...tg } }),

      setOrderTargetCost: (orderId: string, targetCost: number) => {
        const { productionOrders } = get();
        const updated = productionOrders.map((o) => o.id === orderId ? ({ ...o, targetCost }) : o);
        set({ productionOrders: updated });
      },
      
      logProductionEvent: (orderId, eventData) => {
        set(state => {
            const orderIndex = state.productionOrders.findIndex(o => o.id === orderId);
            if (orderIndex === -1) return state;

            const updatedOrders = [...state.productionOrders];
            const order = { ...updatedOrders[orderIndex] };

            const newEvent: ProductionEvent = {
                ...eventData,
                id: `E${Date.now()}`,
                timestamp: new Date().toISOString(),
            };

            order.events = [...(order.events || []), newEvent];
            
            const progressUpdates = recalculateOrderProgress(order);

            updatedOrders[orderIndex] = { ...order, ...progressUpdates };
            
            return { productionOrders: updatedOrders };
        });
      },

      addScrap: (entryInput: Partial<ScrapEntry>) => {
        const state = get();
        const material = state.materials.find((m: any) => m.id === entryInput.materialId);
        if (!material) throw new Error('Material no encontrado');
        const cost = scrapCost(entryInput, material);
        const newEntryId = `S${(state.scrapEntries.length + 1).toString().padStart(3, '0')}${Date.now()}`;
        const entry = { ...entryInput, id: newEntryId, cost };
        set({ scrapEntries: [...state.scrapEntries, entry as ScrapEntry] });
        
        if (entry.orderId && entry.operatorId && entry.machineId) {
            get().logProductionEvent(entry.orderId, {
                type: ProductionEventType.Scrap,
                operatorId: entry.operatorId,
                machineId: entry.machineId,
                quantity: entry.qty,
                unit: entry.unitCaptured,
                notes: `Causa: ${entry.cause}`,
                scrapEntryId: entry.id,
            });
        }
      },

      recomputeOrderCost: (orderId: string) => {
        const state = get();
        const order = state.productionOrders.find((o) => o.id === orderId);
        if (!order) return;
        const total = orderTotalCost(order, state.materials, state.rateTables, state.scrapEntries);
        const updated = state.productionOrders.map((o) => o.id === orderId ? { ...o, actualCost: total } : o);
        set({ productionOrders: updated });
      },

      setOrderStatus: (orderId: string, status: ProductionOrder['status']) => {
        const state = get();
        const order = state.productionOrders.find(o => o.id === orderId);
        if(!order || !order.operatorId || !order.machineId) return;

        const today = new Date().toISOString().split('T')[0];
        const updated = state.productionOrders.map((o) => {
          if (o.id !== orderId) return o;
          const completionDate = (status === 'Completada' && !o.completionDate) ? today : o.completionDate;
          return { ...o, status, completionDate };
        });
        set({ productionOrders: updated });
        
        let eventType: ProductionEventType | null = null;
        if(status === 'En Progreso') eventType = ProductionEventType.Run;
        if(status === 'Pausada') eventType = ProductionEventType.Pause;
        if(status === 'Completada') eventType = ProductionEventType.Complete;

        if (eventType) {
             get().logProductionEvent(orderId, {
                type: eventType,
                operatorId: state.user?.name || order.operatorId, // User taking the action
                machineId: order.machineId
             });
        }

        (get() as any).recomputeOrderCost(orderId);
      },
      
      addInkFormula: (formula) => {
          if (get().inkFormulas.some(f => f.id === formula.id)) return;
          set(state => ({ inkFormulas: [...state.inkFormulas, formula] }));
      },
      
      fetchAndUpdateInkFormula: async (orderId, inkId) => {
          const { productionOrders, setProductionOrders, addInkFormula, inkFormulas, setNotification } = get();
          const order = productionOrders.find(o => o.id === orderId);
          if (!order) return;

          const inkUsage = order.inks.find(i => i.inkId === inkId);
          if (!inkUsage || (inkUsage.components && inkUsage.components.length > 0)) return;

          const isBaseInk = INK_CATALOG.some(ink => ink.id === inkId);
          if (isBaseInk) {
              const baseInkDetails = INK_CATALOG.find(ink => ink.id === inkId);
              if (baseInkDetails && (!inkUsage.hex || inkUsage.hex !== baseInkDetails.hex)) {
                  const updatedInkUsage = { ...inkUsage, hex: baseInkDetails.hex };
                  const updatedOrders = productionOrders.map(o => 
                      o.id === orderId 
                      ? { ...o, inks: o.inks.map(i => i.inkId === inkId ? updatedInkUsage : i) } 
                      : o
                  );
                  setProductionOrders(updatedOrders);
              }
              return;
          }

          try {
              let formula = inkFormulas.find(f => f.id === inkId);
              if (!formula) {
                  const result = await getPantoneFormula(inkId);
                  if (result.components.length === 0) throw new Error(`Fórmula no encontrada para ${inkId}.`);
                  
                  const newFormula: InkFormula = {
                      id: result.pantoneName, name: result.pantoneName, targetHex: result.hex,
                      components: result.components.map(c => {
                          const baseInk = INK_CATALOG.find(i => i.name === c.name);
                          return { inkId: baseInk?.id || c.name, name: c.name, percentage: c.percentage };
                      })
                  };
                  addInkFormula(newFormula); 
                  formula = newFormula;
              }
              
              const calculatedConsumption = inkUsage.consumption;
              const components: InkUsageComponent[] = formula.components.map(comp => {
                  const componentInk = INK_CATALOG.find(i => i.id === comp.inkId);
                   if (!componentInk) {
                      throw new Error(`La tinta base '${comp.name}' no se encontró en el catálogo. El costo no se puede calcular.`);
                  }
                  const weight = (comp.percentage / 100) * calculatedConsumption;
                  const cost = weight * componentInk.pricePerGram;
                  return { name: componentInk.name, weight, cost, hex: componentInk.hex, percentage: comp.percentage };
              });

              const updatedInkUsage = { ...inkUsage, components, hex: formula.targetHex };

              const updatedOrders = productionOrders.map(o => 
                  o.id === orderId 
                  ? { ...o, inks: o.inks.map(i => i.inkId === inkId ? updatedInkUsage : i) } 
                  : o
              );
              setProductionOrders(updatedOrders);

          } catch (error: any) {
              console.error("Failed to fetch and update formula:", error);
              setNotification({ message: error.message || 'Error al obtener la fórmula de la tinta.', type: 'error'});
          }
      },
      archiveItem: (id, type) => {
        const timestamp = new Date().toISOString();
        set(state => {
            if (type === 'order') {
                return { productionOrders: state.productionOrders.map(o => o.id === id ? { ...o, status: 'Archivada', archivedAt: timestamp } : o) };
            }
            if (type === 'employee') {
                return { employees: state.employees.map(e => e.id === id ? { ...e, status: 'Archived', archivedAt: timestamp } : e) };
            }
             if (type === 'machine') {
                return { machines: state.machines.map(m => m.id === id ? { ...m, status: 'Archivada', archivedAt: timestamp } : m) };
            }
            return state;
        });
      },
      deleteItem: (id, type) => {
        const timestamp = new Date().toISOString();
         set(state => {
            if (type === 'order') {
                return { productionOrders: state.productionOrders.map(o => o.id === id ? { ...o, deletedAt: timestamp } : o) };
            }
            if (type === 'employee') {
                return { employees: state.employees.map(e => e.id === id ? { ...e, deletedAt: timestamp } : e) };
            }
             if (type === 'machine') {
                return { machines: state.machines.map(m => m.id === id ? { ...m, deletedAt: timestamp } : m) };
            }
            if (type === 'material') {
                return { materials: state.materials.map(m => m.id === id ? { ...m, deletedAt: timestamp } : m) };
            }
            return state;
        });
      },
      restoreItem: (id, type) => {
        set(state => {
            if (type === 'order') {
                return { productionOrders: state.productionOrders.map(o => o.id === id ? { ...o, deletedAt: null } : o) };
            }
            if (type === 'employee') {
                return { employees: state.employees.map(e => e.id === id ? { ...e, deletedAt: null } : e) };
            }
            if (type === 'machine') {
                return { machines: state.machines.map(m => m.id === id ? { ...m, deletedAt: null } : m) };
            }
            if (type === 'material') {
                return { materials: state.materials.map(m => m.id === id ? { ...m, deletedAt: null } : m) };
            }
            return state;
        });
      },
      purgeItem: (id, type) => {
        set(state => {
            if (type === 'order') {
                return { productionOrders: state.productionOrders.filter(o => o.id !== id) };
            }
            if (type === 'employee') {
                return { employees: state.employees.filter(e => e.id !== id) };
            }
            if (type === 'machine') {
                return { machines: state.machines.filter(m => m.id !== id) };
            }
            if (type === 'material') {
                return { materials: state.materials.filter(m => m.id !== id) };
            }
            return state;
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(safeStorage),
      
      // Explicitly define which parts of the state to persist
      partialize: (state): Omit<PersistedState, 'rateTables'> => ({
        adminPassword: state.adminPassword,
        inventoryItems: state.inventoryItems,
        scrapEntries: state.scrapEntries,
        productionOrders: state.productionOrders,
        scrapCauses: state.scrapCauses,
        machines: state.machines,
        fmeas: state.fmeas,
        employees: state.employees,
        inkFormulas: state.inkFormulas,
        materials: state.materials,
        targets: state.targets,
      }),
      
      merge: (persistedState, currentState) => {
        // Custom merge function to prioritize persisted state over initial state
        // This prevents user data from being overwritten on app updates.
        if (!persistedState) {
            return currentState;
        }

        const initial = getInitialState();

        return {
            ...currentState, // Non-persisted state
            ...initial, // Base initial state for data
            ...(persistedState as object), // Overwrite with user's saved data
        };
      },

      // For handling future data structure changes
      migrate: (persistedState, version) => {
        const state = persistedState as any;
        if (version < 5) {
             if(state.productionOrders) {
                state.productionOrders.forEach((o: any) => {
                    if (!o.events) o.events = [];
                    if (o.archivedAt && o.status !== 'Archivada') o.status = 'Archivada';
                    // Remove deprecated progress fields to force recalculation
                    delete o.progressPercentage;
                    delete o.linearMetersProduced;
                    // quantityProduced is still needed for display before full event-sourcing
                });
            }
        }
        return state as AppState & AppActions;
      },
      
      onRehydrateStorage: () => {
        return (state, error) => {
            if (state) {
                 // Trigger recalculation for all orders on startup to ensure consistency
                const recalculatedOrders = state.productionOrders.map(order => {
                    const progressUpdates = recalculateOrderProgress(order);
                    return { ...order, ...progressUpdates };
                });
                state.setProductionOrders(recalculatedOrders);
                console.log("Hydration finished and progress recalculated.");
            }
            if(error){
                console.error("An error happened during hydration", error);
            }
        }
      },
    }
  )
);