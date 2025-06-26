/**
 * Адаптер для выбора подходящей версии character-profile-service.js
 * в зависимости от среды выполнения (версия для CommonJS)
 * Предотвращает включение серверных зависимостей в клиентскую сборку
 */

// Определяем окружение
const isServerEnvironment = typeof window === 'undefined';

// Определение объекта в зависимости от окружения
let CharacterProfileService;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  try {
    // Импортируем клиентскую версию для браузера
    CharacterProfileService = require('./character-profile-service-api');
  } catch (error) {
    console.error('Ошибка при импорте клиентской версии character-profile-service-api:', error);
    // Создаем заглушку с базовыми методами
    CharacterProfileService = {
      getCharacterProfile: async () => null,
      updateCharacterProfile: async () => ({}),
      isCharacterCreated: async () => false,
      updateCurrency: async () => ({}),
      updateRelationships: async () => ({})
    };
  }
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Прямой импорт серверной версии
    CharacterProfileService = require('./character-profile-service');
  } catch (error) {
    console.error('Ошибка при импорте серверной версии character-profile-service:', error);
    console.warn('Используем заглушку из-за ошибки импорта');
    
    // В случае ошибки используем заглушку
    CharacterProfileService = {
      getCharacterProfile: async () => null,
      updateCharacterProfile: async () => ({}),
      isCharacterCreated: async () => false,
      updateCurrency: async () => ({}),
      updateRelationships: async () => ({})
    };
  }
}

// Экспортируем методы и свойства для CommonJS
module.exports = CharacterProfileService;
// Также экспортируем отдельные методы для совместимости
module.exports.getCharacterProfile = CharacterProfileService.getCharacterProfile;
module.exports.updateCharacterProfile = CharacterProfileService.updateCharacterProfile;
module.exports.isCharacterCreated = CharacterProfileService.isCharacterCreated;
module.exports.updateCurrency = CharacterProfileService.updateCurrency;
module.exports.updateRelationships = CharacterProfileService.updateRelationships;