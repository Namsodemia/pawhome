import { NextRequest } from "next/server";

// Anthropic Messages API vekili: tarayıcıda anahtar yoksa istekler buradan geçer,
// sunucu ANTHROPIC_API_KEY'i ekler. Risk analizi bölümleri uzun sürebildiği için yanıt akış olarak aktarılır.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const UPSTREAM = "https://api.anthropic.com";
const FORWARD_HEADERS = ["content-type", "anthropic-version", "anthropic-beta", "accept"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json(
      { type: "error", error: { type: "api_error", message: "Sunucuda ANTHROPIC_API_KEY tanımlı değil." } },
      { status: 503 },
    );
  }
  const access = process.env.APP_ACCESS_CODE;
  if (access && req.headers.get("x-isgo-access") !== access) {
    return Response.json(
      { type: "error", error: { type: "permission_error", message: "Erişim kodu hatalı veya girilmemiş (Ayarlar > Yapay Zekâ)." } },
      { status: 403 },
    );
  }

  const { path } = await ctx.params;
  const target = (path || []).join("/");
  // Yalnızca Messages API'ye izin ver
  if (target !== "v1/messages") {
    return Response.json({ type: "error", error: { type: "not_found_error", message: "Desteklenmeyen uç nokta." } }, { status: 404 });
  }

  const headers = new Headers();
  for (const h of FORWARD_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("anthropic-version")) headers.set("anthropic-version", "2023-06-01");
  headers.set("x-api-key", key);

  const search = req.nextUrl.search || "";
  const upstream = await fetch(`${UPSTREAM}/${target}${search}`, {
    method: "POST",
    headers,
    body: req.body,
    // @ts-expect-error Node fetch akışlı gövde için gerekli
    duplex: "half",
    signal: req.signal,
  });

  const out = new Headers();
  for (const h of ["content-type", "request-id", "retry-after", "anthropic-ratelimit-requests-remaining"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("cache-control", "no-store");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
