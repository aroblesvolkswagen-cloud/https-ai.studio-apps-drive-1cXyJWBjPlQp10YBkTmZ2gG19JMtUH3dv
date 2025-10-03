import React, { useState } from 'react';
import Modal from './Modal';
import { InventoryItem, InventoryCategory } from '../types';
import { useAppStore } from '../useAppStore';

interface InventoryUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: Partial<InventoryItem>[]) => void;
}

const InventoryUploadModal: React.FC<InventoryUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const { showConfirm } = useAppStore();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<Partial<InventoryItem>[]>([]);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setError('');
            parseCSV(selectedFile);
        } else {
            setFile(null);
            setPreviewData([]);
            setError('Por favor, selecciona un archivo .csv válido.');
        }
    };

    const parseCSV = (csvFile: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    setError('El archivo CSV está vacío o solo contiene la cabecera.');
                    return;
                }
                const header = lines[0].split(',').map(h => h.trim());
                const expectedHeaders = ['sku', 'productName', 'category', 'quantity', 'unit', 'costPerUnit', 'minStock', 'location', 'supplier'];
                
                if (!expectedHeaders.some(h => header.includes(h))) {
                     setError(`Cabeceras incorrectas o faltantes. Se esperaba: ${expectedHeaders.join(', ')}`);
                     return;
                }

                const data: Partial<InventoryItem>[] = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const item: Partial<InventoryItem> = {};
                    header.forEach((h, i) => {
                        const key = h as keyof InventoryItem;
                        const value = values[i]?.trim();
                        if (value !== undefined) {
                             if (key === 'quantity' || key === 'costPerUnit' || key === 'minStock') {
                                (item as any)[key] = parseFloat(value) || 0;
                            } else if (key === 'category') {
                                // Validate category value
                                const isValidCategory = Object.values(InventoryCategory).includes(value as InventoryCategory);
                                (item as any)[key] = isValidCategory ? value : InventoryCategory.FinishedGood;
                            }
                            else {
                                (item as any)[key] = value;
                            }
                        }
                    });
                    return item;
                });
                setPreviewData(data);
                setError('');
            } catch (e) {
                setError('Ocurrió un error al procesar el archivo. Verifique el formato.');
                setPreviewData([]);
            }
        };
        reader.onerror = () => setError('Error al leer el archivo.');
        reader.readAsText(csvFile);
    };

    const handleUpload = () => {
        if (previewData.length > 0) {
            const confirmMessage = `Se integrarán ${previewData.length} registros al inventario. Los SKUs existentes se actualizarán con los datos del archivo. ¿Deseas continuar?`;
            showConfirm({
                title: 'Confirmar Carga de Inventario',
                message: confirmMessage,
                onConfirm: () => {
                    onUpload(previewData);
                    handleClose();
                }
            });
        }
    };
    
    const handleClose = () => {
        setFile(null);
        setPreviewData([]);
        setError('');
        onClose();
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Cargar Inventario desde Archivo CSV">
            <div className="space-y-4">
                <div className="p-4 border-l-4 border-yellow-400 bg-yellow-500/10 text-yellow-200 rounded-r-lg">
                    <p className="font-bold">Formato CSV esperado:</p>
                    <p className="text-sm mt-1">El archivo debe tener una cabecera con las columnas: <code className="break-all font-mono p-1 rounded bg-black/20 block mt-1">sku,productName,category,quantity,unit,costPerUnit,minStock,location,supplier</code></p>
                    <p className="text-xs mt-1">Los valores para `category` deben ser exactamente: `{Object.values(InventoryCategory).join(', ')}`.</p>
                </div>
                <div>
                    <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-200">Seleccionar Archivo .csv</label>
                    <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-venki-cyan file:text-venki-deep-blue hover:file:bg-cyan-200 transition-colors cursor-pointer input-glass"/>
                </div>
                {error && <p className="text-red-300 text-sm bg-red-500/30 p-2 rounded-md">{error}</p>}
                {previewData.length > 0 && (
                    <div className="space-y-2">
                         <h4 className="font-semibold text-white">Vista Previa de Datos ({previewData.length} registros a integrar)</h4>
                         <div className="max-h-60 overflow-y-auto rounded-md glass p-2">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/10 sticky top-0 text-white">
                                    <tr>
                                        <th className="px-4 py-2">SKU</th>
                                        <th className="px-4 py-2">Producto</th>
                                        <th className="px-4 py-2">Categoría</th>
                                        <th className="px-4 py-2">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    {previewData.map((item, index) => (
                                        <tr key={index} className="border-b border-white/10 last:border-0">
                                            <td className="px-4 py-2 font-medium">{item.sku}</td>
                                            <td className="px-4 py-2">{item.productName}</td>
                                            <td className="px-4 py-2">{item.category}</td>
                                            <td className="px-4 py-2">{item.quantity} {item.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                         <button onClick={handleUpload} className="w-full btn-primary">
                            Confirmar e Integrar Datos
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default InventoryUploadModal;