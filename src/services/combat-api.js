import { apiRequest } from './api';

/**
 * Начать новый бой с NPC
 * @param {string} enemyId - ID врага, с которым начинается бой
 * @returns {Promise<Object>} - Promise, который разрешается с данными о бое
 */
export const startCombat = async (enemyId) => {
  try {
    const response = await apiRequest('POST', '/api/combat/start', { enemyId });
    return response;
  } catch (error) {
    console.error('Ошибка при вызове API для начала боя:', error);
    // Возвращаем объект с ошибкой, чтобы компонент мог его обработать
    return { 
      success: false, 
      message: error.message || 'Сетевая ошибка или сервер недоступен' 
    };
  }
};

/**
 * Отправляет действие игрока на сервер
 * @param {number} combatId - ID боя
 * @param {Object} action - Объект действия
 * @returns {Promise<Object>} Промис с обновленным состоянием боя
 */
export const performCombatAction = async (combatId, action) => {
  try {
    const response = await apiRequest('POST', `/api/combat/${combatId}/action`, { action });
    return response;
  } catch (error) {
    console.error(`Ошибка при выполнении действия в бою ${combatId}:`, error);
    return {
      success: false,
      message: error.message || 'Сетевая ошибка или сервер недоступен'
    };
  }
};

/**
 * Получает актуальное состояние боя с сервера
 * @param {number} combatId - ID боя
 * @returns {Promise<Object>} Промис с актуальным состоянием боя
 */
export const getCombatState = async (combatId) => {
  try {
    const response = await apiRequest('GET', `/api/combat/${combatId}/state`);
    return response;
  } catch (error) {
    console.error(`Ошибка при получении состояния боя ${combatId}:`, error);
    return {
      success: false,
      message: error.message || 'Сетевая ошибка или сервер недоступен'
    };
  }
};

/**
 * Получает текущий статус боя пользователя
 * @returns {Promise<Object>} Промис с информацией о текущем бое пользователя
 */
export const getUserCombatStatus = async () => {
  try {
    const response = await apiRequest('GET', '/api/combat/user/status');
    return response;
  } catch (error) {
    console.error('Ошибка при получении статуса боя пользователя:', error);
    return {
      success: false,
      message: error.message || 'Сетевая ошибка или сервер недоступен'
    };
  }
};