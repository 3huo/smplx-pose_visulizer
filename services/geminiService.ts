
import { GoogleGenAI, Type } from "@google/genai";
import { SMPLXParameters, INITIAL_SMPLX } from "../types";

// Fix: Initializing GoogleGenAI using a named parameter with process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePoseFromText = async (prompt: string): Promise<Partial<SMPLXParameters>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Create an SMPL-X body pose for the action: "${prompt}". 
      Return the pose as axis-angle values (radians) for 22 joints (66 floats). 
      Format the output as JSON with the key 'body_pose'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            body_pose: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: "Array of 66 floats representing 22 body joints in axis-angle format."
            },
            expression: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: "Array of 10 floats for facial expression."
            }
          },
          required: ["body_pose"]
        }
      }
    });

    // Fix: Access response.text property directly (not a method)
    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Gemini Error:", error);
    return { body_pose: INITIAL_SMPLX.body_pose };
  }
};
