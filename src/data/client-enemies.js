/**
 * Клиентская версия данных о врагах без серверных зависимостей
 * Использует API для получения данных с сервера
 */

const EnemyAPI = require('../services/enemy-api');

// Экспорт констант из API
const enemyRanks = EnemyAPI.enemyRanks;

// Кэш для хранения данных (для оптимизации)
let enemiesCache = [];
let initialized = false;

// Определяем резервные модификаторы времени суток
const defaultTimeModifiers = {
  'рассвет': {
    'spirit_beast': 1.2,
    'bandit': 0.8,
    'undead': 0.5,
    'elemental': 1.1
  },
  'утро': {
    'spirit_beast': 1.1,
    'bandit': 1.0,
    'undead': 0.3,
    'elemental': 1.0
  },
  'полдень': {
    'spirit_beast': 1.0,
    'bandit': 1.2,
    'undead': 0.2,
    'elemental': 0.9
  },
  'день': {
    'spirit_beast': 1.0,
    'bandit': 1.2,
    'undead': 0.1,
    'elemental': 0.8
  },
  'вечер': {
    'spirit_beast': 1.1,
    'bandit': 1.0,
    'undead': 0.7,
    'elemental': 1.0
  },
  'ночь': {
    'spirit_beast': 0.8,
    'bandit': 0.6,
    'undead': 1.5,
    'elemental': 1.2
  }
};

// Определяем резервные модификаторы погоды
const defaultWeatherModifiers = {
  'Ясно': {
    'spirit_beast': 1.0,
    'bandit': 1.1,
    'undead': 0.9,
    'elemental': 1.0
  },
  'Облачно': {
    'spirit_beast': 1.0,
    'bandit': 1.0,
    'undead': 1.0,
    'elemental': 1.0
  },
  'Дождь': {
    'spirit_beast': 0.8,
    'bandit': 0.7,
    'undead': 1.0,
    'elemental': 1.2,
    'water_elemental': 1.5
  },
  'Гроза': {
    'spirit_beast': 0.6,
    'bandit': 0.5,
    'undead': 1.1,
    'elemental': 1.3,
    'lightning_elemental': 2.0
  },
  'Туман': {
    'spirit_beast': 0.9,
    'bandit': 1.1,
    'undead': 1.3,
    'elemental': 0.8,
    'ghost': 1.6
  },
  'Снег': {
    'spirit_beast': 0.7,
    'bandit': 0.6,
    'undead': 0.9,
    'elemental': 1.1,
    'ice_elemental': 1.8
  }
};

// Устанавливаем резервные данные сразу, чтобы избежать null
let timeModifiersCache = defaultTimeModifiers;
let weatherModifiersCache = defaultWeatherModifiers;

// Резервные данные о врагах для случаев, когда API недоступен
const fallbackEnemies = [
  {
    id: 'training_dummy',
    name: 'Тренировочный манекен',
    icon: '🎯',
    description: 'Простой деревянный манекен для тренировки базовых приёмов.',
    level: 1,
    category: 'construct',
    experience: 10,
    stats: {
      health: 100,
      attack: 0,
      defense: 5, // Оставляем для обратной совместимости
      physicalDefense: 5, // Физическая защита
      spiritualDefense: 5, // Для деревянного манекена логичнее иметь одинаковые защиты
      speed: 0,
      resistance: 5,
      criticalChance: 0,
      accuracy: 10, // Базовая точность (манекен неподвижен, поэтому низкая)
      evasion: 0   // Манекен не уклоняется
    },
    attacks: [
      {
        name: "Контратака",
        damage: 5,
        damageType: "physical",
        energyCost: 0
      }
    ],
    currency: {
      min: 1,
      max: 3
    },
    loot: []
  },
  {
    id: 'weak_spirit_beast',
    name: 'Слабый духовный зверь',
    icon: '🐾',
    description: 'Молодой духовный зверь, только начавший свой путь совершенствования.',
    level: 3,
    category: 'spirit_beast',
    experience: 25,
    stats: {
      health: 150,
      attack: 15,
      defense: 8, // Оставляем для обратной совместимости
      physicalDefense: 8, // Физическая защита (соответствует defense)
      spiritualDefense: 10, // Духовная защита чуть выше для духовного зверя
      speed: 12,
      resistance: 10,
      criticalChance: 0.05,
      accuracy: 20, // Средняя точность
      evasion: 15   // Хорошее уклонение благодаря скорости
    },
    attacks: [
      {
        name: "Укус",
        damage: 10,
        damageType: "physical",
        energyCost: 0
      },
      {
        name: "Духовный рык",
        damage: 15,
        damageType: "spiritual",
        energyCost: 10
      }
    ],
    currency: {
      min: 5,
      max: 10
    },
    loot: []
  },
  {
    id: 'mountain_bandit',
    name: 'Горный разбойник',
    icon: '🗡️',
    description: 'Бандит, промышляющий на горных тропах. Владеет базовыми боевыми техниками.',
    level: 5,
    category: 'bandit',
    experience: 50,
    stats: {
      health: 200,
      attack: 25,
      defense: 15, // Оставляем для обратной совместимости
      physicalDefense: 15, // Физическая защита для бандита
      spiritualDefense: 5, // Низкая духовная защита
      speed: 10,
      resistance: 5,
      criticalChance: 0.08,
      accuracy: 25, // Точность атаки
      evasion: 12  // Уклонение
    },
    attacks: [
      {
        name: "Удар мечом",
        damage: 20,
        damageType: "physical",
        energyCost: 0
      },
      {
        name: "Стремительный выпад",
        damage: 25,
        damageType: "physical",
        energyCost: 15
      }
    ],
    currency: {
      min: 20,
      max: 40
    },
    loot: [
      {
        itemId: "iron_sword",
        chance: 10
      }
    ]
  },
  {
    id: 'ancient_guardian',
    name: 'Древний страж',
    icon: '👹',
    description: 'Духовная сущность, охраняющая руины древней цивилизации.',
    level: 10,
    category: 'elemental',
    experience: 100,
    stats: {
      health: 350,
      attack: 40,
      defense: 30,
      speed: 15,
      resistance: 25,
      criticalChance: 0.1
    },
    attacks: [
      {
        name: "Призрачное касание",
        damage: 30,
        damageType: "spiritual",
        energyCost: 0
      },
      {
        name: "Древнее проклятие",
        damage: 45,
        damageType: "spiritual",
        energyCost: 25
      }
    ],
    currency: {
      min: 50,
      max: 100
    },
    loot: [
      {
        itemId: "ancient_relic",
        chance: 5
      },
      {
        itemId: "spirit_essence",
        chance: 20
      }
    ]
  },
  {
    id: 'night_wraith',
    name: 'Ночной призрак',
    icon: '👻',
    description: 'Мстительный дух, появляющийся только в ночной тьме.',
    level: 7,
    category: 'undead',
    experience: 70,
    stats: {
      health: 220,
      attack: 35,
      defense: 10,
      speed: 20,
      resistance: 30,
      criticalChance: 0.15
    },
    attacks: [
      {
        name: "Прикосновение тьмы",
        damage: 25,
        damageType: "spiritual",
        energyCost: 0
      },
      {
        name: "Вопль ужаса",
        damage: 35,
        damageType: "spiritual",
        energyCost: 20
      }
    ],
    currency: {
      min: 30,
      max: 60
    },
    loot: [
      {
        itemId: "ghost_essence",
        chance: 40
      },
      {
        itemId: "night_pearl",
        chance: 15
      }
    ]
  },
  {
    id: 'water_elemental',
    name: 'Водный элементаль',
    icon: '💧',
    description: 'Существо, состоящее из живой воды. Особенно сильно во время дождя.',
    level: 6,
    category: 'water_elemental',
    experience: 65,
    stats: {
      health: 250,
      attack: 30,
      defense: 20,
      speed: 18,
      resistance: 35,
      criticalChance: 0.08
    },
    attacks: [
      {
        name: "Водяной кнут",
        damage: 25,
        damageType: "water",
        energyCost: 0
      },
      {
        name: "Поток",
        damage: 35,
        damageType: "water",
        energyCost: 25
      }
    ],
    currency: {
      min: 25,
      max: 50
    },
    loot: [
      {
        itemId: "water_essence",
        chance: 40
      },
      {
        itemId: "pure_dewdrop",
        chance: 25
      }
    ]
  },
  {
    id: 'lightning_spirit',
    name: 'Дух молнии',
    icon: '⚡',
    description: 'Элементальное существо, черпающее силу из грозовых облаков.',
    level: 8,
    category: 'lightning_elemental',
    experience: 80,
    stats: {
      health: 200,
      attack: 45,
      defense: 15,
      speed: 25,
      resistance: 20,
      criticalChance: 0.12
    },
    attacks: [
      {
        name: "Электрический разряд",
        damage: 30,
        damageType: "lightning",
        energyCost: 0
      },
      {
        name: "Цепная молния",
        damage: 40,
        damageType: "lightning",
        energyCost: 30
      }
    ],
    currency: {
      min: 35,
      max: 70
    },
    loot: [
      {
        itemId: "lightning_essence",
        chance: 35
      },
      {
        itemId: "thunder_crystal",
        chance: 20
      }
    ]
  }
];

// Инициализируем кэш резервными данными
enemiesCache = fallbackEnemies;

/**
 * Загружает всех врагов с сервера
 * @returns {Promise<Array>} Промис с массивом врагов
 */
async function getAllEnemies() {
  try {
    // Получаем данные с сервера
    const enemies = await EnemyAPI.getAllEnemies();
    
    // Обновляем кэш
    enemiesCache = enemies;
    initialized = true;
    
    return enemies;
  } catch (error) {
    console.error('Ошибка при загрузке врагов через API:', error);
    return enemiesCache;
  }
}
console.log(EnemyAPI.getAllEnemies());

/**
 * Получает врага по ID
 * @param {string} id - ID врага
 * @returns {Promise<Object|null>} Промис с врагом или null, если не найден
 */
async function getEnemyById(id) {
  // Если данные есть в кэше, используем их
  if (initialized && enemiesCache.length > 0) {
    const cachedEnemy = enemiesCache.find(enemy => enemy.id === id);
    if (cachedEnemy) {
      return cachedEnemy;
    }
  }
  
  try {
    return await EnemyAPI.getEnemyById(id);
  } catch (error) {
    console.error(`Ошибка при получении врага с ID ${id} через API:`, error);
    return null;
  }
}

/**
 * Получает врагов по категории
 * @param {string} category - Категория врагов
 * @returns {Promise<Array>} Промис с массивом врагов указанной категории
 */
async function getEnemiesByCategory(category) {
  // Если данные есть в кэше, используем их
  if (initialized && enemiesCache.length > 0) {
    const cachedEnemies = enemiesCache.filter(enemy => enemy.category === category);
    if (cachedEnemies.length > 0) {
      return cachedEnemies;
    }
  }
  
  try {
    return await EnemyAPI.getEnemiesByCategory(category);
  } catch (error) {
    console.error(`Ошибка при получении врагов категории ${category} через API:`, error);
    return [];
  }
}

/**
 * Получает врагов для указанной локации
 * @param {string} locationId - ID локации
 * @returns {Promise<Array>} Промис с массивом врагов
 */
async function getEnemiesByLocation(locationId) {
  try {
    return await EnemyAPI.getEnemiesByLocation(locationId);
  } catch (error) {
    console.error(`Ошибка при получении врагов для локации ${locationId} через API:`, error);
    return [];
  }
}

/**
 * Получает модификаторы времени суток для врагов
 * @returns {Promise<Object>} Промис с модификаторами времени суток
 */
async function getTimeOfDaySpawnModifiers() {
  // Если данные есть в кэше, используем их
  if (timeModifiersCache) {
    console.log('Используем кэшированные модификаторы времени суток');
    return timeModifiersCache;
  }
  
  // Проверяем доступность API
  try {
    // Таймаут в 1 секунду для быстрой проверки
    const apiCheckPromise = EnemyAPI.isApiAvailable();
    // Устанавливаем таймаут в 1 секунду
    const apiAvailable = await Promise.race([
      apiCheckPromise,
      new Promise(resolve => setTimeout(() => resolve(false), 1000))
    ]);
    
    if (!apiAvailable) {
      console.warn('API недоступен при запросе модификаторов времени суток, используем значения по умолчанию');
      return defaultTimeModifiers;
    }
    
    // API доступен, пробуем получить данные
    const modifiers = await EnemyAPI.getTimeOfDaySpawnModifiers();
    
    // Если получили пустые или некорректные данные, используем резервные
    if (!modifiers || Object.keys(modifiers).length === 0) {
      console.warn('API вернул пустые модификаторы времени суток, используем значения по умолчанию');
      return defaultTimeModifiers;
    }
    
    // Данные получены успешно
    console.log('Модификаторы времени суток успешно загружены с сервера');
    timeModifiersCache = modifiers;
    return modifiers;
  } catch (error) {
    console.error('Ошибка при получении модификаторов времени суток через API:', error);
    // Просто используем резервные данные, которые уже были определены ранее
    return defaultTimeModifiers;
  }
}

/**
 * Получает модификаторы погоды для врагов
 * @returns {Promise<Object>} Промис с модификаторами погоды
 */
async function getWeatherSpawnModifiers() {
  // Если данные есть в кэше, используем их
  if (weatherModifiersCache) {
    console.log('Используем кэшированные модификаторы погоды');
    return weatherModifiersCache;
  }
  
  // Проверяем доступность API
  try {
    // Таймаут в 1 секунду для быстрой проверки
    const apiCheckPromise = EnemyAPI.isApiAvailable();
    // Устанавливаем таймаут в 1 секунду
    const apiAvailable = await Promise.race([
      apiCheckPromise,
      new Promise(resolve => setTimeout(() => resolve(false), 1000))
    ]);
    
    if (!apiAvailable) {
      console.warn('API недоступен при запросе модификаторов погоды, используем значения по умолчанию');
      return defaultWeatherModifiers;
    }
    
    // API доступен, пробуем получить данные
    const modifiers = await EnemyAPI.getWeatherSpawnModifiers();
    
    // Если получили пустые или некорректные данные, используем резервные
    if (!modifiers || Object.keys(modifiers).length === 0) {
      console.warn('API вернул пустые модификаторы погоды, используем значения по умолчанию');
      return defaultWeatherModifiers;
    }
    
    // Данные получены успешно
    console.log('Модификаторы погоды успешно загружены с сервера');
    weatherModifiersCache = modifiers;
    return modifiers;
  } catch (error) {
    console.error('Ошибка при получении модификаторов погоды через API:', error);
    // Просто используем резервные данные, которые уже были определены ранее
    return defaultWeatherModifiers;
  }
}

/**
 * Таймаут для повторных попыток загрузки данных (в миллисекундах)
 */
const RETRY_TIMEOUT = 5000;

/**
 * Максимальное количество повторных попыток
 */
const MAX_RETRIES = 3;

/**
 * Инициализирует данные о врагах, загружая их через API с автоматическими повторными попытками
 * @param {number} retryCount - Текущее количество попыток
 * @returns {Promise<boolean>} - Промис с результатом инициализации
 */
async function initEnemyData(retryCount = 0) {
  console.log(`Инициализация данных о врагах через API... (попытка ${retryCount + 1})`);
  
  try {
    // Проверяем доступность API перед началом загрузки
    const apiAvailable = await EnemyAPI.isApiAvailable();
    if (!apiAvailable) {
      console.warn('API недоступен при инициализации, используем резервные данные');
      enemiesCache = fallbackEnemies;
      initialized = true;
      console.log(`Используем резервные данные с ${enemiesCache.length} врагами`);
      return false;
    }
    
    // Получаем данные о врагах
    const enemies = await getAllEnemies();
    
    // Если данные пусты, используем резервные данные
    if (!enemies || enemies.length === 0) {
      console.warn('API вернул пустой массив врагов, используем резервные данные');
      enemiesCache = fallbackEnemies;
    } else {
      console.log(`Успешно загружено ${enemies.length} врагов через API`);
    }
    
    // Загружаем модификаторы последовательно, чтобы избежать эффекта "гонки"
    try {
      console.log('Загрузка модификаторов времени суток...');
      timeModifiersCache = await getTimeOfDaySpawnModifiers();
      console.log('Модификаторы времени суток успешно загружены');
      
      console.log('Загрузка модификаторов погоды...');
      weatherModifiersCache = await getWeatherSpawnModifiers();
      console.log('Модификаторы погоды успешно загружены');
    } catch (modifierError) {
      console.error('Ошибка при загрузке модификаторов:', modifierError);
      console.warn('Используем предустановленные модификаторы');
      // Не делаем ничего, так как модификаторы уже установлены по умолчанию
    }
    
    initialized = true;
    console.log(`Инициализация данных о врагах завершена, доступно ${enemiesCache.length} врагов`);
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации данных о врагах:', error);
    
    // Если достигли максимального количества попыток, используем резервные данные
    if (retryCount >= MAX_RETRIES) {
      console.warn(`Превышено максимальное количество попыток (${MAX_RETRIES}), используем резервные данные`);
      enemiesCache = fallbackEnemies;
      initialized = true;
      console.log(`Используем резервные данные с ${enemiesCache.length} врагами`);
      return false;
    }
    
    // Повторяем попытку через указанный интервал
    console.log(`Повторная попытка через ${RETRY_TIMEOUT / 1000} сек...`);
    return new Promise(resolve => {
      setTimeout(() => {
        initEnemyData(retryCount + 1).then(resolve);
      }, RETRY_TIMEOUT);
    });
  }
}

// Инициализируем данные при загрузке модуля с обработкой ошибок
initEnemyData().catch(error => {
  console.error('Критическая ошибка при инициализации врагов:', error);
  console.warn('Используем резервные данные после критической ошибки');
  enemiesCache = fallbackEnemies;
  initialized = true;
});

// Экспорт для совместимости со старым кодом
module.exports = {
  enemyRanks,
  enemies: enemiesCache, // Экспортируем кэшированные враги как enemies
  fallbackEnemies, // Экспортируем резервные данные отдельно
  getAllEnemies,
  getEnemyById,
  getEnemiesByCategory,
  getEnemiesByLocation,
  getTimeOfDaySpawnModifiers,
  getWeatherSpawnModifiers,
  getModifiedEnemySpawns, // Важно экспортировать эту функцию
  initEnemyData
};

// Если модуль импортирован в браузере, автоматически инициализируем данные
if (typeof window !== 'undefined') {
  initEnemyData().catch(error => {
    console.warn('Автоматическая инициализация данных о врагах не удалась:', error);
    console.info('Используются резервные данные о врагах');
    // Устанавливаем резервные данные, если инициализация не удалась
    enemiesCache = fallbackEnemies;
    initialized = true;
  });
}

/**
 * Получает список врагов для указанной локации с учетом модификаторов времени суток и погоды
 * @param {string} locationId - ID локации
 * @param {string} timeOfDay - Время суток ('рассвет', 'утро', 'полдень', 'день', 'вечер', 'ночь')
 * @param {string} weatherType - Тип погоды ('Ясно', 'Облачно', 'Дождь', 'Гроза', 'Туман', 'Снег')
 * @returns {Array} Массив точек появления врагов
 */
function getModifiedEnemySpawns(locationId, timeOfDay, weatherType) {
  console.log(`Получение модифицированных точек появления врагов для: локация=${locationId}, время=${timeOfDay}, погода=${weatherType}`);
  
  try {
    // Используем предопределенные данные вместо асинхронных запросов
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
    
    let baseEnemies = [];
    if (knownLocations[locationId]) {
      baseEnemies = knownLocations[locationId];
    } else {
      console.warn(`Не найдены враги для локации ${locationId}`);
      return [];
    }
    
    // Используем глобальные кэшированные модификаторы, определенные ранее
    
    // Проверяем корректность модификаторов для выбранного времени и погоды
    if (!timeOfDay || !timeModifiersCache[timeOfDay]) {
      console.warn(`Модификатор времени '${timeOfDay}' не найден, используем модификатор 'день'`);
      timeOfDay = 'день';
    }
    
    if (!weatherType || !weatherModifiersCache[weatherType]) {
      console.warn(`Модификатор погоды '${weatherType}' не найден, используем модификатор 'Ясно'`);
      weatherType = 'Ясно';
    }
    
    // Логирование для отладки
    console.log('Используемые модификаторы времени:', timeOfDay, timeModifiersCache[timeOfDay]);
    console.log('Используемые модификаторы погоды:', weatherType, weatherModifiersCache[weatherType]);
    
    // Преобразуем список врагов в формат точек появления с учетом модификаторов
    const modifiedSpawns = baseEnemies.map(enemy => {
      // Определяем категорию врага по ID
      let category = 'normal';
      const id = enemy.id || '';
      
      // Более точное определение категории
      if (id.includes('water_elemental')) category = 'water_elemental';
      else if (id.includes('lightning_elemental')) category = 'lightning_elemental';
      else if (id.includes('ice_elemental')) category = 'ice_elemental';
      else if (id.includes('elemental')) category = 'elemental';
      else if (id.includes('spirit')) category = 'spirit_beast';
      else if (id.includes('bandit')) category = 'bandit';
      else if (id.includes('ghost')) category = 'ghost';
      else if (id.includes('undead')) category = 'undead';
      
      console.log(`Враг ${id} определен как категория ${category}`);
      
      // По умолчанию вес 50, если не указан
      const baseWeight = enemy.weight || enemy.spawnWeight || enemy.spawnChance || 50;
      
      // Начальный модификатор = 1.0 (без изменений)
      let weightModifier = 1.0;
      
      // Применяем модификатор времени суток, если доступен
      if (timeModifiersCache[timeOfDay] && timeModifiersCache[timeOfDay][category]) {
        weightModifier *= timeModifiersCache[timeOfDay][category];
      }
      
      // Применяем модификатор погоды, если доступен
      if (weatherModifiersCache[weatherType] && weatherModifiersCache[weatherType][category]) {
        weightModifier *= weatherModifiersCache[weatherType][category];
      }
      
      // Рассчитываем модифицированный вес, минимум 5%
      const modifiedWeight = Math.max(5, Math.floor(baseWeight * weightModifier));
      
      // Преобразуем врага в формат точки появления
      return {
        id: enemy.id,
        minLevel: enemy.minLevel || enemy.level || 1,
        maxLevel: enemy.maxLevel || enemy.level || 1,
        weight: modifiedWeight,
        name: enemy.name || enemy.id,
        icon: enemy.icon || '👹',
        category: category
      };
    });
    
    // Сортируем по убыванию веса
    return modifiedSpawns.sort((a, b) => b.weight - a.weight);
  } catch (error) {
    console.error('Ошибка при получении модифицированных врагов:', error);
    // В случае ошибки возвращаем пустой массив
    return [];
  }
}

// Экспортируем отдельные свойства для совместимости
module.exports.enemyRanks = enemyRanks;
module.exports.getAllEnemies = getAllEnemies;
module.exports.getEnemyById = getEnemyById;
module.exports.getEnemiesByCategory = getEnemiesByCategory;
module.exports.getEnemiesByLocation = getEnemiesByLocation;
module.exports.getTimeOfDaySpawnModifiers = getTimeOfDaySpawnModifiers;
module.exports.getWeatherSpawnModifiers = getWeatherSpawnModifiers;
module.exports.getModifiedEnemySpawns = getModifiedEnemySpawns;
module.exports.initEnemyData = initEnemyData;
module.exports.enemies = enemiesCache;