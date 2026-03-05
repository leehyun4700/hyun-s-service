import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth } from "firebase/auth";

// Firebase 설정 - .env.local 에서 가져옵니다.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let messaging;
let auth;

// 환경변수가 제대로 로드되었는지 체크 후 초기화
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        auth = getAuth(app);
    } catch (error) {
        console.error("Firebase initialization error", error);
    }
} else {
    console.warn("Firebase credentials are not set in environment variables");
}

export const requestForToken = async () => {
    if (!messaging) return null;

    try {
        const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY // VAPID 키 세팅 필요
        });

        if (currentToken) {
            console.log('Firebase Token obtained:', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });

/**
 * FCM 직접 발송 함수 (Legacy HTTP API 사용)
 * 보안상 서버(Edge Function)에서 보내는 것이 좋으나, 
 * 현재 환경을 고려하여 클라이언트에서 직접 발송하도록 구현합니다.
 */
export const sendPushNotification = async (toToken, title, body) => {
    // .env.local에 VITE_FIREBASE_FCM_SERVER_KEY 가 설정되어 있어야 합니다.
    const serverKey = import.meta.env.VITE_FIREBASE_FCM_SERVER_KEY;

    if (!serverKey) {
        console.warn("FCM Server Key is not set. Notification skipped.");
        return null;
    }

    try {
        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `key=${serverKey}`
            },
            body: JSON.stringify({
                to: toToken,
                notification: {
                    title: title,
                    body: body,
                    icon: "/vite.svg"
                },
                data: {
                    click_action: "FLUTTER_NOTIFICATION_CLICK"
                }
            })
        });

        const result = await response.json();
        console.log("FCM send result:", result);
        return result;
    } catch (err) {
        console.error("Error sending FCM notification:", err);
        return null;
    }
};

export { messaging, auth };
