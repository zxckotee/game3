/**
 * Адаптер для выбора подходящей версии bonus-service.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const BonusServiceAPI = require('./bonus-service-api');

// Определение объекта в зависимости от окружения
let BonusService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  BonusService = BonusServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerBonusService = require('./bonus-service');
    BonusService = ServerBonusService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии bonus-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    BonusService = BonusServiceAPI;
  }
}

// Экспортируем все методы и свойства из выбранной реализации
module.exports.calculateAllBonuses = BonusService.calculateAllBonuses;
module.exports.calculateItemBonuses = BonusService.calculateItemBonuses;
module.exports.calculateEffectsBonuses = BonusService.calculateEffectsBonuses;
module.exports.checkItemRequirements = BonusService.checkItemRequirements;
module.exports.getBonusTypes = BonusService.getBonusTypes;
module.exports.getBonusSources = BonusService.getBonusSources;
module.exports.getCalculationTypes = BonusService.getCalculationTypes;

// Экспортируем константы для совместимости
module.exports.BONUS_TYPES = BonusService.BONUS_TYPES || BonusService.getBonusTypes?.() || {};
module.exports.BONUS_SOURCES = BonusService.BONUS_SOURCES || BonusService.getBonusSources?.() || {};
module.exports.CALCULATION_TYPES = BonusService.CALCULATION_TYPES || BonusService.getCalculationTypes?.() || {};

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = BonusService;