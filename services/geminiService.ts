
import { GoogleGenAI, ChatSession, GenerateContentResponse } from "@google/genai";

class GeminiService {
  private ai: GoogleGenAI;
  private modelName: string = 'gemini-3-flash-preview';

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key missing. Interface will be simulated.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'mock_key' });
  }

  public createChat(systemInstruction: string) {
    return this.ai.chats.create({
      model: this.modelName,
      config: {
        systemInstruction,
        temperature: 0.8,
        topP: 0.95,
        topK: 64,
      },
    });
  }

  public async sendMessage(chat: any, message: string): Promise<string> {
    try {
      const response: GenerateContentResponse = await chat.sendMessage({ message });
      return response.text || "No response text received.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
