
import { GoogleGenAI, Type } from "@google/genai";
import type { ActionItem } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A short, concise title for the Trello card (under 10 words)."
      },
      description: {
        type: Type.STRING,
        description: "A detailed description of the action item, including context from the transcript."
      },
    },
    required: ["title", "description"],
  },
};

export const findActionItemsFromTranscript = async (transcript: string): Promise<ActionItem[]> => {
  try {
    const prompt = `
      Analyze the following meeting transcript or summary.
      Your task is to identify all distinct action items. An action item is a task, assignment, or commitment that needs to be completed by someone.
      For each action item you find, create a title and a description.
      - The 'title' should be a brief, clear summary of the task, suitable for a Trello card title.
      - The 'description' should provide more detail and context about the task based on the transcript.

      Here is the transcript:
      ---
      ${transcript}
      ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const parsedResponse = JSON.parse(response.text);

    if (!Array.isArray(parsedResponse)) {
        throw new Error("Gemini did not return a valid array of action items.");
    }
    
    // Add a unique ID to each item for React key and state management
    return parsedResponse.map((item: Omit<ActionItem, 'id'>) => ({
        ...item,
        id: crypto.randomUUID(),
    }));

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to extract action items from the transcript. The model may have returned an unexpected format.");
  }
};
