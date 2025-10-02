import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { TEXT_INPUT_STYLE } from '../constants';
import { Role } from '../types';

export interface ColumnOption {
    key: string;
    label: string;
}

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: {
        recipient: string;
        format: 'csv' | 'pdf';
        selectedColumns?: string[];
    }) => void;
    title: string;
    supportedFormats?: ('csv' | 'pdf')[];
    columns?: ColumnOption[];
    userRole?: Role;
}

const ExportModal: React.FC<ExportModalProps> = ({ 
    isOpen, 
    onClose, 
    onExport, 
    title, 
    supportedFormats = ['csv', 'pdf'],
    columns = [],
    userRole
}) => {
    const [recipient, setRecipient] = useState('Dirección');
    const [format, setFormat] = useState<'csv' | 'pdf'>(supportedFormats[0]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(true);

    const recipients = ['Dirección', 'Gerencia', 'CEO'];

    useEffect(() => {
        if (isOpen) {
            const allColumnKeys = columns.map(c => c.key);
            setSelectedColumns(allColumnKeys);
            setSelectAll(true);
            setFormat(supportedFormats[0]); // Reset to first available format on open
        }
    }, [isOpen, columns, supportedFormats]);

    useEffect(() => {
        setSelectAll(columns.length > 0 && selectedColumns.length === columns.length);
    }, [selectedColumns, columns]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedColumns(columns.map(c => c.key));
        } else {
            setSelectedColumns([]);
        }
    };

    const handleColumnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setSelectedColumns(prev =>
            checked ? [...prev, value] : prev.filter(key => key !== value)
        );
    };

    const handleExport = () => {
        onExport({
            recipient,
            format,
            selectedColumns
        });
        onClose();
    };
    
    const showColumnSelector = format === 'csv' && columns.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Exportar ${title}`}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="recipient-select" className="block text-sm font-medium text-gray-200 mb-1">Destinatario del Reporte</label>
                    <select id="recipient-select" value={recipient} onChange={e => setRecipient(e.target.value)} className={TEXT_INPUT_STYLE}>
                        {recipients.map(r => <option className="bg-gray-800" key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="format-select" className="block text-sm font-medium text-gray-200 mb-1">Formato</label>
                    <select id="format-select" value={format} onChange={e => setFormat(e.target.value as 'csv' | 'pdf')} className={TEXT_INPUT_STYLE}>
                        {supportedFormats.includes('csv') && <option className="bg-gray-800" value="csv">CSV (para Excel)</option>}
                        {supportedFormats.includes('pdf') && <option className="bg-gray-800" value="pdf">Guardar como PDF</option>}
                    </select>
                </div>
                
                {showColumnSelector && (
                    <div className="pt-4 border-t border-white/20">
                        <label className="block text-sm font-medium text-gray-200 mb-2">Seleccionar columnas a exportar:</label>
                        <div className="glass p-3 rounded-lg max-h-48 overflow-y-auto">
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="select-all-columns"
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-gray-500 bg-transparent text-cyan-400 focus:ring-cyan-500"
                                    />
                                    <label htmlFor="select-all-columns" className="ml-2 block text-sm font-medium text-white">
                                        Seleccionar Todo / Nada
                                    </label>
                                </div>
                                <hr className="my-2 border-white/20" />
                                {columns.map(col => (
                                    <div key={col.key} className="flex items-center">
                                        <input
                                            id={`col-${col.key}`}
                                            type="checkbox"
                                            value={col.key}
                                            checked={selectedColumns.includes(col.key)}
                                            onChange={handleColumnChange}
                                            className="h-4 w-4 rounded border-gray-500 bg-transparent text-cyan-400 focus:ring-cyan-500"
                                        />
                                        <label htmlFor={`col-${col.key}`} className="ml-2 block text-sm text-gray-200">
                                            {col.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                 {format === 'pdf' && columns.length > 0 && (
                    <div className="pt-4 border-t border-white/20">
                        <label className="block text-sm font-medium text-gray-200 mb-2">Secciones a incluir en el PDF:</label>
                        <div className="glass p-3 rounded-lg">
                           <div className="flex items-center">
                                <input
                                    id="select-all-columns-pdf"
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 rounded border-gray-500 bg-transparent text-cyan-400 focus:ring-cyan-500"
                                />
                                <label htmlFor="select-all-columns-pdf" className="ml-2 block text-sm font-medium text-white">
                                    Seleccionar Todo / Nada
                                </label>
                            </div>
                             <hr className="my-2 border-white/20" />
                            {columns.map(col => (
                                <div key={col.key} className="flex items-center">
                                     <input
                                        id={`col-pdf-${col.key}`}
                                        type="checkbox"
                                        value={col.key}
                                        checked={selectedColumns.includes(col.key)}
                                        onChange={handleColumnChange}
                                        className="h-4 w-4 rounded border-gray-500 bg-transparent text-cyan-400 focus:ring-cyan-500"
                                    />
                                    <label htmlFor={`col-pdf-${col.key}`} className="ml-2 block text-sm text-gray-200">
                                        {col.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                <button onClick={handleExport} className="w-full btn-primary mt-2">
                    Generar Reporte
                </button>
            </div>
        </Modal>
    );
};

export default ExportModal;