/**
 * Адаптер для выбора подходящего CharacterStatsService в зависимости от среды выполнения
 * Безопасная версия, предотвращающая включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем API-версию для клиента
const CharacterStatsServiceAPI = require('./character-stats-api'); // Через API (для браузера)

// Определение объекта сервиса в зависимости от окружения
let CharacterStatsService;

// В браузере всегда используем API-версию
if (!isServerEnvironment) {
  CharacterStatsService = CharacterStatsServiceAPI;
} else {
  // В серверном окружении используем прямой доступ к БД
  try {
    // Используем прямой импорт на сервере
    const CharacterStatsServiceDirect = require('./character-stats-service');
    CharacterStatsService = CharacterStatsServiceDirect.default || CharacterStatsServiceDirect;
  } catch (error) {
    console.error('Ошибка при импорте серверного CharacterStatsService:', error);
    console.warn('Используем API версию из-за ошибки импорта');
    
    // В случае ошибки используем API-версию
    CharacterStatsService = CharacterStatsServiceAPI;
  }
}

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