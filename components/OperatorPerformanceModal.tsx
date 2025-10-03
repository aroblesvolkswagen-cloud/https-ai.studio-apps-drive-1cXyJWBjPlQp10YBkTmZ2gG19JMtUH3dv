import React, { useMemo } from 'react';
import Modal from './Modal';
import { useAppStore } from '../useAppStore';
import { OperatorPerformanceData, Module } from '../types';
import ParetoChart from './charts/ParetoChart';

interface OperatorPerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    performanceData: OperatorPerformanceData | null;
}

const OperatorPerformanceModal: React.FC<OperatorPerformanceModalProps> = ({ isOpen, onClose, performanceData }) => {
    const scrapEntries = useAppStore(state => state.scrapEntries);
    const setScrapControlInitialFilter = useAppStore(state => state.setScrapControlInitialFilter);
    const setActiveModule = useAppStore(state => state.setActiveModule);

    const operatorScrap = useMemo(() => {
        if (!performanceData) return [];
        return scrapEntries.filter(entry => entry.operatorId === performanceData.operatorId);
    }, [scrapEntries, performanceData]);

    const paretoData = useMemo(() => {
        if (operatorScrap.length === 0) return [];

        const causeCounts = operatorScrap.reduce((acc: Record<string, number>, entry) => {
// FIX: Corrected property access from 'rootCause' to 'cause'.
            acc[entry.cause || 'Desconocida'] = (acc[entry.cause || 'Desconocida'] || 0) + 1;
            return acc;
        }, {});

        const sortedCauses = Object.entries(causeCounts)
            .map(([name, count]) => ({ name, Frecuencia: Number(count) }))
            // FIX: Explicitly cast Frecuencia to Number to avoid type errors in arithmetic operations.
            .sort((a, b) => b.Frecuencia - a.Frecuencia);

        // FIX: Explicitly type accumulator and cast value to Number to avoid type errors in arithmetic operations.
        const totalFrecuencia = sortedCauses.reduce((acc: number, cause) => acc + cause.Frecuencia, 0);
        
        let cumulative = 0;
        return sortedCauses.map(cause => {
            // FIX: Explicitly cast value to Number to avoid type errors in arithmetic operations.
            cumulative += cause.Frecuencia;
            return {
                ...cause,
                Cumulativo: totalFrecuencia > 0 ? (cumulative / totalFrecuencia) * 100 : 0,
            };
        });
      }, [operatorScrap]);

    if (!performanceData) return null;

    const handleDeepDive = () => {
        setScrapControlInitialFilter({ type: 'operator', value: performanceData.operatorId });
        setActiveModule(Module.ScrapControl);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Análisis de Rendimiento: ${performanceData.operator}`}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center p-4 glass rounded-lg">
                    <div>
                        <p className="text-sm text-gray-400">Órdenes Completadas</p>
                        <p className="text-xl font-bold text-white">{performanceData.ordersCompleted}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Costo Scrap Total</p>
                        <p className="text-xl font-bold text-red-400">${performanceData.scrapCost.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Eficiencia de Costo</p>
                        <p className={`text-xl font-bold ${performanceData.avgCostEfficiency > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {performanceData.avgCostEfficiency.toFixed(2)}%
                        </p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-lg text-venki-yellow mb-2">Desglose de Scrap</h4>
                    <div className="max-h-48 overflow-y-auto glass p-2 rounded-lg">
                        {operatorScrap.length > 0 ? (
                            <table className="w-full text-xs text-left">
                                <thead className="bg-white/10 text-white">
                                    <tr>
                                        <th className="px-2 py-1">Fecha</th>
                                        <th className="px-2 py-1">Causa</th>
                                        <th className="px-2 py-1">Costo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operatorScrap.map(entry => (
                                        <tr key={entry.id} className="border-b border-white/10 last:border-0">
                                            <td className="px-2 py-1">{entry.date}</td>
{/* FIX: Corrected property access from 'rootCause' to 'cause'. */}
                                            <td className="px-2 py-1">{entry.cause}</td>
                                            <td className="px-2 py-1 text-red-300">${entry.cost.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-400 py-4">Este operador no tiene registros de scrap.</p>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-lg text-venki-yellow mb-2">Pareto de Causas de Scrap del Operador</h4>
                     {paretoData.length > 0 ? (
                        <ParetoChart data={paretoData} />
                    ) : (
                        <p className="text-center text-gray-400 py-4">No hay datos suficientes para generar el gráfico de Pareto.</p>
                    )}
                </div>

                <button
                    onClick={handleDeepDive}
                    className="w-full mt-2 btn-primary"
                >
                    Analizar en Control de Scrap
                </button>
            </div>
        </Modal>
    );
};

export default OperatorPerformanceModal;