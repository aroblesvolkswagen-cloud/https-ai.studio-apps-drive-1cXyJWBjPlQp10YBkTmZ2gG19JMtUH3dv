import React, { useState, useEffect, useRef, useMemo } from "react";
import { ProductionOrder, Role, ProductionEventType, Uom, ProductionEvent, ProductionStatus } from "../types";
import { useAppStore } from "../useAppStore";
import Modal from "../components/Modal";
import ExportModal from "../components/ExportModal";
import { ICONS, TEXT_INPUT_STYLE, INK_CATALOG, WASTE_FACTOR_COLOR, WASTE_FACTOR_WHITE, DEFAULT_INK_COVERAGE_G_PER_M2 } from "../constants";
// Si usas export a CSV/PDF, mantén helpers. Si no, puedes comentarlos para evitar warning.
// import { exportDataToCSV, generatePdfReport } from "../utils/fileHelpers";
import OrderEditModal from "../components/OrderEditModal";
import { orderVariance } from "../utils/cost";

const OrderManagement: React.FC = () => {
  // Store (siempre con selectores)
  const user = useAppStore((s) => s.user);
  const productionOrders = useAppStore((s) => s.productionOrders);
  const setProductionOrders = useAppStore((s) => s.setProductionOrders);
  const machines = useAppStore((s) => s.machines);
  const employees = useAppStore((s) => s.employees);
  const fetchAndUpdateInkFormula = useAppStore((s) => s.fetchAndUpdateInkFormula);
  const recomputeOrderCost = useAppStore((s) => s.recomputeOrderCost);
  const logProductionEvent = useAppStore((s) => s.logProductionEvent);
  const setOrderStatus = useAppStore((s) => s.setOrderStatus);
  const setNotification = useAppStore((s) => s.setNotification ?? (() => {}));
  const archiveItem = useAppStore(s => s.archiveItem);
  const deleteItem = useAppStore(s => s.deleteItem);
// FIX: Added showConfirm to component state to enable confirmation dialogs.
  const showConfirm = useAppStore(s => s.showConfirm);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const [logQuantity, setLogQuantity] = useState<number>(0);
  const [logUnit, setLogUnit] = useState<Uom>('m');

  const visibleOrders = useMemo(
    () => productionOrders.filter(o => !o.archivedAt && !o.deletedAt),
    [productionOrders]
  );
  
  useEffect(() => {
      if (!selectedOrderId && visibleOrders.length > 0) {
          setSelectedOrderId(visibleOrders[0].id);
      } else if (selectedOrderId && !visibleOrders.some(o => o.id === selectedOrderId)) {
          setSelectedOrderId(visibleOrders.length > 0 ? visibleOrders[0].id : null);
      }
  }, [visibleOrders, selectedOrderId]);

  // Orden seleccionada (segura)
  const selectedOrder = useMemo(
    () => productionOrders.find((o) => o.id === selectedOrderId) || null,
    [productionOrders, selectedOrderId]
  );

  // Recalcular costo sólo cuando cambia de orden
  useEffect(() => {
    if (selectedOrderId) {
      recomputeOrderCost(selectedOrderId);
    }
  }, [selectedOrderId, recomputeOrderCost]);

  // Edición / export
  const [editingOrderData, setEditingOrderData] = useState<Partial<ProductionOrder> | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fetch de fórmulas (evitar duplicado)
  const lookingUpFormulaForRef = useRef(new Set<string>());

  const canEdit = user?.role === Role.Admin;
  const canExport = user?.role === Role.Admin;

  // Lista de tintas que requieren fórmula IA (si la usas)
  const inkIdsToFetch = useMemo(() => {
    if (!selectedOrder || !Array.isArray((selectedOrder as any).inks)) return [];
    const inks = (selectedOrder as any).inks as Array<any>;
    return inks
      .filter((ink) => {
        const isBase = INK_CATALOG.some((b) => b.id === ink.inkId);
        return !isBase && (!ink.components || ink.components.length === 0);
      })
      .map((ink) => ink.inkId);
  }, [selectedOrder]);

  useEffect(() => {
    if (!selectedOrder) return;
    inkIdsToFetch.forEach((inkId) => {
      if (!lookingUpFormulaForRef.current.has(inkId)) {
        lookingUpFormulaForRef.current.add(inkId);
        fetchAndUpdateInkFormula(selectedOrder.id, inkId).finally(() => {
          lookingUpFormulaForRef.current.delete(inkId);
        });
      }
    });
  }, [inkIdsToFetch, selectedOrder, fetchAndUpdateInkFormula]);

  // Procesamiento de tintas (g y costo) — robusto a faltantes
  const processedInks = useMemo(() => {
    // Si la orden no tiene propiedad inks, nada que procesar.
    if (!selectedOrder || !Array.isArray((selectedOrder as any).inks)) return [];
    const inks = (selectedOrder as any).inks as Array<any>;

    // Campos opcionales – si tu orden no los tiene, no hay cálculo automático de g (muestra 0)
    const quantity: number = (selectedOrder as any).quantity ?? 0;
    const quantityUnit: string = (selectedOrder as any).quantityUnit ?? "";
    const labelLength: number = (selectedOrder as any).labelLength ?? 0;
    const labelWidth: number = (selectedOrder as any).labelWidth ?? 0;
    const labelsAcross: number = (selectedOrder as any).labelsAcross ?? 1;
    const isColorJob: boolean = (selectedOrder as any).isColorJob ?? true;
    const inkCoverage: number = (selectedOrder as any).inkCoverage ?? DEFAULT_INK_COVERAGE_G_PER_M2;
    const labelGapY = selectedOrder.labelGapY ?? 3.175;

    let totalLabels = quantity;
    if (quantityUnit === "millares") totalLabels *= 1000;

    let targetInkWeight = 0;

    // Cálculo por etiquetas si hay datos suficientes
    if (labelLength > 0 && totalLabels > 0 && labelsAcross > 0) {
      const wasteFactor = isColorJob ? WASTE_FACTOR_COLOR : WASTE_FACTOR_WHITE;
      const labelsPerMeter = 1000 / (labelLength + labelGapY);
      const requiredMeters = (totalLabels / Math.max(labelsAcross, 1)) / Math.max(labelsPerMeter, 0.0001);
      const finalMeters = requiredMeters * wasteFactor;
      const totalWidthM = (labelWidth * labelsAcross) / 1000;
      const totalSurfaceM2 = finalMeters * totalWidthM;
      targetInkWeight = totalSurfaceM2 * inkCoverage;
    }

    if (targetInkWeight <= 0 || inks.length === 0) {
      // fallback: consumo 0; se mostrarán las tintas pero sin g/$
      return inks.map((ink) => {
        const base = INK_CATALOG.find((b) => b.id === ink.inkId);
        const pricePerGram = base?.pricePerGram ?? 0;
        return {
          ...ink,
          name: ink.name ?? base?.name ?? ink.inkId,
          hex: ink.hex ?? base?.hex,
          consumption: 0,
          pricePerGram,
          components: Array.isArray(ink.components) ? ink.components : [],
        };
      });
    }

    const consumptionPerInk = targetInkWeight / inks.length;

    return inks.map((ink) => {
      const base = INK_CATALOG.find((b) => b.id === ink.inkId);
      const pricePerGram = base?.pricePerGram ?? 0;
      const hex = ink.hex ?? base?.hex;
      const name = ink.name ?? base?.name ?? ink.inkId;

      const out: any = {
        ...ink,
        name,
        hex,
        consumption: consumptionPerInk,
        pricePerGram,
      };

      if (Array.isArray(ink.components) && ink.components.length > 0) {
        out.components = ink.components.map((comp: any) => ({
          ...comp,
          weight: (comp.percentage / 100) * consumptionPerInk,
        }));
      } else {
        out.components = [];
      }
      return out;
    });
  }, [selectedOrder]);
  
  const handleLogProduction = () => {
    if(!selectedOrder || !user || !selectedOrder.operatorId || !selectedOrder.machineId) return;
    if(logQuantity <= 0) {
        setNotification({message: "La cantidad debe ser mayor a cero.", type: "error"});
        return;
    }
    logProductionEvent(selectedOrder.id, {
        type: ProductionEventType.GoodProduction,
        operatorId: user.name, // Logged by the current admin user
        machineId: selectedOrder.machineId,
        quantity: logQuantity,
        unit: logUnit,
    });
    setNotification({message: `Registrados ${logQuantity} ${logUnit} de producción.`, type: 'success'});
    setLogQuantity(0);
  };
  
  const handleStatusChange = (newStatus: ProductionStatus) => {
      if(!selectedOrder) return;
      setOrderStatus(selectedOrder.id, newStatus);
      setNotification({message: `Estado de la orden cambiado a "${newStatus}"`, type: 'success'});
  };

  const handleOrderSave = (updatedOrder: ProductionOrder) => {
    const exists = productionOrders.some((o) => o.id === updatedOrder.id);
    setProductionOrders(
      exists
        ? productionOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        : [...productionOrders, updatedOrder]
    );
    try {
      setNotification?.({ message: `¡Orden ${exists ? "actualizada" : "creada"} con éxito!`, type: "success" });
    } catch {}
    if (!exists) setSelectedOrderId(updatedOrder.id);
  };

  const getStatusIndicator = (status: ProductionOrder["status"]) => {
    const base = "px-2 py-0.5 text-xs rounded-full font-semibold ";
    switch (status) {
      case "Nueva":
      case "Pendiente":
        return base + "status-indicator-pending";
      case "En Progreso":
        return base + "status-indicator-progress";
      case "Completada":
        return base + "status-indicator-completed";
      case "Pausada":
        return base + "bg-yellow-500/30 text-yellow-200";
      case "Cancelada":
        return base + "bg-red-500/30 text-red-200";
      default:
        return base + "bg-gray-500/30 text-gray-300";
    }
  };

  const variance = selectedOrder ? orderVariance(selectedOrder) : null;
  const progress = selectedOrder?.progressPercentage || 0;
  
  const getEventIcon = (type: ProductionEventType) => {
    switch (type) {
      case ProductionEventType.GoodProduction: return 'Check';
      case ProductionEventType.Scrap: return 'Trash';
      case ProductionEventType.Pause: return 'Alert'; // Placeholder
      case ProductionEventType.Run: return 'Adjust'; // Placeholder
      default: return 'History';
    }
  };

  const { targetLabels, targetMeters } = useMemo(() => {
    if (!selectedOrder) return { targetLabels: 0, targetMeters: 0 };
    
    const labels = selectedOrder.labelsPlanned || (selectedOrder.quantity * (selectedOrder.quantityUnit === 'millares' ? 1000 : 1));
    const meters = selectedOrder.metersPlanned || selectedOrder.linearMetersRequired || 0;

    return { targetLabels: labels, targetMeters: meters };
  }, [selectedOrder]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold venki-title-gradient">Gestión de Órdenes y Tintas</h2>
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => {
                setEditingOrderData(null);
                setIsOrderModalOpen(true);
              }}
              className="btn-primary"
            >
              Nueva Orden
            </button>
          )}
          {canExport && (
            <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary flex items-center">
              {ICONS.Export}
              <span className="ml-2">Exportar</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado de órdenes */}
        <div className="lg:col-span-1 glass glass-noise p-4">
          <h3 className="venki-subtitle mb-4">Órdenes ({visibleOrders.length})</h3>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {visibleOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  selectedOrderId === order.id ? "glass-active" : "glass-button"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-bold">{order.id}</p>
                  <span className={getStatusIndicator(order.status)}>{order.status}</span>
                </div>
                <p className="text-sm truncate">{(order as any).product ?? order.productName ?? ""}</p>
                <p className="text-xs text-text-muted">{(order as any).client ?? ""}</p>
                 <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                    <div className="bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(order.progressPercentage || 0, 100)}%` }}></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalle de la orden */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrder ? (
            <>
              <div className="glass glass-noise p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold venki-subtitle">
                      {selectedOrder.id}: {(selectedOrder as any).product ?? selectedOrder.productName ?? ""}
                    </h3>
                    <p className="text-text-muted">para {(selectedOrder as any).client ?? "—"}</p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => showConfirm({
                            title: 'Archivar Orden',
                            message: `¿Estás seguro de que quieres archivar la orden ${selectedOrder.id}?`,
                            onConfirm: () => {
                                archiveItem(selectedOrder.id, 'order');
                                setNotification({ message: 'Orden archivada.', type: 'success' });
                            }
                        })} className="btn-secondary p-2" title="Archivar">{/* Archive Icon */}<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h14" /></svg></button>
                        <button onClick={() => showConfirm({
                            title: 'Eliminar Orden',
                            message: `¿Estás seguro de que quieres eliminar la orden ${selectedOrder.id}?`,
                            onConfirm: () => {
                                deleteItem(selectedOrder.id, 'order');
                                setNotification({ message: 'Orden eliminada.', type: 'success' });
                            }
                        })} className="btn-icon-danger w-10 h-10" title="Eliminar">{React.cloneElement(ICONS.Trash, { className: 'w-5 h-5' })}</button>
                        <button onClick={() => { setEditingOrderData(selectedOrder); setIsOrderModalOpen(true); }} className="btn-secondary flex items-center">{ICONS.Edit} <span className="ml-2 hidden sm:inline">Editar</span></button>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs">Máquina</p>
                    <p className="font-semibold">
                      {machines.find((m) => m.id === selectedOrder.machineId)?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs">Operador</p>
                    <p className="font-semibold">
                      {employees.find((e) => e.id === selectedOrder.operatorId)?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs">Cantidad</p>
                    <p className="font-semibold">
                      {(selectedOrder as any).quantity ?? "N/A"} {(selectedOrder as any).quantityUnit ?? ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs">Estado</p>
                    <span className={getStatusIndicator(selectedOrder.status)}>{selectedOrder.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="glass glass-noise p-6">
                <h3 className="text-lg font-semibold venki-subtitle mb-4">Progreso de Producción</h3>
                 <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 flex-shrink-0">
                        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9155" className="stroke-current text-white/10" strokeWidth="3" fill="transparent" />
                            <circle
                                cx="18"
                                cy="18"
                                r="15.9155"
                                className="stroke-current text-cyan-400"
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray={`${progress}, 100`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">{progress.toFixed(0)}%</div>
                    </div>
                    <div className="flex-grow grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div>
                            <span className="text-xs text-text-muted block">Producción (unidades)</span>
                            <p className="font-bold text-xl text-text-strong">{(selectedOrder.quantityProduced || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <span className="text-xs text-text-muted block">Objetivo (unidades)</span>
                            <p className="font-bold text-xl text-text-muted">{targetLabels.toLocaleString()}</p>
                        </div>
                        <div>
                            <span className="text-xs text-text-muted block">Producción (metros)</span>
                            <p className="font-bold text-xl text-text-strong">{(selectedOrder.linearMetersProduced || 0).toFixed(2)} m</p>
                        </div>
                        <div>
                            <span className="text-xs text-text-muted block">Objetivo (metros)</span>
                            <p className="font-bold text-xl text-text-muted">{targetMeters.toFixed(2)} m</p>
                        </div>
                        <div className="col-span-2 mt-2">
                            <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
              
               {canEdit && (
                <div className="glass glass-noise p-6">
                    <h3 className="text-lg font-semibold venki-subtitle mb-4">Acciones de Producción (Admin)</h3>
                    <div className="flex items-end gap-2 mb-4">
                        <div className="flex-grow">
                            <label className="text-xs text-text-muted">Cantidad Producida</label>
                            <input type="number" value={logQuantity || ''} onChange={e => setLogQuantity(Number(e.target.value))} className={TEXT_INPUT_STYLE} />
                        </div>
                        <div className="w-32">
                            <label className="text-xs text-text-muted">Unidad</label>
                            <select value={logUnit} onChange={e => setLogUnit(e.target.value as Uom)} className={TEXT_INPUT_STYLE}>
                                <option value="m">Metros</option>
                                <option value="labels">Etiquetas</option>
                            </select>
                        </div>
                        <button onClick={handleLogProduction} className="btn-primary">Registrar</button>
                    </div>
                     <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                        {selectedOrder.status === 'Pendiente' && <button onClick={() => handleStatusChange('En Progreso')} className="btn-secondary">Iniciar Corrida</button>}
                        {selectedOrder.status === 'En Progreso' && <button onClick={() => handleStatusChange('Pausada')} className="btn-secondary">Pausar</button>}
                        {selectedOrder.status === 'Pausada' && <button onClick={() => handleStatusChange('En Progreso')} className="btn-secondary">Reanudar</button>}
                        {selectedOrder.status === 'En Progreso' && <button onClick={() => handleStatusChange('Completada')} className="btn-primary">Marcar como Completada</button>}
                    </div>
                </div>
              )}
              
              {/* Análisis de costos */}
              <div className="glass glass-noise p-6">
                <h3 className="text-lg font-semibold venki-subtitle mb-4">Análisis de Costos</h3>
                {variance ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm">Costo Objetivo</p>
                      <p className="text-2xl font-bold text-cyan-300">${variance.target.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm">Costo Real</p>
                      <p className="text-2xl font-bold text-yellow-300">${variance.actual.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm">Varianza</p>
                      <p
                        className={`text-2xl font-bold ${
                          variance.variance > 0 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        ${variance.variance.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">% Varianza</p>
                      <p
                        className={`text-2xl font-bold ${
                          variance.variancePct > 0 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {variance.variancePct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>No hay datos de costos.</p>
                )}
              </div>
              
                <div className="glass glass-noise p-6">
                    <h3 className="text-lg font-semibold venki-subtitle mb-4">Bitácora de Eventos</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {[...(selectedOrder.events || [])].reverse().map((event: ProductionEvent) => (
                             <div key={event.id} className="flex items-center gap-3 text-sm p-2 bg-black/20 rounded-md">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center glass rounded-full text-accent-cyan">
                                    {ICONS[getEventIcon(event.type)]}
                                </div>
                                <div>
                                    <p className="font-semibold text-text-strong">{event.type}</p>
                                    <p className="text-xs text-text-muted">
                                        {new Date(event.timestamp).toLocaleString('es-MX')} por {event.operatorId}
                                    </p>
                                </div>
                                {event.quantity && (
                                    <p className="ml-auto font-mono bg-black/30 px-2 py-1 rounded-md text-venki-yellow">
                                        {event.quantity.toLocaleString()} {event.unit}
                                    </p>
                                )}
                            </div>
                        ))}
                        {(!selectedOrder.events || selectedOrder.events.length === 0) && <p className="text-center text-text-muted">No hay eventos registrados.</p>}
                    </div>
                </div>

            </>
          ) : (
            <div className="glass glass-noise p-6 h-full flex items-center justify-center">
              <p>Selecciona una orden.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales (montaje condicional correcto) */}
      <OrderEditModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleOrderSave}
        initialOrderData={editingOrderData}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={() => {}}
        title="Gestión de Órdenes"
        supportedFormats={["csv", "pdf"]}
        userRole={user?.role}
      />
    </div>
  );
};

export default OrderManagement;