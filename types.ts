
export type Category = 'Code Assistance' | 'AI Art Generation' | 'Writing & Content' | 'Data Analysis' | 'Miscellaneous';

export interface PromptItem {
  id: string;
  act: string;
  prompt: string;
  description?: string; // New field for detailed description
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
}
