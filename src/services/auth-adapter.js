/**
 * Адаптер для работы с аутентификацией
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const AuthServiceAPI = require('./auth-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const AuthService = AuthServiceAPI;

module.exports = AuthService;