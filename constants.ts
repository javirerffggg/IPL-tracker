import { Rank, Achievement, Phase } from './types';

export const INITIAL_START_DATE = '2025-12-28T00:00:00.000Z';

export const RANKS_THRESHOLDS: Record<Rank, number> = {
  [Rank.RECRUIT]: 0,
  [Rank.SOLDIER]: 2,
  [Rank.SPECIALIST]: 5,
  [Rank.SERGEANT]: 10,
  [Rank.LIEUTENANT]: 15,
  [Rank.COMMANDER]: 25,
  [Rank.LEGEND]: 50,
};

// Traducciones para visualización
export const RANK_TRANSLATIONS: Record<Rank, string> = {
  [Rank.RECRUIT]: 'RECLUTA',
  [Rank.SOLDIER]: 'SOLDADO',
  [Rank.SPECIALIST]: 'ESPECIALISTA',
  [Rank.SERGEANT]: 'SARGENTO',
  [Rank.LIEUTENANT]: 'TENIENTE',
  [Rank.COMMANDER]: 'COMANDANTE',
  [Rank.LEGEND]: 'LEYENDA',
};

export const PHASE_TRANSLATIONS: Record<Phase, string> = {
  [Phase.ATTACK]: 'ATAQUE (SEMANAL)',
  [Phase.TRANSITION]: 'TRANSICIÓN (QUINCENAL)',
  [Phase.MAINTENANCE]: 'MANTENIMIENTO (MENSUAL)',
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', title: 'PRIMERA SANGRE', description: 'Completa tu primera misión.', icon: 'Droplet', unlocked: false },
  { id: 'sniper', title: 'FRANCOTIRADOR', description: 'Completa una sesión de degradado de hombros.', icon: 'Crosshair', unlocked: false },
  { id: 'dawn_raid', title: 'INCURSIÓN AL ALBA', description: 'Completa una sesión antes de las 10:00.', icon: 'Sun', unlocked: false },
  { id: 'black_ops', title: 'OPERACIONES NEGRAS', description: 'Completa una sesión después de las 22:00.', icon: 'Moon', unlocked: false },
  { id: 'endurance', title: 'RESISTENCIA', description: 'Sesión superior a 40 minutos.', icon: 'Shield', unlocked: false },
  { id: 'blitzkrieg', title: 'ATAQUE RÁPIDO', description: 'Sesión de menos de 15 minutos.', icon: 'Zap', unlocked: false },
  { id: 'blue_monday', title: 'BLUE MONDAY', description: 'Completa una sesión de piernas en Lunes.', icon: 'Calendar', unlocked: false },
  { id: 'roi_breached', title: 'RENTABLE', description: 'Recupera el coste de la máquina.', icon: 'DollarSign', unlocked: false },
];

export const PHASE_CONFIG = {
  [Phase.ATTACK]: { weeks: 12, frequency: 'WEEKLY' },
  [Phase.TRANSITION]: { weeks: 12, frequency: 'BI-WEEKLY' },
  [Phase.MAINTENANCE]: { weeks: 999, frequency: 'MONTHLY' },
};

export const ZONES = {
  LOWER: ['Muslos', 'Rodillas', 'Glúteos'], // Lunes: Fuerza Bruta
  UPPER: ['Pecho', 'Abdomen'], // Domingo: Precisión
  SHOULDER_ADDON: ['Hombros', 'Brazos (Degradado)']
};

// Inteligencia Específica del Plan Maestro
export const WEEKLY_INTEL: Record<number, string> = {
  0: "INICIO DE HOSTILIDADES. Define claramente la 'línea de corte' en el hombro. Todo lo que dispares hoy, tardará 2 semanas en caerse.",
  1: "La piel puede estar sensible de la primera carga. Hidratación máxima post-sesión.",
  2: "El 'Efecto Pimienta': verás puntos negros que parecen vello creciendo, pero es vello muerto expulsándose.",
  3: "Repaso de Hombros. Primer ciclo completo de degradado. Revisa si hay zonas que te saltaste en la Semana 1.",
  4: "Aparición de las primeras 'calvas' o parches irregulares, especialmente en gemelos y pecho.",
  5: "Mitad del camino. La textura de la piel cambia, se vuelve más suave al tacto.",
  6: "Repaso de Hombros. Ajusta la potencia si sientes menos dolor.",
  7: "El rasurado previo es rapidísimo. Casi no hay resistencia de la cuchilla.",
  8: "Persiste. Los folículos supervivientes son los más resistentes y profundos.",
  9: "Repaso de Hombros. El degradado debería verse muy natural ahora.",
  10: "Penúltimo esfuerzo. Revisa zonas difíciles como rodillas o codos.",
  11: "FIN FASE DE ATAQUE. Tu piel ha cambiado radicalmente.",
};