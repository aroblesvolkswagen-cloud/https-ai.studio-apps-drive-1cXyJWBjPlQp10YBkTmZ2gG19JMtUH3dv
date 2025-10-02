import React, { useState, useMemo } from 'react';
import DashboardCard from '../components/DashboardCard';
import { ICONS } from '../constants';
import ParetoChart from '../components/charts/ParetoChart';
import KPICard from '../components/KPICard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProductionOrder, Role, ScrapEntry, OperatorPerformanceData } from '../types';
import ExportModal from '../components/ExportModal';
import { downloadFile, generatePdfReport } from '../utils/fileHelpers';
import { useAppStore } from '../useAppStore';
import OrderEditModal from '../components/OrderEditModal';
import OperatorPerformanceModal from '../components/OperatorPerformanceModal';
import { buildComplianceReport } from '../utils/metrics';


const oeeData = [
  { name: 'Semana 1', OEE: 75 },
  { name: 'Semana 2', OEE: 78 },
  { name: 'Semana 3', OEE: 82 },
  { name: 'Semana 4', OEE: 81 },
  { name: 'Semana 5', OEE: 85 },
];

const ExecutiveDashboard: React.FC = () => {
    const user = useAppStore(state => state.user);
    const inventoryItems = useAppStore(state => state.inventoryItems);
    const scrapEntries = useAppStore(state => state.scrapEntries);
    const productionOrders = useAppStore(state => state.productionOrders);
    const setProductionOrders = useAppStore(state => state.setProductionOrders);
    const machines = useAppStore(state => state.machines);
    const employees = useAppStore(state => state.employees);
    const targets = useAppStore(state => state.targets);
    const setNotification = useAppStore(state => state.setNotification);
    const showConfirm = useAppStore(state => state.showConfirm);
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [activeTab, setActiveTab] = useState<'overview' | 'scrap'>('overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [selectedPerfData, setSelectedPerfData] = useState<OperatorPerformanceData | null>(null);
  const [activeListTab, setActiveListTab] = useState<'active' | 'completed'>('active');


  const canExport = user?.role === Role.Admin;

  const dashboardSections = {
      kpis: 'KPIs Principales',
      active_orders: 'Órdenes Activas',
      operator_performance: 'Rendimiento por Operador',
      compliance: 'Cumplimiento de Objetivos',
      oee: 'Evolución de OEE',
      pareto: 'Análisis de Pareto de Scrap',
  };

  const paretoData = useMemo(() => {
    if (scrapEntries.length === 0) return [];

    const causeCosts = scrapEntries.reduce((acc: Record<string, number>, entry) => {
        const cause = entry.cause || 'Desconocida';
        acc[cause] = (acc[cause] || 0) + Number(entry.cost);
        return acc;
    }, {});

    const sortedCauses = Object.entries(causeCosts)
        .map(([name, cost]) => ({ name, Frecuencia: Number(cost) }))
        .sort((a, b) => b.Frecuencia - a.Frecuencia);

    const totalFrecuencia = sortedCauses.reduce((acc: number, cause) => acc + cause.Frecuencia, 0);
    
    let cumulative = 0;
    return sortedCauses.map(cause => {
        cumulative += cause.Frecuencia;
        return {
            ...cause,
            Cumulativo: (cumulative / totalFrecuencia) * 100,
        };
    });
  }, [scrapEntries]);
  
  const periodMap: { [key: string]: string } = {
    daily: 'Día',
    weekly: 'Semana',
    monthly: 'Mes',
    yearly: 'Año'
  };

  // Dynamic KPI Calculations
  const totalScrapCost = scrapEntries.reduce((acc: number, entry) => acc + Number(entry.cost), 0);
  const totalInventoryValue = inventoryItems.reduce((acc: number, item) => acc + (Number(item.quantity) * Number(item.costPerUnit)), 0);
  const totalInkCost = productionOrders.reduce((total: number, order) => {
    return total + order.inks.reduce((orderTotal: number, ink) => {
        return orderTotal + (Number(ink.consumption) * Number(ink.pricePerGram));
    }, 0);
  }, 0);
  
  const machineUtilization = useMemo(() => {
    if (!machines || machines.length === 0) {
      return { percentage: '0.0', change: 'N/A', changeType: 'increase' as const };
    }
    const totalOperational = machines.reduce((acc: number, machine) => acc + Number(machine.totalHoursOperational), 0);
    const totalAvailable = machines.reduce((acc: number, machine) => acc + Number(machine.totalHoursAvailable), 0);

    if (totalAvailable === 0) {
      return { percentage: '0.0', change: 'N/A', changeType: 'increase' as const };
    }
    
    const percentage = (totalOperational / totalAvailable) * 100;

    // Mock change calculation
    const previousPercentage = percentage * 0.98;
    const change = previousPercentage > 0 ? ((percentage - previousPercentage) / previousPercentage) * 100 : 0;

    return {
      percentage: percentage.toFixed(1),
      change: `${change.toFixed(1)}% vs. periodo anterior`,
      changeType: (change >= 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
    };
  }, [machines]);
  
   const operatorPerformance = useMemo((): OperatorPerformanceData[] => {
        const operatorIds = Array.from(new Set(productionOrders.map(o => o.operatorId).filter(Boolean)));
        
        return operatorIds.map(operatorId => {
            const operatorName = employees.find(e => e.id === operatorId)?.name || operatorId;
            const completedOrders = productionOrders.filter(o => o.operatorId === operatorId && o.status === 'Completada');
            const scrapCost = scrapEntries.filter(s => s.operatorId === operatorId).reduce((sum: number, s) => sum + Number(s.cost), 0);
            
            const costDeviations = completedOrders.map(o => {
                const realCost = o.inks.reduce((sum: number, i) => sum + (Number(i.consumption) * Number(i.pricePerGram)), 0);
                const targetCost = o.targetCost || 0;
                if (targetCost > 0) {
                    return ((realCost - targetCost) / targetCost) * 100;
                }
                return null;
            }).filter(d => d !== null) as number[];

            const avgDeviation = costDeviations.length > 0 ? costDeviations.reduce((a: number, b: number) => a + b, 0) / costDeviations.length : 0;
            
            return {
                operatorId: operatorId as string,
                operator: operatorName,
                ordersCompleted: completedOrders.length,
                scrapCost,
                avgCostEfficiency: avgDeviation,
            };
        });
    }, [productionOrders, scrapEntries, employees]);

    const activeOrders = useMemo(() => {
        return productionOrders.filter(o => o.status !== 'Completada' && o.status !== 'Cancelada' && o.status !== 'Archivada' && !o.deletedAt);
    }, [productionOrders]);

    const completedOrders = useMemo(() => {
        return productionOrders.filter(o => o.status === 'Completada' && !o.archivedAt && !o.deletedAt);
    }, [productionOrders]);

    const complianceReports = useMemo(() => {
        return employees
            .filter(e => e.role === Role.Operator)
            .map(op => {
                const report = buildComplianceReport({
                    targets,
                    scope: 'operator',
                    entries: scrapEntries,
                    productionOrders,
                    operatorId: op.id,
                });
                return {
                    operatorName: op.name,
                    ...report,
                };
            });
    }, [employees, scrapEntries, productionOrders, targets]);


  const handleExport = async ({ recipient, format, selectedColumns }: { recipient: string; format: 'csv' | 'pdf'; selectedColumns?: string[] }) => {
     if (format === 'csv' && selectedColumns) {
        let csvContent = `Reporte de Dashboard Ejecutivo para ${recipient}\n`;
        csvContent += `Generado: ${new Date().toLocaleString()}\n\n`;

        if (selectedColumns.includes('kpis')) {
            csvContent += "KPIs Principales\n";
            csvContent += "Métrica,Valor\n";
            csvContent += `Costo de Scrap (${periodMap[timePeriod]}),"$${totalScrapCost.toFixed(2)}"\n`;
            csvContent += `Inversión en Inventario,"$${totalInventoryValue.toFixed(2)}"\n`;
            csvContent += `Costo Total de Tintas,"$${totalInkCost.toFixed(2)}"\n`;
            csvContent += `Utilización de Máquinas (${periodMap[timePeriod]}),"${machineUtilization.percentage}%"\n\n`;
        }

        if (selectedColumns.includes('oee')) {
            csvContent += "Evolución de OEE\n";
            csvContent += "Periodo,OEE (%)\n";
            oeeData.forEach(row => {
                csvContent += `${row.name},${row.OEE}\n`;
            });
            csvContent += "\n";
        }
        
        if (selectedColumns.includes('pareto')) {
            csvContent += "Análisis de Pareto de Causas de Scrap\n";
            csvContent += "Causa,Frecuencia,Porcentaje Acumulado (%)\n";
            paretoData.forEach(row => {
                csvContent += `"${row.name}",${row.Frecuencia},${row.Cumulativo.toFixed(2)}\n`;
            });
            csvContent += "\n";
        }

        downloadFile(`Reporte_Dashboard_Ejecutivo_${new Date().toISOString().split('T')[0]}.csv`, csvContent, 'text/csv;charset=utf-8;');
    } else if (format === 'pdf' && selectedColumns) {
        const reportSections = [];

        if (selectedColumns.includes('kpis')) {
            reportSections.push({
                type: 'kpis' as const,
                title: 'KPIs Principales',
                data: [
                    { title: `Costo de Scrap (${periodMap[timePeriod]})`, value: `$${totalScrapCost.toFixed(2)}` },
                    { title: 'Inversión en Inventario', value: `$${totalInventoryValue.toFixed(2)}` },
                    { title: 'Costo Total de Tintas', value: `$${totalInkCost.toFixed(2)}` },
                    { title: `Utilización de Máquinas (${periodMap[timePeriod]})`, value: `${machineUtilization.percentage}%` },
                ]
            });
        }
         if (selectedColumns.includes('active_orders')) {
            reportSections.push({
                type: 'table' as const,
                title: 'Seguimiento de Órdenes de Producción Activas',
                data: activeOrders,
                head: [['OP', 'Producto', 'Operador', 'Estado', '% Avance']],
                body: activeOrders.map(order => [
                    order.id,
                    order.product,
                    employees.find(e => e.id === order.operatorId)?.name || 'N/A',
                    order.status,
                    `${(order.progressPercentage || 0).toFixed(0)}%`
                ])
            });
        }

        if (selectedColumns.includes('operator_performance')) {
            reportSections.push({
                type: 'table' as const,
                title: 'Rendimiento por Operador',
                data: operatorPerformance,
                head: [['Operador', 'Órdenes Completadas', 'Costo Scrap', 'Eficiencia Costo (%)']],
                body: operatorPerformance.map(perf => [
                    perf.operator,
                    perf.ordersCompleted,
                    `$${perf.scrapCost.toFixed(2)}`,
                    perf.avgCostEfficiency.toFixed(2)
                ])
            });
        }
        
        if (selectedColumns.includes('oee')) {
            reportSections.push({
                type: 'chart' as const,
                title: 'Evolución de OEE (Overall Equipment Effectiveness)',
                elementSelector: '[data-print-key="oee"] .recharts-wrapper',
                data: oeeData,
            });
        }

        if (selectedColumns.includes('pareto')) {
            reportSections.push({
                type: 'chart' as const,
                title: 'Análisis de Pareto de Causas de Scrap',
                elementSelector: '[data-print-key="pareto"] .recharts-wrapper',
                data: paretoData,
            });
        }

        await generatePdfReport('Reporte de Dashboard Ejecutivo', recipient, reportSections);
    }
  };

  const getStatusIndicator = (status: ProductionOrder['status']) => {
        switch(status) {
            case 'Pendiente': return 'status-indicator-pending';
            case 'En Progreso': return 'status-indicator-progress';
            case 'Completada': return 'status-indicator-completed';
            default: return 'bg-gray-500/30 text-gray-300';
        }
    };

    const handleOrderSave = (updatedOrder: ProductionOrder) => {
        showConfirm({
            title: 'Confirmar Cambios',
            message: `¿Estás seguro de que quieres guardar los cambios para la orden ${updatedOrder.id}?`,
            onConfirm: () => {
                setProductionOrders(productionOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
                setNotification({ message: '¡Orden actualizada con éxito!', type: 'success' });
            }
        });
    };

    const handleOpenOrderModal = (order: ProductionOrder) => {
        setSelectedOrder(order);
        setIsOrderModalOpen(true);
    };

    const handleOpenPerfModal = (perfData: OperatorPerformanceData) => {
        setSelectedPerfData(perfData);
        setIsPerfModalOpen(true);
    };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 no-print">
        <h2 className="text-2xl font-bold venki-title-gradient">Dashboard Ejecutivo</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <label htmlFor="period-select" className="sr-only">Seleccionar Periodo</label>
          <select 
            id="period-select"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="input-glass"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
          {canExport && (
            <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center justify-center btn-secondary"
            >
                {ICONS.Export}
                <span className="ml-2">Exportar</span>
            </button>
          )}
        </div>
      </div>

      <div className="tabs no-print">
        <button onClick={() => setActiveTab('overview')} className={`tab ${activeTab === 'overview' ? 'active' : ''}`}>
            Visión General
        </button>
        <button onClick={() => setActiveTab('scrap')} className={`tab ${activeTab === 'scrap' ? 'active' : ''}`}>
            Análisis de Scrap
        </button>
      </div>

    {activeTab === 'overview' && (
      <div className="space-y-8 animate-fade-in-down">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 printable-area" data-print-key="kpis">
            <DashboardCard 
                title={`Costo de Scrap (${periodMap[timePeriod]})`} 
                value={`$${totalScrapCost.toFixed(2)}`} 
                icon={ICONS['ScrapControl']}
                iconColorClass='text-venki-magenta'
                valueClassName="text-venki-magenta"
                />
            <DashboardCard 
                title="Inversión en Inventario" 
                value={`$${totalInventoryValue.toFixed(2)}`} 
                icon={ICONS['InventoryAndMaterials']}
                iconColorClass='text-venki-yellow'
                valueClassName="text-venki-yellow"
                />
            <DashboardCard 
                title="Costo Total de Tintas" 
                value={`$${totalInkCost.toFixed(2)}`} 
                icon={ICONS['OrderManagement']}
                iconColorClass='text-venki-cyan'
                valueClassName="text-venki-cyan"
                />
            <DashboardCard
                title={`Utilización de Máquinas (${periodMap[timePeriod]})`}
                value={`${machineUtilization.percentage}%`}
                change={machineUtilization.change}
                changeType={machineUtilization.changeType}
                icon={ICONS['MachineManagement']}
                iconColorClass='text-accent-indigo'
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass glass-noise p-6 printable-area" data-print-key="active_orders">
                <div className="glass-specular"></div>
                <div className="glass-glare"></div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg venki-subtitle">Seguimiento de Órdenes</h3>
                <div className="tabs no-print">
                    <button onClick={() => setActiveListTab('active')} className={`tab ${activeListTab === 'active' ? 'active' : ''}`}>
                        Activas ({activeOrders.length})
                    </button>
                    <button onClick={() => setActiveListTab('completed')} className={`tab ${activeListTab === 'completed' ? 'active' : ''}`}>
                        Terminadas ({completedOrders.length})
                    </button>
                </div>
            </div>

            {activeListTab === 'active' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase">
                        <tr>
                        <th className="px-4 py-2">OP</th>
                        <th className="px-4 py-2">Operador</th>
                        <th className="px-4 py-2">Estado</th>
                        <th className="px-4 py-2 w-1/3">% Avance</th>
                        {user?.role === Role.Admin && <th className="px-4 py-2">Acción</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {activeOrders.map(order => {
                        const progress = order.progressPercentage || 0;
                        const operatorName = employees.find(e => e.id === order.operatorId)?.name || 'N/A';
                        return (
                            <tr 
                            key={order.id} 
                            className={`border-b border-white/10 group ${user?.role === Role.Admin ? 'hover:bg-cyan-500/10 cursor-pointer' : ''}`}
                            onClick={() => user?.role === Role.Admin && handleOpenOrderModal(order)}
                            >
                            <td className="px-4 py-3 font-medium text-text-strong">{order.id}<p className="font-normal text-xs text-text-muted">{order.product}</p></td>
                            <td className="px-4 py-3 text-text-default">{operatorName}</td>
                            <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusIndicator(order.status)}`}>{order.status}</span></td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                </div>
                                <span className="text-xs font-medium text-text-muted">{progress.toFixed(0)}%</span>
                                </div>
                            </td>
                            {user?.role === Role.Admin && (
                                <td className="px-4 py-3 text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Ver detalles de la orden ${order.id}`}>
                                {ICONS.View}
                                </td>
                            )}
                            </tr>
                        )
                        })}
                        {activeOrders.length === 0 && (
                            <tr>
                                <td colSpan={user?.role === Role.Admin ? 5 : 4} className="text-center py-4 text-text-muted">No hay órdenes de producción activas.</td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase">
                        <tr>
                        <th className="px-4 py-2">Orden</th>
                        <th className="px-4 py-2">Operador</th>
                        <th className="px-4 py-2">Fecha Finalización</th>
                        <th className="px-4 py-2">Desv. Costo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {completedOrders.map(order => {
                            const realCost = order.inks.reduce((acc, ink) => acc + (ink.consumption * ink.pricePerGram), 0);
                            const targetCost = order.targetCost || 0;
                            const deviation = realCost - targetCost;
                            const operatorName = employees.find(e => e.id === order.operatorId)?.name || 'N/A';
                            return (
                                <tr key={order.id} className="border-b border-white/10">
                                    <td className="px-4 py-3 font-medium text-text-strong">{order.id}<p className="font-normal text-xs text-text-muted">{order.product}</p></td>
                                    <td className="px-4 py-3 text-text-default">{operatorName}</td>
                                    <td className="px-4 py-3 text-text-default">{order.completionDate || 'N/A'}</td>
                                    <td className={`px-4 py-3 font-semibold ${deviation > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        ${deviation.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                        {completedOrders.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-4 text-text-muted">No hay órdenes completadas.</td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            )}
            </div>
            <div className="glass glass-noise p-6 printable-area" data-print-key="operator_performance">
                <div className="glass-specular"></div>
                <div className="glass-glare"></div>
            <h3 className="text-lg venki-subtitle mb-4">Rendimiento por Operador</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase">
                    <tr>
                    <th className="px-4 py-2">Operador</th>
                    <th className="px-4 py-2">Órdenes Completadas</th>
                    <th className="px-4 py-2">Costo Scrap</th>
                    <th className="px-4 py-2">Eficiencia Costo</th>
                    {user?.role === Role.Admin && <th className="px-4 py-2">Acción</th>}
                    </tr>
                </thead>
                <tbody>
                    {operatorPerformance.map(perf => (
                        <tr 
                        key={perf.operatorId} 
                        className={`border-b border-white/10 group ${user?.role === Role.Admin ? 'hover:bg-cyan-500/10 cursor-pointer' : ''}`}
                        onClick={() => user?.role === Role.Admin && handleOpenPerfModal(perf)}
                        >
                            <td className="px-4 py-3 font-medium text-text-strong">{perf.operator}</td>
                            <td className="px-4 py-3 text-center text-text-default">{perf.ordersCompleted}</td>
                            <td className="px-4 py-3 text-center text-red-400">${perf.scrapCost.toFixed(2)}</td>
                            <td className={`px-4 py-3 text-center font-semibold ${perf.avgCostEfficiency > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {perf.avgCostEfficiency.toFixed(2)}%
                            </td>
                            {user?.role === Role.Admin && (
                            <td className="px-4 py-3 text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Ver detalles de rendimiento de ${perf.operator}`}>
                                {ICONS.View}
                            </td>
                            )}
                        </tr>
                    ))}
                    {operatorPerformance.length === 0 && (
                        <tr>
                            <td colSpan={user?.role === Role.Admin ? 5 : 4} className="text-center py-4 text-text-muted">No hay datos de rendimiento disponibles.</td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
            </div>
        </div>

        <div className="glass glass-noise p-6 printable-area" data-print-key="compliance">
            <div className="glass-specular"></div>
            <div className="glass-glare"></div>
            <h3 className="text-lg venki-subtitle mb-4">Cumplimiento de Objetivos (Operador)</h3>
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
                             const gap = (report.percents.costPct || 0) - (report.targets.costPct || 0);
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


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 glass glass-noise printable-area" data-print-key="oee">
                <div className="glass-specular"></div>
                <div className="glass-glare"></div>
            <h3 className="text-lg venki-subtitle mb-4">Evolución de OEE (Overall Equipment Effectiveness)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={oeeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fill: 'var(--text-muted)' }} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'var(--glass-bg-strong)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-default)' ,
                            borderRadius: 'var(--glass-radius)'
                        }} 
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-default)' }} />
                    <Line type="monotone" dataKey="OEE" stroke="var(--accent-teal)" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-rows-2 gap-6 printable-area" data-print-key="kpi_cards_process">
                <KPICard 
                    title="KPIs Proceso A"
                    kpis={[
                        { name: 'Cpk', value: 1.33 },
                        { name: 'CpkL', value: 1.45 },
                        { name: 'CpkU', value: 1.21 },
                        { name: 'Objetivo', value: '> 1.33' },
                    ]}
                />
                <KPICard 
                    title="KPIs Proceso B"
                    kpis={[
                        { name: 'Cpk', value: 1.67 },
                        { name: 'CpkL', value: 1.70 },
                        { name: 'CpkU', value: 1.64 },
                        { name: 'Objetivo', value: '> 1.33' },
                    ]}
                />
            </div>
        </div>
      </div>
    )}

    {activeTab === 'scrap' && (
        <div className="animate-fade-in-down">
             <div className="flex justify-center printable-area" data-print-key="pareto">
                <div className="p-6 glass glass-noise inline-block">
                    <div className="glass-specular"></div>
                    <div className="glass-glare"></div>
                    <h3 className="text-lg venki-subtitle mb-4 text-center">Análisis de Pareto de Causas de Scrap (por Costo)</h3>
                    <ParetoChart data={paretoData} />
                </div>
            </div>
        </div>
    )}


      <footer className="text-center text-text-muted text-sm italic py-4 no-print">
        "Lo que no se mide, no se puede mejorar. Lo que no se digitaliza, no se puede escalar."
      </footer>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title="Dashboard Ejecutivo"
        supportedFormats={['csv', 'pdf']}
        columns={Object.entries(dashboardSections).map(([key, label]) => ({ key, label }))}
        userRole={user?.role}
      />

       {user?.role === Role.Admin && (
        <>
            <OrderEditModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onSave={handleOrderSave}
                initialOrderData={selectedOrder}
            />
            <OperatorPerformanceModal
                isOpen={isPerfModalOpen}
                onClose={() => setIsPerfModalOpen(false)}
                performanceData={selectedPerfData}
            />
        </>
      )}

    </div>
  );
};

export default ExecutiveDashboard;