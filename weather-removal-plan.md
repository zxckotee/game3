# План по удалению системы погоды

## 1. Удаление файлов

Удалите следующие файлы:

- src/context/middleware/weatherMiddleware.js
- src/services/weather-service-adapter.js
- src/services/weather-service-api.js
- src/services/weather-service.js
- src/components/screens/WeatherDetailScreen.js
- src/models/weather-system.js

## 2. Обновление компонентов пользовательского интерфейса

1. Обновите файл src/components/pages/GamePage.js:
   - Удалите импорт INITIALIZE_WEATHER из '../../context/actions/weather-actions'
   - Удалите импорт WeatherService из '../../services/weather-service'
   - Удалите импорт ForecastWidget из '../world/ForecastWidget'
   - Удалите импорт WeatherDetailScreen из '../screens/WeatherDetailScreen'
   - Удалите состояние showWeatherDetail и связанную с ним логику
   - Удалите useEffect, инициализирующий погоду (действие INITIALIZE_WEATHER)
   - Удалите рендеринг компонентов ForecastWidget и WeatherDetailScreen

2. Удалите все компоненты, отображающие погоду:
   - Найдите и удалите компоненты типа WeatherDisplay, ForecastWidget и т.п.
   - Проверьте src/components/ui/TopTimeWeatherBar.js и удалите все элементы, связанные с погодой

3. Обновите src/components/debug/TimeDebugPanel.js:
   - Удалите все элементы, связанные с отображением и отладкой погоды

4. Проверьте и обновите src/hooks/useTimeWeather.js:
   - Удалите всю логику, связанную с погодой
   - Переименуйте хук в useGameTime.js, если он больше не содержит информации о погоде

## 3. Обновление состояния Redux и контекста

1. В файле src/context/GameContextProvider.js:
   - Удалите импорты, связанные с погодой (updateWeather, setTimeOfDay, triggerWeatherEvent, updateGameTime)
   - Удалите weatherMiddleware из цепочки middleware
   - Удалите все действия, связанные с погодой, из объекта actions
   - Обновите логику инициализации игры, чтобы она не включала инициализацию погоды

2. В файле src/context/reducers/worldReducer.js:
   - Удалите все части состояния, связанные с погодой
   - Удалите все обработчики действий, связанные с погодой
   - Обновите логику обработки UPDATE_TIME, чтобы она не включала обновление погоды

3. В файле src/context/actions/actionTypes.js:
   - Удалите все типы действий, связанные с погодой

4. Удалите файл src/context/actions/weather-actions.js, если он существует

## 4. Обновление игровой логики

1. В файле src/components/pages/GamePage.js:
   - Обновите useEffect для имитации игрового времени, удалив любые упоминания о погоде
   - Проверьте и обновите другие части кода, которые могут зависеть от погодных данных

2. В файле src/components/combat/CombatManager.js:
   - Удалите все упоминания о погоде и её влиянии на бой

3. В файле src/components/world/CombatArea.js:
   - Удалите все элементы, отображающие погоду
   - Удалите логику, связанную с влиянием погоды на игровой процесс

4. В файле src/data/enemies.js:
   - Удалите все модификаторы и логику, связанную с погодой

5. В файлах src/utils/effectsCore.js и src/utils/effectsUtils.js:
   - Удалите все эффекты и логику, связанную с погодой

## 5. Очистка ресурсов

1. Удалите директорию src/assets/images/weather/ и все содержащиеся в ней изображения

## 6. Обновление базы данных

1. Удалите файл миграции src/migrations/2025-03-23-create-weather-system.js
2. Проверьте другие файлы миграций на наличие полей, связанных с погодой, и удалите их

## 7. Обновление документации

1. Просмотрите все файлы в директории docs/ (если она существует) и удалите все упоминания о системе погоды

## 8. Обновление тестов

1. Удалите все тесты, связанные с погодой
2. Обновите существующие тесты, убрав ожидания, связанные с погодой

## 9. Финальная проверка

1. Выполните поиск по всему проекту на наличие слов "weather", "погода", "climate", "климат"
2. Удалите все оставшиеся упоминания о погоде, которые не были охвачены предыдущими шагами

## 10. Обновление зависимостей

1. Проверьте файл package.json и удалите все зависимости, которые использовались исключительно для системы погоды

После выполнения всех этих шагов, система погоды должна быть полностью удалена из игры. Убедитесь, что игра компилируется и запускается без ошибок после внесения всех изменений.