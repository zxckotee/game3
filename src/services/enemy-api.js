/**
 * API для взаимодействия с врагами через HTTP
 * Используется в клиентской части для доступа к данным на сервере
 */

// Базовый URL для API с учетом окружения
const BASE_URL = typeof window !== 'undefined' ?
  (window.location.origin || 'http://localhost:3001') :
  'http://localhost:3001';

// Кэш для хранения данных
const apiCache = {
  enemies: new Map(),
  categories: new Map(),
  locations: new Map(),
  modifiers: {
    time: null,
    weather: null
  }
};

// Попытка загрузить кэшированные данные из localStorage
function loadCacheFromStorage() {
  if (typeof localStorage !== 'undefined') {
    try {
      const cachedData = localStorage.getItem('enemyDataCache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        Object.keys(parsed).forEach(key => {
          apiCache.enemies.set(key, parsed[key]);
        });
        console.log('Успешно загружены кэшированные данные о врагах');
      }
    } catch (e) {
      console.error('Ошибка при загрузке кэша:', e);
    }
  }
}

// Сохранение кэша в localStorage
function saveCacheToStorage() {
  if (typeof localStorage !== 'undefined') {
    try {
      const cacheObj = {};
      apiCache.enemies.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem('enemyDataCache', JSON.stringify(cacheObj));
      console.log('Данные о врагах сохранены в кэше');
    } catch (e) {
      console.error('Ошибка при сохранении кэша:', e);
    }
  }
}

// Загружаем кэш при инициализации
loadCacheFromStorage();

// Определим функцию fetch в зависимости от среды выполнения
let fetchFn;
if (typeof fetch !== 'undefined') {
  // В браузере или новых версиях Node.js используем нативный fetch
  fetchFn = fetch;
} else {
  // В старых версиях Node.js используем заглушку, которая возвращает пустые данные
  console.warn('Native fetch API not available, using stub implementation');
  
  fetchFn = async (url, options = {}) => {
    // В серверной среде без fetch просто возвращаем заглушку
    console.log(`[STUB FETCH] ${options.method || 'GET'} ${url}`);
    
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ data: [] })
    };
  };
}

// Вспомогательная функция для проверки доступности API
async function isApiAvailable() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 секунда таймаут
    
    const response = await fetchFn(`${BASE_URL}/api/status`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Вспомогательная функция для выполнения HTTP-запросов
const api = {
  async get(url, useCache = true) {
    // Проверяем кэш, если разрешено его использование
    if (useCache && apiCache.enemies.has(url)) {
      return { data: apiCache.enemies.get(url) };
    }
    
    try {
      // Устанавливаем таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 секунды таймаут
      
      const response = await fetchFn(`${BASE_URL}${url}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Сохраняем в кэш, если успешно получили данные
      if (useCache) {
        apiCache.enemies.set(url, data);
        // Обновляем локальное хранилище асинхронно
        setTimeout(() => saveCacheToStorage(), 0);
      }
      
      return { data };
    } catch (error) {
      console.error(`API Error (GET ${url}):`, error);
      
      if (error.name === 'AbortError') {
        console.warn(`Запрос к ${url} был прерван по таймауту`);
      }
      
      // Не выбрасываем исключение, а возвращаем пустые данные
      return { data: [] };
    }
  },
  
  async post(url, body) {
    try {
      const response = await fetchFn(`${BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Инвалидируем кэш после изменения данных
      apiCache.enemies.clear();
      
      return { data };
    } catch (error) {
      console.error(`API Error (POST ${url}):`, error);
      throw error;
    }
  },
  
  async put(url, body) {
    try {
      const response = await fetchFn(`${BASE_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Инвалидируем кэш после изменения данных
      apiCache.enemies.clear();
      
      return { data };
    } catch (error) {
      console.error(`API Error (PUT ${url}):`, error);
      throw error;
    }
  },
  
  async delete(url) {
    try {
      const response = await fetchFn(`${BASE_URL}${url}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Инвалидируем кэш после изменения данных
      apiCache.enemies.clear();
      
      return { data };
    } catch (error) {
      console.error(`API Error (DELETE ${url}):`, error);
      throw error;
    }
  }
};

// Константы для типов врагов
const enemyRanks = {
  NORMAL: 'normal',
  ELITE: 'elite',
  BOSS: 'boss'
};

/**
 * Получает всех врагов с сервера
 * @returns {Promise<Array>} Промис с массивом врагов
 */
async function getAllEnemies() {
  // Проверяем доступность API перед запросом
  const apiAvailable = await isApiAvailable();
  if (!apiAvailable) {
    console.warn('API недоступен, возвращаем кэшированные данные');
    // Загружаем данные из localStorage, если они там есть
    loadCacheFromStorage();
    
    // Проверяем, есть ли кэшированные данные для этого URL
    const cachedData = apiCache.enemies.get('/api/enemies');
    if (cachedData && cachedData.length > 0) {
      return cachedData;
    }
    
    console.warn('Кэшированные данные отсутствуют, возвращаем пустой массив');
    return [];
  }

  try {
    const response = await api.get('/api/enemies');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении врагов с сервера:', error);
    
    // Проверяем, есть ли кэшированные данные для этого URL
    const cachedData = apiCache.enemies.get('/api/enemies');
    if (cachedData && cachedData.length > 0) {
      console.log('Возвращаем кэшированные данные из getAllEnemies');
      return cachedData;
    }
    
    return []; // Возвращаем пустой массив в крайнем случае
  }
}

/**
 * Получает врага по ID
 * @param {string} id - ID врага
 * @returns {Promise<Object>} Промис с данными врага
 */
async function getEnemyById(id) {
  try {
    // Проверяем, есть ли кэшированные данные
    const allEnemiesCache = apiCache.enemies.get('/api/enemies');
    if (allEnemiesCache && allEnemiesCache.length > 0) {
      const cachedEnemy = allEnemiesCache.find(enemy => enemy.id === id);
      if (cachedEnemy) {
        console.log(`Найден кэшированный враг с ID ${id}`);
        return cachedEnemy;
      }
    }

    // Если нет в кэше или не найден, запрашиваем с сервера
    const response = await api.get(`/api/enemies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении врага с ID ${id}:`, error);
    
    // Попробуем найти в кэше
    const allEnemiesCache = apiCache.enemies.get('/api/enemies');
    if (allEnemiesCache && allEnemiesCache.length > 0) {
      const cachedEnemy = allEnemiesCache.find(enemy => enemy.id === id);
      if (cachedEnemy) {
        console.log(`Найден кэшированный враг с ID ${id} после ошибки`);
        return cachedEnemy;
      }
    }
    
    return null;
  }
}

/**
 * Получает врагов по категории
 * @param {string} category - Категория врага
 * @returns {Promise<Array>} Промис с массивом врагов указанной категории
 */
async function getEnemiesByCategory(category) {
  try {
    // Проверяем, есть ли кэшированные данные
    const allEnemiesCache = apiCache.enemies.get('/api/enemies');
    if (allEnemiesCache && allEnemiesCache.length > 0) {
      const cachedEnemies = allEnemiesCache.filter(enemy => enemy.category === category);
      if (cachedEnemies.length > 0) {
        console.log(`Найдены кэшированные враги категории ${category}`);
        return cachedEnemies;
      }
    }

    // Если нет в кэше, запрашиваем с сервера
    const response = await api.get(`/api/enemies/category/${category}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении врагов категории ${category}:`, error);
    
    // Попробуем найти в кэше
    const allEnemiesCache = apiCache.enemies.get('/api/enemies');
    if (allEnemiesCache && allEnemiesCache.length > 0) {
      const cachedEnemies = allEnemiesCache.filter(enemy => enemy.category === category);
      if (cachedEnemies.length > 0) {
        console.log(`Найдены кэшированные враги категории ${category} после ошибки`);
        return cachedEnemies;
      }
    }
    
    return [];
  }
}

/**
 * Получает врагов по локации
 * @param {string} locationId - ID локации
 * @returns {Promise<Array>} Промис с массивом врагов
 */
async function getEnemiesByLocation(locationId) {
  try {
    // Проверяем доступность API
    const apiAvailable = await isApiAvailable();
    if (!apiAvailable) {
      console.warn(`API недоступен при запросе врагов для локации ${locationId}`);
      return [];
    }
    
    // Проверяем кэш для данной локации
    const cacheKey = `/api/enemies/location/${locationId}`;
    if (apiCache.locations.has(cacheKey)) {
      return apiCache.locations.get(cacheKey);
    }
    
    // Делаем запрос к API
    const response = await api.get(`/api/enemies/location/${locationId}`);
    
    // Кэшируем результат
    if (response.data && response.data.length > 0) {
      apiCache.locations.set(cacheKey, response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении врагов для локации ${locationId}:`, error);
    return [];
  }
}

/**
 * Получает модификаторы времени суток для врагов
 * @returns {Promise<Object>} Промис с модификаторами времени суток
 */
async function getTimeOfDaySpawnModifiers() {
  // Проверяем кэш
  if (apiCache.modifiers.time) {
    return apiCache.modifiers.time;
  }
  
  try {
    const response = await api.get('/api/enemies/modifiers/time');
    
    // Сохраняем результат в кэш
    apiCache.modifiers.time = response.data;
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении модификаторов времени суток через API:', error);
    
    // Возвращаем резервные данные
    const defaultModifiers = {
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
    
    // Сохраняем резервные данные в кэш
    apiCache.modifiers.time = defaultModifiers;
    
    return defaultModifiers;
  }
}

/**
 * Получает модификаторы погоды для врагов
 * @returns {Promise<Object>} Промис с модификаторами погоды
 */
async function getWeatherSpawnModifiers() {
  // Проверяем кэш
  if (apiCache.modifiers.weather) {
    return apiCache.modifiers.weather;
  }
  
  try {
    const response = await api.get('/api/enemies/modifiers/weather');
    
    // Сохраняем результат в кэш
    apiCache.modifiers.weather = response.data;
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении модификаторов погоды через API:', error);
    
    // Возвращаем резервные данные
    const defaultModifiers = {
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
    
    // Сохраняем резервные данные в кэш
    apiCache.modifiers.weather = defaultModifiers;
    
    return defaultModifiers;
  }
}

/**
 * Инициализирует данные о врагах, загружая их через API с автоматическими повторными попытками
 * @param {number} retryCount - Текущее количество попыток
 * @returns {Promise<boolean>} - Промис с результатом инициализации
 */
async function initEnemyData(retryCount = 0) {
  console.log(`Инициализация данных о врагах через API... (попытка ${retryCount + 1})`);
  
  // Загружаем кэш из localStorage
  loadCacheFromStorage();
  
  // Проверяем доступность API
  const apiAvailable = await isApiAvailable();
  if (!apiAvailable) {
    console.warn('API недоступен, используем кэшированные данные');
    return false;
  }
  
  try {
    // Получаем данные о врагах
    const enemies = await getAllEnemies();
    
    // Загружаем модификаторы
    await Promise.allSettled([
      getTimeOfDaySpawnModifiers(),
      getWeatherSpawnModifiers()
    ]);
    
    // Сохраняем данные в localStorage
    saveCacheToStorage();
    
    console.log(`Инициализация данных о врагах завершена успешно`);
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации данных о врагах:', error);
    return false;
  }
}

/**
 * Экспортируем API как модуль CommonJS
 */
module.exports = {
  enemyRanks,
  getAllEnemies,
  getEnemyById,
  getEnemiesByCategory,
  getEnemiesByLocation,
  getTimeOfDaySpawnModifiers,
  getWeatherSpawnModifiers,
  initEnemyData,
  isApiAvailable,
  loadCacheFromStorage,
  saveCacheToStorage
};