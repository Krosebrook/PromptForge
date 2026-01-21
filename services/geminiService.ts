
import { GoogleGenAI, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";
import { SimulationSettings, PromptDocument } from "../types";

// Base64 Helpers for Raw PCM Audio
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  public async optimizePrompt(rawPrompt: string): Promise<string> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert Prompt Engineer. Rewrite the following system instruction to be more effective, concise, and robust for a Large Language Model. Use techniques like Chain of Thought, Delimiters, and Persona Definition where applicable. Return ONLY the rewritten prompt.
        
        Original: "${rawPrompt}"`,
        config: { temperature: 0.7 }
      });
      return response.text?.trim() || rawPrompt;
    } catch (e) {
      console.error("Optimization failed", e);
      return rawPrompt;
    }
  }

  public createChat(systemInstruction: string, settings?: SimulationSettings, docs?: PromptDocument[], schema?: string) {
    const ai = this.getAI();
    const model = settings?.model || 'gemini-3-flash-preview';
    
    const config: any = {
      systemInstruction,
      temperature: settings?.temperature ?? 0.7,
      topP: settings?.topP ?? 0.95,
      topK: settings?.topK ?? 64,
      maxOutputTokens: settings?.maxOutputTokens ?? 8192,
    };

    if (schema) {
      try {
        const parsedSchema = JSON.parse(schema);
        config.responseMimeType = "application/json";
        config.responseSchema = parsedSchema;
      } catch (e) {
        console.warn("Invalid JSON schema provided, skipping.");
      }
    }

    const tools: any[] = [];
    if (settings?.enableSearch) tools.push({ googleSearch: {} });
    if (settings?.enableMaps) tools.push({ googleMaps: {} });
    if (tools.length > 0) config.tools = tools;

    if (settings?.thinkingBudget && settings.thinkingBudget > 0) {
      config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
    }

    const chat = ai.chats.create({ model, config });

    // Inject Knowledge Base (Docs) into history if present
    if (docs && docs.length > 0) {
      // We manually preload the history with the docs as a user message
      // Note: @google/genai chat doesn't expose a clean way to inject history *after* create easily without sending a message.
      // However, we can start the chat with history if we were using the history param in create.
      // Since we use createChat, let's treat these docs as the "Context" that is sent immediately or conceptually part of the system.
      // Strategy: The first sendMessage call from the UI should include these if it's a fresh session, 
      // but simpler: we just modify the system instruction in the config above?
      // No, system instruction is text. 
      // We will handle doc injection by sending a "System Context" message invisibly if needed, 
      // BUT for simplicity in this app structure, we will rely on the UI sending the docs as the first message payload if they exist.
    }

    return chat;
  }

  public async generateVideo(prompt: string, resolution: '720p' | '1080p' = '720p', aspectRatio: '16:9' | '9:16' = '16:9') {
    const ai = this.getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: { numberOfVideos: 1, resolution, aspectRatio }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  public async connectLive(systemInstruction: string, callbacks: {
    onAudio: (buffer: AudioBuffer) => void,
    onTranscription: (text: string, isUser: boolean) => void,
    onInterrupt: () => void
  }) {
    const ai = this.getAI();
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: async () => {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const inputAudioContext = new AudioContext({sampleRate: 16000});
          const source = inputAudioContext.createMediaStreamSource(stream);
          const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            sessionPromise.then(s => s.sendRealtimeInput({
              media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
            }));
          };
          source.connect(processor);
          processor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.outputTranscription) callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
          if (message.serverContent?.inputTranscription) callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
          
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData) {
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            const buffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(outputAudioContext.destination);
            source.start(nextStartTime);
            nextStartTime += buffer.duration;
            sources.add(source);
            callbacks.onAudio(buffer);
          }
          if (message.serverContent?.interrupted) {
            sources.forEach(s => s.stop());
            sources.clear();
            nextStartTime = 0;
            callbacks.onInterrupt();
          }
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction,
        outputAudioTranscription: {},
        inputAudioTranscription: {}
      }
    });

    return sessionPromise;
  }

  public async sendMessage(chat: any, message: string | { text?: string, parts?: any[] }) {
    const startTime = Date.now();
    try {
      // Support complex parts (for RAG) or simple string
      const msgPayload = typeof message === 'string' ? { message } : { message: { role: 'user', parts: message.parts } };
      
      const response: GenerateContentResponse = await chat.sendMessage(msgPayload);
      const latency = Date.now() - startTime;
      
      return {
        text: response.text || "No response text.",
        metadata: {
          thinking: response.candidates?.[0]?.content?.parts?.find(p => (p as any).thought)?.text || "",
          tokenCount: response.candidates?.[0]?.citationMetadata?.citationSources?.length || 0,
          latency,
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        }
      };
    } catch (error) {
      console.error(error);
      return { text: `[Error]: ${error instanceof Error ? error.message : 'API failure.'}`, metadata: { latency: Date.now() - startTime } };
    }
  }
}

export const geminiService = new GeminiService();
