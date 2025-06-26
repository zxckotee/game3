/**
 * API-сервис для работы с эффектами
 */
class EffectsServiceAPI {
  /**
   * Получает все эффекты пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Объект с эффектами, сгруппированными по источнику
   */
  static async getAllEffects(userId) {
    try {
      const response = await fetch(`/api/effects/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении эффектов');
      }

      const effects = await response.json();
      
      // После получения данных обновляем Redux-стейт
      if (window.__gameContext && window.__gameContext.dispatch) {
        // Обновляем каждый тип эффектов отдельно
        window.__gameContext.dispatch({
          type: 'WEATHER_EFFECTS_UPDATE',
          payload: effects.weather || []
        });
        
        window.__gameContext.dispatch({
          type: 'TECHNIQUE_EFFECTS_UPDATE',
          payload: effects.technique || []
        });
        
        window.__gameContext.dispatch({
          type: 'SECT_EFFECTS_UPDATE',
          payload: effects.sect || []
        });
        
        window.__gameContext.dispatch({
          type: 'EQUIPMENT_EFFECTS_UPDATE',
          payload: effects.equipment || []
        });
        
        window.__gameContext.dispatch({
          type: 'PET_EFFECTS_UPDATE',
          payload: effects.pet || []
        });
        
        window.__gameContext.dispatch({
          type: 'STATUS_EFFECTS_UPDATE',
          payload: effects.status || []
        });
        
        // Объединенный список всех эффектов
        const allEffects = [
          ...(effects.weather || []),
          ...(effects.technique || []),
          ...(effects.sect || []),
          ...(effects.equipment || []),
          ...(effects.pet || []),
          ...(effects.status || [])
        ];
        
        window.__gameContext.dispatch({
          type: 'ALL_EFFECTS_UPDATE',
          payload: allEffects
        });
      }
      
      return effects;
    } catch (error) {
      console.error('Ошибка при получении эффектов:', error);
      throw error;
    }
  }
  
  /**
   * Добавляет эффект
   * @param {number} userId - ID пользователя
   * @param {Object} effect - Данные эффекта
   * @returns {Promise<Object>} - Добавленный эффект
   */
  static async addEffect(userId, effect) {
    try {
      const response = await fetch(`/api/effects/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(effect),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при добавлении эффекта');
      }

      const newEffect = await response.json();
      
      // Обновляем Redux-стейт
      this.getAllEffects(userId);
      
      return newEffect;
    } catch (error) {
      console.error('Ошибка при добавлении эффекта:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет эффект
   * @param {number} userId - ID пользователя
   * @param {number} effectId - ID эффекта
   * @returns {Promise<Object>} - Результат удаления
   */
  static async removeEffect(userId, effectId) {
    try {
      const response = await fetch(`/api/effects/${userId}/${effectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении эффекта');
      }

      const result = await response.json();
      
      // Обновляем Redux-стейт
      this.getAllEffects(userId);
      
      return result;
    } catch (error) {
      console.error('Ошибка при удалении эффекта:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет эффекты, связанные с погодой
   * @param {number} userId - ID пользователя
   * @param {Object} weatherData - Данные о погоде
   * @returns {Promise<Object>} - Обновленные эффекты
   */
  static async updateWeatherEffects(userId, weatherData) {
    try {
      const response = await fetch(`/api/effects/${userId}/update-weather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(weatherData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении эффектов погоды');
      }

      const effects = await response.json();
      
      // Обновляем Redux-стейт
      if (window.__gameContext && window.__gameContext.dispatch) {
        // Обновляем каждый тип эффектов отдельно
        window.__gameContext.dispatch({
          type: 'WEATHER_EFFECTS_UPDATE',
          payload: effects.weather || []
        });
        
        // Объединенный список всех эффектов
        const allEffects = [
          ...(effects.weather || []),
          ...(effects.technique || []),
          ...(effects.sect || []),
          ...(effects.equipment || []),
          ...(effects.pet || []),
          ...(effects.status || [])
        ];
        
        window.__gameContext.dispatch({
          type: 'ALL_EFFECTS_UPDATE',
          payload: allEffects
        });
      }
      
      return effects;
    } catch (error) {
      console.error('Ошибка при обновлении эффектов погоды:', error);
      throw error;
    }
  }
}

// Экспортируем класс через CommonJS
module.exports = EffectsServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getAllEffects = EffectsServiceAPI.getAllEffects;
module.exports.addEffect = EffectsServiceAPI.addEffect;
module.exports.removeEffect = EffectsServiceAPI.removeEffect;
module.exports.updateWeatherEffects = EffectsServiceAPI.updateWeatherEffects;