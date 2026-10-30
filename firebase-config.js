// Конфигурация Firebase (проект vppca-rmrp). Ключ apiKey публичный по своей природе; доступ ограничивают правила Firestore.
export const firebaseConfig = {
  apiKey: "AIzaSyAkQy3J_73B9vwFBnZ0mS8xt2ZMG3Twn-8",
  authDomain: "vppca-rmrp.firebaseapp.com",
  projectId: "vppca-rmrp",
  storageBucket: "vppca-rmrp.firebasestorage.app",
  messagingSenderId: "446917562781",
  appId: "1:446917562781:web:e09ce5e57187ca6b96df74"
};

// Ключ сайта App Check (reCAPTCHA Enterprise), публичный. Секретный ключ сюда не писать.
// Пустая строка — App Check на сайте выключен.
export const appCheckSiteKey = '6LfzMPotAAAAAFmBLMLPxIiVYpbIPuxHT7rUdZnn';

// Официальный вход через Discord (OAuth2): публичный id приложения бота и адрес возврата —
// он должен совпадать с Redirect URI в Discord Developer Portal → OAuth2. Client Secret — только у бота, сюда не писать.
export const discordOAuth = { clientId: '1560986799927599205', redirect: 'https://vppka-arbat-rmrp.ru/' };
