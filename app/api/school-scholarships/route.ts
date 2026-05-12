import { GoogleGenAI, Type, ApiError } from "@google/genai";
import { humanizeGeminiError } from "@/lib/gemini-error";

export const runtime = "nodejs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are ScholarScout's school-specific researcher.

Given the name of a US college or university, return scholarships tied to THAT specific school — not generic national awards.

Two buckets:
1. INSTITUTIONAL — funded by the school itself: presidential/dean/merit awards, departmental scholarships, identity/diversity awards, honors college stipends, alumni-funded awards, athletics. Must be plausibly real for THIS school.
2. AROUND CAMPUS — local-to-the-school awards: nearby community foundations, town chambers of commerce, local employers / businesses near campus, Greek life foundations, regional civic clubs.

For each result include:
- name: real or plausibly-real specific scholarship name. If unsure, use a category description (e.g. "Computer Science Departmental Award") rather than fabricating a specific named scholarship.
- amount: award size as a string (e.g. "$5,000", "Full tuition", "$2,000/yr")
- deadline: approximate deadline as a string (e.g. "Mar 1, 2027", "Rolling", "After admission")
- type: one of "Merit" | "Departmental" | "Identity" | "Alumni" | "Honors" | "Athletic" | "Need-based" | "Local"
- desc: one or two sentences — what it's for, how to apply, any insider tip
- url: official URL if you know it confidently for THIS school, otherwise empty string ""

PRIORITIZE under-the-radar awards over the school's flagship merit scholarship that everyone already applies to.

NEVER invent fake-sounding specific scholarships. When in doubt use a category description.`;

const SCHOOL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    institutional: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING },
          deadline: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: [
              "Merit",
              "Departmental",
              "Identity",
              "Alumni",
              "Honors",
              "Athletic",
              "Need-based",
              "Local",
            ],
          },
          desc: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ["name", "amount", "deadline", "type", "desc", "url"],
        propertyOrdering: ["name", "amount", "deadline", "type", "desc", "url"],
      },
    },
    aroundCampus: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING },
          desc: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ["name", "amount", "desc", "url"],
        propertyOrdering: ["name", "amount", "desc", "url"],
      },
    },
  },
  required: ["institutional", "aroundCampus"],
};

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY. Add it to .env.local and restart the dev server." },
        { status: 401 }
      );
    }

    const { school } = (await request.json()) as { school?: string };
    if (!school || typeof school !== "string" || school.trim().length < 2) {
      return Response.json(
        { error: "School name required." },
        { status: 400 }
      );
    }

    // Inject today's date so the model recommends scholarships with future
    // deadlines instead of ones from its training cutoff.
    const today = new Date().toISOString().slice(0, 10);
    const systemInstruction = `${SYSTEM_PROMPT}\n\nToday's date is ${today}. ONLY recommend scholarships whose deadlines fall on or after today — never recommend awards whose deadlines have already passed. If unsure of the next deadline, use "Rolling", "Varies", or "After admission" instead of guessing a past date.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Target school: ${school.trim()}\n\nReturn 5-8 institutional scholarships and 3-5 around-campus scholarships tied to this school as structured JSON.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: SCHOOL_SCHEMA,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text;
    if (!text) {
      return Response.json(
        { error: "Model returned no text content" },
        { status: 502 }
      );
    }

    let parsed: { institutional: unknown; aroundCampus: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "Model returned invalid JSON" },
        { status: 502 }
      );
    }

    return Response.json(parsed);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status ?? 500;
      if (status === 429) {
        return Response.json(
          { error: "Rate limited. Try again in a moment." },
          { status: 429 }
        );
      }
      if (status === 401 || status === 403) {
        return Response.json(
          { error: "Invalid or missing GEMINI_API_KEY." },
          { status: 401 }
        );
      }
      return Response.json({ error: humanizeGeminiError(error.message) }, { status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[school-scholarships]", error);
    return Response.json({ error: humanizeGeminiError(message) }, { status: 500 });
  }
}
