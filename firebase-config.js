// Конфигурация Firebase (проект vppca-rmrp). Ключ apiKey публичный по своей природе; доступ ограничивают правила Firestore.
export const firebaseConfig = {
  apiKey: "AIzaSyAkQy3J_73B9vwFBnZ0mS8xt2ZMG3Twn-8",
  authDomain: "vppca-rmrp.firebaseapp.com",
  projectId: "vppca-rmrp",
  storageBucket: "vppca-rmrp.firebasestorage.app",
  messagingSenderId: "446917562781",
  appId: "1:446917562781:web:e09ce5e57187ca6b96df74"
};

// v228: App Check — reCAPTCHA Enterprise (Firebase → App Check → веб-приложение → reCAPTCHA Enterprise).
// Это КЛЮЧ САЙТА (публичный, тот же, что в App Check). Секретный/устаревший legacy-ключ сюда НЕ вписывать.
// Пусто — App Check на сайте выключен (ничего не ломается).
export const appCheckSiteKey = '6LfzMPotAAAAAFmBLMLPxIiVYpbIPuxHT7rUdZnn';
