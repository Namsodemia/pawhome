export const dynamic = "force-dynamic";

/** Arayüzün yapay zekâ uyarı bandını doğru göstermesi için sunucu yapılandırmasını bildirir (anahtarın kendisini değil). */
export function GET() {
  return Response.json({
    serverKey: Boolean(process.env.ANTHROPIC_API_KEY),
    accessCodeRequired: Boolean(process.env.APP_ACCESS_CODE),
  });
}
