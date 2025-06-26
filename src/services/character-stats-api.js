/**
 * API-сервис для работы с характеристиками персонажа
 * Использует HTTP запросы к серверу вместо прямого доступа к базе данных
 */

// Базовый URL API
const API_URL = '/api';

/**
 * Сервис для работы с характеристиками персонажа через API
 */
class CharacterStatsServiceAPI {
  /**
   * Получение характеристик персонажа
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Характеристики персонажа
   */
  static async getCharacterStats(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении характеристик персонажа');
      }

      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('Ошибка при получении характеристик персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Обновление характеристик персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} data - Новые характеристики персонажа
   * @returns {Promise<Object>} - Обновленные характеристики персонажа
   */
  static async updateCharacterStats(userId, data) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении характеристик персонажа');
      }

      const updatedStats = await response.json();
      return updatedStats;
    } catch (error) {
      console.error('Ошибка при обновлении характеристик персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Расчет вторичных характеристик персонажа
   * @param {Object} stats - Основные характеристики персонажа
   * @param {Object} cultivation - Данные о культивации
   * @returns {Object} - Вторичные характеристики персонажа
   */
  static calculateSecondaryStats(stats, cultivation) {
    try {
      if (!stats || !cultivation) {
        return {
          physicalDefense: 0,
          spiritualDefense: 0,
          attackSpeed: 0,
          criticalChance: 0,
          movementSpeed: 0,
          luck: 0
        };
      }
      
      // Расчет общего уровня культивации
      const stageValues = {
        'закалка тела': 0,
        'очищение ци': 100,
        'золотое ядро': 300,
        'формирование души': 500
      };
      
      // Проверяем наличие stage и level в объекте cultivation
      const stage = cultivation.stage ? cultivation.stage.toLowerCase() : '';
      const level = cultivation.level || 1;
      
      const totalLevel = (stageValues[stage] || 0) + (level - 1);
      
      // Расчет вторичных характеристик
      return {
        physicalAttack: Math.floor(stats.strength), // Физическая атака равна параметру силы
        physicalDefense: Math.floor(stats.strength * 0.5 + stats.health * 0.3 + totalLevel * 0.2),
        spiritualDefense: Math.floor(stats.spirit * 0.5 + stats.intellect * 0.3 + totalLevel * 0.2),
        attackSpeed: Math.floor(stats.agility * 0.6 + totalLevel * 0.1),
        criticalChance: Math.floor(stats.agility * 0.3 + stats.intellect * 0.2),
        movementSpeed: Math.floor(stats.agility * 0.4 + totalLevel * 0.1),
        luck: Math.floor((stats.spirit + stats.intellect) * 0.2)
      };
    } catch (error) {
      console.error('Ошибка при расчете вторичных характеристик персонажа:', error);
      throw error;
    }
  }

  /**
   * Получение комбинированных характеристик персонажа (с учетом эффектов)
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Комбинированные характеристики персонажа
   */
  static async getCombinedCharacterState(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/stats/combined`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении комбинированных характеристик персонажа');
      }

      const combinedState = await response.json();
      return combinedState;
    } catch (error) {
      console.error('Ошибка при получении комбинированных характеристик персонажа:', error);
      throw error;
    }
  }
}

// Экспортируем класс через CommonJS
module.exports = CharacterStatsServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getCharacterStats = CharacterStatsServiceAPI.getCharacterStats;
module.exports.updateCharacterStats = CharacterStatsServiceAPI.updateCharacterStats;
module.exports.calculateSecondaryStats = CharacterStatsServiceAPI.calculateSecondaryStats;
module.exports.getCombinedCharacterState = CharacterStatsServiceAPI.getCombinedCharacterState;