/**
 * Адаптер для выбора подходящей версии reputation-service.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const ReputationServiceAPI = require('./reputation-service-api');

// Определение объекта в зависимости от окружения
let ReputationService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  ReputationService = ReputationServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerReputationService = require('./reputation-service');
    ReputationService = ServerReputationService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии reputation-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    ReputationService = ReputationServiceAPI;
  }
}

// Экспортируем все методы и свойства из выбранной реализации
module.exports.getAllFactions = ReputationService.getAllFactions;
module.exports.getFactionById = ReputationService.getFactionById;
module.exports.getFactionsByType = ReputationService.getFactionsByType;
module.exports.getUserReputations = ReputationService.getUserReputations;
module.exports.getUserFactionReputation = ReputationService.getUserFactionReputation;
module.exports.getFeaturesByReputationLevel = ReputationService.getFeaturesByReputationLevel;
module.exports.changeReputation = ReputationService.changeReputation;
module.exports.getFactionRelation = ReputationService.getFactionRelation;
module.exports.getFactionRelations = ReputationService.getFactionRelations;
module.exports.getFactionTypes = ReputationService.getFactionTypes;
module.exports.getReputationLevels = ReputationService.getReputationLevels;

// Экспортируем константы для совместимости
module.exports.FACTION_TYPES = ReputationService.FACTION_TYPES || ReputationService.getFactionTypes?.() || {};
module.exports.REPUTATION_LEVELS = ReputationService.REPUTATION_LEVELS || ReputationService.getReputationLevels?.() || {};

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = ReputationService;