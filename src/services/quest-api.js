/**
 * API-сервис для работы с заданиями
 * Использует HTTP запросы к серверу вместо прямого доступа к базе данных
 */

// Базовый URL API
const API_URL = '/api';

/**
 * Сервис для работы с заданиями через API
 */
class QuestServiceAPI {
  /**
   * Получение всех заданий пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Объект с заданиями пользователя
   */
  static async getQuests(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/quests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении заданий');
      }

      const quests = await response.json();
      return quests;
    } catch (error) {
      console.error('Ошибка при получении заданий:', error);
      throw error;
    }
  }
  
  /**
   * Обновление прогресса подзадач квеста
   * @param {number} userId - ID пользователя
   * @param {string} questId - ID квеста
   * @param {Object} progress - Объект с прогрессом подзадач в формате {objectiveId: true/false, ...}
   * @returns {Promise<Object>} - Обновленный прогресс
   */
  static async updateQuestProgress(userId, questId, progress) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/quests/${questId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(progress)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении прогресса задания');
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка при обновлении прогресса задания:', error);
      throw error;
    }
  }
  
  /**
   * Принятие задания
   * @param {number} userId - ID пользователя
   * @param {number} questId - ID задания
   * @returns {Promise<Object>} - Принятое задание
   */
  static async acceptQuest(userId, questId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/quests/${questId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при принятии задания');
      }

      const quest = await response.json();
      return quest;
    } catch (error) {
      console.error('Ошибка при принятии задания:', error);
      throw error;
    }
  }
  
  
  /**
   * Завершение задания
   * @param {number} userId - ID пользователя
   * @param {number} questId - ID задания
   * @returns {Promise<Object>} - Завершенное задание
   */
  static async completeQuest(userId, questId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/quests/${questId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при завершении задания');
      }

      const quest = await response.json();
      return quest;
    } catch (error) {
      console.error('Ошибка при завершении задания:', error);
      throw error;
    }
  }
}
 
// Экспортируем класс через CommonJS
module.exports = QuestServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getQuests = QuestServiceAPI.getQuests;
module.exports.acceptQuest = QuestServiceAPI.acceptQuest;
module.exports.updateQuestProgress = QuestServiceAPI.updateQuestProgress;
module.exports.completeQuest = QuestServiceAPI.completeQuest;