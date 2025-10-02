import React, { useState, useMemo } from 'react';
import { Ink } from '../types';
import { TEXT_INPUT_STYLE, ICONS } from '../constants';

interface PantoneColorPickerProps {
    inks: Ink[];
    onSelectInk: (ink: Ink) => void;
    onClose: () => void;
}

const PantoneColorPicker: React.FC<PantoneColorPickerProps> = ({ inks, onSelectInk, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [justSelectedId, setJustSelectedId] = useState<string | null>(null);

    const filteredInks = useMemo(() => {
        if (!searchTerm.trim()) {
            return inks;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return inks.filter(ink =>
            ink.name.toLowerCase().includes(lowercasedFilter) ||
            ink.id.toLowerCase().includes(lowercasedFilter)
        );
    }, [inks, searchTerm]);

    const handleSelect = (ink: Ink) => {
        onSelectInk(ink);
        setJustSelectedId(ink.id);
        setTimeout(() => {
            setJustSelectedId(null);
        }, 2000); // Confirmation visible for 2 seconds
    };

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Buscar por nombre o código Pantone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={TEXT_INPUT_STYLE.replace('mt-1', '')}
            />
            <div className="max-h-80 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-2 neumorphic-inset rounded-lg">
                {filteredInks.map(ink => (
                    <button
                        key={ink.id}
                        onDoubleClick={() => handleSelect(ink)}
                        className="relative flex flex-col items-center p-2 rounded-lg transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 neumorphic-button"
                        title={`Doble clic para añadir ${ink.name}`}
                    >
                        <div
                            className="w-full h-16 rounded-md border-2 border-white/30 shadow-inner"
                            style={{ backgroundColor: ink.hex || '#ccc' }}
                        ></div>
                        <div className="mt-2 text-center">
                            <p className="text-xs font-bold text-white truncate">{ink.name}</p>
                            <p className="text-xxs text-gray-400">{ink.id}</p>
                        </div>
                        {justSelectedId === ink.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 rounded-lg animate-ping-once">
                                <span className="text-white text-3xl">{ICONS.Check}</span>
                            </div>
                        )}
                    </button>
                ))}
                {filteredInks.length === 0 && (
                     <div className="col-span-full text-center py-8 text-gray-400">
                        No se encontraron tintas que coincidan con la búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PantoneColorPicker;