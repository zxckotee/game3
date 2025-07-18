/**
 * Адаптер для работы с профилем персонажа
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const CharacterProfileServiceAPI = require('./character-profile-service-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const CharacterProfileService = CharacterProfileServiceAPI;

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