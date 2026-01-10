
import { GoogleGenAI, ChatSession, GenerateContentResponse } from "@google/genai";
import { SimulationSettings } from "../types";

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // API Key must be obtained exclusively from process.env.API_KEY
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key missing in environment variables. Simulation may fail.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'mock_key' });
  }

  /**
   * Creates a chat session with specific model configurations.
   * Handles Gemini 3 specific parameters like thinkingConfig.
   */
  public createChat(systemInstruction: string, settings?: SimulationSettings) {
    const model = settings?.model || 'gemini-3-flash-preview';
    
    // Construct configuration object based on API requirements
    const config: any = {
      systemInstruction,
      temperature: settings?.temperature ?? 0.7,
      topP: settings?.topP ?? 0.95,
      topK: settings?.topK ?? 64,
      maxOutputTokens: settings?.maxOutputTokens ?? 8192,
    };

    // Apply thinking budget if specified and using supported models (Gemini 3/2.5)
    if (settings?.thinkingBudget && settings.thinkingBudget > 0) {
      // Gemini 3 Flash/Pro supports thinking config
      if (model.includes('gemini-3') || model.includes('gemini-2.5')) {
        config.thinkingConfig = {
          thinkingBudget: settings.thinkingBudget
        };
        // When thinking is enabled, temperature is often recommended to be managed by the model or kept specific
        // However, we pass user preference if set.
      }
    }

    return this.ai.chats.create({
      model: model,
      config: config,
    });
  }

  public async sendMessage(chat: any, message: string): Promise<string> {
    try {
      const response: GenerateContentResponse = await chat.sendMessage({ message });
      return response.text || "No response text received.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      // Return a user-friendly error string instead of throwing to prevent UI crash
      return `[System Error]: Failed to communicate with ${this.ai ? 'Gemini' : 'API'}. Please check your connection and quota.`;
    }
  }
}

export const geminiService = new GeminiService();
