/**
 * Адаптер для работы с врагами
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const EnemyServiceAPI = require('./enemy-api');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const EnemyService = EnemyServiceAPI;

// Добавляем обратную совместимость для классов, которые инстанцируют EnemyService
// Создаем класс-оболочку для статических методов
class EnemyServiceWrapper {
  constructor(models) {
    this.models = models;
    // Сохраняем ссылку на статические методы оригинального сервиса
    this.serviceInstance = EnemyService;
  }
  
  // Прокси-методы, перенаправляющие вызовы на статические методы
  getAllEnemies() {
    return this.serviceInstance.getAllEnemies();
  }
  
  getEnemyById(enemyId) {
    return this.serviceInstance.getEnemyById(enemyId);
  }
  
  getEnemiesByCategory(category) {
    return this.serviceInstance.getEnemiesByCategory(category);
  }
  
  getEnemiesByLocation(locationId) {
    return this.serviceInstance.getEnemiesByLocation(locationId);
  }
  
  getTimeOfDaySpawnModifiers() {
    return this.serviceInstance.getTimeOfDaySpawnModifiers();
  }
  
  getWeatherSpawnModifiers() {
    return this.serviceInstance.getWeatherSpawnModifiers();
  }
  
  addNewEnemy(enemyData) {
    return this.serviceInstance.addNewEnemy(enemyData);
  }
  
  updateEnemy(id, updates) {
    return this.serviceInstance.updateEnemy(id, updates);
  }
  
  deleteEnemy(id) {
    return this.serviceInstance.deleteEnemy(id);
  }
}

// Добавляем статические методы класса-оболочки
Object.keys(EnemyService).forEach(key => {
  if (typeof EnemyService[key] === 'function') {
    EnemyServiceWrapper[key] = EnemyService[key];
  }
});

// Экспортируем константы и методы
module.exports = EnemyServiceWrapper;
module.exports.enemyRanks = EnemyService.enemyRanks || {
  NORMAL: 'normal',
  ELITE: 'elite',
  BOSS: 'boss'
};

// Экспортируем отдельные методы
module.exports.getAllEnemies = EnemyService.getAllEnemies;
module.exports.getEnemyById = EnemyService.getEnemyById;
module.exports.getEnemiesByCategory = EnemyService.getEnemiesByCategory;
module.exports.getEnemiesByLocation = EnemyService.getEnemiesByLocation;
module.exports.getTimeOfDaySpawnModifiers = EnemyService.getTimeOfDaySpawnModifiers;
module.exports.getWeatherSpawnModifiers = EnemyService.getWeatherSpawnModifiers;
module.exports.addNewEnemy = EnemyService.addNewEnemy;
module.exports.updateEnemy = EnemyService.updateEnemy;
module.exports.deleteEnemy = EnemyService.deleteEnemy;