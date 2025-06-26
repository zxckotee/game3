/**
 * API-сервис для работы с системой культивации
 * Использует HTTP запросы к серверу вместо прямого доступа к базе данных
 */

// Базовый URL API
const API_URL = '/api';

/**
 * Сервис для работы с данными о культивации через API
 */
class CultivationServiceAPI {
  /**
   * Получение данных о культивации пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Данные о культивации
   */
  static async getCultivationProgress(userId) {
    try {
      const response = await fetch(`${API_URL}/cultivation/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении данных о культивации');
      }

      const cultivation = await response.json();
      return cultivation;
    } catch (error) {
      console.error('Ошибка при получении данных о культивации:', error);
      throw error;
    }
  }

  /**
   * Обновление данных о культивации пользователя
   * @param {number} userId - ID пользователя
   * @param {Object} data - Новые данные о культивации
   * @returns {Promise<Object>} - Обновленные данные о культивации
   */
  static async updateCultivationProgress(userId, data) {
    try {
      const response = await fetch(`${API_URL}/cultivation/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении данных о культивации');
      }

      const updatedCultivation = await response.json();
      return updatedCultivation;
    } catch (error) {
      console.error('Ошибка при обновлении данных о культивации:', error);
      throw error;
    }
  }

  /**
   * Проверка возможности прорыва на следующий уровень
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат проверки
   */
  static async checkBreakthroughPossibility(userId) {
    try {
      const response = await fetch(`${API_URL}/cultivation/${userId}/breakthrough-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при проверке возможности прорыва');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при проверке возможности прорыва:', error);
      throw error;
    }
  }

  /**
   * Завершение трибуляции
   * @param {number} userId - ID пользователя
   * @param {Object} tribulationResult - Результат трибуляции
   * @returns {Promise<Object>} - Результат обработки трибуляции
   */
  static async completeTribulation(userId, tribulationResult) {
    try {
      const response = await fetch(`${API_URL}/cultivation/${userId}/complete-tribulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(tribulationResult),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при завершении трибуляции');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при завершении трибуляции:', error);
      throw error;
    }
  }

  /**
   * Увеличение прогресса "бутылочного горлышка"
   * @param {number} userId - ID пользователя
   * @param {number} amount - Количество прогресса для добавления
   * @returns {Promise<Object>} - Обновленные данные о культивации
   */
  static async increaseBottleneckProgress(userId, amount) {
    try {
      const response = await fetch(`${API_URL}/cultivation/${userId}/increase-bottleneck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при увеличении прогресса "бутылочного горлышка"');
      }

      const result = await response.json();
      
      // Обновляем состояние Redux после успешного запроса
      if (result.success && typeof window !== 'undefined') {
        // Получаем значение прогресса, учитывая разные форматы имен полей в ответе сервера
        const bottleneckProgress = result.bottleneckProgress || result.currentProgress;
        const requiredBottleneckProgress = result.requiredBottleneckProgress || result.requiredProgress;
        
        // Проверяем доступность Redux Store
        if (window.__GAME_DISPATCH__) {
          console.log('Обновляем Redux-состояние с прогрессом бутылочного горлышка:', bottleneckProgress);
          
          // 1. Диспетчеризируем действие для обновления состояния культивации
          window.__GAME_DISPATCH__({
            type: 'UPDATE_CULTIVATION',
            payload: {
              bottleneckProgress,
              requiredBottleneckProgress
            }
          });
          
          // 2. Отправляем событие обновления культивации для синхронизации компонентов
          window.dispatchEvent(new CustomEvent('cultivation-changed'));
          
          // 3. Добавляем уведомление о прогрессе, если это не было вызвано автоматически
          const progressChange = amount || 1; // используем переданное количество прогресса или 1 по умолчанию
          window.__GAME_DISPATCH__({
            type: 'ADD_NOTIFICATION',
            payload: {
              id: Date.now(),
              type: 'success',
              message: `Вы продвинулись в преодолении "бутылочного горлышка" (+${progressChange})`,
              duration: 3000
            }
          });
          
          // Проверяем, изменилось ли значение в Redux через 100мс
          setTimeout(() => {
            const currentState = window.__GAME_STATE__?.player?.cultivation;
            console.log('Текущее значение bottleneckProgress в Redux после обновления:',
              currentState ? currentState.bottleneckProgress : 'недоступно');
          }, 100);
        } else {
          console.warn('Redux dispatch недоступен для обновления состояния');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при увеличении прогресса "бутылочного горлышка":', error);
      throw error;
    }
  }

  /**
   * Получение озарения
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат озарения
   */
  static async gainInsight(userId) {
    try {
      const response = await fetch(`${API_URL}/cultivation/${userId}/gain-insight`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении озарения');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при получении озарения:', error);
      throw error;
    }
  }

  /**
   * Выполнение прорыва на следующий уровень культивации
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат прорыва
  */

  static async performBreakthrough(userId) {
    try {
      const response = await fetch(`${API_URL}/cultivation/${userId}/breakthrough`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при выполнении прорыва');
      }

      const result = await response.json();
      
      // Обновляем состояние Redux после успешного запроса
      if (result.success && typeof window !== 'undefined' && window.__GAME_DISPATCH__) {
        console.log('Обновляем Redux-состояние после прорыва:', result);
        
        // Диспетчеризируем действие для обновления состояния культивации
        window.__GAME_DISPATCH__({
          type: 'UPDATE_CULTIVATION',
          payload: result.cultivation
        });
        
        // Если были получены очки характеристик, обновляем статистику
        if (result.statsPointsAwarded) {
          window.__GAME_DISPATCH__({
            type: 'UPDATE_PLAYER_STATS',
            payload: {
              unassignedPoints: (window.__GAME_STATE__?.player?.stats?.unassignedPoints || 0) + result.statsPointsAwarded
            }
          });
        }
        
        // Отправляем событие обновления культивации для синхронизации компонентов
        window.dispatchEvent(new CustomEvent('cultivation-changed'));
        window.dispatchEvent(new CustomEvent('breakthrough-complete', {
          detail: { result }
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при выполнении прорыва:', error);
      throw error;
    }
  }
}


// Экспортируем класс через CommonJS
module.exports = CultivationServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getCultivationProgress = CultivationServiceAPI.getCultivationProgress;
module.exports.updateCultivationProgress = CultivationServiceAPI.updateCultivationProgress;
module.exports.checkBreakthroughPossibility = CultivationServiceAPI.checkBreakthroughPossibility;
module.exports.completeTribulation = CultivationServiceAPI.completeTribulation;
module.exports.increaseBottleneckProgress = CultivationServiceAPI.increaseBottleneckProgress;
module.exports.gainInsight = CultivationServiceAPI.gainInsight;
module.exports.performBreakthrough = CultivationServiceAPI.performBreakthrough;

/**
 * Создание данных о культивации пользователя (для новых персонажей)
 * @param {number} userId - ID пользователя
 * @param {Object} data - Начальные данные о культивации
 * @returns {Promise<Object>} - Созданные данные о культивации
 */
module.exports.createCultivationProgress = async function(userId, data) {
  try {
    // Используем тот же эндпоинт что и для обновления, но отправляем флаг, что это новый профиль
    const response = await fetch(`${API_URL}/cultivation/${userId}`, {
      method: 'POST', // Используем POST для создания
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        ...data,
        isNewProfile: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при создании данных о культивации');
    }

    const createdCultivation = await response.json();
    console.log('[CultivationAPI] Успешно созданы данные культивации:', createdCultivation);
    return createdCultivation;
  } catch (error) {
    console.error('Ошибка при создании данных о культивации:', error);
    throw error;
  }
};

// Добавляем метод в класс для полноты
CultivationServiceAPI.createCultivationProgress = module.exports.createCultivationProgress;