import React, { useState, useMemo, useEffect } from 'react';
// FIX: Import correct types and utilities
import { ScrapEntry, Role, Material, Uom, Targets } from '../types';
import { useAppStore } from '../useAppStore';
import ParetoChart from '../components/charts/ParetoChart';
import Modal from '../components/Modal';
import { ICONS, TEXT_INPUT_STYLE } from '../constants';
import ExportModal from '../components/ExportModal';
import { exportDataToCSV, generatePdfReport } from '../utils/fileHelpers';
import { scrapCost } from '../utils/cost';
import { buildComplianceReport } from '../utils/metrics';

// FIX: Align columns with the ScrapEntry type
const scrapColumns = {
    date: 'Fecha',
    orderId: 'OP ID',
    materialId: 'Material ID',
    machineId: 'Máquina',
    operatorId: 'Operador',
    cause: 'Causa Raíz',
    qty: 'Cantidad',
    unitCaptured: 'Unidad',
    cost: 'Costo',
};


const ScrapControl: React.FC = () => {
    const user = useAppStore(state => state.user);
    const scrapEntries = useAppStore(state => state.scrapEntries);
    const addScrap = useAppStore(state => state.addScrap);
    const setScrapEntries = useAppStore(state => state.setScrapEntries);
    const materials = useAppStore(state => state.materials);
    const scrapCauses = useAppStore(state => state.scrapCauses);
    const employees = useAppStore(state => state.employees);
    const productionOrders = useAppStore(state => state.productionOrders);
    const allMachines = useAppStore(state => state.machines);
    const targets = useAppStore(state => state.targets);
    const setTargets = useAppStore(state => state.setTargets);
    const scrapControlInitialFilter = useAppStore(state => state.scrapControlInitialFilter);
    const setScrapControlInitialFilter = useAppStore(state => state.setScrapControlInitialFilter);
    const { setNotification, showConfirm } = useAppStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [editingScrap, setEditingScrap] = useState<ScrapEntry | null>(null);
    const [newScrap, setNewScrap] = useState<Partial<ScrapEntry>>({});

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderFilter, setOrderFilter] = useState('');
    const [machineFilter, setMachineFilter] = useState('');
    const [operatorFilter, setOperatorFilter] = useState('');
    const [activeTab, setActiveTab] = useState<'registro' | 'objetivos'>('registro');
    
    const [localTargets, setLocalTargets] = useState<Targets>(targets);
     useEffect(() => {
        setLocalTargets(targets);
    }, [targets]);

    const canEdit = user?.role === Role.Admin || user?.role === Role.Operator;
    const canExport = user?.role === Role.Admin;

    useEffect(() => {
        if (scrapControlInitialFilter?.type === 'operator') {
            setOperatorFilter(scrapControlInitialFilter.value);
            setScrapControlInitialFilter(null); 
        }
    }, [scrapControlInitialFilter, setScrapControlInitialFilter]);


    const orders = useMemo<string[]>(() => Array.from(new Set(productionOrders.map(o => o.id))), [productionOrders]);
    const operators = useMemo(() => employees.map(e => ({ value: e.id, label: e.name })), [employees]);

    const handleSaveScrap = () => {
        const isEditing = !!editingScrap;
        const confirmMessage = isEditing
            ? `¿Estás seguro de que deseas guardar los cambios para el registro de scrap ${editingScrap!.id}?`
            : '¿Estás seguro de que deseas crear este nuevo registro de scrap?';

        showConfirm({
            title: isEditing ? 'Guardar Cambios' : 'Crear Registro',
            message: confirmMessage,
            onConfirm: () => {
                const material = materials.find(m => m.id === newScrap.materialId);
                const qty = newScrap.qty || 0;

                if (!material) {
                    setNotification({ message: 'Por favor, selecciona un material válido.', type: 'error' });
                    return;
                }
                
                const entryForCost: Partial<ScrapEntry> = {
                    ...newScrap,
                    materialId: material.id,
                    category: material.type,
                    date: newScrap.date || new Date().toISOString().split('T')[0],
                    unitCaptured: newScrap.unitCaptured || material.uomBase,
                    qty: qty,
                };
                
                if (isEditing) {
                    const cost = scrapCost(entryForCost, material);
                    const updatedEntries = scrapEntries.map(entry =>
                        entry.id === editingScrap!.id ? { ...entry, ...newScrap, qty, cost } as ScrapEntry : entry
                    );
                    setScrapEntries(updatedEntries);
                } else {
                    addScrap(entryForCost);
                }
                setNotification({ message: '¡Registro de scrap guardado con éxito!', type: 'success' });
                setIsModalOpen(false);
            }
        });
    };
    
    const handleDeleteScrap = (scrapId: string) => {
        showConfirm({
            title: 'Eliminar Registro de Scrap',
            message: '¿Estás seguro de que quieres eliminar este registro? Esta acción es irreversible.',
            onConfirm: () => {
                setScrapEntries(scrapEntries.filter(s => s.id !== scrapId));
                setNotification({ message: 'Registro de scrap eliminado.', type: 'success' });
            }
        });
    };

    const openModalToEdit = (scrap: ScrapEntry) => {
        setEditingScrap(scrap);
        setNewScrap(scrap);
        setIsModalOpen(true);
    };

    const openModalToCreate = () => {
        setEditingScrap(null);
        // FIX: Use correct property names
        setNewScrap({ cause: scrapCauses[0] || '', unitCaptured: 'unit' });
        setIsModalOpen(true);
    };

    const filteredScraps = useMemo(() => {
        const isFilterApplied = !!startDate || !!endDate || !!orderFilter || !!machineFilter || !!operatorFilter;
        if (!isFilterApplied) return scrapEntries;

        return scrapEntries.filter((scrap) => {
            const scrapDate = new Date(scrap.date);
            const isWithinDateRange =
                (!startDate || scrapDate >= new Date(startDate)) &&
                (!endDate || scrapDate <= new Date(endDate));

            // FIX: Use correct property names for filtering
            const isMatchingOrder = !orderFilter || scrap.orderId === orderFilter;
            const isMatchingMachine = !machineFilter || scrap.machineId === machineFilter;
            const isMatchingOperator = !operatorFilter || scrap.operatorId === operatorFilter;

            return isWithinDateRange && isMatchingOrder && isMatchingMachine && isMatchingOperator;
        });
    }, [scrapEntries, startDate, endDate, orderFilter, machineFilter, operatorFilter]);

    const paretoData = useMemo(() => {
        const dataToAnalyze = filteredScraps;
        if (dataToAnalyze.length === 0) return [];

        const causeCounts = dataToAnalyze.reduce((acc: Record<string, number>, entry) => {
            // FIX: Use 'cause' property
            const cause = entry.cause || 'Desconocida';
            acc[cause] = (acc[cause] || 0) + Number(entry.cost);
            return acc;
        }, {});

        const sortedCauses = Object.entries(causeCounts)
            .map(([name, cost]) => ({ name, Frecuencia: Number(cost) }))
            .sort((a, b) => b.Frecuencia - a.Frecuencia);

        const totalFrecuencia = sortedCauses.reduce((acc, cause) => acc + cause.Frecuencia, 0);
        
        let cumulative = 0;
        return sortedCauses.map(cause => {
            cumulative += cause.Frecuencia;
            return {
                ...cause,
                Cumulativo: totalFrecuencia > 0 ? (cumulative / totalFrecuencia) * 100 : 0,
            };
        });
    }, [filteredScraps]);

    const complianceReports = useMemo(() => {
        return employees
            .filter(e => e.role === Role.Operator && (!operatorFilter || e.id === operatorFilter))
            .map(op => {
                const report = buildComplianceReport({
                    targets,
                    scope: 'operator',
                    entries: scrapEntries,
                    productionOrders,
                    operatorId: op.id,
                    from: startDate,
                    to: endDate
                });
                return {
                    operatorName: op.name,
                    ...report,
                };
            });
    }, [employees, operatorFilter, scrapEntries, productionOrders, targets, startDate, endDate]);
    
    const handleExport = async ({ recipient, format }: { recipient: string; format: 'csv' | 'pdf'; selectedColumns?: string[] }) => {
        if (format === 'csv') {
            const dataToExport = filteredScraps.map(scrap => ({
                ...scrap,
                operatorId: employees.find(e => e.id === scrap.operatorId)?.name || scrap.operatorId,
                machineId: allMachines.find(m => m.id === scrap.machineId)?.name || scrap.machineId,
            }));
            exportDataToCSV(dataToExport, scrapColumns, Object.keys(scrapColumns), `Reporte_Scrap_${new Date().toISOString().split('T')[0]}.csv`);
        } else if (format === 'pdf') {
            const sections = [{
                type: 'table' as const,
                title: 'Reporte de Scrap',
                data: filteredScraps,
                head: [['Fecha', 'OP', 'Máquina', 'Operador', 'Causa', 'Costo']],
                body: filteredScraps.map(scrap => [
                    scrap.date,
                    // FIX: Use correct property names
                    scrap.orderId,
                    allMachines.find(m => m.id === scrap.machineId)?.name || scrap.machineId,
                    employees.find(e => e.id === scrap.operatorId)?.name || scrap.operatorId,
                    scrap.cause,
                    `$${scrap.cost.toFixed(2)}`
                ])
            }];
            await generatePdfReport('Reporte de Scrap', recipient, sections);
        }
    };

    const handleMaterialChange = (materialId: string) => {
        const material = materials.find(m => m.id === materialId);
        if (material) {
            setNewScrap({
                ...newScrap,
                materialId: materialId,
                category: material.type,
                unitCaptured: material.uomBase,
            });
        } else {
            setNewScrap({ ...newScrap, materialId: '' });
        }
    }

    const handleTargetChange = (category: keyof Targets, key: string, metric: 'qtyPct' | 'costPct', value: string) => {
        const numValue = parseFloat(value) || 0;
        setLocalTargets(prev => {
            const newTargets = JSON.parse(JSON.stringify(prev));
            if (category === 'global') {
                (newTargets.global as any)[metric] = numValue;
            } else if (newTargets[category]) {
                if (!(newTargets[category] as any)[key]) {
                    (newTargets[category] as any)[key] = {};
                }
                (newTargets[category] as any)[key][metric] = numValue;
            }
            return newTargets;
        });
    };
    
    const saveTargets = () => {
        setTargets(localTargets);
        setNotification({ message: '¡Objetivos guardados con éxito!', type: 'success' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h2 className="text-2xl font-bold venki-title-gradient">Registro y Análisis de Scrap</h2>
                <div className="flex items-center gap-2">
                    {canEdit && <button onClick={openModalToCreate} className="btn-primary">Registrar Scrap</button>}
                     {canExport && (
                        <button onClick={() => setIsExportModalOpen(true)} className="flex items-center justify-center btn-secondary">
                            {ICONS.Export} <span className="ml-2">Exportar</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="tabs no-print">
                <button onClick={() => setActiveTab('registro')} className={`tab ${activeTab === 'registro' ? 'active' : ''}`}>Registro y Análisis</button>
                <button onClick={() => setActiveTab('objetivos')} className={`tab ${activeTab === 'objetivos' ? 'active' : ''}`}>Objetivos y Cumplimiento</button>
            </div>

            <div className="glass glass-noise p-4 space-y-4 no-print">
                <h3 className="text-lg venki-subtitle">Filtros de Búsqueda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label htmlFor="start-date-filter" className="block text-sm text-text-muted mb-1">Desde</label>
                        <input id="start-date-filter" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={TEXT_INPUT_STYLE} />
                    </div>
                    <div>
                        <label htmlFor="end-date-filter" className="block text-sm text-text-muted mb-1">Hasta</label>
                        <input id="end-date-filter" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={TEXT_INPUT_STYLE} />
                    </div>
                    <div>
                        <label htmlFor="order-filter" className="block text-sm text-text-muted mb-1">Orden</label>
                        <select id="order-filter" value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className={TEXT_INPUT_STYLE}>
                            <option value="">Todas</option>
                            {orders.map((o) => (<option key={o} value={o}>{o}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="machine-filter" className="block text-sm text-text-muted mb-1">Máquina</label>
                        {/* FIX: Filter by machine ID */}
                        <select id="machine-filter" value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)} className={TEXT_INPUT_STYLE}>
                            <option value="">Todas</option>
                            {allMachines.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="operator-filter" className="block text-sm text-text-muted mb-1">Operador</label>
                        <select id="operator-filter" value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} className={TEXT_INPUT_STYLE}>
                            <option value="">Todos</option>
                            {operators.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                    </div>
                </div>
            </div>

            {activeTab === 'registro' && (
                <div className="space-y-6 animate-fade-in-down">
                    <div className="flex justify-center">
                        <div className="p-6 glass glass-noise inline-block">
                            <h3 className="text-lg venki-subtitle mb-4 text-center">Análisis de Pareto de Causas de Scrap (por Costo)</h3>
                            <ParetoChart data={paretoData} />
                        </div>
                    </div>

                    <div className="glass glass-noise p-6">
                        <h3 className="text-lg venki-subtitle">Scraps Registrados</h3>
                        {filteredScraps.length === 0 ? (
                            <p className="text-text-muted mt-4 text-center">No hay registros coincidentes.</p>
                        ) : (
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-text-muted uppercase">
                                        <tr>
                                            <th className="px-4 py-2">Fecha</th>
                                            <th className="px-4 py-2">OP</th>
                                            <th className="px-4 py-2">Máquina</th>
                                            <th className="px-4 py-2">Operador</th>
                                            <th className="px-4 py-2">Causa</th>
                                            <th className="px-4 py-2">Costo</th>
                                            {canEdit && <th className="px-4 py-2">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="text-text-default">
                                        {filteredScraps.map((scrap) => (
                                            <tr key={scrap.id} className="border-b border-white/10">
                                                <td className="px-4 py-3">{scrap.date}</td>
                                                <td className="px-4 py-3">{scrap.orderId}</td>
                                                <td className="px-4 py-3">{allMachines.find(m => m.id === scrap.machineId)?.name || scrap.machineId}</td>
                                                <td className="px-4 py-3">{employees.find(e => e.id === scrap.operatorId)?.name || scrap.operatorId}</td>
                                                <td className="px-4 py-3">{scrap.cause}</td>
                                                <td className="px-4 py-3 text-red-400">${scrap.cost.toFixed(2)}</td>
                                                {canEdit && (
                                                    <td className="px-4 py-3 flex items-center gap-2">
                                                        <button onClick={() => openModalToEdit(scrap)} className="text-accent-cyan p-1 rounded-md hover:opacity-80" aria-label={`Editar registro de scrap ${scrap.id}`}>{ICONS.Edit}</button>
                                                        <button onClick={() => handleDeleteScrap(scrap.id)} className="btn-icon-danger w-8 h-8" aria-label={`Eliminar registro de scrap ${scrap.id}`}>{React.cloneElement(ICONS.Trash, { className: 'w-4 h-4' })}</button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'objetivos' && (
                <div className="space-y-6 animate-fade-in-down">
                    <div className="glass glass-noise p-6">
                        <h3 className="text-lg venki-subtitle mb-4">Reporte Detallado de Cumplimiento</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-muted uppercase">
                                    <tr>
                                        <th className="px-4 py-2">Operador</th>
                                        <th className="px-4 py-2">Costo Scrap</th>
                                        <th className="px-4 py-2">Objetivo Costo (%)</th>
                                        <th className="px-4 py-2">Real Costo (%)</th>
                                        <th className="px-4 py-2">Gap (%)</th>
                                        <th className="px-4 py-2">Factor de Bono</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complianceReports.map(report => {
                                         const gap = (report.percents.costPct ?? 0) - (report.targets.costPct ?? 0);
                                         return (
                                            <tr key={report.operatorName} className="border-b border-white/10">
                                                <td className="px-4 py-3 font-medium text-text-strong">{report.operatorName}</td>
                                                <td className="px-4 py-3 text-red-400">${report.scrapTotals.cost.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-text-default">{report.targets.costPct?.toFixed(2) || 'N/A'}%</td>
                                                <td className={`px-4 py-3 font-semibold ${gap > 0 ? 'text-red-400' : 'text-green-400'}`}>{report.percents.costPct?.toFixed(2) || 'N/A'}%</td>
                                                <td className={`px-4 py-3 font-semibold ${gap > 0 ? 'text-red-400' : 'text-green-400'}`}>{gap.toFixed(2)}%</td>
                                                <td className={`px-4 py-3 font-bold text-xl ${report.payout.overall >= 1 ? 'text-green-400' : 'text-amber-400'}`}>{report.payout.overall.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {canEdit && (
                         <div className="glass glass-noise p-6 space-y-6">
                            <h3 className="text-lg venki-subtitle">Editar Objetivos de Scrap Permitido (%)</h3>
                            <div>
                                <h4 className="font-semibold text-text-strong mb-2">Global</h4>
                                <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Por Cantidad (%)" value={localTargets.global.qtyPct || ''} onChange={e => handleTargetChange('global', 'global', 'qtyPct', e.target.value)} className={TEXT_INPUT_STYLE}/>
                                <input type="number" placeholder="Por Costo (%)" value={localTargets.global.costPct || ''} onChange={e => handleTargetChange('global', 'global', 'costPct', e.target.value)} className={TEXT_INPUT_STYLE}/>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-text-strong mb-2">Por Operador</h4>
                                {employees.filter(e => e.role === Role.Operator).map(op => (
                                    <div key={op.id} className="grid grid-cols-3 gap-4 mb-2 items-center">
                                        <label className="text-sm">{op.name}</label>
                                        <input type="number" placeholder="Por Cantidad (%)" value={localTargets.byOperator?.[op.id]?.qtyPct || ''} onChange={e => handleTargetChange('byOperator', op.id, 'qtyPct', e.target.value)} className={TEXT_INPUT_STYLE}/>
                                        <input type="number" placeholder="Por Costo (%)" value={localTargets.byOperator?.[op.id]?.costPct || ''} onChange={e => handleTargetChange('byOperator', op.id, 'costPct', e.target.value)} className={TEXT_INPUT_STYLE}/>
                                    </div>
                                ))}
                            </div>
                            <button onClick={saveTargets} className="btn-primary">Guardar Objetivos</button>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingScrap ? "Editar Registro Scrap" : "Registrar Nuevo Scrap"}>
                <div className="space-y-4">
                    <input type="text" name="orderId" placeholder="ID de OP" value={newScrap.orderId || ''} onChange={(e) => setNewScrap({ ...newScrap, orderId: e.target.value })} className={TEXT_INPUT_STYLE} />
                    <div>
                        <label className="block text-sm">Material</label>
                        <select name="materialId" value={newScrap.materialId || ''} onChange={(e) => handleMaterialChange(e.target.value)} className={TEXT_INPUT_STYLE}>
                            <option value="">Seleccionar</option>
                            {materials.map((m) => (<option key={m.id} value={m.id}>{m.id} - {m.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm">Operador</label>
                        <select name="operatorId" value={newScrap.operatorId || ''} onChange={(e) => setNewScrap({ ...newScrap, operatorId: e.target.value })} className={TEXT_INPUT_STYLE}>
                            <option value="">Seleccionar</option>
                            {operators.map((op) => (<option key={op.value} value={op.value}>{op.label}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm">Máquina</label>
                        <select name="machineId" value={newScrap.machineId || ''} onChange={(e) => setNewScrap({ ...newScrap, machineId: e.target.value })} className={TEXT_INPUT_STYLE}>
                             <option value="">Seleccionar</option>
                            {allMachines.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm">Causa Raíz</label>
                        <select name="cause" value={newScrap.cause || ''} onChange={(e) => setNewScrap({ ...newScrap, cause: e.target.value })} className={TEXT_INPUT_STYLE}>
                            {scrapCauses.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                    </div>
                    <input type="number" name="qty" placeholder="Cantidad" value={newScrap.qty || ''} onChange={(e) => setNewScrap({ ...newScrap, qty: Number(e.target.value) || 0 })} className={TEXT_INPUT_STYLE} />
                    <button onClick={handleSaveScrap} className="w-full btn-primary">💾 Guardar</button>
                </div>
            </Modal>
            
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Control de Scrap"
                supportedFormats={['csv', 'pdf']}
                columns={[]}
                userRole={user?.role}
            />
        </div>
    );
};

export default ScrapControl;