import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ProductionOrder, Role, ProductionEventType, Uom, ProductionEvent, ProductionStatus } from "../types";
import { useAppStore } from "../useAppStore";
import Modal from "../components/Modal";
import ExportModal from "../components/ExportModal";
import { ICONS, TEXT_INPUT_STYLE, INK_CATALOG, WASTE_FACTOR_COLOR, WASTE_FACTOR_WHITE, DEFAULT_INK_COVERAGE_G_PER_M2 } from "../constants";
import OrderEditModal from "../components/OrderEditModal";
import { orderVariance } from "../utils/cost";

const OrderManagement: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const productionOrders = useAppStore((s) => s.productionOrders) || []; // Garantizar que siempre sea un array
  const setProductionOrders = useAppStore((s) => s.setProductionOrders);
  const machines = useAppStore((s) => s.machines) || [];
  const employees = useAppStore((s) => s.employees) || [];
  const fetchAndUpdateInkFormula = useAppStore((s) => s.fetchAndUpdateInkFormula);
  const recomputeOrderCost = useAppStore((s) => s.recomputeOrderCost);
  const logProductionEvent = useAppStore((s) => s.logProductionEvent);
  const setOrderStatus = useAppStore((s) => s.setOrderStatus);
  const setNotification = useAppStore((s) => s.setNotification ?? (() => {}));
  const archiveItem = useAppStore(s => s.archiveItem);
  const deleteItem = useAppStore(s => s.deleteItem);
  const showConfirm = useAppStore(s => s.showConfirm);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [logQuantity, setLogQuantity] = useState<number>(0);
  const [logUnit, setLogUnit] = useState<Uom>("m");
  const [activeListTab, setActiveListTab] = useState<
'active' | 'completed'
>(
'active'
);

  const visibleOrders = useMemo(
    () => productionOrders.filter(o => !o.archivedAt && !o.deletedAt),
    [productionOrders]
  );

  const activeOrders = useMemo(
    () => visibleOrders.filter(o => o.status !== 'Completada' && o.status !== 'Cancelada'),
    [visibleOrders]
  );

  const completedOrders = useMemo(
    () => visibleOrders.filter(o => o.status === 'Completada' || o.status === 'Cancelada'),
    [visibleOrders]
  );
  
  useEffect(() => {
      if (!selectedOrderId && visibleOrders.length > 0) {
          setSelectedOrderId(visibleOrders[0].id);
      } else if (selectedOrderId && !visibleOrders.some(o => o.id === selectedOrderId)) {
          setSelectedOrderId(visibleOrders.length > 0 ? visibleOrders[0].id : null);
      }
  }, [visibleOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => productionOrders.find((o) => o.id === selectedOrderId) || null,
    [productionOrders, selectedOrderId]
  );

  useEffect(() => {
    if (selectedOrderId) {
      recomputeOrderCost(selectedOrderId);
    }
  }, [selectedOrderId, recomputeOrderCost]);

  const [editingOrderData, setEditingOrderData] = useState<Partial<ProductionOrder> | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const lookingUpFormulaForRef = useRef(new Set<string>());

  const canEdit = user?.role === Role.Admin;
  const canExport = user?.role === Role.Admin;

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

  const processedInks = useMemo(() => {
    if (!selectedOrder || !Array.isArray((selectedOrder as any).inks)) return [];
    const inks = (selectedOrder as any).inks as Array<any>;

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
  
  const handleLogProduction = useCallback(() => {
    if(!selectedOrder || !user || !selectedOrder.operatorId || !selectedOrder.machineId) return;
    if(logQuantity <= 0) {
        setNotification({message: "La cantidad debe ser mayor a cero.", type: "error"});
        return;
    }
    logProductionEvent(selectedOrder.id, {
        type: ProductionEventType.GoodProduction,
        operatorId: user.name,
        machineId: selectedOrder.machineId,
        quantity: logQuantity,
        unit: logUnit,
    });
    setNotification({message: `Registrados ${logQuantity} ${logUnit} de producción.`, type: 'success'});
    setLogQuantity(0);
  }, [selectedOrder, user, logQuantity, logUnit, logProductionEvent, setNotification]);
  
  const handleStatusChange = useCallback((newStatus: ProductionStatus) => {
      if(!selectedOrder) return;
      setOrderStatus(selectedOrder.id, newStatus);
      setNotification({message: `Estado de la orden cambiado a "${newStatus}"`, type: 'success'});
  }, [selectedOrder, setOrderStatus, setNotification]);

  const handleOrderSave = useCallback((updatedOrder: ProductionOrder) => {
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
  }, [productionOrders, setProductionOrders, setNotification]);

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
      case ProductionEventType.Pause: return 'Alert';
      case ProductionEventType.Run: return 'Adjust';
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
        <div className="lg:col-span-1 glass glass-noise p-4">
          <h3 className="venki-subtitle mb-4">Órdenes</h3>
          <div className="flex mb-4 space-x-2">
            <button
              onClick={() => setActiveListTab('active')}
              className={`tab ${activeListTab === 'active' ? 'active' : ''}`}
            >
              Activas ({activeOrders ? activeOrders.length : 0})
            </button>
            <button
              onClick={() => setActiveListTab('completed')}
              className={`tab ${activeListTab === 'completed' ? 'active' : ''}`}
            >
              Terminadas ({completedOrders ? completedOrders.length : 0})
            </button>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {(activeListTab === 'active' ? activeOrders : completedOrders) && (activeListTab === 'active' ? activeOrders : completedOrders).length > 0 ? (
              (activeListTab === 'active' ? activeOrders : completedOrders).map((order) => (
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
              ))
            ) : (
              <p className="text-center py-4 text-text-muted">No hay órdenes {activeListTab === 'active' ? 'activas' : 'terminadas'}.</p>
            )}
          </div>
        </div>

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
                        })} className="btn-secondary p-2" title="Archivar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h14" /></svg></button>
                        <button onClick={( ) => showConfirm({
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
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 h-2.5 rounded-full"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-text-muted">{progress.toFixed(0)}%</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-muted">Etiquetas Planificadas:</p>
                    <p className="font-semibold venki-value">{targetLabels}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Metros Lineales Requeridos:</p>
                    <p className="font-semibold venki-value">{targetMeters.toFixed(2)} m</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Etiquetas Producidas:</p>
                    <p className="font-semibold venki-value">{selectedOrder.labelsProduced ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Metros Producidos:</p>
                    <p className="font-semibold venki-value">{(selectedOrder.linearMetersProduced ?? 0).toFixed(2)} m</p>
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-6 p-4 glass glass-strong rounded-lg">
                    <h4 className="font-semibold mb-3">Registrar Producción</h4>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <input
                        type="number"
                        value={logQuantity === 0 ? '' : logQuantity}
                        onChange={(e) => setLogQuantity(parseFloat(e.target.value) || 0)}
                        placeholder="Cantidad"
                        className={`${TEXT_INPUT_STYLE} w-full sm:w-auto flex-grow`}
                      />
                      <select
                        value={logUnit}
                        onChange={(e) => setLogUnit(e.target.value as Uom)}
                        className={`${TEXT_INPUT_STYLE} w-full sm:w-auto`}
                      >
                        <option value="m">Metros</option>
                        <option value="millares">Millares</option>
                        <option value="unidades">Unidades</option>
                      </select>
                      <button onClick={handleLogProduction} className="btn-primary w-full sm:w-auto">
                        Registrar
                      </button>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Cambiar Estado</h4>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(e.target.value as ProductionStatus)}
                        className={`${TEXT_INPUT_STYLE} w-full`}
                      >
                        {(['Nueva', 'En Progreso', 'Pausada', 'Completada', 'Cancelada', 'Pendiente', 'Archivada'] as ProductionStatus[]).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass glass-noise p-6">
                <h3 className="text-lg font-semibold venki-subtitle mb-4">Tintas ({processedInks.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase">
                      <tr>
                        <th className="px-4 py-2">Tinta</th>
                        <th className="px-4 py-2">Hex</th>
                        <th className="px-4 py-2">Consumo (g)</th>
                        <th className="px-4 py-2">Costo ($)</th>
                        <th className="px-4 py-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedInks.length > 0 ? (
                        processedInks.map((ink, index) => (
                          <tr key={index} className="border-b border-white/10">
                            <td className="px-4 py-3 font-medium text-text-strong">{ink.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: ink.hex }}></span>
                                {ink.hex}
                              </div>
                            </td>
                            <td className="px-4 py-3">{ink.consumption.toFixed(2)} g</td>
                            <td className="px-4 py-3">${(ink.consumption * ink.pricePerGram).toFixed(2)}</td>
                            <td className="px-4 py-3">{((ink.consumption * ink.pricePerGram) / (processedInks.reduce((acc, curr) => acc + (curr.consumption * curr.pricePerGram), 0) || 1) * 100).toFixed(2)}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-text-muted">No hay tintas para esta orden.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass glass-noise p-6">
                <h3 className="text-lg font-semibold venki-subtitle mb-4">Eventos de Producción</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase">
                      <tr>
                        <th className="px-4 py-2">Tipo</th>
                        <th className="px-4 py-2">Operador</th>
                        <th className="px-4 py-2">Máquina</th>
                        <th className="px-4 py-2">Cantidad</th>
                        <th className="px-4 py-2">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.events && selectedOrder.events.length > 0 ? (
                        selectedOrder.events.map((event, index) => (
                          <tr key={index} className="border-b border-white/10">
                            <td className="px-4 py-3 flex items-center gap-2">
                              {getEventIcon(event.type)} {event.type}
                            </td>
                            <td className="px-4 py-3">{employees.find(e => e.id === event.operatorId)?.name || event.operatorId}</td>
                            <td className="px-4 py-3">{machines.find(m => m.id === event.machineId)?.name || event.machineId}</td>
                            <td className="px-4 py-3">{event.quantity} {event.unit}</td>
                            <td className="px-4 py-3">{new Date(event.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-text-muted">No hay eventos de producción registrados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {user?.role === Role.Admin && (
                <div className="glass glass-noise p-6 printable-area" data-print-key="order_summary">
                  <h3 className="text-lg venki-subtitle mb-4">Resumen de Costos y Variación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted">Costo Objetivo:</p>
                      <p className="font-semibold venki-value">${selectedOrder.targetCost?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Costo Real:</p>
                      <p className="font-semibold venki-value">${selectedOrder.actualCost?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Variación:</p>
                      <p className={`font-semibold venki-value ${variance && variance.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        ${variance?.variance?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted">% Variación:</p>
                      <p className={`font-semibold venki-value ${variance && variance.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {variance?.variancePct?.toFixed(2) ?? 'N/A'}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass glass-noise p-6 text-center text-text-muted">
              Selecciona una orden para ver los detalles.
            </div>
          )}
        </div>
      </div>

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