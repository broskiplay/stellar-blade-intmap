# 🗺 Интерактивная карта Stellar Blade by BroskiPlay

Фанатский проект сообщества BroskiPlay для исследования локаций Stellar Blade, поиска коллекционных предметов и отслеживания игрового прогресса.

**Сайт проекта:** [broskiplay.github.io/stellar-blade-intmap](https://broskiplay.github.io/stellar-blade-intmap/)

> Проект не связан с SHIFT UP Corporation или Sony Interactive Entertainment и не является официальным продуктом игры.

## Реализовано

| Локация | Карта | База меток |
| --- | --- | --- |
| Эйдос 7 (Eidos 7) | [Открыть карту](eidos7.html) | [База меток JSON](%21metki%20eidos-7%20FINAL.json) |
| Ксион (Xion) | [Открыть карту](xion.html) | [База меток JSON](%21metki%20XION%20FINAL.json) |
| Пустошь (Wasteland) | [Открыть карту](wasteland.html) | [База меток JSON](%21metki%20Wasteland%20FINAL.json) |
| Атлесс Левуар (Altess Levoire) | [Открыть карту](altess_levoire.html) | [База меток JSON](altess_levoire_data.json) |
| Матрица 11 (Matrix 11) | [Открыть карту](matrix11.html) | [База меток JSON](stellar_blade_matrix-11_markers.json) |
| Великая пустыня (Great Desert) | [Открыть карту](great_desert.html) | [База меток JSON](stellar_blade_great-desert_markers.json) |
| Бездна Левуар (Abyss Levoire) | [Открыть карту](abyss_levoire.html) | [База меток JSON](stellar_blade_abyss-levoire_markers.json) |
| Шпиль 4 (Spire 4) | [Открыть карту](spire4.html) | [База меток JSON](stellar_blade_spire-4_markers.json) |
| Эйдос 9 (Eidos 9) | [Открыть карту](eidos9.html) | [База меток JSON](stellar_blade_eidos-9_markers.json) |

На каждой карте доступны поиск по названию и описанию, фильтры по категориям, счётчик собранных меток, просмотр описания и отметка найденных предметов. Картографический интерфейс построен на Leaflet с простой системой координат и отдельным изображением для каждой локации.

## Возможности

- **Отметки и фильтры.** Отмечайте найденное кнопкой в карточке метки или правой кнопкой мыши. Переключайте категории и следите за прогрессом по каждой из них.
- **Права доступа.** Посетители могут добавлять собственные метки и вести прогресс. Управление общей базой и её экспорт доступны создателю карты после входа через Google.
- **Локальное сохранение.** Прогресс и пользовательские метки сохраняются в браузере. Прогресс можно импортировать и экспортировать как JSON; создатель может экспортировать общую базу меток для публикации в репозитории.
- **Синхронизация Firebase.** После входа через Google личные отметки и пользовательские метки синхронизируются через Cloud Firestore между устройствами. При отсутствии сети данные остаются локально; синхронизация повторяется после восстановления соединения.

## Управление

| Действие | Как выполнить |
| --- | --- |
| Найти метку | Введите название или описание в строку поиска |
| Отметить найденное | Нажмите метку правой кнопкой мыши или кнопку в её карточке |
| Переместить общую метку | Войдите в аккаунт создателя, затем зажмите `Ctrl` и перетащите её левой кнопкой мыши |
| Добавить собственную метку | Включите режим добавления и нажмите на нужное место карты |
| Скрыть категорию | Нажмите на её название в списке фильтров |

### Настройка правил Firebase

Личные метки и прогресс хранятся в `users/{uid}`. Чтобы пользователи могли синхронизировать их только со своими аккаунтами, опубликуйте [firestore.rules](./firestore.rules) в проекте Firebase `broskiplaymaps` через Firebase Console → Firestore Database → Rules. Не заменяйте правила в проекте, если в них есть другие нужные приложению разрешения.

## Запуск локально

Проект не требует сборки: это статические HTML-, CSS- и JavaScript-файлы. Чтобы браузер мог загружать JSON-базы через `fetch`, запустите HTTP-сервер из корня репозитория:

```bash
python3 -m http.server 8000
```

Затем откройте [http://localhost:8000](http://localhost:8000). Для Google-входа домен сайта должен быть разрешён в настройках Firebase Authentication. Firebase и Leaflet загружаются с внешних CDN, поэтому для их работы требуется подключение к интернету.

## Технологии

- HTML5, CSS3 и JavaScript без фреймворков
- [Leaflet.js](https://leafletjs.com/) и `L.CRS.Simple`
- Firebase Authentication и Cloud Firestore
- GitHub Pages

## Ссылки

- [Twitch: BroskiPlay](https://www.twitch.tv/broskiplay)
- [YouTube: BroskiPlay](https://youtube.com/@broskiplayt)
- [Поддержать проект на DonationAlerts](https://www.donationalerts.com/r/broskiplay)

---

*Stellar Blade™ is a trademark of SHIFT UP Corporation. This fan-made project is not affiliated with or endorsed by SHIFT UP Corporation or Sony Interactive Entertainment.*
