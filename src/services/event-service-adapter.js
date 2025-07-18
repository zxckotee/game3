/**
 * Адаптер для работы с событиями
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const EventServiceAPI = require('./event-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const EventService = EventServiceAPI;

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