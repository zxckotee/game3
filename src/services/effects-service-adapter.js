/**
 * Адаптер для работы с эффектами
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const EffectsServiceAPI = require('./effects-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const EffectsService = EffectsServiceAPI;

module.exports = EffectsService;