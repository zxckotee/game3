/**
 * Адаптер для выбора подходящего CultivationService в зависимости от среды выполнения
 * Безопасная версия, предотвращающая включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем API-версию для клиента
const CultivationServiceAPI = require('./cultivation-api'); // Через API (для браузера)

// Определение объекта сервиса в зависимости от окружения
let CultivationService;

// В браузере всегда используем API-версию
if (!isServerEnvironment) {
  CultivationService = CultivationServiceAPI;
} else {
  // В серверном окружении используем прямой доступ к БД
  try {
    // Используем прямой импорт на сервере
    const CultivationServiceDirect = require('./cultivation-service');
    CultivationService = CultivationServiceDirect.default || CultivationServiceDirect;
  } catch (error) {
    console.error('Ошибка при импорте серверного CultivationService:', error);
    console.warn('Используем API версию из-за ошибки импорта');
    
    // В случае ошибки используем API-версию
    CultivationService = CultivationServiceAPI;
  }
}

module.exports = CultivationService;