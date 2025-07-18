/**
 * Адаптер для работы с group service
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const GroupServiceAPI = require('./group-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const Service = GroupServiceAPI;

// Экспортируем сервис
module.exports = Service;
