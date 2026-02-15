
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Ensure process.env doesn't throw ReferenceError
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

/**
 * Global handler for Gemini API errors.
 * Specifically handles 403 (Permission Denied) and 404 (Not Found).
 */
export const handleApiError = async (error: any) => {
  const errorMsg = error?.message || "";
  const isPermissionError = errorMsg.includes("403") || errorMsg.toLowerCase().includes("permission") || errorMsg.toLowerCase().includes("not have permission");
  const isNotFoundError = errorMsg.includes("404") || errorMsg.toLowerCase().includes("not found");

  if ((isPermissionError || isNotFoundError) && (window as any).aistudio) {
    console.warn("Permission or Entity error detected. Prompting for API key selection.");
    try {
      await (window as any).aistudio.openSelectKey();
    } catch (e) {
      console.error("Failed to open key selector:", e);
    }
  }
  throw error;
};

/**
 * Helper to get a fresh instance of GoogleGenAI with the current API key.
 * This ensures we always use the latest key from the selection dialog.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please select an API key to continue.");
  }
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  // Fix: Implemented chat using the recommended chat interface
  async chat(message: string) {
    try {
      const ai = getAI();
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: "You are Lumio AI, a humanistic and warm assistant. Speak naturally and be friendly.",
        }
      });
      return await chat.sendMessage({ message });
    } catch (err) {
      return await handleApiError(err);
    }
  },

  // Fix: Implemented speak for text-to-speech using gemini-2.5-flash-preview-tts
  async speak(text: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say naturally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) {
      return await handleApiError(err);
    }
  },

  // Fix: Implemented research using Google Search grounding
  async research(query: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      return response;
    } catch (err) {
      return await handleApiError(err);
    }
  },

  // Fix: Implemented createPrompt for transforming instructions into detailed prompts
  async createPrompt(instruction: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Convert this simple instruction into a clean, structured, AI-ready detailed prompt: "${instruction}"`,
      });
      return response.text;
    } catch (err) {
      return await handleApiError(err);
    }
  },

  // Fix: Implemented generateCode for single-file solutions
  async generateCode(instruction: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a single file HTML/CSS/JS solution for: "${instruction}". Return only the code in a single code block.`,
      });
      return response.text;
    } catch (err) {
      return await handleApiError(err);
    }
  },

  // Fix: Completed generateSlides with proper JSON schema and return value to fix SlideMakerView error
  async generateSlides(topic: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a high-end, unique presentation structure about "${topic}". 
        Create exactly 6 slides. Vary the layoutTypes across: SPLIT, HERO, GRID, FEATURE, MINIMAL.
        Provide detailed, artistic imagePrompts that would result in cinematic, modern photography or high-tech 3D renders.
        Output as a JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                imagePrompt: { type: Type.STRING },
                layoutType: { type: Type.STRING, description: "One of: SPLIT, HERO, GRID, FEATURE, MINIMAL" },
              },
              required: ["title", "bullets", "imagePrompt", "layoutType"],
            },
          },
        },
      });
      const text = response.text;
      return JSON.parse(text || "[]");
    } catch (err) {
      return await handleApiError(err);
    }
  },

  // Fix: Added generateImage supporting standard and high-resolution models for MediaGeneratorView and SlideMakerView
  async generateImage(prompt: string, options?: { aspectRatio?: string, size?: string }) {
    try {
      const ai = getAI();
      const isPro = options?.size === '2K' || options?.size === '4K';
      const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: options?.aspectRatio as any || '1:1',
            imageSize: isPro ? options?.size as any : undefined,
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
    } catch (err) {
      return await handleApiError(err);
    }
  },

  // Fix: Added generateVideo with operation polling for MediaGeneratorView
  async generateVideo(prompt: string, aspectRatio: string = '16:9') {
    try {
      const ai = getAI();
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio as any,
        },
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) return null;

      const videoResp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await videoResp.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      return await handleApiError(err);
    }
  }
};
