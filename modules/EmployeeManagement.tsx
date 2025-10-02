import React, { useState } from 'react';
import { Employee, Role, Module } from '../types';
import { useAppStore } from '../useAppStore';
import { ICONS } from '../constants';
import EmployeeModal from '../components/EmployeeModal';
import ExportModal from '../components/ExportModal';
import { exportDataToCSV, generatePdfReport } from '../utils/fileHelpers';

const employeeColumns = {
    id: 'No. de Empleado',
    name: 'Nombre',
    position: 'Puesto',
    role: 'Rol',
    email: 'Email',
    phone: 'Teléfono',
    hireDate: 'Fecha de Contratación',
    modules: 'Módulos Asignados',
};


const getModuleBadgeColor = (module: Module) => {
    const colors = [
        'bg-cyan-900/70 text-cyan-200',
        'bg-teal-900/70 text-teal-200',
        'bg-green-900/70 text-green-200',
        'bg-yellow-900/70 text-yellow-200',
        'bg-purple-900/70 text-purple-200',
        'bg-pink-900/70 text-pink-200',
        'bg-indigo-900/70 text-indigo-200',
        'bg-peach-900/70 text-peach-200',
    ];
    let hash = 0;
    for (let i = 0; i < module.length; i++) {
        hash = module.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash % colors.length)];
};

const EmployeeManagement: React.FC = () => {
    const user = useAppStore(state => state.user);
    const employees = useAppStore(state => state.employees);
    const setEmployees = useAppStore(state => state.setEmployees);
    const { setNotification, showConfirm } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);

    const canEdit = user?.role === Role.Admin;
    const canExport = user?.role === Role.Admin;

    const handleOpenModal = (employee: Partial<Employee> | null) => {
        setEditingEmployee(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingEmployee(null);
        setIsModalOpen(false);
    };
    
    const handleSaveEmployee = (employee: Employee) => {
        const isEditing = employees.some(e => e.id === employee.id);
        const confirmMessage = isEditing
            ? '¿Estás seguro de que deseas guardar los cambios para este empleado?'
            : '¿Estás seguro de que deseas crear este nuevo empleado?';
    
        showConfirm({
            title: isEditing ? 'Guardar Cambios' : 'Crear Empleado',
            message: confirmMessage,
            onConfirm: () => {
                if (isEditing) {
                    setEmployees(employees.map(e => (e.id === employee.id ? employee : e)));
                } else {
                    setEmployees([...employees, employee]);
                }
                setNotification({ message: '¡Empleado guardado con éxito!', type: 'success' });
                handleCloseModal();
            }
        });
    };

    const handleDeleteEmployee = (id: string) => {
        showConfirm({
            title: 'Eliminar Empleado',
            message: `¿Estás seguro de que quieres eliminar al empleado ${id}? Esta acción no se puede deshacer.`,
            onConfirm: () => {
                setEmployees(employees.filter(e => e.id !== id));
                setNotification({ message: `Empleado ${id} eliminado con éxito.`, type: 'success' });
            }
        });
    };

    const calculateSeniority = (hireDate: string) => {
        if (!hireDate) return 'N/A';
        const start = new Date(hireDate);
        const now = new Date();
        if (isNaN(start.getTime())) return 'Fecha inválida';

        let years = now.getFullYear() - start.getFullYear();
        let months = now.getMonth() - start.getMonth();
        
        if (now.getDate() < start.getDate()) {
            months--;
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        if (years === 0 && months === 0) return 'Menos de 1 mes';
        
        const result: string[] = [];
        if (years > 0) {
            result.push(`${years} año${years > 1 ? 's' : ''}`);
        }
        if (months > 0) {
            result.push(`${months} mes${months > 1 ? 'es' : ''}`);
        }
        
        return result.join(' y ');
    };
    
    const handleExport = async ({ recipient, format }: { recipient: string; format: 'csv' | 'pdf'; selectedColumns?: string[] }) => {
        if (format === 'csv') {
            const dataToExport = employees.map(emp => ({
                ...emp,
                modules: emp.modules.join(', ')
            }));
            exportDataToCSV(dataToExport, employeeColumns, Object.keys(employeeColumns), `Reporte_Empleados_${new Date().toISOString().split('T')[0]}.csv`);
        } else if (format === 'pdf') {
            const sections = [{
                type: 'table' as const,
                title: 'Reporte de Empleados',
                data: employees,
                head: [['ID', 'Nombre', 'Puesto', 'Rol', 'Antigüedad']],
                body: employees.map(emp => [
                    emp.id,
                    emp.name,
                    emp.position,
                    emp.role,
                    calculateSeniority(emp.hireDate)
                ])
            }];
            await generatePdfReport('Reporte de Empleados', recipient, sections);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <h2 className="text-2xl font-bold venki-title-gradient">Gestión de Empleados</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {canEdit && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="btn-primary"
                        >
                            Añadir Nuevo Empleado
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
                <div className="p-4 text-sm text-yellow-200 bg-yellow-900/40 border-l-4 border-yellow-500" role="alert">
                    <p><span className="font-bold">Modo de Solo Lectura:</span> Tu rol no permite modificar la lista de empleados.</p>
                </div>
            )}

            <div className="glass glass-noise p-6">
                 <div className="glass-specular"></div>
                 <div className="glass-glare"></div>
                 <h3 className="text-lg venki-subtitle mb-4">Listado de Personal</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-default">
                        <thead className="text-xs text-text-muted uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">No. de Empleado</th>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Puesto</th>
                                <th scope="col" className="px-6 py-3">Antigüedad</th>
                                <th scope="col" className="px-6 py-3">Módulos Asignados</th>
                                {canEdit && <th scope="col" className="px-6 py-3">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(employee => (
                                <tr key={employee.id} className="border-b border-white/10">
                                    <td className="px-6 py-4 font-medium text-text-strong">{employee.id}</td>
                                    <td className="px-6 py-4">{employee.name}</td>
                                    <td className="px-6 py-4">{employee.position}</td>
                                    <td className="px-6 py-4">{calculateSeniority(employee.hireDate)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {employee.modules?.map(module => (
                                                <span key={module} className={`px-2 py-0.5 text-xs rounded-full ${getModuleBadgeColor(module)}`}>
                                                    {module}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    {canEdit && (
                                        <td className="px-6 py-4 flex items-center gap-4">
                                            <button onClick={() => handleOpenModal(employee)} title="Editar Empleado" aria-label={`Editar empleado ${employee.name}`} className="text-accent-cyan hover:opacity-80">
                                                {ICONS.Edit}
                                            </button>
                                            <button onClick={() => handleDeleteEmployee(employee.id)} title="Eliminar Empleado" aria-label={`Eliminar empleado ${employee.name}`} className="text-danger hover:opacity-80">
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
                <EmployeeModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveEmployee}
                    employeeData={editingEmployee}
                />
            )}
            
             <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title="Gestión de Empleados"
                supportedFormats={['csv', 'pdf']}
                columns={[]}
                userRole={user?.role}
            />
        </div>
    );
};

export default EmployeeManagement;