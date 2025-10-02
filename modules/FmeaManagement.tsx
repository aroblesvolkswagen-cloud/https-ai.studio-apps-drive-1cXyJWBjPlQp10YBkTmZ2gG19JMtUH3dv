import React, { useState } from 'react';
import { useAppStore } from '../useAppStore';
import { Role, FmeaDocument } from '../types';
// FIX: Corrected import to be a named import as FmeaTable does not have a default export.
import { FmeaTable } from '../components/FmeaTable';
import { ICONS } from '../constants';
import ExportModal from '../components/ExportModal';
import { exportDataToCSV, generatePdfReport } from '../utils/fileHelpers';

const fmeaColumns = {
    processStep: 'Paso del Proceso',
    potentialFailureMode: 'Modo de Falla Potencial',
    potentialEffect: 'Efecto Potencial',
    severity: 'Severidad (S)',
    potentialCause: 'Causa Potencial',
    occurrence: 'Ocurrencia (O)',
    currentControls: 'Controles Actuales',
    detection: 'Detección (D)',
    rpn: 'NPR',
    recommendedAction: 'Acción Recomendada',
};

const FmeaManagement: React.FC = () => {
    const user = useAppStore(state => state.user);
    const fmeas = useAppStore(state => state.fmeas);
    const setFmeas = useAppStore(state => state.setFmeas);
    const showConfirm = useAppStore(state => state.showConfirm);
    const [selectedFmeaId, setSelectedFmeaId] = useState<string | null>(fmeas.length > 0 ? fmeas[0].id : null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const canEdit = user?.role === Role.Admin;
    const canExport = user?.role === Role.Admin;
    const selectedFmea = fmeas.find(f => f.id === selectedFmeaId);

    const handleCreateNewFmea = () => {
        const newFmeaId = `PFMEA-${(fmeas.length + 1).toString().padStart(3, '0')}`;
        const newFmea: FmeaDocument = {
            id: newFmeaId,
            name: 'Nuevo FMEA - Sin Título',
            scope: 'Alcance por definir.',
            team: [user?.name || 'Usuario'],
            rows: [
                {
                    id: 1,
                    processStep: '',
                    potentialFailureMode: '',
                    potentialEffect: '',
                    severity: 1,
                    potentialCause: '',
                    occurrence: 1,
                    currentControls: '',
                    detection: 10,
                    rpn: 10,
                    recommendedAction: ''
                }
            ]
        };
        const newFmeas = [...fmeas, newFmea];
        setFmeas(newFmeas);
        setSelectedFmeaId(newFmeaId);
    };

    const handleFmeaChange = (updatedFmea: FmeaDocument) => {
        const newFmeas = fmeas.map(doc =>
            doc.id === updatedFmea.id ? updatedFmea : doc
        );
        setFmeas(newFmeas);
    };
    
    const handleDeleteFmea = (fmeaId: string) => {
        showConfirm({
            title: 'Eliminar FMEA',
            message: `¿Estás seguro de que quieres eliminar el documento FMEA ${fmeaId}? Esta acción es irreversible.`,
            onConfirm: () => {
                const currentIndex = fmeas.findIndex(f => f.id === fmeaId);
                const newFmeas = fmeas.filter(f => f.id !== fmeaId);
                setFmeas(newFmeas);

                if (selectedFmeaId === fmeaId) {
                    if (newFmeas.length === 0) {
                        setSelectedFmeaId(null);
                    } else {
                        const newIndex = Math.max(0, currentIndex - 1);
                        setSelectedFmeaId(newFmeas[newIndex].id);
                    }
                }
            }
        });
    };

    const handleExport = async ({ recipient, format }: { recipient: string; format: 'csv' | 'pdf'; selectedColumns?: string[] }) => {
        if (!selectedFmea) return;

        if (format === 'csv') {
            exportDataToCSV(
                selectedFmea.rows,
                fmeaColumns,
                Object.keys(fmeaColumns),
                `Reporte_FMEA_${selectedFmea.id}_${new Date().toISOString().split('T')[0]}.csv`
            );
        } else if (format === 'pdf') {
            const sections = [{
                type: 'table' as const,
                title: `Análisis FMEA: ${selectedFmea.name}`,
                // FIX: The 'data' property is required for PDF generation.
                data: selectedFmea.rows,
                head: [['Paso', 'Modo Falla', 'Efecto', 'S', 'Causa', 'O', 'Controles', 'D', 'NPR', 'Acción Rec.']],
                body: selectedFmea.rows.map(row => [
                    row.processStep,
                    row.potentialFailureMode,
                    row.potentialEffect,
                    row.severity,
                    row.potentialCause,
                    row.occurrence,
                    row.currentControls,
                    row.detection,
                    row.rpn,
                    row.recommendedAction
                ])
            }];
            await generatePdfReport('Reporte FMEA', recipient, sections);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 no-print">
                <div>
                    <h2 className="text-2xl font-bold venki-title-gradient">Análisis de Modos y Efectos de Falla (FMEA)</h2>
                    <p className="text-text-muted mt-1 text-sm sm:text-base">Herramienta proactiva para identificar y mitigar riesgos en los procesos.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    {canEdit && (
                        <button
                            onClick={handleCreateNewFmea}
                            className="btn-primary"
                        >
                            Crear Nuevo FMEA
                        </button>
                    )}
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
             {!canEdit && (
                <div className="p-4 text-sm text-yellow-200 bg-yellow-900/40 border-l-4 border-yellow-500 no-print" role="alert">
                    <p><span className="font-bold">Modo de Solo Lectura:</span> Tu rol no permite modificar los documentos FMEA.</p>
                </div>
            )}

            <div className="p-4 no-print glass glass-noise">
                <div className="glass-specular"></div>
                <div className="glass-glare"></div>
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="glass w-10 h-10 rounded-full flex items-center justify-center text-venki-cyan">
                           {ICONS.Question}
                        </div>
                    </div>
                    <div className="ml-3">
                        <p className="font-bold venki-subtitle">Guía Rápida</p>
                        <p className="text-sm mt-1 text-text-muted">
                            <strong>1. ¿Qué es un FMEA?:</strong> Es una herramienta para identificar y prevenir fallas <em>antes</em> de que ocurran. <br/>
                            <strong>2. Navegación:</strong> Selecciona un documento FMEA de la lista de la izquierda para ver su contenido en la tabla. <br/>
                            <strong>3. NPR (Número Prioritario de Riesgo):</strong> Se calcula multiplicando Severidad (S), Ocurrencia (O) y Detección (D). Un NPR alto (rojo) indica un riesgo prioritario a mitigar. <br/>
                            <strong>4. Edición (Admin):</strong> Como administrador, puedes hacer clic directamente en las celdas para editar los valores. El NPR se recalculará automáticamente.
                        </p>
                    </div>
                </div>
            </div>

            {fmeas.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 glass glass-noise p-4 no-print">
                        <div className="glass-specular"></div>
                        <div className="glass-glare"></div>
                        <h3 className="venki-subtitle mb-4">Documentos FMEA</h3>
                        <ul className="space-y-2">
                            {fmeas.map((fmea) => (
                                <li key={fmea.id} className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setSelectedFmeaId(fmea.id)}
                                        className={`tab flex-grow text-left p-3 !rounded-xl transition-all ${selectedFmeaId === fmea.id ? 'active' : ''}`}
                                    >
                                        <p className="font-bold">{fmea.id}</p>
                                        <p className="text-sm">{fmea.name}</p>
                                    </button>
                                    {canEdit && (
                                        <button
                                            onClick={() => handleDeleteFmea(fmea.id)}
                                            className="btn-icon-danger flex-shrink-0"
                                            aria-label={`Eliminar FMEA ${fmea.id}`}
                                        >
                                            {React.cloneElement(ICONS.Trash, { className: 'w-4 h-4' })}
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-3 glass glass-noise p-6 printable-area" data-print-key="fmea_table">
                        <div className="glass-specular"></div>
                        <div className="glass-glare"></div>
                        {selectedFmea ? (
                            <div>
                                <h3 className="text-lg font-bold venki-subtitle">{selectedFmea.name}</h3>
                                <p className="text-sm text-text-muted mt-1"><span className="font-semibold">Alcance:</span> {selectedFmea.scope}</p>
                                <p className="text-sm text-text-muted"><span className="font-semibold">Equipo:</span> {selectedFmea.team.join(', ')}</p>
                                <div className="mt-6">
                                    <FmeaTable
                                        fmea={selectedFmea}
                                        onFmeaChange={handleFmeaChange}
                                        canEdit={canEdit}
                                        showConfirm={showConfirm}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p>Selecciona un documento FMEA para ver los detalles.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 glass glass-noise">
                    <div className="glass-specular"></div>
                    <div className="glass-glare"></div>
                    <h3 className="text-xl font-semibold venki-subtitle">No hay documentos FMEA</h3>
                    <p className="mt-2 text-text-muted">
                        {canEdit ? "Crea tu primer FMEA para comenzar a analizar los riesgos del proceso." : "No se han creado documentos FMEA todavía."}
                    </p>
                </div>
            )}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title={`FMEA: ${selectedFmea?.name || ''}`}
                supportedFormats={['csv', 'pdf']}
                columns={[]}
                userRole={user?.role}
            />
        </div>
    );
};

export default FmeaManagement;