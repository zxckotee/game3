/**
 * Адаптер для работы с моделями базы данных
 * Предоставляет альтернативный API для клиентской части, не использующий Sequelize напрямую
 */

// Импортируем определение серверной среды
const { isServerEnvironment } = require('../sequelize-config');

// Определяем пустые модели-заглушки для браузерной среды
const clientModels = {
  User: {
    findOne: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return null;
    },
    findByPk: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return null;
    },
    findAll: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return [];
    },
    create: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return null;
    },
    update: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return [0];
    },
    destroy: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return 0;
    }
  },
  CultivationProgress: {
    findOne: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return null;
    },
    findByPk: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return null;
    },
    findAll: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return [];
    },
    create: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return null;
    },
    update: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return [0];
    },
    destroy: async () => { 
      console.warn('Client-side model access: Use API service instead');
      return 0;
    }
  },
  // Добавьте другие необходимые модели по аналогии
};

/**
 * Функция для получения серверных моделей
 * Безопасная версия, которая не будет включена в клиентскую сборку
 */
function getServerModels() {
  // Проверка, что мы действительно на сервере
  if (!isServerEnvironment) {
    console.error('Попытка получить серверные модели в браузере');
    return clientModels;
  }

  try {
    // Используем метод, который не будет обрабатываться webpack при сборке
    // Это предотвратит попытки webpack разрешить этот импорт во время сборки
    // Используем прямой импорт на сервере
    const serverModels = require('../models');
    return serverModels.default || serverModels;
  } catch (error) {
    console.error('Ошибка при импорте серверных моделей:', error);
    console.warn('Используем клиентские заглушки моделей из-за ошибки');
    // В случае ошибки возвращаем клиентские заглушки
    return clientModels;
  }
}

/**
 * Получить все модели
 * @returns {Promise<Object>} - Объект со всеми моделями
 */
function getModels() {
  // В браузере всегда используем заглушки
  if (!isServerEnvironment) {
    return clientModels;
  }
  
  // На сервере пробуем получить реальные модели
  try {
    return getServerModels();
  } catch (error) {
    console.error('Не удалось получить серверные модели:', error);
    // В случае ошибки возвращаем клиентские заглушки
    return clientModels;
  }
}

/**
 * Получить конкретную модель по имени
 * @param {string} modelName - Имя модели
 * @returns {Promise<Object>} - Инстанс модели
 */
function getModel(modelName) {
  // В браузере всегда используем заглушки
  if (!isServerEnvironment) {
    return clientModels[modelName] || null;
  }
  
  // На сервере пробуем получить реальную модель
  try {
    const models = getServerModels();
    if (!models[modelName]) {
      console.warn(`Модель ${modelName} не найдена, возвращаем заглушку`);
      return clientModels[modelName] || null;
    }
    return models[modelName];
  } catch (error) {
    console.error(`Ошибка при получении модели ${modelName}:`, error);
    // В случае ошибки возвращаем клиентскую заглушку
    return clientModels[modelName] || null;
  }
}

/**
 * Удобная функция для получения модели User
 * @returns {Promise<Object>} - Модель User
 */
function getUserModel() {
  return getModel('User');
}

/**
 * Удобная функция для получения модели CultivationProgress
 * @returns {Object} - Модель CultivationProgress
 */
function getCultivationProgressModel() {
  return getModel('CultivationProgress');
}

module.exports = {
  getModels,
  getModel,
  getUserModel,
  getCultivationProgressModel
};

// Экспортируем отдельные функции как свойства модуля
module.exports.getModels = getModels;
module.exports.getModel = getModel;
module.exports.getUserModel = getUserModel;
module.exports.getCultivationProgressModel = getCultivationProgressModel;