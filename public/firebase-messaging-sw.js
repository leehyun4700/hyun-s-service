// 이 파일은 브라우저 백그라운드에서 푸시 알림을 수신하기 위한 서비스워커입니다.
// Firebase 버전에 맞는 스크립트를 임포트합니다.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase 콘솔에서 발급받은 실제 설정값으로 수동 교체되어야 합니다.
// (import.meta.env 를 서비스워커에서 직접 쓸 수 없기 때문입니다)
const firebaseConfig = {
    apiKey: "AIzaSyBheVR2i3SIU44SNg7_yy_HBnalxGmOOW4",
    authDomain: "sample-firebase-ai-app-ec74e.firebaseapp.com",
    projectId: "sample-firebase-ai-app-ec74e",
    storageBucket: "sample-firebase-ai-app-ec74e.firebasestorage.app",
    messagingSenderId: "306184065621",
    appId: "1:306184065621:web:de94936b2814ad9570badc"
};

// VITE 빌드 시점에 환경변수를 주입하는 플러그인을 쓰거나, 
// 사용자에게 직접 파일 내부에 값을 넣으라고 안내하는 방식이 일반적입니다.
// 현재는 뼈대만 잡아둡니다.

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function (payload) {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/vite.svg'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.log('Firebase background setup failed', e);
}
