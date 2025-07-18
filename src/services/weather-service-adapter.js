/**
 * Адаптер для работы с weather service
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const WeatherServiceAPI = require('./weather-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const Service = WeatherServiceAPI;

// Экспортируем сервис
module.exports = Service;
