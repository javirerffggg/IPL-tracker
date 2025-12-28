
export enum Rank {
  RECRUIT = 'RECRUIT',
  SOLDIER = 'SOLDIER',
  SPECIALIST = 'SPECIALIST',
  SERGEANT = 'SERGEANT',
  LIEUTENANT = 'LIEUTENANT',
  COMMANDER = 'COMMANDER',
  LEGEND = 'LEGEND'
}

export enum Phase {
  ATTACK = 'ATTACK',
  TRANSITION = 'TRANSITION',
  MAINTENANCE = 'MAINTENANCE'
}

export interface SessionLog {
  id: string;
  date: string; // ISO String
  durationSeconds: number;
  zones: string[];
  notes?: string;
  completed: boolean;
  uvIndex?: number; // Histórico de UV
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserSettings {
  startDate: string; // ISO String of Operation Start
  machineCost: number; // Cost of device
  sessionValueLegs: number; // Market value
  sessionValueTorso: number; // Market value
  darkMode: boolean; // Always true practically, but good for schema
  vibrationIntensity: 'LOW' | 'HIGH'; // New Setting
  isPaused: boolean; // Manual Override for holidays/sickness
}

export interface AppState {
  settings: UserSettings;
  logs: SessionLog[];
  achievements: Achievement[];
  totalSavings: number;
}

export interface WeatherData {
  uvIndex: number;
  temperature: number;
  code: number;
}