/**
 * Адаптер для выбора подходящего TechniqueService в зависимости от среды выполнения
 * Безопасная версия, предотвращающая включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем API-версию для клиента
const TechniqueServiceAPI = require('./technique-api'); // Через API (для браузера)

// Определение объекта сервиса в зависимости от окружения
let TechniqueService;

// В браузере всегда используем API-версию
if (!isServerEnvironment) {
  TechniqueService = TechniqueServiceAPI;
} else {
  // В серверном окружении используем прямой доступ к БД
  try {
    // Используем прямой импорт на сервере
    const TechniqueServiceDirect = require('./technique-service');
    TechniqueService = TechniqueServiceDirect.default || TechniqueServiceDirect;
  } catch (error) {
    console.error('Ошибка при импорте серверного TechniqueService:', error);
    console.warn('Используем API версию из-за ошибки импорта');
    
    // В случае ошибки используем API-версию
    TechniqueService = TechniqueServiceAPI;
  }
}

// Константы
const techniqueTypes = TechniqueService.techniqueTypes || {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SUPPORT: 'support',
  CULTIVATION: 'cultivation'
};

const elementTypes = TechniqueService.elementTypes || {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  WIND: 'wind',
  LIGHTNING: 'lightning',
  DARKNESS: 'darkness',
  LIGHT: 'light',
  VOID: 'void'
};

const elementColors = TechniqueService.elementColors || {
  fire: '#ff4d4d',
  water: '#4d94ff',
  earth: '#a67c00',
  wind: '#80ff80',
  lightning: '#ffff4d',
  darkness: '#660066',
  light: '#ffff99',
  void: '#1a1a1a'
};

// Создаем экземпляр для использования методов экземпляра (если такие есть)
const serviceInstance = new (function() {
  // Прокси-методы, перенаправляющие вызовы на статические методы
  this.getAllTechniques = function() {
    return TechniqueService.getAllTechniques();
  };
  
  this.getTechniqueById = function(techniqueId) {
    return TechniqueService.getTechniqueById(techniqueId);
  };
  
  this.getTechniqueByName = function(techniqueName) {
    return TechniqueService.getTechniqueByName(techniqueName);
  };
  
  this.getTechniquesByType = function(type) {
    return TechniqueService.getTechniquesByType(type);
  };
  
  this.getLearnedTechniques = function(userId) {
    return TechniqueService.getLearnedTechniques(userId);
  };
  
  this.getAvailableTechniques = function(userId, userLevel) {
    return TechniqueService.getAvailableTechniques(userId, userLevel);
  };
  
  this.learnTechnique = function(userId, techniqueId) {
    return TechniqueService.learnTechnique(userId, techniqueId);
  };
  
  this.upgradeTechnique = function(userId, techniqueId, targetLevel) {
    return TechniqueService.upgradeTechnique(userId, techniqueId, targetLevel);
  };
  
  this.useTechnique = function(userId, techniqueId) {
    if (TechniqueService.useTechnique) {
      return TechniqueService.useTechnique(userId, techniqueId);
    }
    console.warn('Метод useTechnique не реализован в текущей версии сервиса');
    return Promise.reject(new Error('Метод не реализован'));
  };
  
  this.calculateUpgradeCost = function(currentLevel, targetLevel) {
    return TechniqueService.calculateUpgradeCost(currentLevel, targetLevel);
  };
})();

// Экспортируем единый объект с методами и константами
const adapter = {
  // Методы, экспортируемые напрямую
  getAllTechniques: TechniqueService.getAllTechniques,
  getTechniqueById: TechniqueService.getTechniqueById,
  getTechniqueByName: TechniqueService.getTechniqueByName,
  getTechniquesByType: TechniqueService.getTechniquesByType,
  getLearnedTechniques: TechniqueService.getLearnedTechniques,
  getAvailableTechniques: TechniqueService.getAvailableTechniques,
  learnTechnique: TechniqueService.learnTechnique,
  upgradeTechnique: TechniqueService.upgradeTechnique,
  calculateUpgradeCost: TechniqueService.calculateUpgradeCost,
  
  // Метод, который может отсутствовать в некоторых реализациях
  useTechnique: TechniqueService.useTechnique ||
    ((userId, techniqueId) => Promise.reject(new Error('Метод useTechnique не реализован'))),
  
  // Константы
  techniqueTypes,
  elementTypes,
  elementColors,
  
  // Экземпляр для обратной совместимости
  getInstance: function() {
    return serviceInstance;
  },
  
  // Для доступа к оригинальному сервису
  _service: TechniqueService
};

// Дополнительно добавляем все методы как прямые экспорты
// для обеспечения доступа через TechniqueService.methodName
Object.keys(adapter).forEach(key => {
  if (typeof adapter[key] === 'function') {
    module.exports[key] = adapter[key];
  }
});

// Экспортируем константы напрямую
module.exports.techniqueTypes = techniqueTypes;
module.exports.elementTypes = elementTypes;
module.exports.elementColors = elementColors;

// Для обратной совместимости с кодом, который использует конструктор
adapter.constructor = function(models) {
  console.warn('Создание экземпляра TechniqueService через конструктор устарело. Используйте статические методы.');
  return serviceInstance;
};

module.exports = adapter;