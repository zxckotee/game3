/**
 * Адаптер для работы с market service
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const MarketServiceAPI = require('./market-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const Service = MarketServiceAPI;

// Экспортируем сервис
module.exports = Service;
