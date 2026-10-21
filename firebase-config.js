// Конфигурация Firebase (проект vppca-rmrp). Ключ apiKey публичный по своей природе; доступ ограничивают правила Firestore.
export const firebaseConfig = {
  apiKey: "AIzaSyAkQy3J_73B9vwFBnZ0mS8xt2ZMG3Twn-8",
  authDomain: "vppca-rmrp.firebaseapp.com",
  projectId: "vppca-rmrp",
  storageBucket: "vppca-rmrp.firebasestorage.app",
  messagingSenderId: "446917562781",
  appId: "1:446917562781:web:e09ce5e57187ca6b96df74"
};

// v223: App Check (reCAPTCHA v3). Ключ САЙТА (публичный) из консоли reCAPTCHA / Firebase App Check → вписать сюда.
// Пусто — App Check на сайте выключен (ничего не ломается). Секретный ключ сюда НЕ вписывать.
export const appCheckSiteKey = '';
