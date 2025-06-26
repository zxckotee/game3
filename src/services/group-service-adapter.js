/**
 * Адаптер для выбора подходящей версии group-service.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const GroupServiceAPI = require('./group-service-api');

// Определение объекта в зависимости от окружения
let GroupService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  GroupService = GroupServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerGroupService = require('./group-service');
    GroupService = ServerGroupService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии group-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    GroupService = GroupServiceAPI;
  }
}

// Экспортируем все методы и свойства из выбранной реализации
module.exports.getAllGroups = GroupService.getAllGroups;
module.exports.getGroupById = GroupService.getGroupById;
module.exports.getGroupsByType = GroupService.getGroupsByType;
module.exports.createGroup = GroupService.createGroup;
module.exports.updateGroup = GroupService.updateGroup;
module.exports.disbandGroup = GroupService.disbandGroup;
module.exports.getGroupMembers = GroupService.getGroupMembers;
module.exports.getUserMembership = GroupService.getUserMembership;
module.exports.getUserGroups = GroupService.getUserGroups;
module.exports.inviteToGroup = GroupService.inviteToGroup;
module.exports.respondToInvitation = GroupService.respondToInvitation;
module.exports.leaveGroup = GroupService.leaveGroup;
module.exports.changeMemberStatus = GroupService.changeMemberStatus;
module.exports.kickMember = GroupService.kickMember;
module.exports.getGroupStatuses = GroupService.getGroupStatuses;
module.exports.getMemberStatuses = GroupService.getMemberStatuses;
module.exports.getGroupTypes = GroupService.getGroupTypes;

// Экспортируем константы для совместимости
module.exports.GROUP_STATUS = GroupService.GROUP_STATUS || GroupService.getGroupStatuses?.() || {};
module.exports.MEMBER_STATUS = GroupService.MEMBER_STATUS || GroupService.getMemberStatuses?.() || {};
module.exports.GROUP_TYPES = GroupService.GROUP_TYPES || GroupService.getGroupTypes?.() || {};

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = GroupService;