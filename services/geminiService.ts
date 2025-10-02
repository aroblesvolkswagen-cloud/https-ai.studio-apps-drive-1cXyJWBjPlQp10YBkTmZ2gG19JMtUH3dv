import { GoogleGenAI, Type } from "@google/genai";
import { PantoneFormulaResult } from '../types';

// This service now uses the real Gemini API.
// Ensure your API_KEY is configured in the environment variables.

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const pantoneFormulaSchema = {
    type: Type.OBJECT,
    properties: {
        pantoneName: { type: Type.STRING, description: 'Official Pantone code and name, e.g., "PANTONE 185 C"' },
        hex: { type: Type.STRING, description: 'Approximate HEX color code, e.g., "#C8102E"' },
        description: { type: Type.STRING, description: 'A brief description of the color, e.g., "A vibrant, classic red."' },
        components: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'Official name of the base ink component, e.g., "PANTONE Yellow 012 C"' },
                    percentage: { type: Type.NUMBER, description: 'The percentage of this component in the mix.' },
                    hex: { type: Type.STRING, description: 'Approximate HEX color code of the base ink.' },
                    role: { type: Type.STRING, description: 'The function of this ink in the mix, e.g., "Provides the main red hue."' },
                },
                required: ['name', 'percentage', 'hex', 'role'],
            },
        },
    },
    required: ['pantoneName', 'hex', 'description', 'components'],
};

export async function getPantoneFormula(pantoneCode: string): Promise<PantoneFormulaResult> {
    console.log(`Getting Pantone formula for: "${pantoneCode}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Provide the mixing formula for the Pantone Solid Coated color: ${pantoneCode}.`,
            config: {
                systemInstruction: `You are a world-class expert in Pantone color mixing for the industrial printing industry. Your knowledge covers the entire global Pantone Solid Coated Formula Guide. Your task is to provide the exact mixing formula for a given Pantone Solid Coated color code. You must respond ONLY with the JSON object matching the provided schema. Do not add any extra text or explanations. If the color code is invalid or not found, return an error in the description field and an empty components array.`,
                responseMimeType: 'application/json',
                responseSchema: pantoneFormulaSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PantoneFormulaResult;

    } catch (error) {
        console.error("Error calling Gemini API for Pantone formula:", error);
        throw new Error("No se pudo obtener una respuesta del consultor Pantone. Verifica el código del color y vuelve a intentarlo.");
    }
}

// FIX: Added missing generateTip function to be used by the DynamicTips component.
export async function generateTip(topic: string): Promise<string> {
    console.log(`Getting quality tip for: "${topic}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Provide a detailed, practical, and actionable quality improvement tip for the following topic in the printing/manufacturing industry: "${topic}".`,
            config: {
                systemInstruction: `You are an expert quality management consultant for the industrial printing and manufacturing industry. Your advice is clear, concise, and focused on tangible improvements. Respond in Spanish. Structure your response with a title, a short introduction, and then a list of actionable steps or bullet points.`,
            },
        });
        
        return response.text;

    } catch (error) {
        console.error("Error calling Gemini API for a quality tip:", error);
        throw new Error("No se pudo obtener una respuesta del consultor de calidad. Por favor, intenta de nuevo.");
    }
}