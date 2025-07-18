/**
 * Адаптер для работы с group activity service
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const GroupActivityServiceAPI = require('./group-activity-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const Service = GroupActivityServiceAPI;

// Экспортируем сервис
module.exports = Service;
