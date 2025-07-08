/**
 * API-сервис для работы с бонусами персонажа
 * Использует HTTP запросы к серверу вместо прямого доступа к базе данных
 */

// Базовый URL API
const API_URL = '/api';

/**
 * Сервис для работы с бонусами персонажа через API
 */
class BenefitsServiceAPI {
  /**
   * Получение всех бонусов пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Массив бонусов пользователя
   */
  static async getUserBenefits(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/benefits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении бонусов пользователя');
      }

      const benefits = await response.json();
      return benefits;
    } catch (error) {
      console.error('Ошибка при получении бонусов пользователя:', error);
      throw error;
    }
  }
  
  /**
   * Сбор и применение всех бонусов пользователя
   * @param {number} userId - ID пользователя
   * @param {Object} secondaryStats - Вторичные характеристики персонажа
   * @param {Object} statusEffects - Эффекты статуса персонажа
   * @returns {Promise<Object>} - Обновленные характеристики и список бонусов
   */
  static async collectAndApplyBenefits(userId, secondaryStats, statusEffects) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/benefits/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ secondaryStats, statusEffects }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сборе и применении бонусов');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при сборе и применении бонусов:', error);
      throw error;
    }
  }
  
  /**
   * Добавление бонуса пользователю
   * @param {number} userId - ID пользователя
   * @param {Object} benefitData - Данные бонуса
   * @returns {Promise<Object>} - Созданный бонус
   */
  static async addUserBenefit(userId, benefitData) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/benefits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(benefitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при добавлении бонуса пользователю');
      }

      const benefit = await response.json();
      return benefit;
    } catch (error) {
      console.error('Ошибка при добавлении бонуса пользователю:', error);
      throw error;
    }
  }
  
  /**
   * Удаление бонуса пользователя
   * @param {number} userId - ID пользователя
   * @param {number} benefitId - ID бонуса
   * @returns {Promise<boolean>} - Результат удаления
   */
  static async removeUserBenefit(userId, benefitId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/benefits/${benefitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении бонуса пользователя');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Ошибка при удалении бонуса пользователя:', error);
      throw error;
    }
  }
}

// Экспортируем класс через CommonJS
module.exports = BenefitsServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getUserBenefits = BenefitsServiceAPI.getUserBenefits;
module.exports.collectAndApplyBenefits = BenefitsServiceAPI.collectAndApplyBenefits;
module.exports.addUserBenefit = BenefitsServiceAPI.addUserBenefit;
module.exports.removeUserBenefit = BenefitsServiceAPI.removeUserBenefit;