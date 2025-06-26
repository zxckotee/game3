/**
 * Модуль для работы с врагами
 * Обеспечивает загрузку данных о врагах через адаптер
 */

// Импортируем combat и адаптер через CommonJS
const { damageTypes } = require('./combat');
const EnemyAdapter = require('../services/enemy-adapter');

// Импортируем функции и константы из адаптера
const {
  getAllEnemies: adapterGetAllEnemies,
  getEnemyById: adapterGetEnemyById,
  getEnemiesByCategory: adapterGetEnemiesByCategory,
  getEnemiesByLocation: adapterGetEnemiesByLocation,
  getTimeOfDaySpawnModifiers: adapterGetTimeOfDaySpawnModifiers,
  getWeatherSpawnModifiers: adapterGetWeatherSpawnModifiers,
  enemyRanks
} = EnemyAdapter;

// Кэш для хранения данных
let enemies = [];
let timeOfDaySpawnModifiers = {};
let weatherSpawnModifiers = {};

/**
 * Получает модификаторы времени суток
 * @returns {Promise<Object>} Модификаторы времени суток
 */
async function getTimeOfDaySpawnModifiers() {
  try {
    const result = await adapterGetTimeOfDaySpawnModifiers();
    // Обновляем кэш
    timeOfDaySpawnModifiers = result;
    return result;
  } catch (error) {
    console.error('Ошибка при загрузке модификаторов времени суток:', error);
    // Возвращаем кэшированные данные в случае ошибки
    return timeOfDaySpawnModifiers;
  }
}

/**
 * Получает модификаторы погоды
 * @returns {Promise<Object>} Модификаторы погоды
 */
async function getWeatherSpawnModifiers() {
  try {
    const result = await adapterGetWeatherSpawnModifiers();
    // Обновляем кэш
    weatherSpawnModifiers = result;
    return result;
  } catch (error) {
    console.error('Ошибка при загрузке модификаторов погоды:', error);
    // Возвращаем кэшированные данные в случае ошибки
    return weatherSpawnModifiers;
  }
}

/**
 * Получает полные данные врага
 * @param {string} enemyId - ID врага
 * @returns {Promise<Object>} Данные врага
 */
async function getEnemy(enemyId) {
  try {
    return await adapterGetEnemyById(enemyId);
  } catch (error) {
    console.error(`Ошибка при получении данных врага ${enemyId}:`, error);
    // Пытаемся найти в кэше
    return enemies.find(e => e.id === enemyId) || null;
  }
}

/**
 * Получает всех врагов
 * @returns {Promise<Array>} Массив всех врагов
 */
async function getEnemies() {
  try {
    const result = await adapterGetAllEnemies();
    // Обновляем кэш
    enemies = result;
    return result;
  } catch (error) {
    console.error('Ошибка при получении всех врагов:', error);
    // Возвращаем кэшированные данные в случае ошибки
    return enemies;
  }
}

/**
 * Получает врагов по категории
 * @param {string} category - Категория врагов
 * @returns {Promise<Array>} Массив врагов указанной категории
 */
async function getEnemiesByCategory(category) {
  try {
    return await adapterGetEnemiesByCategory(category);
  } catch (error) {
    console.error(`Ошибка при получении врагов категории ${category}:`, error);
    // Фильтруем кэш
    return enemies.filter(e => e.category === category);
  }
}

/**
 * Получает врагов по локации
 * @param {string} locationId - ID локации
 * @returns {Promise<Array>} Массив врагов в указанной локации
 */
async function getEnemiesByLocation(locationId) {
  try {
    return await adapterGetEnemiesByLocation(locationId);
  } catch (error) {
    console.error(`Ошибка при получении врагов локации ${locationId}:`, error);
    // В случае ошибки возвращаем пустой массив, так как нет кэша по локациям
    return [];
  }
}

/**
 * Получает точки появления врагов
 * @returns {Promise<Object>} Точки появления врагов
 */
async function getEnemySpawns() {
  try {
    // Если в адаптере есть функция getEnemySpawns, используем её
    if (typeof EnemyAdapter.getEnemySpawns === 'function') {
      return await EnemyAdapter.getEnemySpawns();
    }
    
    // Иначе собираем данные из getEnemiesByLocation для каждой локации
    // Этот код выполняется только если в адаптере нет метода getEnemySpawns
    
    // Список известных локаций (в реальном приложении может быть получен из сервиса локаций)
    const locations = [
      'starting_area',
      'mountain_path',
      'ancient_ruins',
      'forest_lake',
      'thunder_peak'
    ];
    
    const spawnsByLocation = {};
    
    // Получаем врагов для каждой локации
    for (const locationId of locations) {
      const locationEnemies = await getEnemiesByLocation(locationId);
      spawnsByLocation[locationId] = locationEnemies.map(enemy => ({
        id: enemy.id,
        minLevel: enemy.minLevel || enemy.level || 1,
        maxLevel: enemy.maxLevel || enemy.level || 1,
        weight: enemy.spawnWeight || 50, // значение по умолчанию, если не задано
        ...(enemy.spawnConditions ? { conditions: enemy.spawnConditions } : {})
      }));
    }
    
    return spawnsByLocation;
  } catch (error) {
    console.error('Ошибка при получении точек появления врагов:', error);
    // Возвращаем базовую структуру в случае ошибки
    return {
      starting_area: [
        { id: 'training_dummy', minLevel: 1, maxLevel: 2, weight: 70 },
        { id: 'weak_spirit_beast', minLevel: 3, maxLevel: 4, weight: 30 }
      ],
      mountain_path: [
        { id: 'weak_spirit_beast', minLevel: 3, maxLevel: 5, weight: 40 },
        { id: 'mountain_bandit', minLevel: 5, maxLevel: 7, weight: 60 }
      ]
    };
  }
}

// Инициализируем данные
async function initEnemyData() {
  try {
    // Загружаем данные из адаптера
    const [allEnemies, timeMods, weatherMods] = await Promise.all([
      getEnemies(),
      getTimeOfDaySpawnModifiers(),
      getWeatherSpawnModifiers()
    ]);
    
    // Обновляем переменные для обратной совместимости
    enemies = allEnemies;
    timeOfDaySpawnModifiers = timeMods;
    weatherSpawnModifiers = weatherMods;
    
    console.log(`Загружено ${enemies.length} врагов`);
    
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации данных врагов:', error);
    return false;
  }
}

// Инициализируем данные при загрузке модуля
initEnemyData().catch(error => {
  console.error('Ошибка при инициализации данных врагов:', error);
});

// Экспортируем с использованием CommonJS
module.exports = {
  enemyRanks,
  enemies,
  timeOfDaySpawnModifiers,
  weatherSpawnModifiers,
  getTimeOfDaySpawnModifiers,
  getWeatherSpawnModifiers,
  getEnemy,
  getEnemies,
  getEnemiesByCategory,
  getEnemiesByLocation,
  getEnemySpawns,
  getModifiedEnemySpawns
};

/**
 * Получает модифицированный список врагов для указанной локации с учетом времени суток и погоды
 * @param {string} locationId - ID локации
 * @param {string} timeOfDay - Время суток ('рассвет', 'утро', 'полдень', 'день', 'вечер', 'ночь')
 * @param {string} weatherType - Тип погоды ('Ясно', 'Облачно', 'Дождь', 'Гроза', 'Туман', 'Снег')
 * @returns {Array} Список врагов с измененными вероятностями появления
 */
function getModifiedEnemySpawns(locationId, timeOfDay, weatherType) {
  try {
    // Обходим асинхронность с помощью кэшированных данных
    let baseSpawns = [];
    
    // Константы для известных локаций
    const knownLocations = {
      'starting_area': [
        { id: 'training_dummy', minLevel: 1, maxLevel: 2, weight: 70 },
        { id: 'weak_spirit_beast', minLevel: 3, maxLevel: 4, weight: 30 }
      ],
      'mountain_path': [
        { id: 'weak_spirit_beast', minLevel: 3, maxLevel: 5, weight: 40 },
        { id: 'mountain_bandit', minLevel: 5, maxLevel: 7, weight: 60 }
      ],
      'ancient_ruins': [
        { id: 'ancient_guardian', minLevel: 8, maxLevel: 10, weight: 50 },
        { id: 'ruin_spirit', minLevel: 7, maxLevel: 9, weight: 40 },
        { id: 'treasure_hunter', minLevel: 6, maxLevel: 8, weight: 30 }
      ],
      'forest_lake': [
        { id: 'water_elemental', minLevel: 7, maxLevel: 9, weight: 50 },
        { id: 'forest_wolf', minLevel: 5, maxLevel: 7, weight: 40 },
        { id: 'swamp_creature', minLevel: 8, maxLevel: 10, weight: 30 }
      ]
    };
    
    if (knownLocations[locationId]) {
      baseSpawns = knownLocations[locationId];
    } else {
      console.error(`Не найдены точки появления врагов для локации ${locationId}`);
      return [];
    }
    
    // Используем кэшированные модификаторы или значения по умолчанию
    const timeModifiers = timeOfDaySpawnModifiers || {
      'рассвет': { 'spirit_beast': 1.2, 'bandit': 0.8, 'undead': 0.5 },
      'день': { 'spirit_beast': 1.0, 'bandit': 1.2, 'undead': 0.1 },
      'вечер': { 'spirit_beast': 1.1, 'bandit': 1.0, 'undead': 0.7 },
      'ночь': { 'spirit_beast': 0.8, 'bandit': 0.6, 'undead': 1.5 }
    };
    
    // Используем кэшированные модификаторы или значения по умолчанию
    const weatherModifiers = weatherSpawnModifiers || {
      'Ясно': { 'spirit_beast': 1.0, 'bandit': 1.1, 'undead': 0.9 },
      'Дождь': { 'spirit_beast': 0.8, 'bandit': 0.7, 'undead': 1.0 },
      'Туман': { 'spirit_beast': 0.9, 'bandit': 1.1, 'undead': 1.3 }
    };
    
    // Модифицируем шансы появления врагов
    const modifiedSpawns = baseSpawns.map(spawn => {
      // Определяем категорию врага
      let category = 'normal';
      
      // Попытка найти врага в кэшированных данных
      const enemy = enemies.find(e => e.id === spawn.id);
      if (enemy && enemy.category) {
        category = enemy.category;
      } else {
        // Определяем категорию по ID врага
        if (spawn.id.includes('spirit')) category = 'spirit_beast';
        else if (spawn.id.includes('bandit')) category = 'bandit';
        else if (spawn.id.includes('undead') || spawn.id.includes('ghost')) category = 'undead';
        else if (spawn.id.includes('elemental')) category = 'elemental';
      }
      
      // Применяем модификаторы времени суток
      let weightModifier = 1.0;
      if (timeModifiers[timeOfDay] && timeModifiers[timeOfDay][category]) {
        weightModifier *= timeModifiers[timeOfDay][category];
      }
      
      // Применяем модификаторы погоды
      if (weatherModifiers[weatherType] && weatherModifiers[weatherType][category]) {
        weightModifier *= weatherModifiers[weatherType][category];
      }
      
      // Создаем копию объекта spawn с измененным весом
      return {
        ...spawn,
        weight: Math.max(5, Math.floor(spawn.weight * weightModifier)) // минимальный вес 5%
      };
    });
    
    // Сортируем по убыванию веса
    return modifiedSpawns.sort((a, b) => b.weight - a.weight);
  } catch (error) {
    console.error('Ошибка при получении модифицированных точек появления врагов:', error);
    // В случае ошибки возвращаем базовые данные без модификаций
    return [];
  }
}
