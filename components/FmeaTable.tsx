import React from 'react';
import { FmeaDocument, FmeaRow } from '../types';
import { ICONS } from '../constants';

interface FmeaTableProps {
    fmea: FmeaDocument;
    onFmeaChange: (updatedFmea: FmeaDocument) => void;
    canEdit: boolean;
    showConfirm: (dialog: { title: string; message: string; onConfirm: () => void; }) => void;
}

// FIX: Moved EditableCell outside of FmeaTable to prevent re-declaration on every render.
// This is a standard React pattern to avoid issues like React Error #185.
const EditableCell: React.FC<{ 
    row: FmeaRow; 
    rowIndex: number; 
    field: keyof FmeaRow; 
    type?: 'text' | 'number';
    canEdit: boolean;
    onCellChange: (rowIndex: number, field: keyof FmeaRow, value: string | number) => void;
}> = ({ row, rowIndex, field, type = 'text', canEdit, onCellChange }) => {
    if (!canEdit) {
        return <>{row[field]}</>;
    }
    
    if (type === 'number') {
         return (
            <input
                type="number"
                min="1"
                max="10"
                value={row[field] ?? ''}
                onChange={(e) => onCellChange(rowIndex, field, e.target.value)}
                className="w-16 p-1 rounded bg-transparent text-center input-glass"
            />
        );
    }

    return (
        <textarea
            value={row[field] as string}
            onChange={(e) => onCellChange(rowIndex, field, e.target.value)}
            className="w-full p-1 rounded bg-transparent min-h-[40px] input-glass"
            rows={2}
        />
    );
};

// FIX: Corrected component definition to be a named export and to return JSX.
export const FmeaTable: React.FC<FmeaTableProps> = ({ fmea, onFmeaChange, canEdit, showConfirm }) => {
    
    const handleCellChange = (rowIndex: number, field: keyof FmeaRow, value: string | number) => {
        const newRows = [...fmea.rows];
        const updatedRow = { ...newRows[rowIndex] };

        // Handle numeric fields
        if (field === 'severity' || field === 'occurrence' || field === 'detection') {
            const numValue = parseInt(value as string, 10);
            if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
                (updatedRow as any)[field] = numValue;
            } else {
                return; // or handle invalid input
            }
        } else {
            (updatedRow as any)[field] = value;
        }

        // Recalculate RPN
        updatedRow.rpn = updatedRow.severity * updatedRow.occurrence * updatedRow.detection;

        newRows[rowIndex] = updatedRow;
        onFmeaChange({ ...fmea, rows: newRows });
    };

    const addRow = () => {
        const newId = fmea.rows.length > 0 ? Math.max(...fmea.rows.map(r => r.id)) + 1 : 1;
        const newRow: FmeaRow = {
            id: newId,
            processStep: 'Nuevo Paso',
            potentialFailureMode: '',
            potentialEffect: '',
            severity: 1,
            potentialCause: '',
            occurrence: 1,
            currentControls: '',
            detection: 10,
            rpn: 10,
            recommendedAction: ''
        };
        onFmeaChange({ ...fmea, rows: [...fmea.rows, newRow] });
    };

    const deleteRow = (id: number) => {
        showConfirm({
            title: 'Eliminar Fila',
            message: '¿Estás seguro de que quieres eliminar esta fila?',
            onConfirm: () => {
                onFmeaChange({ ...fmea, rows: fmea.rows.filter(row => row.id !== id) });
            }
        });
    };
    
     const getRpnColor = (rpn: number) => {
        if (rpn > 125) return 'bg-red-900/50 text-red-200';
        if (rpn > 80) return 'bg-yellow-800/50 text-yellow-200';
        return 'bg-green-900/50 text-green-200';
    };


    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-text-default min-w-[1200px]">
                <thead className="bg-white/10">
                    <tr>
                        <th className="p-2">Paso del Proceso</th>
                        <th className="p-2">Modo de Falla</th>
                        <th className="p-2">Efecto Potencial</th>
                        <th className="p-2 text-center">Sev (S)</th>
                        <th className="p-2">Causa Potencial</th>
                        <th className="p-2 text-center">Ocur (O)</th>
                        <th className="p-2">Controles Actuales</th>
                        <th className="p-2 text-center">Det (D)</th>
                        <th className="p-2 text-center">NPR</th>
                        <th className="p-2">Acción Recomendada</th>
                        {canEdit && <th className="p-2"></th>}
                    </tr>
                </thead>
                <tbody>
                    {fmea.rows.map((row, rowIndex) => (
                        <tr key={row.id} className="border-b border-white/10">
                            <td className="p-1"><EditableCell row={row} rowIndex={rowIndex} field="processStep" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            <td className="p-1"><EditableCell row={row} rowIndex={rowIndex} field="potentialFailureMode" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            <td className="p-1"><EditableCell row={row} rowIndex={rowIndex} field="potentialEffect" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            <td className="p-1 text-center"><EditableCell row={row} rowIndex={rowIndex} field="severity" type="number" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            <td className="p-1"><EditableCell row={row} rowIndex={rowIndex} field="potentialCause" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            <td className="p-1 text-center"><EditableCell row={row} rowIndex={rowIndex} field="occurrence" type="number" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            <td className="p-1"><EditableCell row={row} rowIndex={rowIndex} field="currentControls" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            <td className="p-1 text-center"><EditableCell row={row} rowIndex={rowIndex} field="detection" type="number" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            <td className={`p-1 text-center font-bold rounded ${getRpnColor(row.rpn)}`}>{row.rpn}</td>
                            <td className="p-1"><EditableCell row={row} rowIndex={rowIndex} field="recommendedAction" canEdit={canEdit} onCellChange={handleCellChange} /></td>
                            {canEdit && <td className="p-1"><button onClick={() => deleteRow(row.id)} className="text-danger hover:opacity-80 p-1" aria-label={`Eliminar fila ${row.id}`}>{ICONS.Trash}</button></td>}
                        </tr>
                    ))}
                </tbody>
            </table>
            {canEdit && (
                <div className="mt-4">
                    <button onClick={addRow} className="btn-primary text-sm">+ Añadir Fila</button>
                </div>
            )}
        </div>
    );
};
