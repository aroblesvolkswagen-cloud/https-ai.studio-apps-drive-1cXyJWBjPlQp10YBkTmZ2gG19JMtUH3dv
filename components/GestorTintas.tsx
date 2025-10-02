import React, { useState, useEffect } from 'react';
import { Ink, InkUsage, InkUsageComponent } from '../types';
import { ICONS, TEXT_INPUT_STYLE, INK_CATALOG } from '../constants';
import Modal from './Modal';
import PantoneColorPicker from './PantoneColorPicker';
import { getPantoneFormula } from '../services/geminiService';
import { useAppStore } from '../useAppStore';

interface GestorTintasProps {
    currentInks: InkUsage[];
    onInksChange: (newInks: InkUsage[]) => void;
    targetInkWeight: number;
    inkLimit: number;
}

const GestorTintas: React.FC<GestorTintasProps> = ({ currentInks, onInksChange, targetInkWeight, inkLimit }) => {
    const { setNotification, showConfirm } = useAppStore();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isCustomPantoneOpen, setIsCustomPantoneOpen] = useState(false);
    const [customPantone, setCustomPantone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const isLimitReached = inkLimit > 0 && currentInks.length >= inkLimit;
    
    useEffect(() => {
        if (targetInkWeight > 0 && currentInks.length > 0) {
            const consumptionPerInk = targetInkWeight / currentInks.length;
            
            const updatedInks = currentInks.map(ink => {
                const updatedInk = { ...ink, consumption: consumptionPerInk };

                if (updatedInk.components && updatedInk.components.length > 0) {
                    updatedInk.components = updatedInk.components.map(comp => {
                        const baseInk = INK_CATALOG.find(i => i.name === comp.name);
                        const weight = (comp.percentage / 100) * consumptionPerInk;
                        const cost = weight * (baseInk?.pricePerGram || 0.05);
                        return { ...comp, weight, cost };
                    });
                    const totalCost = updatedInk.components.reduce((sum, c) => sum + c.cost, 0);
                    updatedInk.pricePerGram = consumptionPerInk > 0 ? totalCost / consumptionPerInk : 0;
                }
                
                return updatedInk;
            });

            if (JSON.stringify(updatedInks) !== JSON.stringify(currentInks)) {
                onInksChange(updatedInks);
            }
        }
    }, [targetInkWeight, currentInks.length]);


    const addInkFromCatalog = (ink: Ink) => {
        if (currentInks.some(i => i.inkId === ink.id)) {
            setNotification({ message: "Esta tinta ya ha sido agregada.", type: 'error' });
            return;
        }

        showConfirm({
            title: 'Añadir Tinta del Catálogo',
            message: `¿Deseas añadir la tinta "${ink.name}" a la orden?`,
            onConfirm: () => {
                const newInkUsage: InkUsage = {
                    inkId: ink.id,
                    name: ink.name,
                    hex: ink.hex,
                    type: 'new',
                    consumption: 0, // Will be updated by useEffect
                    leftover: 0,
                    pricePerGram: ink.pricePerGram,
                    clicheId: '',
                    components: [],
                };
                onInksChange([...currentInks, newInkUsage]);
                setNotification({ message: `Tinta "${ink.name}" añadida.`, type: 'success' });
            }
        });
    };

    const handleAddCustomPantone = async () => {
        if (!customPantone.trim()) {
            setError('Por favor, ingresa un código Pantone.');
            return;
        }
        if (currentInks.some(i => i.inkId.toLowerCase() === customPantone.trim().toLowerCase())) {
            setNotification({ message: "Esta tinta ya ha sido agregada.", type: 'error' });
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const formula = await getPantoneFormula(customPantone);
            if (!formula || formula.components.length === 0) {
                throw new Error(`No se encontró la fórmula para ${customPantone}.`);
            }
            
            const newInkUsage: InkUsage = {
                inkId: formula.pantoneName,
                name: formula.pantoneName,
                hex: formula.hex,
                type: 'new',
                consumption: 0, // Will be updated by useEffect
                leftover: 0,
                pricePerGram: 0, // Will be updated by useEffect
                clicheId: '',
                components: formula.components.map(c => ({...c, weight: 0, cost: 0})),
            };

            onInksChange([...currentInks, newInkUsage]);
            setIsCustomPantoneOpen(false);
            setCustomPantone('');
        } catch (err: any) {
            setError(err.message || 'Error al buscar la fórmula Pantone.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdateInkDetail = (inkId: string, field: keyof InkUsage, value: string | number) => {
        const updatedInks = currentInks.map(ink => 
            ink.inkId === inkId ? { ...ink, [field]: value } : ink
        );
        onInksChange(updatedInks);
    };

    const removeInk = (inkId: string) => {
        showConfirm({
            title: 'Quitar Tinta',
            message: '¿Estás seguro de que quieres quitar esta tinta de la orden?',
            onConfirm: () => {
                onInksChange(currentInks.filter(ink => ink.inkId !== inkId));
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
                <button 
                    onClick={() => setIsPickerOpen(true)} 
                    className="flex-1 btn-secondary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLimitReached}
                >
                    {ICONS.OrderManagement && React.cloneElement(ICONS.OrderManagement, {className: "h-5 w-5 mr-2"})}
                    Añadir del Catálogo
                </button>
                 <button 
                    onClick={() => setIsCustomPantoneOpen(true)} 
                    className="flex-1 btn-secondary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLimitReached}
                >
                    {ICONS.Question && React.cloneElement(ICONS.Question, {className: "h-5 w-5 mr-2"})}
                    Añadir por Código Pantone
                </button>
            </div>
            
            {isLimitReached && (
                <div className="text-sm text-center text-yellow-300 bg-yellow-500/20 p-2 rounded-lg">
                    {ICONS.Alert && React.cloneElement(ICONS.Alert, {className: "inline-block h-4 w-4 mr-2"})}
                    Límite de {inkLimit} tinta{inkLimit > 1 ? 's' : ''} alcanzado para esta orden.
                </div>
            )}


            <h3 className="mt-6 mb-2 venki-subtitle">Tintas en la Orden</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {currentInks.length === 0 && <p className="text-text-muted text-center py-4">No hay tintas en la orden.</p>}
                {currentInks.map(ink => (
                    <div key={ink.inkId} className="glass p-3">
                         <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div style={{ backgroundColor: ink.hex }} className="w-10 h-10 rounded-full border-2 border-white/30 flex-shrink-0"/>
                                <div>
                                    <p className="font-bold text-text-strong">{ink.name}</p>
                                    <p className="text-xs text-text-muted">Costo Tinta: ${(ink.consumption * ink.pricePerGram).toFixed(2)}</p>
                                </div>
                            </div>
                            <button onClick={() => removeInk(ink.inkId)} className="btn-danger p-2" aria-label={`Quitar tinta ${ink.name}`}>
                                {ICONS.Trash}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <div>
                                <label className="text-xs text-text-muted">Consumo (gr)</label>
                                <input 
                                    type="number"
                                    value={ink.consumption.toFixed(2)}
                                    onChange={(e) => handleUpdateInkDetail(ink.inkId, 'consumption', parseFloat(e.target.value) || 0)}
                                    className={TEXT_INPUT_STYLE + " py-1"}
                                    readOnly // Consumption is now automatic
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted">Cliché ID</label>
                                 <input 
                                    type="text"
                                    value={ink.clicheId || ''}
                                    onChange={(e) => handleUpdateInkDetail(ink.inkId, 'clicheId', e.target.value)}
                                    className={TEXT_INPUT_STYLE + " py-1"}
                                />
                            </div>
                        </div>
                        {ink.components && ink.components.length > 0 && (
                             <div className="p-3 bg-black/20 rounded-lg mt-3">
                                <h5 className="font-bold text-sm text-amber-300 mb-2">Desglose de Fórmula:</h5>
                                <ul className="text-xs space-y-1">
                                    {ink.components.map((comp, idx) => (
                                        <li key={idx} className="flex justify-between items-center">
                                            <span className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: comp.hex}}></div>
                                                {comp.name}
                                            </span>
                                            <span className="font-mono">
                                                <span className="font-bold text-amber-400">{comp.percentage.toFixed(1)}%</span>
                                                <span className="text-gray-400"> ({comp.weight.toFixed(2)} gr)</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} title="Catálogo de Tintas Pantone" size="4xl">
                <PantoneColorPicker 
                    inks={INK_CATALOG}
                    onSelectInk={addInkFromCatalog}
                    onClose={() => setIsPickerOpen(false)}
                />
            </Modal>

            <Modal isOpen={isCustomPantoneOpen} onClose={() => setIsCustomPantoneOpen(false)} title="Añadir por Código Pantone">
                 <div className="space-y-4">
                    <p className="text-sm text-text-muted">Introduce un código Pantone (ej: 'PAN-186C' o '485 C'). El sistema buscará la fórmula y la añadirá a la orden.</p>
                    <input 
                        type="text"
                        placeholder="Código Pantone"
                        value={customPantone}
                        onChange={(e) => setCustomPantone(e.target.value)}
                        className={TEXT_INPUT_STYLE}
                    />
                    {error && <p className="text-red-300 text-sm bg-red-500/30 p-2 rounded-md">{error}</p>}
                    <button onClick={handleAddCustomPantone} disabled={isLoading} className="w-full btn-primary flex items-center justify-center">
                        {isLoading ? ICONS.Spinner : 'Buscar y Añadir Tinta'}
                    </button>
                 </div>
            </Modal>
        </div>
    );
};
export default GestorTintas;