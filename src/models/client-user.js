/**
 * Клиентская версия модели User без серверных зависимостей
 * Используется в браузере вместо серверной версии
 */

// Базовые эмуляторы для совместимости с интерфейсом Sequelize
class ClientModel {
  constructor(data = {}) {
    Object.assign(this, data);
  }
  
  static associate() {
    // Пустая функция для совместимости с интерфейсом
    console.log('Client model: associate() called (no-op)');
  }
}

// Клиентская версия модели User
class ClientUser extends ClientModel {
  constructor(data = {}) {
    super({
      id: data.id || Math.floor(Math.random() * 10000),
      username: data.username || 'guest',
      email: data.email || 'guest@example.com',
      password: data.password || '',
      cultivationLevel: data.cultivationLevel || 1,
      experience: data.experience || 0,
      ...data
    });
  }
}

// Создаем заглушку для localStorage если он не доступен (в серверной среде)
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
}

// Хранилище для пользователей в localStorage
class UserStorage {
  constructor() {
    this.storageKey = 'client_users';
    this.users = this.loadUsers();
  }
  
  loadUsers() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (err) {
      console.error('Error loading users from localStorage:', err);
      return {};
    }
  }
  
  saveUsers() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.users));
    } catch (err) {
      console.error('Error saving users to localStorage:', err);
    }
  }
  
  getUser(id) {
    return this.users[id] ? new ClientUser(this.users[id]) : null;
  }
  
  getUserByUsername(username) {
    const id = Object.keys(this.users).find(userId => 
      this.users[userId].username.toLowerCase() === username.toLowerCase()
    );
    return id ? this.getUser(id) : null;
  }
  
  createUser(userData) {
    const id = userData.id || Date.now();
    const user = new ClientUser({...userData, id});
    this.users[id] = user;
    this.saveUsers();
    return user;
  }
  
  updateUser(id, userData) {
    if (!this.users[id]) return null;
    
    this.users[id] = {...this.users[id], ...userData};
    this.saveUsers();
    return new ClientUser(this.users[id]);
  }
  
  deleteUser(id) {
    if (this.users[id]) {
      delete this.users[id];
      this.saveUsers();
      return true;
    }
    return false;
  }
}

// Глобальное хранилище пользователей
const userStorage = new UserStorage();

// Переменные для хранения инициализированной модели
let initializedUserModel = ClientUser;
let initializationPromise = Promise.resolve(ClientUser);

/**
 * Функция для получения инициализированной модели User (клиентская версия)
 * @returns {Promise<ClientUser>} Промис, который резолвится инициализированной моделью
 */
async function getInitializedUserModel() {
  return initializedUserModel;
}

/**
 * Инициализирует модель User (клиентская версия)
 * @returns {Promise<ClientUser>} Промис, который резолвится инициализированной моделью
 */
async function initializeUserModel() {
  if (initializedUserModel) {
    return initializedUserModel;
  }
  
  if (!initializationPromise) {
    initializationPromise = Promise.resolve(ClientUser);
    initializedUserModel = ClientUser;
  }
  
  return initializationPromise;
}

// API для работы с пользователями
const userAPI = {
  /**
   * Создает нового пользователя
   * @param {Object} userData Данные пользователя
   * @returns {Promise<ClientUser>} Созданный пользователь
   */
  async create(userData) {
    return userStorage.createUser(userData);
  },
  
  /**
   * Находит пользователя по ID
   * @param {number|string} id ID пользователя
   * @returns {Promise<ClientUser|null>} Найденный пользователь или null
   */
  async findByPk(id) {
    return userStorage.getUser(id);
  },
  
  /**
   * Находит пользователя по имени пользователя
   * @param {string} username Имя пользователя
   * @returns {Promise<ClientUser|null>} Найденный пользователь или null
   */
  async findOne({where}) {
    if (where.username) {
      return userStorage.getUserByUsername(where.username);
    }
    return null;
  },
  
  /**
   * Обновляет данные пользователя
   * @param {Object} userData Новые данные пользователя
   * @param {Object} options Опции запроса
   * @returns {Promise<ClientUser|null>} Обновленный пользователь или null
   */
  async update(userData, {where}) {
    if (where.id) {
      return userStorage.updateUser(where.id, userData);
    }
    return null;
  },
  
  /**
   * Удаляет пользователя
   * @param {Object} where Условия удаления
   * @returns {Promise<boolean>} Успешность удаления
   */
  async destroy({where}) {
    if (where.id) {
      return userStorage.deleteUser(where.id);
    }
    return false;
  }
};

// Экспорт через CommonJS для совместимости
module.exports = ClientUser;
module.exports.ClientUser = ClientUser;
module.exports.getInitializedUserModel = getInitializedUserModel;
module.exports.initializeUserModel = initializeUserModel;
module.exports.userAPI = userAPI;