/**
 * Адаптер для работы с reputation service
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const ReputationServiceAPI = require('./reputation-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const Service = ReputationServiceAPI;

// Экспортируем сервис
module.exports = Service;
