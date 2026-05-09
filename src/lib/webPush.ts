import webpush from "web-push";

// Define your VAPID keys from environment variables
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "BE-J0z8Mb-jQhy6eQeZox62xtkBp28LiZ8pTtTmtS69alWxmHvAJ_JVB0XHYFfpcVz2BsNjd0Kfr3HdrSqS-TPc";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "lWxmHvAJ_JVB0XHYFfpcVz2BsNjd0Kfr3HdrSqS-TPc";

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
