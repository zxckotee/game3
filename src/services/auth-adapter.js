/**
 * Адаптер для выбора подходящего AuthService в зависимости от среды выполнения
 * Безопасная версия, предотвращающая включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем API-версию для клиента
const AuthServiceAPI = require('./auth-api'); // Через API (для браузера)

// Определение объекта сервиса в зависимости от окружения
let AuthService;

// В браузере всегда используем API-версию
if (!isServerEnvironment) {
  AuthService = AuthServiceAPI;
} else {
  // В серверном окружении используем прямой доступ к БД
  try {
    // Используем прямой импорт на сервере
    const AuthServiceDirect = require('./auth');
    AuthService = AuthServiceDirect.default || AuthServiceDirect;
  } catch (error) {
    console.error('Ошибка при импорте серверного AuthService:', error);
    console.warn('Используем API версию из-за ошибки импорта');
    
    // В случае ошибки используем API-версию
    AuthService = AuthServiceAPI;
  }
}

module.exports = AuthService;