import { Expo, type ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

// Fire-and-forget push via Expo's own push service — no third-party provider needed since this
// is an Expo-managed app. Silently drops invalid tokens and logs (doesn't throw) on send failure,
// since a milestone still got hit and recorded either way; the notification is a bonus.
export async function sendPushNotification(tokens: string[], title: string, body: string) {
  const messages: ExpoPushMessage[] = tokens.filter((t) => Expo.isExpoPushToken(t)).map((to) => ({ to, sound: "default", title, body }));
  if (messages.length === 0) return;

  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error("Failed to send a push notification chunk:", err);
    }
  }
}
