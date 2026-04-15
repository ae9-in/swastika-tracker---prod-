const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BE_Svf6qdHHV7LURYWMp0saljnoRmEoHviHVxN5Z_hydallZyx6dUT0mk135H_QtQ3rFCjCYu8lgc-PBKbSw2TM';

function base64UrlToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPush = async (userId, api) => {
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission === 'denied') return;

    try {
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        if (Notification.permission !== 'granted') return;

        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64UrlToUint8Array(publicVapidKey)
            });
        }

        await api.post('/auth/push-subscribe', { subscription });
        console.log('Push subscription successful');
    } catch (error) {
        console.error('Push registration failed:', error);
    }
};
