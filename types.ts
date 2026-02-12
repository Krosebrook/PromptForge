
export type Category = 'Code Assistance' | 'AI Art Generation' | 'Writing & Content' | 'Data Analysis' | 'Miscellaneous';

export interface PersonaVersion {
  timestamp: number;
  prompt: string;
  description?: string; // Snapshot note
  personaDescription?: string; // The persona's 'Matrix Intent' at the time of snapshot
  act: string;
  tags?: string[];
}

export interface PromptDocument {
  id: string;
  name: string;
  type: string;
  data: string; // Base64
}

export interface PromptItem {
  id: string;
  act: string;
  prompt: string;
  description?: string;
  for_devs: boolean;
  type: 'TEXT' | 'STRUCTURED' | 'IMAGE' | 'VIDEO';
  contributor: string;
  tags: string[];
  category: Category;
  isCustom?: boolean;
  versions?: PersonaVersion[];
  documents?: PromptDocument[];
  responseSchema?: string; // JSON Schema String
}

export interface MessageMetadata {
  thinking?: string;
  tokenCount?: number;
  latency?: number;
  groundingChunks?: any[];
  searchEnabled?: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  metadata?: MessageMetadata;
  videoUrl?: string;
}

export interface ChatSession {
  id: string;
  personaId: string;
  personaName: string;
  messages: Message[];
  startTime: number;
  lastUpdateTime: number;
  modelId?: string; 
  isComparison?: boolean;
}

export interface PipelineConfig {
  id: string;
  name: string;
  flowState: {
    nodes: any[];
    edges: any[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface SimulationSettings {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  thinkingBudget: number;
  maxOutputTokens: number;
  enableSearch?: boolean;
  enableMaps?: boolean;
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

export interface UserProfile {
  onboardingStatus: 'complete' | 'incomplete';
  createdAt: string;
  identity: {
    role: 'Full Stack Dev' | 'Frontend Dev' | 'Backend Dev' | 'Data Scientist' | 'Product Designer' | 'Prompt Engineer';
    expertise: 'Junior' | 'Senior' | 'Staff/Principal';
    preferredStack: string[];
  };
  preferences: {
    globalContext: string; // e.g. "Always use TypeScript", "Be concise"
    autoSave: boolean;
    privacyMode: 'Local' | 'Cloud';
  };
}
