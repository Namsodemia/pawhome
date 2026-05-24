import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), content: z.string().min(1) }))
    .min(1),
  petName: z.string().optional(),
});

const SYSTEM_PROMPT = `Sen PetWhisper uygulamasının VetAI asistanısın. Türkçe yanıt veriyorsun.
- Empatik, sabırlı ve net konuş.
- Kesin teşhis koyma; kullanıcıyı uygun durumda veteriner hekime yönlendir.
- Acil belirtiler (nefes darlığı, bilinç kaybı, ağır kanama, zehirlenme şüphesi, doğum güçlüğü) varsa derhal en yakın 24 saat açık veteriner kliniğine başvurmasını öner.
- Cevapları kısa tut, gerektiğinde maddeler halinde ver.
- İlaç doz önerisi vermekten kaçın; bu kararı veterinere bırak.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY tanımlı değil." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const systemContent = parsed.data.petName
    ? `${SYSTEM_PROMPT}\nKullanıcının dostu: ${parsed.data.petName}.`
    : SYSTEM_PROMPT;

  const openaiMessages = [
    { role: "system", content: systemContent },
    ...parsed.data.messages.map((m) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: openaiMessages,
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "OpenAI hatası", detail: text }, { status: 502 });
  }

  const data = await res.json();
  const reply: string =
    data?.choices?.[0]?.message?.content ?? "Bir yanıt üretilemedi.";
  return NextResponse.json({ reply });
}
