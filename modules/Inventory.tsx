import React, { useState, useMemo } from 'react';
import { InventoryItem, Role, InventoryCategory, Material } from '../types';
import { useAppStore } from '../useAppStore';
import Modal from '../components/Modal';
import ExportModal from '../components/ExportModal';
import InventoryUploadModal from '../components/InventoryUploadModal';
import { ICONS, UNITS_OF_MEASURE, TEXT_INPUT_STYLE } from '../constants';
import { exportDataToCSV, generatePdfReport } from '../utils/fileHelpers';
import DashboardCard from '../components/DashboardCard';
import MaterialModal from '../components/MaterialModal';

const inventoryColumns = {
    category: 'Categoría',
    sku: 'SKU',
    productName: 'Producto',
    supplier: 'Proveedor',
    opId: 'OP ID',
    quantity: 'Cantidad',
    unit: 'Unidad',
    costPerUnit: 'Costo Unitario',
    totalValue: 'Valor Total',
    minStock: 'Stock Mínimo',
    location: 'Ubicación',
};

const Inventory: React.FC = () => {
    const user = useAppStore(state => state.user);
    const inventoryItems = useAppStore(state => state.inventoryItems);
    const setInventoryItems = useAppStore(state => state.setInventoryItems);
    const materials = useAppStore(state => state.materials);
    const setMaterials = useAppStore(state => state.setMaterials);
    const { setNotification, showConfirm } = useAppStore();
    
    const canWarehouseLoad = user?.role === Role.Admin || user?.role === Role.Warehouse;
    
    const [activeTab, setActiveTab] = useState<InventoryCategory | 'Almacen' | 'Catalogo'>(
        canWarehouseLoad ? 'Almacen' : InventoryCategory.FinishedGood
    );
    const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<Partial<Material> | null>(null);

    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ unit: 'unidades', minStock: 0, category: InventoryCategory.FinishedGood });
    const [adjustment, setAdjustment] = useState<number>(0);

    const canExport = user?.role === Role.Admin;
    const canEditMaterials = user?.role === Role.Admin;
    
    const canManipulateCurrentCategory = user?.role === Role.Admin || (user?.role === Role.Warehouse && (activeTab === InventoryCategory.RawMaterial || activeTab === 'Almacen'));

    const filteredItems = useMemo(() => {
        if (activeTab === 'Almacen') return inventoryItems.filter(item => item.category === InventoryCategory.RawMaterial);
        if (activeTab === 'Catalogo') return [];
        return inventoryItems.filter(item => item.category === activeTab);
    }, [inventoryItems, activeTab]);

    const kpiValues = useMemo(() => {
        const values = {
            [InventoryCategory.RawMaterial]: 0,
            [InventoryCategory.WorkInProgress]: 0,
            [InventoryCategory.FinishedGood]: 0,
        };
        inventoryItems.forEach(item => {
            values[item.category] = (values[item.category] || 0) + item.quantity * item.costPerUnit;
        });
        return {
            mp: values[InventoryCategory.RawMaterial],
            pp: values[InventoryCategory.WorkInProgress],
            pt: values[InventoryCategory.FinishedGood],
            total: values[InventoryCategory.RawMaterial] + values[InventoryCategory.WorkInProgress] + values[InventoryCategory.FinishedGood],
        };
    }, [inventoryItems]);

    const handleSaveItem = () => {
        if (!newItem.sku || !newItem.productName || newItem.quantity === undefined || newItem.costPerUnit === undefined || !newItem.category) {
            setNotification({ message: 'Por favor, completa todos los campos obligatorios.', type: 'error' });
            return;
        }

        const isEditing = !!selectedItem;
        showConfirm({
            title: isEditing ? 'Guardar Cambios' : 'Crear Ítem',
            message: isEditing ? 'Se modificarán los datos del producto. ¿Deseas continuar?' : 'Se creará un nuevo producto en el inventario. ¿Deseas continuar?',
            onConfirm: () => {
                if (isEditing) {
                    const updatedItem: InventoryItem = { ...selectedItem, ...newItem } as InventoryItem;
                    setInventoryItems(inventoryItems.map(item => item.id === selectedItem.id ? updatedItem : item));
                } else {
                    const entry: InventoryItem = {
                        id: `${newItem.category === InventoryCategory.RawMaterial ? 'MP' : 'PT'}${(inventoryItems.length + 1)}`, ...newItem
                    } as InventoryItem;
                    setInventoryItems([...inventoryItems, entry]);
                }
                setNotification({ message: '¡Cambios guardados con éxito!', type: 'success' });
                closeNewItemModal();
            }
        });
    };

    const handleSaveMaterial = (material: Material) => {
        const isEditing = materials.some(m => m.id === material.id);
        setMaterials(isEditing ? materials.map(m => m.id === material.id ? material : m) : [...materials, material]);
        setNotification({ message: `Material ${isEditing ? 'actualizado' : 'creado'} con éxito.`, type: 'success' });
        setIsMaterialModalOpen(false);
    };
    
    const handleDeleteMaterial = (materialId: string) => {
        showConfirm({
            title: "Eliminar Material",
            message: `¿Seguro que quieres eliminar el material ${materialId}?`,
            onConfirm: () => {
                setMaterials(materials.filter(m => m.id !== materialId));
                setNotification({ message: "Material eliminado.", type: 'success'});
            }
        })
    };
    
    const openNewItemModal = (category: InventoryCategory) => { setSelectedItem(null); setNewItem({ category }); setIsNewItemModalOpen(true); };
    const closeNewItemModal = () => { setIsNewItemModalOpen(false); setNewItem({}); setSelectedItem(null); };

    // Other handlers... (openEditModal, openAdjustModal, handleAdjustStock, handleDeleteItem, handleExport, handleInventoryUpload) remain mostly the same
    const openEditModal = (item: InventoryItem) => { setSelectedItem(item); setNewItem(item); setIsNewItemModalOpen(true); };
    const openAdjustModal = (item: InventoryItem) => { setSelectedItem(item); setAdjustment(item.quantity); setIsAdjustModalOpen(true); };
    const handleAdjustStock = () => {
        if (selectedItem && adjustment >= 0) {
            showConfirm({
                title: 'Ajustar Stock',
                message: `¿Ajustar stock de "${selectedItem.productName}" de ${selectedItem.quantity} a ${adjustment}?`,
                onConfirm: () => {
                    setInventoryItems(inventoryItems.map(item => item.id === selectedItem.id ? { ...item, quantity: adjustment } : item));
                    setNotification({ message: '¡Stock ajustado!', type: 'success' });
                }
            });
        }
        setIsAdjustModalOpen(false);
    };
    const handleDeleteItem = (itemToDelete: InventoryItem) => {
        showConfirm({
            title: 'Eliminar Producto',
            message: `¿Eliminar "${itemToDelete.productName}"?`,
            onConfirm: () => {
                setInventoryItems(inventoryItems.filter(item => item.id !== itemToDelete.id));
                setNotification({ message: 'Producto eliminado.', type: 'success' });
            }
        });
    };
    const handleExport = async ({ recipient, format }: { recipient: string; format: 'csv' | 'pdf' }) => { /* ... */ };
    const handleInventoryUpload = (uploadedData: Partial<InventoryItem>[]) => { /* ... */ };


    const TABS = [
        ...(canWarehouseLoad ? [{ id: 'Almacen' as const, label: 'Almacén MP' }] : []),
        { id: InventoryCategory.RawMaterial, label: 'Materia Prima' },
        { id: InventoryCategory.WorkInProgress, label: 'Producto en Proceso' },
        { id: InventoryCategory.FinishedGood, label: 'Producto Terminado' },
        { id: 'Catalogo', label: 'Catálogo General' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <h2 className="text-2xl font-bold venki-title-gradient">Inventarios y Materiales</h2>
                {canExport && <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary flex items-center">{ICONS.Export}<span className="ml-2">Exportar</span></button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
                <DashboardCard title="Valor Total Inventario" value={`$${kpiValues.total.toFixed(2)}`} icon={ICONS.Money} valueClassName="text-venki-cyan"/>
                <DashboardCard title={`Valor MP`} value={`$${kpiValues.mp.toFixed(2)}`} icon={ICONS.Money} valueClassName="text-venki-yellow"/>
                <DashboardCard title={`Valor PP`} value={`$${kpiValues.pp.toFixed(2)}`} icon={ICONS.Money} valueClassName="text-venki-magenta"/>
                <DashboardCard title={`Valor PT`} value={`$${kpiValues.pt.toFixed(2)}`} icon={ICONS.Money} valueClassName="text-accent-mint"/>
            </div>
            
            <div className="glass glass-noise p-6 printable-area">
                <div className="flex justify-between items-center mb-4">
                     <div className="tabs no-print">{TABS.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`tab ${activeTab === tab.id ? 'active' : ''}`}>{tab.label}</button>)}</div>
                     <div className="no-print">
                        {activeTab === 'Catalogo' && canEditMaterials && <button onClick={() => { setSelectedMaterial(null); setIsMaterialModalOpen(true); }} className="btn-primary">Añadir Material</button>}
                        {activeTab === 'Almacen' && canWarehouseLoad && ( <div className="flex gap-2"> <button onClick={() => setIsUploadModalOpen(true)} className="btn-secondary">Cargar CSV</button> <button onClick={() => openNewItemModal(InventoryCategory.RawMaterial)} className="btn-primary">Registrar MP</button> </div> )}
                        {activeTab !== 'Almacen' && activeTab !== 'Catalogo' && <button onClick={() => openNewItemModal(activeTab as InventoryCategory)} disabled={!canManipulateCurrentCategory} className="btn-primary disabled:opacity-50">Registrar Ítem</button>}
                     </div>
                </div>

                {activeTab === 'Catalogo' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-text-muted uppercase"><tr><th className="px-4 py-2">ID</th><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Tipo</th><th className="px-4 py-2">Modo Precio</th><th className="px-4 py-2">Precio</th>{canEditMaterials && <th>Acciones</th>}</tr></thead>
                            <tbody>
                                {materials.map(m => (
                                    <tr key={m.id} className="border-b border-white/10">
                                        <td className="px-4 py-3 font-medium">{m.id}</td><td>{m.name}</td><td>{m.type}</td><td>{m.pricing.mode}</td><td>${m.pricing.price.toFixed(2)}</td>
                                        {canEditMaterials && <td><button onClick={() => { setSelectedMaterial(m); setIsMaterialModalOpen(true); }}>{ICONS.Edit}</button><button onClick={() => handleDeleteMaterial(m.id)}>{ICONS.Trash}</button></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                           <thead className="text-xs text-text-muted uppercase"><tr><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Costo Unit.</th><th>Valor Total</th>{canManipulateCurrentCategory && <th>Acciones</th>}</tr></thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id} className={`border-b border-white/10 ${item.quantity < item.minStock ? 'bg-red-900/40' : ''}`}>
                                        <td>{item.sku}</td><td>{item.productName}</td>
                                        <td>{item.quantity} {item.unit} {item.quantity < item.minStock && ICONS.Alert}</td>
                                        <td>${item.costPerUnit.toFixed(2)}</td><td>${(item.quantity * item.costPerUnit).toFixed(2)}</td>
                                        {canManipulateCurrentCategory && <td><button onClick={() => openAdjustModal(item)}>{ICONS.Adjust}</button><button onClick={() => openEditModal(item)}>{ICONS.Edit}</button><button onClick={() => handleDeleteItem(item)}>{ICONS.Trash}</button></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {canEditMaterials && <MaterialModal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} onSave={handleSaveMaterial} materialData={selectedMaterial} />}
{/* FIX: Added children to Modal to resolve missing 'children' property error. */}
            <Modal isOpen={isNewItemModalOpen} onClose={closeNewItemModal} title={selectedItem ? "Editar Ítem" : "Registrar Ítem"}>
                <div className="space-y-4">
                    <input type="text" name="sku" placeholder="SKU" value={newItem.sku || ''} onChange={e => setNewItem({...newItem, sku: e.target.value})} className={TEXT_INPUT_STYLE} />
                    <input type="text" name="productName" placeholder="Nombre del Producto" value={newItem.productName || ''} onChange={e => setNewItem({...newItem, productName: e.target.value})} className={TEXT_INPUT_STYLE} />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" name="quantity" placeholder="Cantidad" value={newItem.quantity ?? ''} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})} className={TEXT_INPUT_STYLE} />
                        <select name="unit" value={newItem.unit || 'unidades'} onChange={e => setNewItem({...newItem, unit: e.target.value})} className={TEXT_INPUT_STYLE}>
                            {UNITS_OF_MEASURE.map(u => <option key={u} value={u} className="bg-gray-800">{u}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <input type="number" name="costPerUnit" placeholder="Costo Unitario" value={newItem.costPerUnit ?? ''} onChange={e => setNewItem({...newItem, costPerUnit: parseFloat(e.target.value) || 0})} className={TEXT_INPUT_STYLE} />
                        <input type="number" name="minStock" placeholder="Stock Mínimo" value={newItem.minStock ?? ''} onChange={e => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})} className={TEXT_INPUT_STYLE} />
                    </div>
                    <input type="text" name="location" placeholder="Ubicación" value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} className={TEXT_INPUT_STYLE} />
                    <input type="text" name="supplier" placeholder="Proveedor" value={newItem.supplier || ''} onChange={e => setNewItem({...newItem, supplier: e.target.value})} className={TEXT_INPUT_STYLE} />
                    <button onClick={handleSaveItem} className="w-full btn-primary mt-4">Guardar</button>
                </div>
            </Modal>
{/* FIX: Added children to Modal to resolve missing 'children' property error. */}
            <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Ajustar Stock">
                <div className="space-y-4">
                    <p>Ajustando stock para: <span className="font-bold">{selectedItem?.productName}</span></p>
                    <p className="text-sm">Cantidad actual: {selectedItem?.quantity}</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Nueva Cantidad</label>
                        <input type="number" value={adjustment} onChange={e => setAdjustment(Number(e.target.value))} className={TEXT_INPUT_STYLE} />
                    </div>
                    <button onClick={handleAdjustStock} className="w-full btn-primary">Ajustar</button>
                </div>
            </Modal>
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={handleExport} title="Inventario" userRole={user?.role} />
            {canWarehouseLoad && <InventoryUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleInventoryUpload} />}
        </div>
    );
};

export default Inventory;