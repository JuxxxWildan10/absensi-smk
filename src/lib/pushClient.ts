const urlB64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// VAPID Public Key - Must match the one used in the backend
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BETO6krStUGreV-1DqYrtliy7olYfeUZtEWTjG8yQOUTE9O3S1AsYsPCKwMIE7GH91sU4MujfkdsU1ybv59sNZA";

export async function subscribeToPush(userId: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push messaging is not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Prompt user for permission and subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicVapidKey),
      });
    }

    // Send subscription to server
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subscription }),
    });

    console.log("Push subscribed successfully");
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
  }
}
