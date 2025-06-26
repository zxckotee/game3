/**
 * Адаптер для выбора подходящей версии weather-service.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const WeatherServiceAPI = require('./weather-service-api');

// Определение объекта в зависимости от окружения
let WeatherService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  WeatherService = WeatherServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerWeatherModule = require('./weather-service');
    
    // Создаем обертку, т.к. оригинальный WeatherService - это класс, который нужно инстанцировать
    class ServerWeatherServiceWrapper {
      // Статические методы, которые используются в клиентском коде
      static getCurrentWeather() {
        const service = new ServerWeatherModule.default();
        return service.initWeather();
      }
      
      static initWeather(location, worldTime) {
        const service = new ServerWeatherModule.default();
        return service.initWeather(location, worldTime);
      }
      
      static updateTime(currentWeather, location, worldTime, realMinutesPassed) {
        const service = new ServerWeatherModule.default();
        return service.updateTime(currentWeather, location, worldTime, realMinutesPassed);
      }
      
      // Также сохраняем статический TIME_MULTIPLIER
      static get TIME_MULTIPLIER() {
        return ServerWeatherModule.default.TIME_MULTIPLIER;
      }
      
      static set TIME_MULTIPLIER(value) {
        ServerWeatherModule.default.TIME_MULTIPLIER = value;
      }
      
      // Метод для безопасного обновления множителя
      static updateMultiplier(newValue) {
        return ServerWeatherModule.default.updateMultiplier(newValue);
      }
    }
    
    WeatherService = ServerWeatherServiceWrapper;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии weather-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    WeatherService = WeatherServiceAPI;
  }
}

// Экспортируем сервис
module.exports = WeatherService;