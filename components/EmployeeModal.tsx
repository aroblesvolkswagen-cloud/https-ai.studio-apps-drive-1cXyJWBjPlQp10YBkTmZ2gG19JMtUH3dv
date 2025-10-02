import React, { useState, useEffect } from 'react';
import { Employee, Role, Module } from '../types';
import { TEXT_INPUT_STYLE, USER_ROLES } from '../constants';
import Modal from './Modal';

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: Employee) => void;
    employeeData: Partial<Employee> | null;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, employeeData }) => {
    const [employee, setEmployee] = useState<Partial<Employee>>({});

    useEffect(() => {
        setEmployee(employeeData || { role: Role.Operator, modules: [] });
    }, [employeeData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEmployee(prev => ({ ...prev, [name]: value }));
    };

    const handleModuleChange = (module: Module, checked: boolean) => {
        const currentModules = employee.modules || [];
        if (checked) {
            setEmployee(prev => ({ ...prev, modules: [...currentModules, module] }));
        } else {
            setEmployee(prev => ({ ...prev, modules: currentModules.filter(m => m !== module) }));
        }
    };

    const handleSubmit = () => {
        if (!employee.id || !employee.name || !employee.position || !employee.email || !employee.phone || !employee.hireDate || !employee.role) {
            alert("Todos los campos, incluyendo el rol, son obligatorios.");
            return;
        }
        
        onSave({ ...employee, modules: employee.modules || [] } as Employee);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={employeeData?.id ? "Editar Empleado" : "Añadir Nuevo Empleado"}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">No. de Empleado (ID)</label>
                        <input type="text" name="id" placeholder="Ej: EMP-001" value={employee.id || ''} onChange={handleChange} className={TEXT_INPUT_STYLE} disabled={!!employeeData?.id} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Puesto</label>
                        <input type="text" name="position" placeholder="Ej: Prensista" value={employee.position || ''} onChange={handleChange} className={TEXT_INPUT_STYLE} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Nombre Completo</label>
                    <input type="text" name="name" placeholder="Ej: Juan Pérez" value={employee.name || ''} onChange={handleChange} className={TEXT_INPUT_STYLE} />
                </div>
                
                 <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Rol de Usuario</label>
                    <select name="role" value={employee.role} onChange={handleChange} className={TEXT_INPUT_STYLE}>
                       {USER_ROLES.map(role => (
                           <option key={role} value={role} className="bg-gray-800 text-white">{role}</option>
                       ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                        <input type="email" name="email" placeholder="ejemplo@venki.com" value={employee.email || ''} onChange={handleChange} className={TEXT_INPUT_STYLE} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Teléfono</label>
                        <input type="tel" name="phone" placeholder="55-1234-5678" value={employee.phone || ''} onChange={handleChange} className={TEXT_INPUT_STYLE} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Fecha de Contratación</label>
                    <input type="date" name="hireDate" value={employee.hireDate || ''} onChange={handleChange} className={TEXT_INPUT_STYLE} />
                </div>

                 <div className="pt-4 border-t border-white/20">
                    <label className="block text-sm font-medium text-gray-200 mb-2">Asignar Módulos</label>
                    <div className="glass p-3 rounded-lg max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.values(Module).map(module => (
                            <div key={module} className="flex items-center">
                                <input
                                    id={`module-${module}`}
                                    type="checkbox"
                                    value={module}
                                    checked={employee.modules?.includes(module) || false}
                                    onChange={(e) => handleModuleChange(module, e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-500 bg-transparent text-cyan-400 focus:ring-cyan-500"
                                />
                                <label htmlFor={`module-${module}`} className="ml-2 block text-sm text-gray-200">
                                    {module}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                
                <button onClick={handleSubmit} className="w-full btn-primary mt-4">Guardar Empleado</button>
            </div>
        </Modal>
    );
};

export default EmployeeModal;