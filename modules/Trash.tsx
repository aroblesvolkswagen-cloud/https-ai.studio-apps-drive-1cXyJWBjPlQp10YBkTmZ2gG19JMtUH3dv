import React, { useState, useMemo } from 'react';
import { useAppStore } from '../useAppStore';
import { ProductionOrder, Machine, Employee, Material } from '../types';

type ItemType = 'order' | 'machine' | 'employee' | 'material';

const Trash: React.FC = () => {
    const { 
        productionOrders, 
        machines, 
        employees, 
        materials,
        restoreItem,
        purgeItem,
        showConfirm,
        setNotification
    } = useAppStore();

    const [activeTab, setActiveTab] = useState<ItemType>('order');

    const deletedItems = useMemo(() => ({
        order: productionOrders.filter(item => item.deletedAt),
        machine: machines.filter(item => item.deletedAt),
        employee: employees.filter(item => item.deletedAt),
        material: materials.filter(item => item.deletedAt),
    }), [productionOrders, machines, employees, materials]);

    const handleRestore = (id: string, type: ItemType) => {
        showConfirm({
            title: `Restaurar ${type}`,
            message: `¿Estás seguro de que deseas restaurar este elemento? Volverá a estar visible en la aplicación.`,
            onConfirm: () => {
                restoreItem(id, type);
                setNotification({ message: 'Elemento restaurado con éxito.', type: 'success' });
            }
        });
    };

    const handlePurge = (id: string, type: ItemType) => {
        showConfirm({
            title: `Eliminar Permanentemente`,
            message: `Esta acción es irreversible y eliminará el elemento de forma definitiva. ¿Estás seguro?`,
            onConfirm: () => {
                purgeItem(id, type);
                setNotification({ message: 'Elemento eliminado permanentemente.', type: 'success' });
            }
        });
    };

    const getDaysUntilPurge = (deletedAt: string | null): number => {
        if (!deletedAt) return 120;
        const deletedDate = new Date(deletedAt);
        const purgeDate = new Date(deletedDate.setDate(deletedDate.getDate() + 120));
        const diffTime = purgeDate.getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const renderTable = () => {
        const items = deletedItems[activeTab];

        if (items.length === 0) {
            return <p className="text-center text-text-muted py-8">La papelera para esta categoría está vacía.</p>;
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase">
                        <tr>
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Nombre / Descripción</th>
                            <th className="px-4 py-2">Fecha de Eliminación</th>
                            <th className="px-4 py-2">Días para Purga</th>
                            <th className="px-4 py-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any) => {
                            const daysLeft = getDaysUntilPurge(item.deletedAt);
                            const canPurge = daysLeft <= 0;
                            return (
                                <tr key={item.id} className={`border-b border-white/10 ${canPurge ? 'bg-red-900/30' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-text-strong">{item.id}</td>
                                    <td className="px-4 py-3 text-text-default">{item.name || item.productName || item.product}</td>
                                    <td className="px-4 py-3 text-text-muted">{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : ''}</td>
                                    <td className={`px-4 py-3 font-semibold ${canPurge ? 'text-red-300' : 'text-yellow-300'}`}>
                                        {canPurge ? 'Listo para purgar' : `${daysLeft} días`}
                                    </td>
                                    <td className="px-4 py-3 text-center space-x-2">
                                        <button onClick={() => handleRestore(item.id, activeTab)} className="btn-secondary text-xs">Restaurar</button>
                                        <button 
                                            onClick={() => handlePurge(item.id, activeTab)} 
                                            className={`${canPurge ? 'btn-danger' : 'btn-secondary disabled:opacity-50'} text-xs`}
                                            disabled={!canPurge}
                                            title={canPurge ? 'Eliminar permanentemente' : 'Solo se puede purgar después de 120 días'}
                                        >
                                            Purgar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 trash-module">
             <div className="p-4 border-l-4 border-yellow-400 bg-yellow-500/10 text-yellow-200 rounded-r-lg">
                <p className="font-bold">Gestión de la Papelera</p>
                <p className="text-sm mt-1">
                    Aquí se listan todos los elementos eliminados. Permanecerán aquí durante <strong>120 días</strong>.
                    Durante este período puedes restaurarlos. Después de 120 días, deberás confirmar su eliminación permanente para liberar espacio.
                </p>
            </div>
            <div className="glass glass-noise glass-danger p-6">
                <div className="tabs mb-4">
                    <button onClick={() => setActiveTab('order')} className={`tab ${activeTab === 'order' ? 'active' : ''}`}>Órdenes ({deletedItems.order.length})</button>
                    <button onClick={() => setActiveTab('machine')} className={`tab ${activeTab === 'machine' ? 'active' : ''}`}>Máquinas ({deletedItems.machine.length})</button>
                    <button onClick={() => setActiveTab('employee')} className={`tab ${activeTab === 'employee' ? 'active' : ''}`}>Empleados ({deletedItems.employee.length})</button>
                    <button onClick={() => setActiveTab('material')} className={`tab ${activeTab === 'material' ? 'active' : ''}`}>Materiales ({deletedItems.material.length})</button>
                </div>
                {renderTable()}
            </div>
        </div>
    );
};

export default Trash;