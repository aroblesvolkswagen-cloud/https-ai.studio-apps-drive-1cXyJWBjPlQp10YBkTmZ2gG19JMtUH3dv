import React, { useState, useEffect } from 'react';
import { Material, MaterialType, Uom, PricingMode } from '../types';
import { TEXT_INPUT_STYLE } from '../constants';
import Modal from './Modal';
import { useAppStore } from '../useAppStore';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Material) => void;
  materialData: Partial<Material> | null;
}

const MATERIAL_TYPES: MaterialType[] = ['ink', 'paper', 'adhesive', 'liner', 'varnish', 'labelStock', 'solvent', 'mro', 'tool', 'service', 'misc'];
const UOM_OPTIONS: Uom[] = ['g', 'kg', 'm', 'unit', 'labels'];
const PRICING_MODES: PricingMode[] = ['per_g', 'per_kg', 'per_m', 'per_unit', 'per_roll'];

const MaterialModal: React.FC<MaterialModalProps> = ({ isOpen, onClose, onSave, materialData }) => {
  const [material, setMaterial] = useState<Partial<Material>>({});
  const { setNotification } = useAppStore();

  useEffect(() => {
    setMaterial(materialData || { type: 'paper', uomBase: 'm', pricing: { mode: 'per_m', price: 0 } });
  }, [materialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMaterial(prev => ({ ...prev, [name]: value }));
  };

  const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = ['price', 'lengthMetersPerRoll', 'labelsPerRoll', 'weightKgPerRoll'].includes(name);
    setMaterial(prev => ({
        ...prev,
        pricing: {
            ...prev.pricing,
            [name]: isNumber ? parseFloat(value) || 0 : value,
        } as Material['pricing'],
    }));
  };

  const handleSubmit = () => {
    if (!material.id || !material.name || !material.pricing?.price) {
      setNotification({ message: 'ID, Nombre y Precio son obligatorios.', type: 'error' });
      return;
    }
    if (material.pricing.mode === 'per_roll' && !material.pricing.lengthMetersPerRoll && !material.pricing.labelsPerRoll) {
       setNotification({ message: 'Para precio por rollo, debe especificar Metros por Rollo o Etiquetas por Rollo.', type: 'error' });
       return;
    }
    onSave(material as Material);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={materialData?.id ? 'Editar Material' : 'Añadir Nuevo Material'}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">ID Material</label>
            <input type="text" name="id" value={material.id ?? ''} onChange={handleChange} className={TEXT_INPUT_STYLE} disabled={!!materialData?.id} />
          </div>
          <div>
            <label className="block text-sm">Nombre</label>
            <input type="text" name="name" value={material.name ?? ''} onChange={handleChange} className={TEXT_INPUT_STYLE} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm">Tipo de Material</label>
                <select name="type" value={material.type} onChange={handleChange} className={TEXT_INPUT_STYLE}>
                    {MATERIAL_TYPES.map(t => <option key={t} value={t} className="bg-gray-800">{t}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm">Unidad Base</label>
                <select name="uomBase" value={material.uomBase} onChange={handleChange} className={TEXT_INPUT_STYLE}>
                    {UOM_OPTIONS.map(u => <option key={u} value={u} className="bg-gray-800">{u}</option>)}
                </select>
            </div>
        </div>
        
        <div className="pt-4 border-t border-white/20">
            <h4 className="font-semibold text-accent-cyan mb-2">Costeo</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Modo de Precio</label>
                    <select name="mode" value={material.pricing?.mode} onChange={handlePricingChange} className={TEXT_INPUT_STYLE}>
                        {PRICING_MODES.map(m => <option key={m} value={m} className="bg-gray-800">{m}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm">Precio</label>
                    <input type="number" name="price" value={material.pricing?.price ?? ''} onChange={handlePricingChange} className={TEXT_INPUT_STYLE} />
                </div>
            </div>
             {material.pricing?.mode === 'per_roll' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm">Metros por Rollo</label>
                        <input type="number" name="lengthMetersPerRoll" value={material.pricing.lengthMetersPerRoll ?? ''} onChange={handlePricingChange} className={TEXT_INPUT_STYLE} />
                    </div>
                    <div>
                        <label className="block text-sm">Etiquetas por Rollo</label>
                        <input type="number" name="labelsPerRoll" value={material.pricing.labelsPerRoll ?? ''} onChange={handlePricingChange} className={TEXT_INPUT_STYLE} />
                    </div>
                </div>
            )}
        </div>

        <button onClick={handleSubmit} className="w-full btn-primary mt-4">Guardar Material</button>
      </div>
    </Modal>
  );
};

export default MaterialModal;
