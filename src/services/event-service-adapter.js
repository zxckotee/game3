/**
 * Адаптер для выбора подходящей версии event-service.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const EventServiceAPI = require('./event-service-api');

// Определение объекта в зависимости от окружения
let EventService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  EventService = EventServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerEventService = require('./event-service');
    EventService = ServerEventService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии event-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    EventService = EventServiceAPI;
  }
}

// Экспортируем все методы и свойства из выбранной реализации
module.exports.getEventTypes = EventService.getEventTypes;
module.exports.getEventCategories = EventService.getEventCategories;
module.exports.getAllEvents = EventService.getAllEvents;
module.exports.getEventById = EventService.getEventById;
module.exports.getUserActiveEvents = EventService.getUserActiveEvents;
module.exports.checkForEvents = EventService.checkForEvents;
module.exports.startEvent = EventService.startEvent;
module.exports.completeEvent = EventService.completeEvent;
module.exports.cancelEvent = EventService.cancelEvent;

// Экспортируем константы для совместимости
module.exports.EVENT_TYPES = EventService.EVENT_TYPES || {};
module.exports.EVENT_CATEGORIES = EventService.EVENT_CATEGORIES || {};
module.exports.EVENT_PRIORITIES = EventService.EVENT_PRIORITIES || {};

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = EventService;