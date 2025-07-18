/**
 * Адаптер для работы с бонусами
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const BonusServiceAPI = require('./bonus-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const BonusService = BonusServiceAPI;

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