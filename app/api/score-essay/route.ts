import { GoogleGenAI, Type, ApiError } from "@google/genai";
import { NextResponse } from "next/server";
import { humanizeGeminiError } from "@/lib/gemini-error";

export const runtime = "nodejs";
export const maxDuration = 30;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a scholarship essay coach for incoming college freshmen.

Score the student's draft on these dimensions:
- HOOK — does the opening grab? specific scene vs generic statement
- SPECIFICITY — one zoomed-in moment vs résumé summary
- VOICE — active and personal vs vague and abstract
- FIT — does it connect to what THIS scholarship org likely values
- WORD ECONOMY — filler, repetition, hedge words ("very", "really", "passionate"), passive voice
- CLOSING — does it tie back to the scholarship's mission, or trail off generically

Return 4 to 6 SHORT, ACTIONABLE feedback bullets. Each bullet must:
- State what's working OR what to fix — never just "good job"
- Cite SPECIFIC phrases from the draft in quotes when possible (e.g. \`The phrase "I am passionate about" appears 3 times — replace with action\`)
- Be ONE sentence, under 25 words
- Be direct and kind — talk to the student like a trusted teacher would

If the draft is too short or empty, return a single bullet saying so.
NEVER rewrite the essay for the student. NEVER give a numeric score or grade. Just bullets.
NEVER hallucinate phrases that aren't in the draft.

Calibrate to the scholarship name the user provides — different orgs reward different qualities (entrepreneurship awards reward grit; community foundations reward service; arts awards reward voice/vision).`;

const ESSAY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    feedback: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["feedback"],
};

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY. Add it to .env.local and restart the dev server." },
        { status: 401 }
      );
    }

    const { scholarship, draft } = (await request.json()) as {
      scholarship?: string;
      draft?: string;
    };

    if (!draft || typeof draft !== "string" || draft.trim().length < 20) {
      return NextResponse.json(
        { error: "Draft too short. Paste at least a paragraph." },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Scholarship the student is applying to: ${
        scholarship?.trim() || "(not specified — give general feedback)"
      }\n\n--- DRAFT START ---\n${draft.trim()}\n--- DRAFT END ---\n\nReturn 4 to 6 actionable feedback bullets as structured JSON.`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: ESSAY_SCHEMA,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Model returned no text content" },
        { status: 502 }
      );
    }

    let parsed: { feedback: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status ?? 500;
      if (status === 429) {
        return NextResponse.json(
          { error: "Rate limited. Try again in a moment." },
          { status: 429 }
        );
      }
      if (status === 401 || status === 403) {
        return NextResponse.json(
          { error: "Invalid or missing GEMINI_API_KEY." },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: humanizeGeminiError(error.message) }, { status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[score-essay]", error);
    return NextResponse.json({ error: humanizeGeminiError(message) }, { status: 500 });
  }
}
