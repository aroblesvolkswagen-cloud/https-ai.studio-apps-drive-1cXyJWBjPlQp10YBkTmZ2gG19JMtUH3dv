import React, { useState } from 'react';
import { generateTip } from '../services/geminiService';
import { ICONS, TEXT_INPUT_STYLE } from '../constants';

const DynamicTips: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [tip, setTip] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateTip = async () => {
        if (!topic.trim()) {
            setError('Por favor, ingresa un tema.');
            return;
        }
        setIsLoading(true);
        setError('');
        setTip('');
        try {
            const generatedTip = await generateTip(topic);
            setTip(generatedTip);
        } catch (err) {
            setError('Error al generar el consejo. Por favor, intenta de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const quickTopics = [
        "Implementar 5'S en el área de prensas",
        "Reducir desperdicio de tinta",
        "Mejorar el control estadístico de proceso (SPC)",
        "Técnicas de análisis de causa raíz"
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Consejos Dinámicos de Calidad</h2>
            </div>

            <div className="border-l-4 border-cyan-400 text-white p-4 no-print rounded-r-xl neumorphic-inset">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="glass-icon-wrapper w-10 h-10">
                          {ICONS.Question}
                        </div>
                    </div>
                    <div className="ml-3">
                        <p className="font-bold">Guía Rápida</p>
                        <p className="text-sm mt-1 text-gray-300">
                            <strong>1. Haz una Pregunta:</strong> Escribe un tema o problema de calidad en el campo de texto (ej: 'mejorar tiempo de set-up').<br/>
                            <strong>2. Usa Sugerencias:</strong> Haz clic en los botones de temas rápidos para llenar el campo automáticamente.<br/>
                            <strong>3. Genera Consejo:</strong> Presiona el botón 'Generar Consejo' para recibir una recomendación detallada de nuestro consultor de calidad IA.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8 neumorphic-card text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full glass-icon-wrapper">
                    {ICONS['DynamicTips']}
                </div>
                <h2 className="text-xl font-bold text-cyan-300">Consultor de Calidad IA</h2>
                <p className="mt-2 text-gray-300">
                    Obtén consejos y mejores prácticas para optimizar tus procesos.
                </p>

                <div className="mt-6">
                     <p className="text-sm text-gray-400 mb-2">Pregunta sobre un tema, por ejemplo:</p>
                     <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {quickTopics.map(t => (
                            <button 
                                key={t} 
                                onClick={() => setTopic(t)}
                                className="px-3 py-1 text-xs text-white glass-button"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ej: Cómo reducir el tiempo de cambio de trabajo"
                            className={TEXT_INPUT_STYLE.replace('mt-1', '') + ' rounded-r-none'}
                        />
                        <button
                            onClick={handleGenerateTip}
                            disabled={isLoading}
                            className="px-6 py-2 flex items-center justify-center neumorphic-button neumorphic-button-primary rounded-l-none"
                        >
                            {isLoading ? ICONS.Spinner : 'Generar Consejo'}
                        </button>
                    </div>
                </div>
            </div>

            {error && <p className="mt-4 text-center text-red-400">{error}</p>}
            
            {tip && (
                 <div className="mt-6 p-6 neumorphic-card border-l-4 border-cyan-400">
                    <h3 className="text-lg font-semibold text-white">Recomendación del Consultor IA:</h3>
                    <p className="mt-2 text-gray-300 whitespace-pre-wrap">{tip}</p>
                 </div>
            )}
        </div>
    );
};

export default DynamicTips;