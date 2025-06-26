// src/services/database.js
const Sequelize = require('sequelize');
const { initializeDatabaseConnection, unifiedDatabase } = require('./database-connection-manager-adapter');

// Кэш для экземпляра sequelize
let sequelize = null;

// Функция для добавления таймаута к промису
function withTimeout(promise, timeoutMs, errorMessage) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || 'Операция превысила время ожидания'));
    }, timeoutMs);
  });
  
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
}

// Функция-одиночка для получения экземпляра sequelize
async function getSequelizeInstance() {
  try {
    if (!sequelize) {
      console.log('Получение экземпляра Sequelize через database.js...');
      // Используем унифицированный интерфейс вместо прямого вызова initializeDatabaseConnection
      const result = await withTimeout(
        unifiedDatabase.getSequelizeInstance(),
        15000,
        'Получение экземпляра Sequelize в database.js превысило время ожидания'
      );
      
      if (!result || !result.db) {
        throw new Error("КРИТИЧЕСКАЯ ОШИБКА: Инициализация БД вернула пустой результат");
      }
      
      sequelize = result.db;
      console.log('Экземпляр Sequelize успешно получен в database.js');
    }
    return sequelize;
  } catch (error) {
    console.error("КРИТИЧЕСКАЯ ОШИБКА при получении экземпляра Sequelize:", error.message);
    // Выбрасываем ошибку вместо создания заглушки
    throw new Error(`Не удалось подключиться к PostgreSQL: ${error.message}`);
  }
}

// Создаем прокси со встроенными фейковыми свойствами и методами
const proxyBase = {
  modelManager: {
    getModel: function(name) {
      console.warn(`[PROXY] Запрос модели ${name} через прокси`);
      return null;
    }
  },
  model: function(name) {
    console.warn(`[PROXY] Запрос модели ${name} через прокси`);
    return null;
  },
  define: function() {
    console.warn("[PROXY] Попытка определения модели через прокси");
    return {};
  },
  authenticate: async function() {
    console.warn("[PROXY] Попытка аутентификации через прокси");
    // Пытаемся аутентифицироваться с реальной БД
    const seq = await getSequelizeInstance();
    return seq.authenticate();
  }
};

// Для обратной совместимости с существующими моделями
const sequelizeProxy = new Proxy(proxyBase, {
  get: function(target, prop) {
    // Если свойство уже есть в базовом объекте, возвращаем его
    if (prop in target) {
      if (typeof target[prop] === 'function') {
        return (...args) => {
          console.log(`[PROXY] Вызов метода ${prop} через прокси`);
          return target[prop](...args);
        };
      }
      return target[prop];
    }
    
    // Специальная обработка для modelManager
    if (prop === 'modelManager') {
      return new Proxy(target.modelManager || {}, {
        get: function(targetManager, managerProp) {
          if (managerProp in targetManager) {
            if (typeof targetManager[managerProp] === 'function') {
              return function(...args) {
                console.log(`[PROXY] Вызов modelManager.${managerProp}`);
                return targetManager[managerProp](...args);
              };
            }
            return targetManager[managerProp];
          }
          
          return function(...args) {
            console.log(`[PROXY] Перенаправление modelManager.${managerProp} на реальный Sequelize`);
            return getSequelizeInstance()
              .then(seq => {
                if (!seq || !seq.modelManager || typeof seq.modelManager[managerProp] !== 'function') {
                  console.error(`[PROXY] Метод modelManager.${managerProp} недоступен`);
                  throw new Error(`Метод modelManager.${managerProp} недоступен в Sequelize`);
                }
                return seq.modelManager[managerProp](...args);
              })
              .catch(err => {
                console.error(`[PROXY] КРИТИЧЕСКАЯ ОШИБКА при вызове modelManager.${managerProp}:`, err);
                throw err; // Пробрасываем ошибку дальше
              });
          };
        }
      });
    }
    
    // Для остальных свойств делегируем к реальному экземпляру
    return function(...args) {
      console.log(`[PROXY] Перенаправление метода ${prop} на реальный Sequelize`);
      return getSequelizeInstance()
        .then(seq => {
          if (!seq || typeof seq[prop] !== 'function') {
            console.error(`[PROXY] Метод ${prop} недоступен в реальном Sequelize`);
            throw new Error(`Метод ${prop} недоступен в Sequelize`);
          }
          return seq[prop](...args);
        })
        .catch(err => {
          console.error(`[PROXY] КРИТИЧЕСКАЯ ОШИБКА при вызове ${prop}:`, err);
          throw err; // Пробрасываем ошибку дальше
        });
    };
  }
});

// Экспортируем компоненты Sequelize, необходимые для моделей
module.exports = {
  Model: Sequelize.Model,
  DataTypes: Sequelize.DataTypes,
  sequelize: sequelizeProxy,
  getSequelizeInstance // Экспортируем функцию для прямого получения экземпляра
};
