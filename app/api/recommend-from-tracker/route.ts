import { GoogleGenAI, Type, ApiError } from "@google/genai";
import { NextResponse } from "next/server";
import { humanizeGeminiError } from "@/lib/gemini-error";

export const runtime = "nodejs";
// Same headroom as the other Gemini routes — see find-scholarships for context.
export const maxDuration = 30;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are ScholarScout, recommending COMPLEMENTARY scholarships based on what a student is already pursuing in their tracker.

You will be given a list of scholarships the student has already added to their personal tracker. Your job: suggest 5 to 8 ADDITIONAL scholarships they should also apply to, based on the patterns you see in their existing list.

Inference rules:
- If the existing list skews local (Rotary, Kiwanis, community foundations) -> suggest more local awards from adjacent civic orgs (Lions, Elks, JCI, American Legion).
- If the existing list skews identity-based (HSF, NACME, etc) -> suggest more identity-aligned awards (department-specific, professional org chapters, cultural foundations).
- If the existing list skews major-aligned (CS, engineering, etc) -> suggest more departmental + professional society awards in that major.
- If the existing list skews creative (Doodle for Google, art portfolios) -> suggest more contest-based + portfolio-judged awards.
- If the list mixes -> suggest from across the gaps the student hasn't covered yet (e.g. they have local + national but no employer/parent-employer awards).

Return scholarships ranked by:
1. Low competition (smaller applicant pool = better odds)
2. Complementary fit with what they're already pursuing
3. Reward-to-effort ratio

For each result include:
- name: real or plausibly-real specific scholarship name. Do NOT invent fake-sounding specific names.
- amount: award size as a plain ASCII string. Use a hyphen for ranges, not an en-dash. Examples: "$2,500", "$1,000-$5,000", "Full tuition". DO NOT use en-dash (U+2013) or em-dash (U+2014) characters.
- deadline: approximate deadline as a string (e.g. "Mar 15, 2027", "Rolling", "Varies by chapter")
- competition: "Very low" | "Low" | "Medium"
- match: integer 0 to 100 how well it complements THIS student's existing tracker
- tags: 1 to 4 short tag strings
- why: one or two sentences explaining WHY this fills a gap or pattern in their existing list. Be specific — reference the existing scholarships you noticed.
- url: ALWAYS try to provide a URL. Order of preference:
    1. The exact official scholarship application page if you know it confidently
    2. The funding organization's main website
    3. Empty string "" only if you have no confident URL at all
  Do NOT invent URLs.

CRITICAL: Do NOT recommend any scholarship that is already in the student's existing tracker list. Each result must be NEW.`;

const RECOMMEND_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING },
          deadline: { type: Type.STRING },
          competition: { type: Type.STRING, enum: ["Very low", "Low", "Medium"] },
          match: { type: Type.INTEGER },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          why: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ["name", "amount", "deadline", "competition", "match", "tags", "why", "url"],
        propertyOrdering: ["name", "amount", "deadline", "competition", "match", "tags", "why", "url"],
      },
    },
  },
  required: ["results"],
};

type TrackerRow = {
  name: string;
  award?: string;
  deadline?: string;
  status?: string;
  notes?: string;
};

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY. Add it to .env.local and restart the dev server." },
        { status: 401 }
      );
    }

    const { rows, materials } = (await request.json()) as {
      rows?: TrackerRow[];
      materials?: string[];
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Add at least one scholarship to your tracker to get personalized recommendations." },
        { status: 400 }
      );
    }

    // Strip the heavy fields (status, submitted, ids) — model only needs the
    // identity + amount + deadline + notes to infer patterns.
    const summarized = rows.map((r) => ({
      name: r.name || "(unnamed)",
      award: r.award || "",
      deadline: r.deadline || "",
      notes: r.notes || "",
    }));

    const today = new Date().toISOString().slice(0, 10);
    const systemInstruction = `${SYSTEM_PROMPT}\n\nToday's date is ${today}. ONLY recommend scholarships whose deadlines fall on or after today. If unsure of the next deadline, use "Rolling" or "Varies" instead of guessing a past date.`;

    const userContents = `The student is currently tracking these scholarships:\n\n${JSON.stringify(
      summarized,
      null,
      2
    )}${
      materials && materials.length > 0
        ? `\n\nThey have these reusable application materials prepared: ${materials.join(", ")}.`
        : ""
    }\n\nReturn 5 to 8 NEW complementary scholarships as structured JSON. Do not repeat any of the names listed above.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userContents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RECOMMEND_SCHEMA,
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

    let parsed: { results: unknown };
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
    console.error("[recommend-from-tracker]", error);
    return NextResponse.json({ error: humanizeGeminiError(message) }, { status: 500 });
  }
}
