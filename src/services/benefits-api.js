/**
 * API-сервис для работы с бонусами игрока
 */

const API_URL = '/api';

class BenefitsAPI {
  /**
   * Получает все бонусы пользователя с сервера
   * @returns {Promise<Array>} Промис с массивом бонусов
   */
  async getPlayerBenefits() {
    try {
      const response = await fetch(`${API_URL}/benefits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Ошибка при получении бонусов пользователя с сервера:', error);
      throw error; // Пробрасываем ошибку дальше, чтобы ее можно было обработать в UI
    }
  }
}

const benefitsApiInstance = new BenefitsAPI();

module.exports = benefitsApiInstance;
module.exports.BenefitsAPI = BenefitsAPI;