/**
 * API-сервис для работы с авторизацией
 * Использует HTTP запросы к серверу вместо прямого доступа к базе данных
 */

// Базовый URL API
const API_URL = '/api';

class AuthServiceAPI {
  /**
   * Регистрация нового пользователя
   * @param {string} username - Имя пользователя
   * @param {string} email - Email пользователя
   * @param {string} password - Пароль пользователя
   * @returns {Promise<Object>} - Данные созданного пользователя
   */
  static async registerUser(username, email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при регистрации');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  /**
   * Авторизация пользователя
   * @param {string} usernameOrEmail - Имя пользователя или email
   * @param {string} password - Пароль пользователя
   * @returns {Promise<Object>} - Данные авторизованного пользователя
   */
  static async loginUser(usernameOrEmail, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при авторизации');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  }

  /**
   * Обновление прогресса пользователя
   * @param {number} userId - ID пользователя
   * @param {number} experience - Опыт пользователя
   * @param {number} cultivationLevel - Уровень культивации
   * @returns {Promise<Object>} - Обновленные данные пользователя
   */
  static async updateUserProgress(userId, experience, cultivationLevel) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          experience,
          cultivationLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении прогресса');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Ошибка обновления прогресса:', error);
      throw error;
    }
  }

  /**
   * Получение профиля пользователя
   * @param {string|number} userIdOrUsername - ID пользователя или имя пользователя
   * @returns {Promise<Object>} - Данные пользователя
   */
  static async getUserProfile(userIdOrUsername) {
    try {
      // Определяем, это ID или имя пользователя
      const isId = typeof userIdOrUsername === 'number' || !isNaN(parseInt(userIdOrUsername));
      const endpoint = isId 
        ? `${API_URL}/users/${userIdOrUsername}`
        : `${API_URL}/users/by-username/${userIdOrUsername}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении профиля');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      throw error;
    }
  }
}

// Экспортируем класс через CommonJS
module.exports = AuthServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.registerUser = AuthServiceAPI.registerUser;
module.exports.loginUser = AuthServiceAPI.loginUser;
module.exports.updateUserProgress = AuthServiceAPI.updateUserProgress;
module.exports.getUserProfile = AuthServiceAPI.getUserProfile;