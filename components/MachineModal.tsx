import React, { useState, useEffect } from 'react';
import { Machine } from '../types';
import { TEXT_INPUT_STYLE, MACHINE_TYPES, MACHINE_STATUSES } from '../constants';
import Modal from './Modal';
import { useAppStore } from '../useAppStore';

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (machine: Machine) => void;
  machineData: Partial<Machine> | null;
}

const MachineModal: React.FC<MachineModalProps> = ({ isOpen, onClose, onSave, machineData }) => {
  const [machine, setMachine] = useState<Partial<Machine>>({});
  const { setNotification } = useAppStore();

  useEffect(() => {
    setMachine(machineData || { type: 'Flexo', status: 'Operativa' });
  }, [machineData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMachine((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMachine((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : parseInt(value) || 0,
    }));
  };

  const handleSubmit = () => {
    if (!machine.id || !machine.name) {
      setNotification({ message: 'El ID y el Nombre de la máquina son obligatorios.', type: 'error' });
      return;
    }
    onSave(machine as Machine);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={machineData?.id ? 'Editar Máquina' : 'Añadir Nueva Máquina'}
    >
      <div className="space-y-4">
        {/* ID y Nombre */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">ID Máquina</label>
            <input
              type="text"
              name="id"
              placeholder="Ej: MA-P5"
              value={machine.id ?? ''}
              onChange={handleChange}
              className={TEXT_INPUT_STYLE}
              disabled={!!machineData?.id}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Nombre</label>
            <input
              type="text"
              name="name"
              placeholder="Ej: Mark Andy P5"
              value={machine.name ?? ''}
              onChange={handleChange}
              className={TEXT_INPUT_STYLE}
            />
          </div>
        </div>

        {/* Tipo y Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Tipo</label>
            <select
              name="type"
              value={machine.type ?? 'Flexo'}
              onChange={handleChange}
              className={TEXT_INPUT_STYLE}
            >
              {MACHINE_TYPES.map((type) => (
                <option key={type} value={type} className="bg-gray-800">
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Estado</label>
            <select
              name="status"
              value={machine.status ?? 'Operativa'}
              onChange={handleChange}
              className={TEXT_INPUT_STYLE}
            >
              {MACHINE_STATUSES.map((status) => (
                <option key={status} value={status} className="bg-gray-800">
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Datos técnicos */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Ancho Máx. (mm)</label>
            <input
              type="number"
              name="maxWidth"
              value={machine.maxWidth ?? ''}
              onChange={handleNumberChange}
              className={TEXT_INPUT_STYLE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Veloc. Máx. (m/min)</label>
            <input
              type="number"
              name="maxSpeed"
              value={machine.maxSpeed ?? ''}
              onChange={handleNumberChange}
              className={TEXT_INPUT_STYLE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Estaciones Color</label>
            <input
              type="number"
              name="colorStations"
              value={machine.colorStations ?? ''}
              onChange={handleNumberChange}
              className={TEXT_INPUT_STYLE}
            />
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Último Mtto.</label>
            <input
              type="date"
              name="lastMaintenance"
              value={machine.lastMaintenance ? String(machine.lastMaintenance) : ''}
              onChange={handleChange}
              className={TEXT_INPUT_STYLE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Próximo Mtto.</label>
            <input
              type="date"
              name="nextMaintenance"
              value={machine.nextMaintenance ? String(machine.nextMaintenance) : ''}
              onChange={handleChange}
              className={TEXT_INPUT_STYLE}
            />
          </div>
        </div>

        {/* Horas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Horas Disponibles</label>
            <input
              type="number"
              name="totalHoursAvailable"
              value={machine.totalHoursAvailable ?? ''}
              onChange={handleNumberChange}
              className={TEXT_INPUT_STYLE}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Horas Operativas</label>
            <input
              type="number"
              name="totalHoursOperational"
              value={machine.totalHoursOperational ?? ''}
              onChange={handleNumberChange}
              className={TEXT_INPUT_STYLE}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full btn-primary mt-4"
        >
          Guardar Máquina
        </button>
      </div>
    </Modal>
  );
};

export default MachineModal;