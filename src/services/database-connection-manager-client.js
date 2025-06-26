/**
 * Клиентская версия DatabaseConnectionManager без серверных зависимостей (CommonJS)
 * Предоставляет заглушки для всех методов оригинального модуля
 */

// Заглушка для withTimeout - просто возвращает переданный промис
function withTimeout(promise, timeoutMs, errorMessage) {
  return promise;
}

/**
 * Заглушка для функции проверки прямого подключения к PostgreSQL
 * @returns {Promise<boolean>} Всегда возвращает false в клиентской среде
 */
async function testDirectPostgresConnection() {
  console.warn('testDirectPostgresConnection: Эта функция не доступна в браузере');
  return false;
}

/**
 * Заглушка для инициализации подключения к PostgreSQL
 * @returns {Promise<Object>} Объект с пустым экземпляром db
 */
async function initializeDatabaseConnection() {
  console.warn('initializeDatabaseConnection: Эта функция не доступна в браузере');
  
  return {
    db: {
      // Заглушка для основных методов Sequelize
      model: () => null,
      transaction: async (callback) => null,
      authenticate: async () => null,
      query: async () => []
    }
  };
}

// Унифицированный интерфейс с заглушками для клиентской среды
const unifiedDatabase = {
  /**
   * Заглушка для получения коллекции/модели
   * @param {string} name Имя коллекции/модели
   * @returns {Promise<Object>} Заглушка модели с базовыми методами
   */
  async getCollection(name) {
    console.warn(`getCollection('${name}'): Эта функция не доступна в браузере`);
    
    // Возвращаем заглушку с минимальной реализацией моделей Sequelize
    return {
      findAll: async () => [],
      findOne: async () => null,
      findByPk: async () => null,
      create: async () => ({}),
      update: async () => [0],
      destroy: async () => 0,
      bulkCreate: async () => [],
      count: async () => 0
    };
  },
  
  /**
   * Заглушка для выполнения транзакции
   * @param {Function} callback Функция для выполнения в транзакции
   * @returns {Promise<any>} Результат коллбэка с null вместо транзакции
   */
  async transaction(callback) {
    console.warn('transaction: Эта функция не доступна в браузере');
    // Вызываем коллбэк с null вместо транзакции
    return callback ? callback(null) : null;
  },
  
  /**
   * Заглушка для проверки статуса подключения
   * @returns {Promise<{connected: boolean, using: string}>} Состояние подключения
   */
  async checkStatus() {
    return {
      connected: false,
      using: 'client-stub'
    };
  },
  
  /**
   * Заглушка для получения экземпляра Sequelize
   * @returns {Promise<Object>} Объект с пустым экземпляром db
   */
  async getSequelizeInstance() {
    console.warn('getSequelizeInstance: Эта функция не доступна в браузере');
    
    return {
      db: {
        model: () => null,
        transaction: async (callback) => null,
        authenticate: async () => null,
        query: async () => []
      }
    };
  },
  
  /**
   * Заглушка для выполнения SQL-запроса
   * @param {string} sql SQL-запрос
   * @param {Object} options Опции запроса
   * @returns {Promise<Array>} Пустой массив результатов
   */
  async query(sql, options) {
    console.warn('query: Эта функция не доступна в браузере');
    console.warn('Запрос:', sql);
    
    return [];
  }
};

// Экспортируем заглушки для CommonJS
module.exports = { 
  unifiedDatabase, 
  initializeDatabaseConnection,
  testDirectPostgresConnection,
  withTimeout
};