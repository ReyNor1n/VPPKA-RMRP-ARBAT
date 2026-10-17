# Выпуск новой версии приложений (APK / Windows)

Приложения при запуске и каждые 30 минут читают `app-version.json` с сайта
(`cache: no-store`). Если версия там новее встроенной — в приложении появляется
кнопка «⟳ Обновить vX» (правый нижний угол), она открывает ссылку `url`.
Без интернета приложения показывают экран «Нет подключения к интернету»
и сами перезагружаются при появлении сети.

## Android (/workspace/vppka-apk)
1. `AndroidManifest.xml`: увеличить `versionCode` (+1) и `versionName`.
2. `MainActivity.java`: в строке `UPD` заменить `"1.2"` (`var P="android",V="..."`)
   на новую версию, и `VPPKA-App/x.y` в User-Agent.
3. Сборка: aapt2 compile/link → javac → d8 → добавить classes.dex → zipalign →
   apksigner с ТЕМ ЖЕ ключом `/workspace/.vppka-apk-keystore.jks`
   (пароль/alias в `.vppka-apk-keystore.txt`; ключ не терять и не менять,
   иначе обновление поверх не установится).
4. `gh release upload apk-v1 vppka.apk --clobber -R ReyNor1n/VPPKA-RMRP-ARBAT`
   (ссылка на скачивание остаётся прежней).

## Windows (/workspace/vppka-desktop)
1. `package.json` → `version`; в `main.js` в строке `UPD` заменить `V="1.1.0"`.
   Имена файлов (`...-1.0.0.exe`) НЕ менять — на них ссылаются сайт и app-version.json.
2. `npm run dist`
3. `gh release upload win-v1 dist/VPPKA-Arbat-Setup-1.0.0.exe dist/VPPKA-Arbat-Portable-1.0.0.exe --clobber -R ReyNor1n/VPPKA-RMRP-ARBAT`

## Сайт
Обновить `app-version.json` (android.version / versionCode, windows.version),
закоммитить и запушить. Только после загрузки файлов в релизы!
