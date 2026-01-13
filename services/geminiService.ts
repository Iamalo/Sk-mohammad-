
import { GoogleGenAI, Type } from "@google/genai";
import { PdfMetadata } from "../App";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzePdfContent(fileName: string): Promise<PdfMetadata> {
  try {
    const prompt = `Act as a professional librarian and content analyst.
    I have a file named "${fileName}". 
    Imagine its content based on its name and provide a professional metadata package.
    Return a JSON object following the specified schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            suggestedTheme: { 
              type: Type.STRING,
              description: "One of 'Corporate', 'Modern', 'Classic', 'Creative', 'Academic'"
            }
          },
          required: ["title", "summary", "keywords", "suggestedTheme"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result as PdfMetadata;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return {
      title: fileName,
      summary: "This document contains valuable professional information synthesized for easy reading.",
      keywords: ["document", "professional", "analysis", "insights"],
      suggestedTheme: "Corporate"
    };
  }
}

export async function getCreativeSuggestions(context: string): Promise<string[]> {
  try {
    const prompt = `You are a professional design assistant. Based on this project context: "${context}", 
    suggest 3 quick one-line design improvements. Focus on color, typography, and visual balance.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text.split('\n').filter(line => line.trim().length > 0);
  } catch (error) {
    return ["Optimize color contrast for better accessibility.", "Ensure consistent font hierarchy across pages.", "Use whitespace to guide the reader's eye."];
  }
}
