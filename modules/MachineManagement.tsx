import React, { useState } from 'react';
import { Machine, Role } from '../types';
import { useAppStore } from '../useAppStore';
import { ICONS } from '../constants';
import MachineModal from '../components/MachineModal';
import ExportModal from '../components/ExportModal';
import { exportDataToCSV, generatePdfReport } from '../utils/fileHelpers';

const machineColumns = {
    id: 'ID',
    name: 'Nombre',
    type: 'Tipo',
    status: 'Estado',
    maxWidth: 'Ancho Máx. (mm)',
    maxSpeed: 'Vel. Máx. (m/min)',
    colorStations: 'Estaciones de Color',
    lastMaintenance: 'Último Mtto.',
    nextMaintenance: 'Próx. Mtto.',
    totalHoursAvailable: 'Horas Disponibles',
    totalHoursOperational: 'Horas Operativas',
};

const MachineManagement: React.FC = () => {
    const user = useAppStore(state => state.user);
    const machines = useAppStore(state => state.machines);
    const setMachines = useAppStore(state => state.setMachines);
    const { setNotification, showConfirm } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Partial<Machine> | null>(null);

    const canEdit = user?.role === Role.Admin;
    const canExport = user?.role === Role.Admin;

    const handleOpenModal = (machine: Partial<Machine> | null) => {
        setEditingMachine(machine);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingMachine(null);
        setIsModalOpen(false);
    };
    
    const handleSaveMachine = (machine: Machine) => {
        const isEditing = machines.some(m => m.id === machine.id);
        const confirmMessage = isEditing
            ? `¿Estás seguro de que deseas guardar los cambios para la máquina ${machine.id}?`
            : '¿Estás seguro de que deseas crear esta nueva máquina?';

        showConfirm({
            title: isEditing ? 'Guardar Cambios' : 'Crear Máquina',
            message: confirmMessage,
            onConfirm: () => {
                if (isEditing) {
                    setMachines(machines.map(m => m.id === machine.id ? machine : m));
                } else {
                    setMachines([...machines, machine]);
                }
                handleCloseModal();
                setNotification({ message: '¡Los cambios se han guardado con éxito!', type: 'success' });
            }
        });
    };

    const handleDeleteMachine = (id: string) => {
        showConfirm({
            title: 'Eliminar Máquina',
            message: `¿Estás seguro de que quieres eliminar la máquina ${id}? Esta acción no se puede deshacer.`,
            onConfirm: () => {
                setMachines(machines.filter(m => m.id !== id));
                setNotification({ message: `La máquina ${id} ha sido eliminada.`, type: 'success' });
            }
        });
    };

    const handleExport = async ({ recipient, format }: { recipient: string; format: 'csv' | 'pdf'; selectedColumns?: string[] }) => {
        if (format === 'csv') {
             exportDataToCSV(
                machines,
                machineColumns,
                Object.keys(machineColumns),
                `Reporte_Maquinas_${new Date().toISOString().split('T')[0]}.csv`
            );
        } else if (format === 'pdf') {
             const sections = [{
                type: 'table' as const,
                title: 'Reporte del Parque de Máquinas',
                data: machines,
                head: [['ID', 'Nombre', 'Tipo', 'Estado', 'Vel. Máx.', 'Próx. Mtto.']],
                body: machines.map(m => [
                    m.id,
                    m.name,
                    m.type,
                    m.status,
                    `${m.maxSpeed} m/min`,
                    m.nextMaintenance
                ])
            }];
            await generatePdfReport('Reporte de Máquinas', recipient, sections);
        }
    };
    
    const getStatusColor = (status: Machine['status']) => {
        switch (status) {
            case 'Operativa': return 'status-indicator-completed';
            case 'En Mantenimiento': return 'status-indicator-pending';
            case 'Fuera de Servicio': return 'bg-red-500/30 text-red-300';
            default: return 'bg-gray-500/30 text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 no-print">
                <h2 className="text-2xl font-bold venki-title-gradient">Gestión del Parque de Máquinas</h2>
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    {canEdit && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="btn-primary"
                        >
                            Añadir Nueva Máquina
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
                    <p><span className="font-bold">Modo de Solo Lectura:</span> Tu rol no permite modificar el catálogo de máquinas.</p>
                </div>
            )}

            <div className="glass glass-noise p-6 printable-area" data-print-key="machine_table">
                <h3 className="text-lg venki-subtitle mb-4">Listado de Máquinas</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-default">
                        <thead className="text-xs text-text-muted uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID</th>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Tipo</th>
                                <th scope="col" className="px-6 py-3">Estado</th>
                                <th scope="col" className="px-6 py-3">Vel. Máx.</th>
                                <th scope="col" className="px-6 py-3">Próx. Mtto.</th>
                                {canEdit && <th scope="col" className="px-6 py-3 no-print">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {machines.map(machine => (
                                <tr key={machine.id} className="border-b border-white/10">
                                    <td className="px-6 py-4 font-medium text-text-strong">{machine.id}</td>
                                    <td className="px-6 py-4">{machine.name}</td>
                                    <td className="px-6 py-4">{machine.type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(machine.status)}`}>
                                            {machine.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{machine.maxSpeed} m/min</td>
                                    <td className="px-6 py-4">{machine.nextMaintenance}</td>
                                    {canEdit && (
                                        <td className="px-6 py-4 flex items-center gap-4 no-print">
                                            <button onClick={() => handleOpenModal(machine)} title="Editar Máquina" aria-label={`Editar máquina ${machine.name}`} className="text-accent-cyan hover:opacity-80">
                                                {ICONS.Edit}
                                            </button>
                                            <button onClick={() => handleDeleteMachine(machine.id)} title="Eliminar Máquina" aria-label={`Eliminar máquina ${machine.name}`} className="text-danger hover:opacity-80">
                                                {ICONS.Trash}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
            
            {canEdit && (
                <MachineModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveMachine}
                    machineData={editingMachine}
                />
            )}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Gestión de Máquinas"
                supportedFormats={['csv', 'pdf']}
                columns={[]}
                userRole={user?.role}
            />
        </div>
    );
};

export default MachineManagement;