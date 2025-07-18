/**
 * Адаптер для работы со статистикой персонажа
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const CharacterStatsServiceAPI = require('./character-stats-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const CharacterStatsService = CharacterStatsServiceAPI;

// Создаем единственный экземпляр для использования методов экземпляра (если такие есть)
const serviceInstance = new (function() {
  this.getCharacterStats = function(userId) {
    return CharacterStatsService.getCharacterStats(userId);
  };
  
  this.updateCharacterStats = function(userId, data) {
    return CharacterStatsService.updateCharacterStats(userId, data);
  };
  
  this.calculateSecondaryStats = function(stats, cultivation) {
    return CharacterStatsService.calculateSecondaryStats(stats, cultivation);
  };
})();

// Экспортируем методы напрямую для совместимости
module.exports = {
  // Статические методы
  getCharacterStats: CharacterStatsService.getCharacterStats,
  updateCharacterStats: CharacterStatsService.updateCharacterStats,
  calculateSecondaryStats: CharacterStatsService.calculateSecondaryStats,
  
  // Экспортируем также экземпляр для обратной совместимости
  // для кода, который ожидает экземпляр класса
  getInstance: function() {
    return serviceInstance;
  },
  
  // Экспортируем оригинальный сервис для совместимости
  _service: CharacterStatsService
};

// Для обратной совместимости добавляем конструктор
module.exports.constructor = function(models) {
  console.warn('Создание экземпляра CharacterStatsService через конструктор устарело. Используйте статические методы.');
  return serviceInstance;
};