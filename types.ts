
export type Category = 'Code Assistance' | 'AI Art Generation' | 'Writing & Content' | 'Data Analysis' | 'Miscellaneous';

export interface PromptItem {
  id: string;
  act: string;
  prompt: string;
  description?: string;
  for_devs: boolean;
  type: 'TEXT' | 'STRUCTURED' | 'IMAGE';
  contributor: string;
  tags: string[];
  category: Category;
  isCustom?: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  personaId: string;
  personaName: string;
  messages: Message[];
  startTime: number;
  lastUpdateTime: number;
  // Metadata to distinguish sessions in history/compare mode
  modelId?: string; 
  isComparison?: boolean;
}

export interface SimulationSettings {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  thinkingBudget: number; // Specific to Gemini 3 models
  maxOutputTokens: number;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    '--bg-app': string;
    '--bg-panel': string;
    '--bg-element': string;
    '--bg-element-hover': string;
    '--border': string;
    '--text-heading': string;
    '--text-body': string;
    '--text-muted': string;
    '--accent': string;
    '--accent-hover': string;
    '--accent-text': string;
  };
}
