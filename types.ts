export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
  PreferNotToSay = 'Prefer not to say'
}

export enum Language {
  Auto = 'Auto',
  English = 'English',
  Hindi = 'Hindi',
  Kannada = 'Kannada',
  Telugu = 'Telugu',
  Tamil = 'Tamil',
  Marathi = 'Marathi',
  Bengali = 'Bengali',
  Gujarati = 'Gujarati',
  Malayalam = 'Malayalam',
  Odia = 'Odia'
}

export interface PatientData {
  age: string;
  sex: Gender;
  language: Language;
  duration: string;
  conditions: string;
  medications: string;
  symptoms: string;
  includeAyurveda: boolean;
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface AudioData {
  blob: Blob;
  base64: string;
  mimeType: string;
}

export interface AnalysisState {
  loading: boolean;
  result: string | null;
  error: string | null;
}

export interface AnalysisRecord {
  id: string;
  createdAt: string;
  patientAge?: string;
  patientSex?: string;
  duration?: string;
  conditions?: string;
  medications?: string;
  triageLevel?: string;
  summaryQuick?: string;
  markdown: string;
}