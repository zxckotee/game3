/**
 * Адаптер для выбора подходящей версии character-profile-service.js
 * в зависимости от среды выполнения
 * Предотвращает включение серверных зависимостей в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const CharacterProfileServiceAPI = require('./character-profile-service-api');

// Определение объекта в зависимости от окружения
let CharacterProfileService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  CharacterProfileService = CharacterProfileServiceAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerCharacterProfileService = require('./character-profile-service');
    CharacterProfileService = ServerCharacterProfileService;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии character-profile-service:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    CharacterProfileService = CharacterProfileServiceAPI;
  }
}

// Экспортируем все методы и свойства из выбранной реализации
const getCharacterProfile = CharacterProfileService.getCharacterProfile;
const updateCharacterProfile = CharacterProfileService.updateCharacterProfile;
const isCharacterCreated = CharacterProfileService.isCharacterCreated;
const updateCurrency = CharacterProfileService.updateCurrency;
const updateRelationships = CharacterProfileService.updateRelationships;

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = CharacterProfileService;

// Экспортируем явно отдельные методы для деструктуризации импорта
module.exports.getCharacterProfile = getCharacterProfile;
module.exports.updateCharacterProfile = updateCharacterProfile;
module.exports.isCharacterCreated = isCharacterCreated;
module.exports.updateCurrency = updateCurrency;
module.exports.updateRelationships = updateRelationships;

// Добавляем отладочную информацию для функции updateCharacterProfile
const originalUpdateCharacterProfile = module.exports.updateCharacterProfile;
module.exports.updateCharacterProfile = async function(userId, data, isInitializing) {
  console.log('[Adapter] Вызов updateCharacterProfile');
  
  try {
    const result = await originalUpdateCharacterProfile(userId, data, isInitializing);
    return result;
  } catch (error) {
    console.error('[Adapter] Ошибка в updateCharacterProfile:', error);
    throw error;
  }
};