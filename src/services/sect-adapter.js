const SectServiceAPI = require('./sect-api');

/**
 * Адаптер для работы с сектами
 * Обеспечивает совместимость с существующим кодом, используя API
 */
class SectAdapter {
  /**
   * Получение информации о секте по ID
   * @param {number} sectId - ID секты
   * @returns {Promise<Object>} - Секта
   */
  static async getSectById(sectId) {
    try {
      // Проверка на корректность ID
      console.log(`SectAdapter.getSectById вызван с параметром: ${sectId}, тип: ${typeof sectId}`);
      
      if (isNaN(parseInt(sectId)) || String(sectId) === 'available') {
        console.error(`Некорректный ID секты в адаптере: ${sectId}`);
        throw new Error(`Некорректный ID секты: ${sectId}`);
      }
      
      // Используем API для получения данных
      const sect = await SectServiceAPI.getSectById(sectId);
      
      // Обновляем состояние Redux
      if (sect) {
        store.dispatch({ type: 'UPDATE_SECT', payload: sect });
      }
      
      return sect;
    } catch (error) {
      console.error(`Ошибка при получении секты с ID ${sectId}:`, error);
      
      // Пытаемся восстановить данные из Redux
      try {
        const state = store.getState();
        const sect = state.sect?.data;
        
        if (sect && sect.id === sectId) {
          console.log('Используем кэшированные данные о секте из Redux');
          return sect;
        }
      } catch (reduxError) {
        console.error('Ошибка при получении данных из Redux:', reduxError);
      }
      
      throw error;
    }
  }
  
  /**
   * Получение информации о секте игрока
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Секта игрока
   */
  static async getUserSect(userId) {
    try {
      // Используем API для получения данных
      const sect = await SectServiceAPI.getUserSect(userId);
      
      // Обновляем состояние Redux
      if (sect) {
        store.dispatch({ type: 'UPDATE_SECT', payload: sect });
      } else {
        store.dispatch({ type: 'CLEAR_SECT' });
      }
      
      return sect;
    } catch (error) {
      console.error('Ошибка при получении секты пользователя:', error);
      
      // Пытаемся восстановить данные из Redux
      try {
        const state = store.getState();
        const sect = state.sect?.data;
        
        if (sect) {
          console.log('Используем кэшированные данные о секте из Redux');
          return sect;
        }
      } catch (reduxError) {
        console.error('Ошибка при получении данных из Redux:', reduxError);
      }
      
      return null;
    }
  }
  
  /**
   * Создание секты
   * @param {number} userId - ID пользователя
   * @param {string} sectName - Название секты
   * @returns {Promise<Object>} - Созданная секта
   */
  static async createSect(userId, sectName) {
    try {
      // Используем API для создания секты
      const sect = await SectServiceAPI.createSect(userId, sectName);
      
      // Обновляем состояние Redux
      if (sect) {
        store.dispatch({ type: 'UPDATE_SECT', payload: sect });
      }
      
      return sect;
    } catch (error) {
      console.error('Ошибка при создании секты:', error);
      throw error;
    }
  }
  
  /**
   * Присоединение к секте
   * @param {number} userId - ID пользователя
   * @param {number} sectId - ID секты
   * @returns {Promise<Object>} - Член секты
   */
  static async joinSect(userId, sectId) {
    try {
      // Используем API для присоединения к секте
      const sectMember = await SectServiceAPI.joinSect(userId, sectId);
      
      // Получаем обновленные данные о секте
      if (sectMember) {
        const sect = await SectServiceAPI.getSectById(sectId);
        if (sect) {
          store.dispatch({ type: 'UPDATE_SECT', payload: sect });
        }
      }
      
      return sectMember;
    } catch (error) {
      console.error('Ошибка при присоединении к секте:', error);
      throw error;
    }
  }
  
  /**
   * Внесение вклада в секту
   * @param {number} userId - ID пользователя
   * @param {number} sectId - ID секты
   * @param {number} energyAmount - Количество энергии для вклада
   * @returns {Promise<Object>} - Результат вклада
   */
  static async contributeToSect(userId, sectId, energyAmount) {
    try {
      // Вызов API для внесения вклада
      const result = await SectServiceAPI.contributeToSect(userId, sectId, energyAmount);
      
      // Просто возвращаем результат, без обновления Redux
      return result;
    } catch (error) {
      console.error('Ошибка при внесении вклада в секту:', error);
      throw error;
    }
  }
  
  /**
   * Тренировка с членом секты
   * @param {number} userId - ID пользователя
   * @param {number} memberId - ID члена секты
   * @param {number} duration - Продолжительность тренировки
   * @returns {Promise<Object>} - Результат тренировки
   */
  static async trainWithMember(userId, memberId, duration) {
    try {
      // Используем API для тренировки
      const result = await SectServiceAPI.trainWithMember(userId, memberId, duration);
      
      // Обновляем состояние Redux
      if (result) {
        // Получаем обновленные данные о секте
        const state = store.getState();
        const sectId = state.sect?.data?.id;
        
        if (sectId) {
          const sect = await SectServiceAPI.getSectById(sectId);
          if (sect) {
            store.dispatch({ type: 'UPDATE_SECT', payload: sect });
          }
        }
        
        // Обновляем культивацию пользователя
        if (result.userCultivation) {
          store.dispatch({
            type: 'UPDATE_CULTIVATION',
            payload: result.userCultivation
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при тренировке с членом секты:', error);
      throw error;
    }
  }
  
  /**
   * Получение бонусов от секты
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Бонусы от секты
   */
  static async getSectBenefits(userId) {
    try {
      // Используем API для получения бонусов
      const benefits = await SectServiceAPI.getSectBenefits(userId);
      
      // Обновляем состояние Redux
      if (benefits) {
        store.dispatch({ type: 'UPDATE_SECT_BENEFITS', payload: benefits });
      }
      
      return benefits;
    } catch (error) {
      console.error('Ошибка при получении бонусов от секты:', error);
      
      // Пытаемся восстановить данные из Redux
      try {
        const state = store.getState();
        const benefits = state.sect?.benefits;
        
        if (benefits) {
          console.log('Используем кэшированные данные о бонусах секты из Redux');
          return benefits;
        }
      } catch (reduxError) {
        console.error('Ошибка при получении данных из Redux:', reduxError);
      }
      
      return [];
    }
  }
  
  /**
   * Получение ранга пользователя в секте
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Ранг и привилегии пользователя в секте
   */
  static async getUserSectRank(userId) {
    try {
      // Используем API для получения ранга
      const rank = await SectServiceAPI.getUserSectRank(userId);
      
      // Обновляем состояние Redux
      if (rank) {
        store.dispatch({ type: 'UPDATE_SECT_RANK', payload: rank });
      }
      
      return rank;
    } catch (error) {
      console.error('Ошибка при получении ранга пользователя в секте:', error);
      
      // Пытаемся восстановить данные из Redux
      try {
        const state = store.getState();
        const rank = state.sect?.rank;
        
        if (rank) {
          console.log('Используем кэшированные данные о ранге в секте из Redux');
          return rank;
        }
      } catch (reduxError) {
        console.error('Ошибка при получении данных из Redux:', reduxError);
      }
      
      return {
        inSect: false,
        rank: 'Нет',
        privileges: []
      };
    }
  }

  /**
   * Выход из секты
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат выхода
   */
  static async leaveSect(userId) {
    try {
      // Проверяем, состоит ли пользователь в секте
      const userSect = await SectServiceAPI.getUserSect(userId);
      
      // Если пользователь не состоит в секте, возвращаем успешный результат
      if (!userSect) {
        console.log('Пользователь уже не состоит в секте');
        return { success: true, message: 'Пользователь уже не состоит в секте' };
      }
      
      // Используем API для выхода из секты
      const result = await SectServiceAPI.leaveSect(userId);
      
      // Очищаем кеш секты вместо обновления Redux
      try {
        const { clearCache, getSectCacheKey } = require('../utils/cacheUtils');
        clearCache(getSectCacheKey(userId));
      } catch (cacheError) {
        console.warn('Не удалось очистить кеш секты:', cacheError);
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при выходе из секты:', error);
      throw error;
    }
  }
}
console.log(SectAdapter);
module.exports = SectAdapter;