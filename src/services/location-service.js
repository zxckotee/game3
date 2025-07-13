/**
 * Сервис для работы с локациями
 * Обрабатывает запросы от API и взаимодействует с базой данных через ORM
 */

// Импортируем реестр моделей вместо прямого использования connectionProvider
const modelRegistry = require('../models/registry');

// Кэш для хранения локаций (для оптимизации)
let locationsCache = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

/**
 * Получает все локации из базы данных
 * @returns {Promise<Array>} Массив локаций
 */
exports.getAllLocations = async function() {
  try {
    console.log('Запрос на получение всех локаций');
    
    // Проверяем кэш
    const now = Date.now();
    if (locationsCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Возвращаем локации из кэша');
      return locationsCache;
    }
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модель через реестр
    const Location = modelRegistry.getModel('Location');
    
    if (!Location) {
      throw new Error('Модель Location не найдена в реестре');
    }
    
    // Загружаем все локации из базы данных
    const locations = await Location.findAll({
      attributes: ['id', 'name', 'description', 'type', 'energyCost', 'backgroundImage',
                   'enemies', 'coordinates'],
      order: [['energyCost', 'ASC']]
    });
    
    console.log(`Загружено ${locations.length} локаций из базы данных`);
    
    // Преобразуем в нужный формат для клиента
    const formattedLocations = locations.map(location => ({
      id: location.id,
      name: location.name,
      description: location.description,
      type: location.type,
      energyCost: location.energyCost || 0,
      backgroundImage: location.backgroundImage,
      enemies: location.enemies || [],
      coordinates: location.coordinates || { x: 0, y: 0 },
      // Добавляем координаты для совместимости с фронтендом
      x: location.coordinates?.x || 0,
      y: location.coordinates?.y || 0
    }));
    
    // Обновляем кэш
    locationsCache = formattedLocations;
    cacheTimestamp = now;
    
    console.log('Локации успешно загружены и закэшированы');
    return formattedLocations;
    
  } catch (error) {
    console.error('Ошибка при получении локаций:', error);
    throw error;
  }
};

/**
 * Получает локацию по ID
 * @param {string} locationId - ID локации
 * @returns {Promise<Object|null>} Объект локации или null
 */
exports.getLocationById = async function(locationId) {
  try {
    console.log(`Запрос на получение локации с ID: ${locationId}`);
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модель через реестр
    const Location = modelRegistry.getModel('Location');
    
    if (!Location) {
      throw new Error('Модель Location не найдена в реестре');
    }
    
    // Ищем локацию по ID
    const location = await Location.findByPk(locationId, {
      attributes: ['id', 'name', 'description', 'type', 'energyCost', 'backgroundImage',
                   'enemies', 'coordinates']
    });
    
    if (!location) {
      console.log(`Локация с ID ${locationId} не найдена`);
      return null;
    }
    
    // Преобразуем в нужный формат для клиента
    const formattedLocation = {
      id: location.id,
      name: location.name,
      description: location.description,
      type: location.type,
      energyCost: location.energyCost || 0,
      backgroundImage: location.backgroundImage,
      enemies: location.enemies || [],
      coordinates: location.coordinates || { x: 0, y: 0 },
      // Добавляем координаты для совместимости с фронтендом
      x: location.coordinates?.x || 0,
      y: location.coordinates?.y || 0
    };
    
    console.log(`Локация ${locationId} успешно найдена`);
    return formattedLocation;
    
  } catch (error) {
    console.error(`Ошибка при получении локации ${locationId}:`, error);
    throw error;
  }
};

/**
 * Создает новую локацию
 * @param {Object} locationData - Данные локации
 * @returns {Promise<Object>} Созданная локация
 */
exports.createLocation = async function(locationData) {
  try {
    console.log('Запрос на создание новой локации:', locationData.name);
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модель через реестр
    const Location = modelRegistry.getModel('Location');
    
    if (!Location) {
      throw new Error('Модель Location не найдена в реестре');
    }
    
    // Создаем новую локацию
    const newLocation = await Location.create({
      id: locationData.id,
      name: locationData.name,
      description: locationData.description,
      type: locationData.type,
      energyCost: locationData.energyCost || 0,
      backgroundImage: locationData.backgroundImage,
      enemies: locationData.enemies || [],
      coordinates: locationData.coordinates || { x: 0, y: 0 }
    });
    
    // Очищаем кэш
    locationsCache = [];
    cacheTimestamp = 0;
    
    console.log(`Локация ${locationData.name} успешно создана`);
    return newLocation;
    
  } catch (error) {
    console.error('Ошибка при создании локации:', error);
    throw error;
  }
};

/**
 * Обновляет локацию
 * @param {string} locationId - ID локации
 * @param {Object} updateData - Данные для обновления
 * @returns {Promise<Object|null>} Обновленная локация или null
 */
exports.updateLocation = async function(locationId, updateData) {
  try {
    console.log(`Запрос на обновление локации ${locationId}`);
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модель через реестр
    const Location = modelRegistry.getModel('Location');
    
    if (!Location) {
      throw new Error('Модель Location не найдена в реестре');
    }
    
    // Обновляем локацию
    const [updatedRowsCount] = await Location.update({
      name: updateData.name,
      description: updateData.description,
      type: updateData.type,
      energyCost: updateData.energyCost,
      backgroundImage: updateData.backgroundImage,
      enemies: updateData.enemies,
      coordinates: updateData.coordinates
    }, {
      where: { id: locationId }
    });
    
    if (updatedRowsCount === 0) {
      console.log(`Локация с ID ${locationId} не найдена для обновления`);
      return null;
    }
    
    // Очищаем кэш
    locationsCache = [];
    cacheTimestamp = 0;
    
    // Возвращаем обновленную локацию
    const updatedLocation = await exports.getLocationById(locationId);
    
    console.log(`Локация ${locationId} успешно обновлена`);
    return updatedLocation;
    
  } catch (error) {
    console.error(`Ошибка при обновлении локации ${locationId}:`, error);
    throw error;
  }
};

/**
 * Удаляет локацию
 * @param {string} locationId - ID локации
 * @returns {Promise<boolean>} true если удалена, false если не найдена
 */
exports.deleteLocation = async function(locationId) {
  try {
    console.log(`Запрос на удаление локации ${locationId}`);
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модель через реестр
    const Location = modelRegistry.getModel('Location');
    
    if (!Location) {
      throw new Error('Модель Location не найдена в реестре');
    }
    
    // Удаляем локацию
    const deletedRowsCount = await Location.destroy({
      where: { id: locationId }
    });
    
    if (deletedRowsCount === 0) {
      console.log(`Локация с ID ${locationId} не найдена для удаления`);
      return false;
    }
    
    // Очищаем кэш
    locationsCache = [];
    cacheTimestamp = 0;
    
    console.log(`Локация ${locationId} успешно удалена`);
    return true;
    
  } catch (error) {
    console.error(`Ошибка при удалении локации ${locationId}:`, error);
    throw error;
  }
};

/**
 * Очищает кэш локаций
 */
exports.clearCache = function() {
  locationsCache = [];
  cacheTimestamp = 0;
  console.log('Кэш локаций очищен');
};