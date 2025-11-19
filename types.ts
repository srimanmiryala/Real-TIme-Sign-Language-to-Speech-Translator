export interface TranslationResult {
  text: string;
  confidence: number;
  timestamp: number;
}

export interface ChartDataPoint {
  name: string;
  confidence: number;
}

export enum AppState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  RECORDING = 'RECORDING',
  ERROR = 'ERROR'
}
