/**
 * Адаптер для работы с культивацией
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const CultivationServiceAPI = require('./cultivation-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const CultivationService = CultivationServiceAPI;

module.exports = CultivationService;