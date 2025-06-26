/**
 * Адаптер для выбора подходящего EffectsService в зависимости от среды выполнения
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем API-версию для клиента
const EffectsServiceAPI = require('./effects-service-api');

// Определение объекта сервиса в зависимости от окружения
let EffectsService;

// В браузере всегда используем API-версию
if (!isServerEnvironment) {
  EffectsService = EffectsServiceAPI;
} else {
  // В серверном окружении используем прямой доступ к БД
  try {
    // Используем прямой импорт на сервере
    const EffectsServiceDirect = require('./effects-service');
    EffectsService = EffectsServiceDirect.default || EffectsServiceDirect;
  } catch (error) {
    console.error('Ошибка при импорте серверного EffectsService:', error);
    console.warn('Используем API-версию из-за ошибки импорта');
    
    // В случае ошибки используем API-версию
    EffectsService = EffectsServiceAPI;
  }
}

module.exports = EffectsService;