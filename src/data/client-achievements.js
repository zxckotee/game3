/**
 * Клиентская версия данных о достижениях без серверных зависимостей
 * Использует API для получения данных с сервера
 */

const AchievementAPI = require('../services/achievement-api');

// Кэш для хранения данных (для оптимизации)
let achievementsCache = [];
let userAchievementsCache = {};
let categoriesCache = [];
let initialized = false;

/**
 * Загружает все достижения с сервера
 * @returns {Promise<Array>} Промис с массивом достижений
 */
async function getAllAchievements() {
  try {
    // Получаем данные с сервера
    const achievements = await AchievementAPI.getAllAchievements();
    
    // Обновляем кэш
    achievementsCache = achievements;
    
    // Обновляем кэш категорий
    const categories = new Set();
    achievements.forEach(achievement => {
      if (achievement.category) {
        categories.add(achievement.category);
      }
    });
    categoriesCache = Array.from(categories);
    
    initialized = true;
    
    return achievements;
  } catch (error) {
    console.error('Ошибка при загрузке достижений через API:', error);
    return achievementsCache;
  }
}

/**
 * Получает достижение по ID
 * @param {string} id - ID достижения
 * @returns {Promise<Object|null>} Промис с достижением или null, если не найдено
 */
async function getAchievementById(id) {
  // Если данные есть в кэше и мы инициализированы, используем их
  if (initialized && achievementsCache.length > 0) {
    const cachedAchievement = achievementsCache.find(achievement => achievement.id === id);
    if (cachedAchievement) {
      return cachedAchievement;
    }
  }
  
  try {
    const achievement = await AchievementAPI.getAchievementById(id);
    
    // Если достижение найдено, добавляем его в кэш
    if (achievement) {
      if (!initialized) {
        // Если кэш не инициализирован, инициализируем его
        await getAllAchievements();
      } else {
        // Добавляем или обновляем достижение в кэше
        const index = achievementsCache.findIndex(a => a.id === id);
        if (index !== -1) {
          achievementsCache[index] = achievement;
        } else {
          achievementsCache.push(achievement);
        }
      }
    }
    
    return achievement;
  } catch (error) {
    console.error(`Ошибка при получении достижения с ID ${id} через API:`, error);
    return null;
  }
}

/**
 * Получает все категории достижений
 * @returns {Promise<Array>} Промис с массивом категорий
 */
async function getAchievementCategories() {
  if (initialized && categoriesCache.length > 0) {
    return categoriesCache;
  }
  
  // Если кэш не инициализирован, загружаем все достижения
  await getAllAchievements();
  
  return categoriesCache;
}

/**
 * Получает достижения по категории
 * @param {string} category - Категория достижений
 * @returns {Promise<Array>} Промис с массивом достижений указанной категории
 */
async function getAchievementsByCategory(category) {
  // Если данные есть в кэше и мы инициализированы, используем их
  if (initialized && achievementsCache.length > 0) {
    const cachedAchievements = achievementsCache.filter(
      achievement => achievement.category === category
    );
    
    if (cachedAchievements.length > 0) {
      return cachedAchievements;
    }
  }
  
  try {
    const achievements = await AchievementAPI.getAchievementsByCategory(category);
    
    // Если кэш инициализирован, обновляем его
    if (initialized) {
      // Находим все достижения этой категории в кэше
      const indicesToRemove = [];
      achievementsCache.forEach((achievement, index) => {
        if (achievement.category === category) {
          indicesToRemove.push(index);
        }
      });
      
      // Удаляем их из кэша в обратном порядке
      for (let i = indicesToRemove.length - 1; i >= 0; i--) {
        achievementsCache.splice(indicesToRemove[i], 1);
      }
      
      // Добавляем новые достижения в кэш
      achievementsCache.push(...achievements);
    }
    
    return achievements;
  } catch (error) {
    console.error(`Ошибка при получении достижений категории ${category} через API:`, error);
    
    // Если данные есть в кэше, возвращаем их
    if (achievementsCache.length > 0) {
      return achievementsCache.filter(achievement => achievement.category === category);
    }
    
    return [];
  }
}

/**
 * Получает прогресс достижений пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} Промис с массивом прогресса достижений
 */
async function getUserAchievements(userId) {
  try {
    const achievements = await AchievementAPI.getUserAchievements(userId);
    
    // Обновляем кэш
    userAchievementsCache[userId] = achievements;
    
    return achievements;
  } catch (error) {
    console.error(`Ошибка при получении прогресса достижений пользователя ${userId} через API:`, error);
    
    // Если данные есть в кэше, возвращаем их
    if (userAchievementsCache[userId]) {
      return userAchievementsCache[userId];
    }
    
    return [];
  }
}

/**
 * Обновляет прогресс достижения
 * @param {string} userId - ID пользователя
 * @param {string} achievementId - ID достижения
 * @param {number} value - Новое значение прогресса
 * @returns {Promise<Object>} Промис с обновленным прогрессом достижения
 */
async function updateAchievementProgress(userId, achievementId, value) {
  try {
    const result = await AchievementAPI.updateAchievementProgress(userId, achievementId, value);
    
    // Если у нас есть кэш пользователя, обновляем его
    if (userAchievementsCache[userId]) {
      const index = userAchievementsCache[userId].findIndex(a => a.id === achievementId);
      if (index !== -1) {
        userAchievementsCache[userId][index] = {
          ...userAchievementsCache[userId][index],
          currentValue: result.currentValue,
          requiredValue: result.requiredValue,
          isCompleted: result.isCompleted,
          progress: result.progress,
          completionDate: result.completionDate
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Ошибка при обновлении прогресса достижения ${achievementId} через API:`, error);
    throw error;
  }
}

/**
 * Получает награду за достижение
 * @param {string} userId - ID пользователя
 * @param {string} achievementId - ID достижения
 * @returns {Promise<Object>} Промис с результатом операции
 */
async function claimAchievementReward(userId, achievementId) {
  try {
    const result = await AchievementAPI.claimAchievementReward(userId, achievementId);
    
    // Если результат содержит ошибку, выбрасываем исключение
    if (result.error) {
      throw new Error(result.message);
    }
    
    // Если у нас есть кэш пользователя, обновляем его
    if (userAchievementsCache[userId]) {
      const index = userAchievementsCache[userId].findIndex(a => a.id === achievementId);
      if (index !== -1) {
        userAchievementsCache[userId][index].isRewarded = true;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Ошибка при получении награды за достижение ${achievementId} через API:`, error);
    throw error;
  }
}

/**
 * Проверяет выполнение достижений на основе текущего состояния
 * @param {string} userId - ID пользователя
 * @param {Object} state - Состояние игры
 * @returns {Promise<Array>} Промис с массивом новых выполненных достижений
 */
async function checkAchievements(userId, state) {
  try {
    // Проверяем достижения на сервере
    const newlyCompleted = await AchievementAPI.checkAchievements(userId, state);
    
    // Если у нас есть кэш пользователя и есть новые завершенные достижения, обновляем его
    if (userAchievementsCache[userId] && newlyCompleted.length > 0) {
      // Сбрасываем кэш, так как серверная логика могла сильно изменить состояние
      userAchievementsCache[userId] = null;
    }
    
    return newlyCompleted;
  } catch (error) {
    console.error('Ошибка при проверке достижений через API:', error);
    return [];
  }
}

/**
 * Локальная функция для проверки условий достижения на клиенте
 * Используется для быстрой проверки выполнения без обращения к серверу
 * @param {string} achievementId - ID достижения
 * @param {Object} state - Состояние игры
 * @returns {boolean} Результат проверки
 */
function checkAchievementCondition(achievementId, state) {
  try {
    // Логика проверки зависит от ID достижения
    switch (achievementId) {
      case 'ach1': // Первые шаги
        if (!state || !state.player || !state.player.cultivation) {
          return false;
        }
        return typeof state.player.cultivation.level === 'number' && state.player.cultivation.level >= 1;
        
      case 'ach2': // Коллекционер техник
        if (!state || !state.player || !state.player.techniques) {
          return false;
        }
        return Array.isArray(state.player.techniques) && state.player.techniques.length >= 5;
        
      case 'ach3': // Исследователь
        if (!state || !state.player || !state.player.progress || !state.player.progress.discoveries) {
          return false;
        }
        
        const discoveries = state.player.progress.discoveries;
        
        if (typeof discoveries !== 'object' || discoveries === null || Array.isArray(discoveries)) {
          return false;
        }
        
        let count = 0;
        for (const key in discoveries) {
          if (discoveries[key]) {
            count++;
          }
        }
        
        return count >= 10;
        
      // Добавьте другие проверки по мере необходимости
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`Ошибка при проверке условия достижения ${achievementId}:`, error);
    return false;
  }
}

/**
 * Локальная функция для расчета прогресса достижения на клиенте
 * @param {string} achievementId - ID достижения
 * @param {Object} state - Состояние игры
 * @returns {Object} Информация о прогрессе
 */
function calculateAchievementProgress(achievementId, state) {
  try {
    // Логика расчета прогресса зависит от ID достижения
    switch (achievementId) {
      case 'ach1': // Первые шаги
        if (!state || !state.player || !state.player.cultivation) {
          return { current: 0, required: 1 };
        }
        return {
          current: typeof state.player.cultivation.level === 'number' ? state.player.cultivation.level : 0,
          required: 1
        };
        
      case 'ach2': // Коллекционер техник
        if (!state || !state.player || !state.player.techniques) {
          return { current: 0, required: 5 };
        }
        return {
          current: Array.isArray(state.player.techniques) ? state.player.techniques.length : 0,
          required: 5
        };
        
      case 'ach3': // Исследователь
        if (!state || !state.player || !state.player.progress || !state.player.progress.discoveries) {
          return { current: 0, required: 10 };
        }
        
        const discoveries = state.player.progress.discoveries;
        
        if (typeof discoveries !== 'object' || discoveries === null || Array.isArray(discoveries)) {
          return { current: 0, required: 10 };
        }
        
        let count = 0;
        for (const key in discoveries) {
          if (discoveries[key]) {
            count++;
          }
        }
        
        return {
          current: count,
          required: 10
        };
        
      // Добавьте другие расчеты прогресса по мере необходимости
        
      default:
        return { current: 0, required: 1 };
    }
  } catch (error) {
    console.error(`Ошибка при расчете прогресса достижения ${achievementId}:`, error);
    return { current: 0, required: 1 };
  }
}

/**
 * Инициализирует данные о достижениях, загружая их через API
 */
async function initAchievementData() {
  console.log('Инициализация данных о достижениях через API...');
  try {
    await getAllAchievements();
    console.log(`Загружено ${achievementsCache.length} достижений через API`);
  } catch (error) {
    console.error('Ошибка при инициализации данных о достижениях:', error);
  }
}

// Для совместимости с оригинальным модулем achievements.js
const achievements = [];

// Инициализируем данные при загрузке модуля
initAchievementData().then(() => {
  // Заполняем массив achievements для обратной совместимости
  achievements.splice(0, achievements.length, ...achievementsCache);
}).catch(error => {
  console.error('Ошибка при автоматической инициализации достижений:', error);
});

// Экспорт для совместимости со старым кодом
module.exports = {
  achievements,
  getAllAchievements,
  getAchievementById,
  getAchievementCategories,
  getAchievementsByCategory,
  getUserAchievements,
  updateAchievementProgress,
  claimAchievementReward,
  checkAchievements,
  checkAchievementCondition,
  calculateAchievementProgress,
  initAchievementData
};

// Экспортируем отдельные свойства для совместимости
module.exports.achievements = achievements;
module.exports.getAllAchievements = getAllAchievements;
module.exports.getAchievementById = getAchievementById;
module.exports.getAchievementCategories = getAchievementCategories;
module.exports.getAchievementsByCategory = getAchievementsByCategory;
module.exports.getUserAchievements = getUserAchievements;
module.exports.updateAchievementProgress = updateAchievementProgress;
module.exports.claimAchievementReward = claimAchievementReward;
module.exports.checkAchievements = checkAchievements;
module.exports.checkAchievementCondition = checkAchievementCondition;
module.exports.calculateAchievementProgress = calculateAchievementProgress;
module.exports.initAchievementData = initAchievementData;