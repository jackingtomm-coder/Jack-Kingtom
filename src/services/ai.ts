import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCharacter = async (prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Create a high-quality character portrait based on this description: ${prompt}. The character should be centered, clear, and on a simple background suitable for a character profile.`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const generateScene = async (
  scenePrompt: string, 
  characters: { imageUrl: string; name: string }[], 
  aspectRatio: '1:1' | '16:9' | '9:16'
) => {
  const ai = getAI();
  
  const characterParts = characters.map((char, index) => ({
    inlineData: {
      data: char.imageUrl.split(',')[1],
      mimeType: "image/png",
    },
  }));

  const textPart = {
    text: `Create a complete scene with the provided characters. 
    Scene Description: ${scenePrompt}. 
    The characters provided in the images should be integrated naturally into this scene. 
    Maintain their visual identity and style. 
    Aspect Ratio: ${aspectRatio}.`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [...characterParts, textPart],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const editScene = async (
  baseImageUrl: string,
  editPrompt: string
) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: baseImageUrl.split(',')[1],
            mimeType: "image/png",
          },
        },
        {
          text: `Modify this image based on the following request: ${editPrompt}. Keep the main characters and composition similar but apply the requested changes.`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};
