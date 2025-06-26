/**
 * Адаптер для выбора подходящей версии group-activity-service.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const GroupActivityServiceAPI = require('./group-activity-service-api');

// Определение объекта в зависимости от окружения
let GroupActivityService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  GroupActivityService = GroupActivityServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerGroupActivityService = require('./group-activity-service');
    GroupActivityService = ServerGroupActivityService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии group-activity-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    GroupActivityService = GroupActivityServiceAPI;
  }
}

// Экспортируем все методы и свойства из выбранной реализации
module.exports.getActivityTypes = GroupActivityService.getActivityTypes;
module.exports.getActivityStatuses = GroupActivityService.getActivityStatuses;
module.exports.getDifficultyLevels = GroupActivityService.getDifficultyLevels;
module.exports.getGroupActivities = GroupActivityService.getGroupActivities;
module.exports.getActivityById = GroupActivityService.getActivityById;
module.exports.createActivity = GroupActivityService.createActivity;
module.exports.updateActivity = GroupActivityService.updateActivity;
module.exports.cancelActivity = GroupActivityService.cancelActivity;
module.exports.getActivityParticipants = GroupActivityService.getActivityParticipants;
module.exports.joinActivity = GroupActivityService.joinActivity;
module.exports.leaveActivity = GroupActivityService.leaveActivity;
module.exports.startActivity = GroupActivityService.startActivity;
module.exports.completeActivity = GroupActivityService.completeActivity;

// Экспортируем константы для совместимости
module.exports.ACTIVITY_TYPES = GroupActivityService.ACTIVITY_TYPES || {};
module.exports.ACTIVITY_STATUS = GroupActivityService.ACTIVITY_STATUS || {};
module.exports.DIFFICULTY_LEVELS = GroupActivityService.DIFFICULTY_LEVELS || {};

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = GroupActivityService;