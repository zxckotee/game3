/**
 * API для взаимодействия с достижениями через HTTP
 * Используется в клиентской части для доступа к данным на сервере
 */

// Импортируем модули через адаптеры для совместимости
const { apiRequest } = require('./api');
const InventoryAdapter = require('./inventory-adapter');
const CultivationAdapter = require('./cultivation-adapter');
const CharacterProfileServiceAPI = require('./character-profile-service-api');

/**
 * Получает все достижения с сервера
 * @returns {Promise<Array>} Промис с массивом достижений
 */
const getAllAchievements = async () => {
  try {
    console.log('[Achievement API] Запрашиваем все достижения');
    const response = await apiRequest('GET', '/api/achievements');
    console.log('[Achievement API] Получен ответ:', response);
    
    // Всегда обновляем профиль персонажа после получения ответа от API
    if (response && Array.isArray(response)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        console.log('[Achievement API] Обновляем профиль персонажа после получения данных о достижениях');
        
        // Сначала проверяем, есть ли награды, которые были получены
        const hasClaimedRewards = response.some(achievement =>
          achievement.userProgress && achievement.userProgress.rewardClaimed);
          
        if (hasClaimedRewards) {
          console.log('[Achievement API] Обнаружены полученные награды, обновляем ресурсы');
          await updateAllResources(userId);
        } else {
          // Даже если нет полученных наград, всё равно обновляем профиль
          // Обновляем инвентарь только если у нас есть Redux Store и инициализированный инвентарь
          await updateCharacterProfile(userId);
          
          // Проверяем, есть ли Redux Store и инициализирован ли инвентарь
          if (typeof window !== 'undefined' && window.__GAME_STATE__ &&
              window.__GAME_STATE__.player &&
              window.__GAME_STATE__.player.inventory &&
              Array.isArray(window.__GAME_STATE__.player.inventory.items)) {
            await updateInventory(userId);
          } else {
            console.log('[Achievement API] Пропускаем обновление инвентаря, так как он еще не инициализирован');
          }
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('[Achievement API] Ошибка при получении достижений с сервера:', error);
    throw error;
  }
};

/**
 * Получает достижение по ID с сервера
 * @param {number} id - ID достижения
 * @returns {Promise<Object|null>} Промис с достижением или null, если не найдено
 */
const getAchievementById = async (id) => {
  try {
    console.log(`[Achievement API] Запрашиваем достижение с ID ${id}`);
    const response = await apiRequest('GET', `/api/achievements/${id}`);
    console.log('[Achievement API] Получен ответ:', response);
    return response;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error(`[Achievement API] Ошибка при получении достижения с ID ${id}:`, error);
    throw error;
  }
};

/**
 * Получает достижения по категории с сервера
 * @param {string} category - Категория достижений
 * @returns {Promise<Array>} Промис с массивом достижений указанной категории
 */
const getAchievementsByCategory = async (category) => {
  try {
    console.log(`[Achievement API] Запрашиваем достижения категории ${category}`);
    const response = await apiRequest('GET', `/api/achievements/category/${encodeURIComponent(category)}`);
    console.log('[Achievement API] Получен ответ:', response);
    return response;
  } catch (error) {
    console.error(`[Achievement API] Ошибка при получении достижений категории ${category}:`, error);
    throw error;
  }
};

/**
 * Получает прогресс достижений пользователя с сервера
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} Промис с массивом прогресса достижений
 */
const getUserAchievements = async(userId) => {
  try {
    console.log(`[Achievement API] Запрашиваем достижения пользователя ${userId}`);
    const response = await apiRequest('GET', `/api/achievements/user/${userId}`);
    console.log(`[Achievement API] Получен ответ для пользователя ${userId}:`, response);
    
    // Всегда обновляем профиль персонажа после получения ответа от API
    if (response && Array.isArray(response)) {
      // Проверяем, есть ли достижения с полученными наградами
      const hasClaimedRewards = response.some(achievement =>
        achievement.userProgress && achievement.userProgress.rewardClaimed);
        
      if (hasClaimedRewards) {
        console.log('[Achievement API] Обнаружены полученные награды, обновляем ресурсы');
        await updateAllResources(userId);
      } else {
        // Даже если нет полученных наград, всё равно обновляем профиль
        console.log('[Achievement API] Обновляем профиль персонажа после получения данных о достижениях');
        await updateCharacterProfile(userId);
        
        // Обновляем инвентарь только если он инициализирован
        if (typeof window !== 'undefined' && window.__GAME_STATE__ &&
            window.__GAME_STATE__.player &&
            window.__GAME_STATE__.player.inventory &&
            Array.isArray(window.__GAME_STATE__.player.inventory.items)) {
          console.log('[Achievement API] Обновляем инвентарь после получения данных о достижениях');
          await updateInventory(userId);
        } else {
          console.log('[Achievement API] Пропускаем обновление инвентаря, так как он еще не инициализирован');
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error(`[Achievement API] Ошибка при получении прогресса достижений пользователя ${userId}:`, error);
    console.error('[Achievement API] Детали ошибки:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return [];
  }
};

/**
 * Обновляет прогресс достижения
 * @param {string} userId - ID пользователя
 * @param {number} achievementId - ID достижения
 * @param {number} value - Новое значение прогресса
 * @returns {Promise<Object>} Промис с обновленным прогрессом достижения
 */
const updateAchievementProgress = async(userId, achievementId, value) => {
  try {
    const response = await apiRequest('POST', '/api/achievements/progress', {
      userId,
      achievementId,
      value
    });
    return response;
  } catch (error) {
    console.error(`[Achievement API] Ошибка при обновлении прогресса достижения ${achievementId}:`, error);
    throw error;
  }
};

/**
 * Получает награду за достижение
 * @param {string} userId - ID пользователя
 * @param {number} achievementId - ID достижения
 * @returns {Promise<Object>} Промис с результатом операции
 */
const claimAchievementReward = async(userId, achievementId) => {
  try {
    console.log(`[Achievement API] Получение награды за достижение ${achievementId} для пользователя ${userId}`);
    const response = await apiRequest('POST', '/api/achievements/claim-reward', {
      userId,
      achievementId
    });
    
    // Если запрос успешен и награда получена, обновляем все ресурсы пользователя
    if (response && !response.error) {
      console.log(`[Achievement API] Награда за достижение ${achievementId} успешно получена, обновляем ресурсы`);
      await updateAllResources(userId);
    }
    
    return response;
  } catch (error) {
    console.error(`[Achievement API] Ошибка при получении награды за достижение ${achievementId}:`, error);
    
    // Формируем понятное сообщение об ошибке для клиента
    if (error.response && error.response.data && error.response.data.message) {
      return { 
        error: true, 
        message: error.response.data.message 
      };
    }
    
    return { 
      error: true, 
      message: 'Произошла ошибка при получении награды за достижение' 
    };
  }
};

/**
 * Проверяет выполнение достижений
 * @param {string} userId - ID пользователя
 * @param {Object} state - Состояние игры
 * @returns {Promise<Array>} Промис с массивом новых выполненных достижений
 */
const checkAchievements = async (userId, state) => {
  try {
    const response = await apiRequest('POST', '/api/achievements/check', {
      userId,
      state
    });
    return response;
  } catch (error) {
    console.error('[Achievement API] Ошибка при проверке достижений:', error);
    return [];
  }
};

/**
 * Создает новое достижение (только для администраторов)
 * @param {Object} achievementData - Данные о достижении
 * @returns {Promise<Object>} Промис с созданным достижением
 */
const createAchievement = async (achievementData) => {
  try {
    const response = await apiRequest('POST', '/api/achievements', achievementData);
    return response;
  } catch (error) {
    console.error('[Achievement API] Ошибка при создании достижения:', error);
    throw error;
  }
};

/**
 * Обновляет достижение (только для администраторов)
 * @param {number} id - ID достижения
 * @param {Object} updates - Обновления для достижения
 * @returns {Promise<Object|null>} Промис с обновленным достижением или null, если не найдено
 */
const updateAchievement = async(id, updates) => {
  try {
    const response = await apiRequest('PUT', `/api/achievements/${id}`, updates);
    return response;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error(`[Achievement API] Ошибка при обновлении достижения с ID ${id}:`, error);
    throw error;
  }
};

/**
 * Удаляет достижение (только для администраторов)
 * @param {number} id - ID достижения
 * @returns {Promise<boolean>} Промис с результатом операции
 */
const deleteAchievement = async(id) => {
  try {
    await apiRequest('DELETE', `/api/achievements/${id}`);
    return true;
  } catch (error) {
    console.error(`[Achievement API] Ошибка при удалении достижения с ID ${id}:`, error);
    return false;
  }
};

/**
 * Обновляет все ресурсы пользователя в Redux после получения наград за достижения
 * @param {string} userId - ID пользователя
 * @returns {Promise<void>}
 */
const updateAllResources = async (userId) => {
  if (!userId) {
    console.warn('[Achievement API] Невозможно обновить ресурсы: отсутствует userId');
    return;
  }

  try {
    console.log('[Achievement API] Обновление ресурсов пользователя после получения наград за достижения');
    
    // Проверяем доступность Redux Store
    if (typeof window === 'undefined' || !window.__GAME_DISPATCH__) {
      console.warn('[Achievement API] Redux dispatch недоступен для обновления состояния');
      return;
    }
    
    // 1. Получаем данные профиля
    console.log('[Achievement API] Запрашиваем обновленные данные профиля');
    const profileResponse = await apiRequest('GET', `/api/users/${userId}/profile`);
    if (profileResponse) {
      console.log('[Achievement API] Обновление профиля в Redux:', profileResponse);
      console.log('[Achievement API] Валюта профиля:', profileResponse.currency);
      window.__GAME_DISPATCH__({
        type: 'UPDATE_PROFILE',
        payload: profileResponse
      });
    } else {
      console.warn('[Achievement API] Не удалось получить данные профиля для обновления');
    }
    
    // 2. Явно обновляем валюту в Redux из профиля
    if (profileResponse && profileResponse.currency) {
      console.log('[Achievement API] Обновление валюты в Redux:', profileResponse.currency);
      window.__GAME_DISPATCH__({
        type: 'UPDATE_CURRENCY',
        payload: profileResponse.currency
      });
    }
    
    // 3. Получаем и обновляем данные инвентаря через адаптер
    console.log('[Achievement API] Запрашиваем обновленные данные инвентаря');
    const inventoryItems = await InventoryAdapter.getInventoryItems(userId);
    if (inventoryItems) {
      console.log('[Achievement API] Обновление инвентаря в Redux:', inventoryItems);
      window.__GAME_DISPATCH__({
        type: 'UPDATE_INVENTORY',
        payload: inventoryItems // Передаем массив предметов напрямую, без вложенности
      });
    }
    
    // 4. Получаем данные культивации через адаптер
    console.log('[Achievement API] Запрашиваем обновленные данные культивации');
    const cultivationResponse = await CultivationAdapter.getCultivationProgress(userId);
    if (cultivationResponse) {
      console.log('[Achievement API] Обновление культивации в Redux:', cultivationResponse);
      window.__GAME_DISPATCH__({
        type: 'UPDATE_CULTIVATION',
        payload: cultivationResponse
      });
    }
    
    // 5. Проверяем текущее состояние в Redux для отладки
    setTimeout(() => {
      if (window.__GAME_STATE__) {
        console.log('[Achievement API] Текущая валюта в Redux после обновления:',
          window.__GAME_STATE__.player?.inventory?.currency);
      }
    }, 100);
    
    // 6. Отправляем событие обновления ресурсов для синхронизации компонентов
    window.dispatchEvent(new CustomEvent('resources-updated', {
      detail: { source: 'achievement-rewards' }
    }));
    
    console.log('[Achievement API] Ресурсы пользователя успешно обновлены');
  } catch (error) {
    console.error('[Achievement API] Ошибка при обновлении ресурсов пользователя:', error);
  }
};

/**
 * Обновляет профиль персонажа через character-profile-service-api
 * @param {string} userId - ID пользователя
 * @returns {Promise<void>}
 */
const updateCharacterProfile = async (userId) => {
  if (!userId) {
    console.warn('[Achievement API] Невозможно обновить профиль: отсутствует userId');
    return;
  }

  try {
    console.log('[Achievement API] Обновление профиля пользователя через CharacterProfileServiceAPI');
    
    // Проверяем доступность Redux Store
    if (typeof window === 'undefined' || !window.__GAME_DISPATCH__) {
      console.warn('[Achievement API] Redux dispatch недоступен для обновления состояния');
      return;
    }
    
    // Получаем данные профиля через CharacterProfileServiceAPI
    const profileResponse = await CharacterProfileServiceAPI.getCharacterProfile(userId);
    if (profileResponse) {
      console.log('[Achievement API] Обновление профиля в Redux:', profileResponse);
      console.log('[Achievement API] Валюта профиля:', profileResponse.currency);
      window.__GAME_DISPATCH__({
        type: 'UPDATE_PROFILE',
        payload: profileResponse
      });
      
      // Явно обновляем валюту в Redux из профиля
      if (profileResponse.currency) {
        console.log('[Achievement API] Обновление валюты в Redux:', profileResponse.currency);
        window.__GAME_DISPATCH__({
          type: 'UPDATE_CURRENCY',
          payload: profileResponse.currency
        });
      }
      
      // Отправляем событие обновления ресурсов для синхронизации компонентов
      window.dispatchEvent(new CustomEvent('profile-updated', {
        detail: { source: 'achievement-api' }
      }));
      
      console.log('[Achievement API] Профиль пользователя успешно обновлен');
    } else {
      console.warn('[Achievement API] Не удалось получить данные профиля для обновления');
    }
  } catch (error) {
    console.error('[Achievement API] Ошибка при обновлении профиля пользователя:', error);
  }
};

/**
 * Обновляет инвентарь пользователя через inventory-api
 * @param {string} userId - ID пользователя
 * @returns {Promise<void>}
 */
const updateInventory = async (userId) => {
  if (!userId) {
    console.warn('[Achievement API] Невозможно обновить инвентарь: отсутствует userId');
    return;
  }

  try {
    console.log('[Achievement API] Обновление инвентаря пользователя через InventoryAdapter');
    
    // Проверяем доступность Redux Store
    if (typeof window === 'undefined' || !window.__GAME_DISPATCH__) {
      console.warn('[Achievement API] Redux dispatch недоступен для обновления состояния');
      return;
    }
    
    // Получаем текущее состояние из Redux Store для проверки
    const currentState = window.__GAME_STATE__;
    if (!currentState || !currentState.player || !currentState.player.inventory) {
      console.warn('[Achievement API] Инвентарь еще не инициализирован в Redux Store, пропускаем обновление');
      return;
    }
    
    // Получаем данные инвентаря через InventoryAdapter
    const inventoryItems = await InventoryAdapter.getInventoryItems(userId);
    if (inventoryItems && Array.isArray(inventoryItems)) {
      console.log('[Achievement API] Обновление инвентаря в Redux:', inventoryItems);
      
      // Обновляем инвентарь, передавая массив предметов напрямую
      window.__GAME_DISPATCH__({
        type: 'UPDATE_INVENTORY',
        payload: inventoryItems // Передаем массив предметов напрямую, без вложенности
      });
      
      // Отправляем событие обновления инвентаря для синхронизации компонентов
      window.dispatchEvent(new CustomEvent('inventory-updated', {
        detail: { source: 'achievement-api' }
      }));
      
      console.log('[Achievement API] Инвентарь пользователя успешно обновлен');
    } else {
      console.warn('[Achievement API] Не удалось получить данные инвентаря для обновления или данные не являются массивом');
    }
  } catch (error) {
    console.error('[Achievement API] Ошибка при обновлении инвентаря пользователя:', error);
  }
};

// Экспортируем функции через CommonJS
module.exports = {
  getAllAchievements,
  getAchievementById,
  getAchievementsByCategory,
  getUserAchievements,
  updateAchievementProgress,
  claimAchievementReward,
  checkAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  updateAllResources,
  updateCharacterProfile,
  updateInventory
};

// Логирование для отладки
console.log('[Achievement API] API для достижений загружен с поддержкой apiRequest');