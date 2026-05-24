import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), content: z.string().min(1) }))
    .min(1),
  petName: z.string().optional(),
});

const SYSTEM_PROMPT = `Sen PetWhisper / PawHome uygulamasının VetAI asistanısın. Türkçe yanıt veriyorsun.
- Empatik, sabırlı ve net konuş.
- Kesin teşhis koyma; kullanıcıyı uygun durumda veteriner hekime yönlendir.
- Acil belirtiler (nefes darlığı, bilinç kaybı, ağır kanama, zehirlenme şüphesi, doğum güçlüğü) varsa derhal en yakın 24 saat açık veteriner kliniğine başvurmasını öner.
- Cevapları kısa tut, gerektiğinde maddeler halinde ver.
- İlaç doz önerisi vermekten kaçın; bu kararı veterinere bırak.`;

type Msg = { role: "user" | "model"; content: string };

async function callOpenAI(apiKey: string, system: string, messages: Msg[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.content,
        })),
      ],
      temperature: 0.6,
      max_tokens: 800,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "Bir yanıt üretilemedi.";
}

async function callGemini(apiKey: string, system: string, messages: Msg[]): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash-001";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("\n") ??
    "Bir yanıt üretilemedi."
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const systemContent = parsed.data.petName
    ? `${SYSTEM_PROMPT}\nKullanıcının dostu: ${parsed.data.petName}.`
    : SYSTEM_PROMPT;

  // Provider seçimi: OPENAI öncelikli, yoksa GEMINI
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    let reply: string;
    let provider: string;

    if (openaiKey) {
      reply = await callOpenAI(openaiKey, systemContent, parsed.data.messages);
      provider = "openai";
    } else if (geminiKey) {
      reply = await callGemini(geminiKey, systemContent, parsed.data.messages);
      provider = "gemini";
    } else {
      return NextResponse.json(
        {
          error:
            ".env içinde OPENAI_API_KEY veya GEMINI_API_KEY tanımlı değil.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply, provider });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "AI hatası", detail: msg }, { status: 502 });
  }
}
