/**
 * Адаптер для выбора подходящего EnemyService в зависимости от среды выполнения
 * Безопасная версия, предотвращающая включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем API-версию для клиента
const EnemyServiceAPI = require('./enemy-api'); // Через API (для браузера)

// Определение объекта сервиса в зависимости от окружения
let EnemyService;

// В браузере всегда используем API-версию
if (!isServerEnvironment) {
  EnemyService = EnemyServiceAPI;
} else {
  // В серверном окружении используем прямой доступ к БД
  try {
    // Используем прямой импорт на сервере
    const EnemyServiceDirect = require('./enemy-service');
    EnemyService = EnemyServiceDirect.default || EnemyServiceDirect;
  } catch (error) {
    console.error('Ошибка при импорте серверного EnemyService:', error);
    console.warn('Используем API версию из-за ошибки импорта');
    
    // В случае ошибки используем API-версию
    EnemyService = EnemyServiceAPI;
  }
}

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