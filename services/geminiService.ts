import { GoogleGenAI } from "@google/genai";
import { Rank, Phase } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getMissionBriefing = async (
  rank: Rank,
  phase: Phase,
  uvIndex: number,
  nextZone: string
): Promise<string> => {
  if (!apiKey) return "ENLACE DE COMUNICACIONES OFF-LINE. FALTA API KEY.";

  const prompt = `
    Genera un informe de misión táctico militar corto (máximo 3 frases) para un soldado varón de rango ${rank}.
    Fase Actual: ${phase}.
    Zona Objetivo: ${nextZone}.
    Protocolo Actual: Domingo (Torso/Precisión) y Lunes (Piernas/Fuerza) para evitar el 'Blue Monday'.
    Inteligencia Ambiental: Índice UV es ${uvIndex}.
    Tono: Serio, alentador, enfocado en bio-hacking y disciplina férrea.
    Idioma: Español de España.
    Si el UV es alto (>3), advierte sobre la exposición solar.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "NO HAY INTELIGENCIA DISPONIBLE.";
  } catch (error) {
    console.error("Gemini Briefing Error", error);
    return "ENLACE DE COMUNICACIONES INTERRUMPIDO.";
  }
};

export const chatWithIntelOfficer = async (
  message: string,
  history: string[]
): Promise<string> => {
  if (!apiKey) return "ENLACE DE COMUNICACIONES OFF-LINE.";

  const systemInstruction = `
    Eres el "Oficial de Inteligencia" de IPL Tracker Elite.
    El usuario sigue el 'Protocolo Domingo-Lunes' (Domingo Torso, Lunes Piernas).
    Domingo es para detalle y precisión. Lunes es para fuerza bruta y vencer la pereza del inicio de semana.
    Fase 1 (12 semanas) es semanal. Fase 2 es quincenal. Fase 3 es mensual.
    Responde preguntas sobre seguridad IPL, cuidado de la piel, calendario y manejo del dolor.
    Mantén las respuestas concisas, tácticas y autoritarias.
    Usa jerga militar ocasionalmente (ej: "Recibido", "Negativo", "Proceda con precaución").
    Idioma: Español de España.
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction },
      history: history.map(msg => ({
        role: msg.startsWith('User:') ? 'user' : 'model',
        parts: [{ text: msg.replace(/^(User:|Model:)\s*/, '') }],
      })),
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Negativo. Transmisión poco clara.";
  } catch (error) {
    return "Enlace comprometido. Inténtelo más tarde.";
  }
};