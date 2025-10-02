import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { useAppStore } from '../useAppStore';
import { ProductionOrder, InkUsage, JobType, FinishType } from '../types';
import { ICONS, TEXT_INPUT_STYLE, WASTE_FACTOR_COLOR, WASTE_FACTOR_WHITE, DEFAULT_INK_COVERAGE_G_PER_M2, LABEL_GAP_MM, JOB_TYPES, FINISH_TYPES, QUANTITY_UNITS } from '../constants';
import GestorTintas from './GestorTintas';

interface OrderEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: ProductionOrder) => void;
    initialOrderData: Partial<ProductionOrder> | null;
}

const initialNewOrderState: Partial<ProductionOrder> = {
    inks: [],
    quantityUnit: 'millares',
    surfaceUnit: 'm²',
    status: 'Pendiente',
    quantityProduced: 0,
    isColorJob: true,
    labelsAcross: 1,
    jobType: JobType.PrintedLabel,
    finishes: [FinishType.None],
    numberOfColors: 1,
    complexityRating: 'Baja',
    targetCost: 0,
    materials: [],
    routing: [],
    tooling: [],
    events: [],
    progressPercentage: 0,
    labelGapX: LABEL_GAP_MM,
    labelGapY: LABEL_GAP_MM,
};


const OrderEditModal: React.FC<OrderEditModalProps> = ({ isOpen, onClose, onSave, initialOrderData }) => {
    const { inventoryItems, machines, employees, setNotification, showConfirm } = useAppStore();

    const [orderData, setOrderData] = useState<Partial<ProductionOrder>>(initialNewOrderState);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [manualProduct, setManualProduct] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            const baseState = { ...initialNewOrderState };

            if (initialOrderData) {
                const productSku = inventoryItems.find(i => i.productName === initialOrderData.product)?.sku;
                setSelectedProduct(productSku || 'manual');
                setManualProduct(productSku ? '' : initialOrderData.product || '');
                
                setOrderData({
                    ...baseState,
                    ...initialOrderData,
                    inks: initialOrderData.inks || [],
                    finishes: initialOrderData.finishes?.length ? initialOrderData.finishes : [FinishType.None],
                });
            } else {
                setOrderData(baseState);
                setSelectedProduct('');
                setManualProduct('');
            }
        }
    }, [initialOrderData, isOpen, inventoryItems]);
    
    const updateCalculatedFields = useCallback((data: Partial<ProductionOrder>) => {
        const {
            labelLength = 0,
            labelWidth = 0,
            labelsAcross = 1,
            isColorJob = true,
            inkCoverage = DEFAULT_INK_COVERAGE_G_PER_M2,
            labelGapX = LABEL_GAP_MM,
            labelGapY = LABEL_GAP_MM,
            metersPlanned = 0,
        } = data;

        const wasteFactor = isColorJob ? WASTE_FACTOR_COLOR : WASTE_FACTOR_WHITE;
        
        const finalMeters = (metersPlanned || 0) * wasteFactor;
        const totalWidthWithGaps = (labelWidth * labelsAcross) + (labelGapX * (labelsAcross - 1));
        const totalWidthM = totalWidthWithGaps / 1000;
        const totalSurfaceM2 = finalMeters * totalWidthM;
        const inkWeight = isColorJob ? totalSurfaceM2 * inkCoverage : 0;

        return {
            ...data,
            labelsPerMeter: (labelLength > 0) ? (1000 / (labelLength + labelGapY)) : 0,
            linearMetersRequired: finalMeters,
            surface: totalSurfaceM2,
            targetInkWeight: inkWeight
        };
    }, []);

    const handleSpecChange = useCallback((field: keyof ProductionOrder | 'quantity', value: any) => {
        setOrderData(prev => {
            let newData = { ...prev, [field]: value };

            const {
                quantity = 0,
                labelLength = 0,
                labelsAcross = 1,
                labelGapY = LABEL_GAP_MM,
            } = newData;

            const quantityUnit = (field === 'quantityUnit') ? value : (newData.quantityUnit || 'millares');
            const labelsPerMeter = (labelLength > 0 && (labelLength + labelGapY) > 0) ? (1000 / (labelLength + labelGapY)) : 0;

            if (field === 'quantity' || field === 'quantityUnit') {
                let totalLabels = Number(field === 'quantity' ? value : quantity);
                if (quantityUnit === 'millares') totalLabels *= 1000;
                newData.labelsPlanned = totalLabels;
                newData.metersPlanned = (labelsPerMeter > 0 && labelsAcross > 0) ? (totalLabels / labelsAcross) / labelsPerMeter : 0;
            
            } else if (field === 'metersPlanned') {
                const newMeters = Number(value);
                if (labelsPerMeter > 0 && labelsAcross > 0) {
                    const totalLabels = newMeters * labelsPerMeter * labelsAcross;
                    newData.labelsPlanned = totalLabels;
                    newData.quantity = totalLabels / 1000;
                    newData.quantityUnit = 'millares';
                } else {
                    newData.labelsPlanned = 0;
                    newData.quantity = 0;
                }

            } else if (['labelLength', 'labelWidth', 'labelsAcross', 'labelGapY', 'labelGapX'].includes(field as string)) {
                let totalLabels = quantity;
                if (quantityUnit === 'millares') totalLabels *= 1000;
                newData.labelsPlanned = totalLabels;

                const newLabelsPerMeter = (newData.labelLength > 0 && (newData.labelLength + (newData.labelGapY || LABEL_GAP_MM)) > 0) 
                    ? (1000 / (newData.labelLength + (newData.labelGapY || LABEL_GAP_MM))) 
                    : 0;
                
                newData.metersPlanned = (newLabelsPerMeter > 0 && (newData.labelsAcross || 1) > 0) 
                    ? (totalLabels / (newData.labelsAcross || 1)) / newLabelsPerMeter 
                    : 0;
            }

            return updateCalculatedFields(newData);
        });
    }, [updateCalculatedFields]);

    useEffect(() => {
        const { numberOfColors = 1, finishes = [], substrate = '' } = orderData;
        let score = 0;
        if (numberOfColors > 4) score++;
        if (numberOfColors > 6) score++;
        if (finishes.length > 1 && !finishes.includes(FinishType.None)) score++;
        if (finishes.includes(FinishType.HotStamping) || finishes.includes(FinishType.Embossing)) score += 2;
        if (substrate?.toLowerCase().includes('metaliz') || substrate?.toLowerCase().includes('bopp')) score++;

        let rating: ProductionOrder['complexityRating'] = 'Baja';
        if (score >= 5) rating = 'Experta';
        else if (score >= 3) rating = 'Alta';
        else if (score >= 1) rating = 'Media';
        setOrderData(prev => ({ ...prev, complexityRating: rating }));
    }, [orderData.numberOfColors, orderData.finishes, orderData.substrate]);

    const handleSave = () => {
        const productName = selectedProduct === 'manual' ? manualProduct : inventoryItems.find(i => i.sku === selectedProduct)?.productName;
        if (!orderData.id || !productName) {
            setNotification({ message: "El ID de la OP y el Producto son obligatorios.", type: 'error' });
            return;
        }
    
        const isEditing = !!initialOrderData?.id;
        showConfirm({
            title: isEditing ? 'Guardar Cambios' : 'Crear Orden',
            message: isEditing ? '¿Guardar cambios en esta orden?' : '¿Crear esta nueva orden?',
            onConfirm: () => {
                const baseOrder = isEditing ? initialOrderData : initialNewOrderState;
                const finalOrder: ProductionOrder = {
                    ...baseOrder, ...orderData, id: orderData.id!, product: productName,
                } as ProductionOrder;
        
                onSave(finalOrder);
                setNotification({ message: '¡Orden guardada!', type: 'success' });
                onClose();
            }
        });
    };

    const handleFinishChange = (finish: FinishType, checked: boolean) => {
        let currentFinishes = orderData.finishes || [];
        if (checked) {
            currentFinishes = [...currentFinishes.filter(f => f !== FinishType.None), finish];
        } else {
            currentFinishes = currentFinishes.filter(f => f !== finish);
        }
        if (currentFinishes.length === 0) currentFinishes = [FinishType.None];
        setOrderData(prev => ({ ...prev, finishes: currentFinishes }));
    };

    const isEditing = !!initialOrderData?.id;

    const getComplexityBadge = (rating?: 'Baja' | 'Media' | 'Alta' | 'Experta') => {
        switch(rating) {
            case 'Baja': return 'bg-green-700';
            case 'Media': return 'bg-yellow-700';
            case 'Alta': return 'bg-orange-700';
            case 'Experta': return 'bg-red-700';
            default: return 'bg-gray-700';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Editar Orden: ${orderData.id}` : "Crear Nueva Orden"}>
             <div className="space-y-4">
                <div className="glass p-4">
                  <h3 className="font-semibold text-lg text-accent-cyan mb-3">1. Datos Generales</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                      <input type="text" placeholder="ID de OP" value={orderData.id || ''} onChange={e => handleSpecChange('id', e.target.value)} className={TEXT_INPUT_STYLE} disabled={isEditing}/>
                      <input type="text" placeholder="Cliente" value={orderData.client || ''} onChange={e => handleSpecChange('client', e.target.value)} className={TEXT_INPUT_STYLE}/>
                  </div>
                  <div>
                      <label>Producto</label>
                      <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className={TEXT_INPUT_STYLE}><option value="">Seleccionar</option>{inventoryItems.map(item => <option key={item.sku} value={item.sku}>{item.productName}</option>)}<option value="manual">-- Manual --</option></select>
                      {selectedProduct === 'manual' && <input type="text" placeholder="Nuevo producto" value={manualProduct} onChange={e => setManualProduct(e.target.value)} className={TEXT_INPUT_STYLE + " mt-2"} />}
                  </div>
                   <div className="grid sm:grid-cols-2 gap-4">
                      <div><label>Máquina</label><select value={orderData.machineId || ''} onChange={e => handleSpecChange('machineId', e.target.value)} className={TEXT_INPUT_STYLE}><option value="">Seleccionar</option>{machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                      <div><label>Operador</label><select value={orderData.operatorId || ''} onChange={e => handleSpecChange('operatorId', e.target.value)} className={TEXT_INPUT_STYLE}><option value="">Seleccionar</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                  </div>
                </div>

                <div className="glass p-4">
                    <h3 className="font-semibold text-lg text-accent-cyan mb-3">2. Especificaciones y Consumo</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Cantidad (Objetivo)</label><input type="number" placeholder="Cantidad" value={orderData.quantity || ''} onChange={e => handleSpecChange('quantity', e.target.value)} className={TEXT_INPUT_STYLE} /></div>
                        <div><label>Unidad</label><select value={orderData.quantityUnit} onChange={e => handleSpecChange('quantityUnit', e.target.value)} className={TEXT_INPUT_STYLE}>{QUANTITY_UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
                    </div>
                     <div className="mt-2">
                        <label>Metros Lineales Planeados (Objetivo)</label>
                        <input type="number" placeholder="Metros" value={orderData.metersPlanned || ''} onChange={e => handleSpecChange('metersPlanned', e.target.value)} className={TEXT_INPUT_STYLE} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                        <div><label>Largo (mm)</label><input type="number" value={orderData.labelLength || ''} onChange={e => handleSpecChange('labelLength', Number(e.target.value))} className={TEXT_INPUT_STYLE}/></div>
                        <div><label>Ancho (mm)</label><input type="number" value={orderData.labelWidth || ''} onChange={e => handleSpecChange('labelWidth', Number(e.target.value))} className={TEXT_INPUT_STYLE}/></div>
                        <div><label>Gap Vert. (mm)</label><input type="number" value={orderData.labelGapY || ''} onChange={e => handleSpecChange('labelGapY', Number(e.target.value))} className={TEXT_INPUT_STYLE}/></div>
                        <div><label>Gap Horiz. (mm)</label><input type="number" value={orderData.labelGapX || ''} onChange={e => handleSpecChange('labelGapX', Number(e.target.value))} className={TEXT_INPUT_STYLE}/></div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div><label>Etiquetas por Banda</label><input type="number" value={orderData.labelsAcross || ''} onChange={e => handleSpecChange('labelsAcross', Number(e.target.value))} className={TEXT_INPUT_STYLE}/></div>
                        <div>
                            <label className="block text-sm">&nbsp;</label>
                            <div className="flex items-center mt-2">
                                <input type="checkbox" id="isColorJob" checked={orderData.isColorJob} onChange={e => setOrderData(prev => updateCalculatedFields({...prev, isColorJob: e.target.checked}))} className="h-4 w-4" />
                                <label htmlFor="isColorJob" className="ml-2">Es trabajo a color</label>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 glass p-3 text-center grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <p>Metros Lineales Req.: <span className="block font-bold text-lg text-yellow-300">{orderData.linearMetersRequired?.toFixed(2) || '0.00'} m</span></p>
                        <p>Superficie Req.: <span className="block font-bold text-lg text-yellow-300">{orderData.surface?.toFixed(2) || '0.00'} m²</span></p>
                        <p>Peso de Tinta Est.: <span className="block font-bold text-lg text-yellow-300">{orderData.targetInkWeight?.toFixed(2) || '0.00'} gr</span></p>
                    </div>
                </div>

                <div className="glass p-4">
                    <h3 className="font-semibold text-lg text-accent-cyan mb-3">3. Detalles del Trabajo y Complejidad</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div><label>Tipo de Trabajo</label><select value={orderData.jobType} onChange={e => handleSpecChange('jobType', e.target.value)} className={TEXT_INPUT_STYLE}>{JOB_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                        <div><label>Número de Colores</label><input type="number" min="0" value={orderData.numberOfColors || ''} onChange={e => handleSpecChange('numberOfColors', Number(e.target.value))} className={TEXT_INPUT_STYLE}/></div>
                    </div>
                    <div><label>Sustrato</label><input type="text" placeholder="Ej: Polipropileno Blanco" value={orderData.substrate || ''} onChange={e => handleSpecChange('substrate', e.target.value)} className={TEXT_INPUT_STYLE}/></div>
                    <div><label className="block mb-2">Acabados</label><div className="flex flex-wrap gap-2">{FINISH_TYPES.map(f => (<div key={f}><input type="checkbox" id={f} checked={orderData.finishes?.includes(f) || false} onChange={e => handleFinishChange(f, e.target.checked)}/><label htmlFor={f} className="ml-2">{f}</label></div>))}</div></div>
                    <div className="mt-4 text-center">Nivel de Complejidad: <span className={`px-3 py-1 text-sm font-bold rounded-full text-white ${getComplexityBadge(orderData.complexityRating)}`}>{orderData.complexityRating}</span></div>
                </div>

                <div className="glass p-4">
                    <h3 className="font-semibold text-lg text-accent-cyan mb-3">4. Gestión de Tintas</h3>
                    <GestorTintas currentInks={orderData.inks || []} onInksChange={inks => setOrderData({...orderData, inks})} targetInkWeight={orderData.targetInkWeight || 0} inkLimit={orderData.numberOfColors || 0} />
                </div>
                
                <div className="glass p-4">
                  <h3 className="font-semibold text-lg text-accent-cyan mb-3">5. Costos y Materiales Adicionales</h3>
                   <div>
                       <label className="text-sm font-medium">Costo Objetivo ($)</label>
                       <input type="number" placeholder="0.00" value={orderData.targetCost || ''} onChange={e => handleSpecChange('targetCost', parseFloat(e.target.value) || 0)} className={TEXT_INPUT_STYLE} />
                   </div>
                </div>
                
                <div className="pt-4 border-t border-white/20 mt-4 flex justify-end">
                  <button onClick={handleSave} className="btn-primary">{isEditing ? "Guardar Cambios" : "Crear Orden"}</button>
                </div>
            </div>
        </Modal>
    );
};

export default OrderEditModal;