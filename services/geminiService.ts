
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { decode, decodeAudioData } from "./audioUtils";

export class GeminiTTSService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  private getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    return this.audioContext;
  }

  async stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
  }

  async speak(text: string, voice: VoiceName = VoiceName.Kore): Promise<void> {
    await this.stop();
    const ctx = this.getAudioContext();

    // Fix: Always use process.env.API_KEY directly and instantiate before call as per SDK guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      // Optimization: Gemini TTS handles limited chunks better. 
      // If text is too long, we might need to chunk, but for a single page it should be fine.
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Please read the following text clearly and naturally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data returned from Gemini");
      }

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ctx,
        24000,
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      this.currentSource = source;
      
      return new Promise((resolve) => {
        source.onended = () => {
          this.currentSource = null;
          resolve();
        };
        source.start();
      });
    } catch (error) {
      console.error("Gemini TTS Error:", error);
      throw error;
    }
  }
}

export const ttsService = new GeminiTTSService();
