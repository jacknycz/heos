import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { apiPatch } from "../api/client";

// Called after login/session-restore so a milestone push (server-side, see
// server/src/routes/hoursEntries.ts) actually has somewhere to land.
//
// getExpoPushTokenAsync() needs a real EAS projectId (set in app.json's extra.eas.projectId) and
// throws without one, or if it can't reach Expo's push service — either way, caught below so that
// degrades to "no push notifications" instead of breaking login.
export async function registerForPushNotifications() {
  if (Platform.OS === "web") return; // no push support in the web preview build

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let status = existingStatus;
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await apiPatch("/users/me/push-token", { pushToken: token.data });
  } catch (err) {
    console.warn("Could not register for push notifications (EAS project not configured yet?):", err);
  }
}
