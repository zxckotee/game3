/**
 * Конфигурация Sequelize для браузерной и серверной среды
 *
 * Предоставляет:
 * 1. Заглушки для Sequelize, DataTypes и Model в браузерной среде
 * 2. Определение текущего окружения (браузер или сервер)
 * 3. Информацию о соединении с базой данных (только на сервере)
 */

/**
 * Улучшенное определение серверной среды для более точного определения контекста
 */
/**
 * Улучшенное определение серверной среды для более точного определения контекста
 * Добавлены дополнительные проверки и логирование
 */
const isServerEnvironment = (() => {
  // Основная проверка на серверную среду
  const isServer = (
    typeof window === 'undefined' &&
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  );
  
  // Дополнительная проверка на наличие require
  const hasRequire = typeof require === 'function';
  
  // Логирование для диагностики
  console.log('Определение среды выполнения:');
  console.log(' - window:', typeof window === 'undefined' ? 'отсутствует (сервер)' : 'присутствует (браузер)');
  console.log(' - process:', typeof process !== 'undefined' ? 'присутствует (сервер)' : 'отсутствует (браузер)');
  console.log(' - process.versions:', process && process.versions ? 'присутствует' : 'отсутствует');
  console.log(' - process.versions.node:', process && process.versions && process.versions.node ? process.versions.node : 'отсутствует');
  console.log(' - require:', hasRequire ? 'доступен' : 'недоступен');
  console.log(' - Итоговое определение:', isServer ? 'СЕРВЕРНАЯ СРЕДА' : 'БРАУЗЕРНАЯ СРЕДА');
  
  return isServer;
})();

// ------------------------------------------------------------------------
// ВАЖНО: Эта часть будет исполняться только на сервере
// Полностью изолируем код для предотвращения включения в клиентскую сборку
// ------------------------------------------------------------------------

// Заглушки для браузерной среды с подробными предупреждениями
const BrowserSequelize = function() {
  console.error(
    'ОШИБКА: Попытка использовать Sequelize в браузере напрямую.\n' +
    'Используйте client-api.js вместо прямого доступа к базе данных.\n' +
    'Эта операция не будет выполнена в браузерной среде.'
  );
  return {};
};

const BrowserDataTypes = {
  STRING: 'STRING',
  TEXT: 'TEXT',
  INTEGER: 'INTEGER',
  FLOAT: 'FLOAT',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  JSON: 'JSON',
  JSONB: 'JSONB',
  // Объявляем все типы для совместимости
  UUID: 'UUID',
  ENUM: (...args) => 'ENUM',
  ARRAY: (type) => `ARRAY(${type})`,
  DECIMAL: 'DECIMAL',
  VIRTUAL: 'VIRTUAL',
  // Статические методы
  ABSTRACT: function() { return 'ABSTRACT'; }
};

class BrowserModel {
  static init() {
    console.error(
      'ОШИБКА: Попытка использовать Model.init в браузере.\n' +
      'Используйте client-api.js вместо прямого доступа к базе данных.\n'
    );
    return this;
  }
  
  static findOne() {
    console.error('ОШИБКА: Попытка обращения к базе данных в браузере (findOne)');
    return Promise.reject(new Error('Недоступно в браузере'));
  }
  
  static findAll() {
    console.error('ОШИБКА: Попытка обращения к базе данных в браузере (findAll)');
    return Promise.reject(new Error('Недоступно в браузере'));
  }
  
  static findByPk() {
    console.error('ОШИБКА: Попытка обращения к базе данных в браузере (findByPk)');
    return Promise.reject(new Error('Недоступно в браузере'));
  }
  
  static create() {
    console.error('ОШИБКА: Попытка обращения к базе данных в браузере (create)');
    return Promise.reject(new Error('Недоступно в браузере'));
  }
  
  static update() {
    console.error('ОШИБКА: Попытка обращения к базе данных в браузере (update)');
    return Promise.reject(new Error('Недоступно в браузере'));
  }
  
  static destroy() {
    console.error('ОШИБКА: Попытка обращения к базе данных в браузере (destroy)');
    return Promise.reject(new Error('Недоступно в браузере'));
  }
}

// Инициализируем переменные моками по умолчанию
let Sequelize = BrowserSequelize;
let DataTypes = BrowserDataTypes;
let Model = BrowserModel;

// Используем динамический импорт только в серверной среде
// для предотвращения включения зависимостей в клиентскую сборку
if (isServerEnvironment) {
  // Оборачиваем в try-catch, чтобы предотвратить сбои при сборке
  try {
    // На сервере пытаемся импортировать sequelize через require
    try {
      const sequelizePackage = require('sequelize');
      Sequelize = sequelizePackage.Sequelize;
      DataTypes = sequelizePackage.DataTypes;
      Model = sequelizePackage.Model;
      console.log('Sequelize успешно загружен в серверной среде через require');
    } catch (requireError) {
      console.warn('Ошибка при импорте Sequelize через require:', requireError);
      
      // Как запасной вариант проверяем наличие require и используем безопасный импорт
      if (typeof require === 'function') {
        try {
          // Используем безопасный прямой импорт вместо Function constructor
          const dynamicImport = require('sequelize');
          
          if (dynamicImport) {
            Sequelize = dynamicImport.Sequelize;
            DataTypes = dynamicImport.DataTypes;
            Model = dynamicImport.Model;
            console.log('Sequelize успешно загружен в серверной среде через безопасный импорт');
          }
        } catch (importError) {
          console.error('Ошибка при безопасном импорте Sequelize:', importError);
        }
      } else {
        console.warn('ПРЕДУПРЕЖДЕНИЕ: функция require не доступна, невозможно загрузить Sequelize');
      }
    }
  } catch (error) {
    console.error('Критическая ошибка при попытке импортировать Sequelize:', error);
    // Используем заглушки в случае ошибки
  }
}

// Экспортируем только через CommonJS
module.exports = {
  isServerEnvironment,
  Sequelize,
  DataTypes,
  Model
};
