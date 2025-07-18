/**
 * Адаптер для работы с merchant
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const MerchantAPI = require('./merchant-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const Service = MerchantAPI;

// Экспортируем сервис
module.exports = Service;
