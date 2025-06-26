/**
 * Единый API-интерфейс для клиентской части приложения
 * Инкапсулирует всю логику взаимодействия с сервером
 */

// Импортируем API-адаптеры
const AuthService = require('./auth-adapter');
const CultivationService = require('./cultivation-adapter');

// Базовый URL API
const API_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Класс для работы с серверным API
 */
class ClientAPI {
  constructor() {
    // Проверяем наличие токена авторизации
    this.token = localStorage.getItem('authToken');
    this.currentUser = null;
  }

  /**
   * Получение заголовков для запросов к API
   * @private
   * @returns {Object} - Заголовки запроса
   */
  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Выполнение запроса к API
   * @private
   * @param {string} endpoint - Конечная точка API
   * @param {string} method - HTTP-метод (GET, POST, PUT, DELETE)
   * @param {Object} data - Данные для отправки
   * @returns {Promise<any>} - Результат запроса
   */
  async _fetch(endpoint, method = 'GET', data = null) {
    try {
      const url = `${API_URL}${endpoint}`;
      
      const options = {
        method,
        headers: this._getHeaders(),
        credentials: 'include' // Включает куки, если используется сессионная авторизация
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      // Обработка ошибочных кодов ответа
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка ${response.status}: ${response.statusText}`);
      }

      // Обработка успешного ответа
      return response.json();
    } catch (error) {
      console.error(`Ошибка API при ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Авторизация пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object>} - Данные авторизованного пользователя
   */
  async login(username, password) {
    try {
      const result = await this._fetch('/auth/login', 'POST', { username, password });
      
      // Сохраняем токен
      if (result.token) {
        this.token = result.token;
        localStorage.setItem('authToken', result.token);
      }
      
      // Сохраняем текущего пользователя
      this.currentUser = result.user;
      
      return result;
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  }

  /**
   * Регистрация нового пользователя
   * @param {string} username - Имя пользователя
   * @param {string} email - Email пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object>} - Данные зарегистрированного пользователя
   */
  async register(username, email, password) {
    try {
      const result = await this._fetch('/auth/register', 'POST', { username, email, password });
      
      // Сохраняем токен
      if (result.token) {
        this.token = result.token;
        localStorage.setItem('authToken', result.token);
      }
      
      // Сохраняем текущего пользователя
      this.currentUser = result.user;
      
      return result;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  /**
   * Выход из системы
   * @returns {Promise<void>}
   */
  async logout() {
    // Удаляем токен
    this.token = null;
    localStorage.removeItem('authToken');
    this.currentUser = null;
    
    // В некоторых случаях может потребоваться запрос к API для отзыва токена
    // await this._fetch('/auth/logout', 'POST');
  }

  /**
   * Получение данных текущего пользователя
   * @returns {Promise<Object>} - Данные пользователя
   */
  async getCurrentUser() {
    if (!this.token) {
      throw new Error('Пользователь не авторизован');
    }
    
    try {
      const result = await this._fetch('/auth/me');
      this.currentUser = result.user;
      return result.user;
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      
      // Если токен недействителен, выходим из системы
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        await this.logout();
      }
      
      throw error;
    }
  }

  /**
   * Проверка валидности текущего токена
   * @returns {Promise<boolean>} - true, если токен валиден
   */
  async checkAuth() {
    if (!this.token) {
      return false;
    }
    
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Получение квестов для пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Объект с квестами пользователя
   */
  async getUserQuests(userId) {
    return this._fetch(`/users/${userId}/quests`);
  }

  /**
   * Получение всех доступных квестов
   * @returns {Promise<Array>} - Список квестов
   */
  async getQuests() {
    return this._fetch('/quests');
  }

  /**
   * Принятие квеста
   * @param {number} questId - ID квеста
   * @returns {Promise<Object>} - Результат операции
   */
  async acceptQuest(questId) {
    if (!this.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    return this._fetch(`/quests/${questId}/accept`, 'POST');
  }

  /**
   * Завершение квеста
   * @param {number} questId - ID квеста
   * @returns {Promise<Object>} - Результат операции
   */
  async completeQuest(questId) {
    if (!this.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    return this._fetch(`/quests/${questId}/complete`, 'POST');
  }

  /**
   * Получение данных о культивации пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Данные о культивации
   */
  async getCultivationProgress(userId) {
    return this._fetch(`/cultivation/${userId}`);
  }

  /**
   * Обновление данных о культивации
   * @param {number} userId - ID пользователя
   * @param {Object} data - Данные для обновления
   * @returns {Promise<Object>} - Обновленные данные о культивации
   */
  async updateCultivationProgress(userId, data) {
    return this._fetch(`/cultivation/${userId}`, 'PUT', data);
  }

  /**
   * Получение инвентаря пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Список предметов в инвентаре
   */
  async getInventoryItems(userId) {
    return this._fetch(`/inventory/${userId}`);
  }

  /**
   * Добавление предмета в инвентарь
   * @param {number} userId - ID пользователя
   * @param {Object} item - Данные о предмете
   * @returns {Promise<Object>} - Добавленный предмет
   */
  async addInventoryItem(userId, item) {
    return this._fetch(`/inventory/${userId}`, 'POST', item);
  }

  /**
   * Получение изученных техник пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Список изученных техник
   */
  async getLearnedTechniques(userId) {
    return this._fetch(`/users/${userId}/techniques`);
  }

  /**
   * Сохранение игрового состояния
   * @param {Object} gameState - Игровое состояние
   * @returns {Promise<Object>} - Результат сохранения
   */
  async saveGameState(gameState) {
    if (!this.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    return this._fetch(`/users/${this.currentUser.id}/game-state`, 'PUT', gameState);
  }

  /**
   * Загрузка игрового состояния
   * @returns {Promise<Object>} - Игровое состояние
   */
  async loadGameState() {
    if (!this.currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    return this._fetch(`/users/${this.currentUser.id}/game-state`);
  }
}

// Создаем и экспортируем экземпляр API
const clientAPI = new ClientAPI();
// Экспортируем класс через CommonJS
module.exports = ClientAPI;