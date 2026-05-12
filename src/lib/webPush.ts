import webpush from "web-push";

// Define your VAPID keys from environment variables
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "BETO6krStUGreV-1DqYrtliy7olYfeUZtEWTjG8yQOUTE9O3S1AsYsPCKwMIE7GH91sU4MujfkdsU1ybv59sNZA";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "-ZrgCe58FhkGzzwCiT3cw0UJVc6OZSx6LBo4sWDCqiE";

webpush.setVapidDetails(
  "mailto:admin@absensismk.com", // Contact email
  publicVapidKey,
  privateVapidKey
);

export async function sendWebPushNotification(subscriptionJson: string, title: string, message: string) {
  try {
    const subscription = JSON.parse(subscriptionJson);
    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/logo-smk.jpg",
      badge: "/logo-smk.jpg",
    });

    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}
