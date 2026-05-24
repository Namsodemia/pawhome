import webpush from "web-push";
import { prisma } from "./prisma";

let configured = false;
function configure() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@pawhome.app";
  if (!pub || !priv) return;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Belirli kullanıcıya tüm cihazlarına push gönderir. */
export async function sendPushToUser(userId: number, payload: PushPayload) {
  configure();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      )
    )
  );

  // Cleanup: expired/gone subscriptions
  const toDelete: number[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const err = r.reason as { statusCode?: number };
      if (err.statusCode === 404 || err.statusCode === 410) {
        toDelete.push(subs[i].id);
      }
    }
  });
  if (toDelete.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } });
  }

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    cleaned: toDelete.length,
  };
}

/** Tüm kullanıcılara broadcast — admin için */
export async function sendPushToAll(payload: PushPayload) {
  configure();
  const subs = await prisma.pushSubscription.findMany();
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      )
    )
  );
  return {
    total: subs.length,
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}
