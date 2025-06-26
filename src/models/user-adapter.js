/**
 * Адаптер для выбора подходящей версии модели User в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const ClientUser = require('./client-user');

// Определение объекта и функций в зависимости от окружения
let User;
let getInitializedUserModel;
let initializeUserModel;
let userAPI;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  User = ClientUser.ClientUser;
  getInitializedUserModel = ClientUser.getInitializedUserModel;
  initializeUserModel = ClientUser.initializeUserModel;
  userAPI = ClientUser.userAPI;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем проверку наличия require перед импортом
    if (typeof require === 'function') {
      const serverPath = './user';
      const ServerUserModule = require(serverPath);
      
      User = ServerUserModule;
      getInitializedUserModel = ServerUserModule.getInitializedUserModel;
      initializeUserModel = ServerUserModule.initializeUserModel;
      
      // На сервере API формируем из модели Sequelize
      userAPI = {
        create: async (userData) => {
          const UserModel = await getInitializedUserModel();
          return UserModel.create(userData);
        },
        findByPk: async (id) => {
          const UserModel = await getInitializedUserModel();
          return UserModel.findByPk(id);
        },
        findOne: async (options) => {
          const UserModel = await getInitializedUserModel();
          return UserModel.findOne(options);
        },
        update: async (userData, options) => {
          const UserModel = await getInitializedUserModel();
          return UserModel.update(userData, options);
        },
        destroy: async (options) => {
          const UserModel = await getInitializedUserModel();
          return UserModel.destroy(options);
        }
      };
    } else {
      console.warn('Функция require недоступна, используем клиентскую версию');
      User = ClientUser.ClientUser;
      getInitializedUserModel = ClientUser.getInitializedUserModel;
      initializeUserModel = ClientUser.initializeUserModel;
      userAPI = ClientUser.userAPI;
    }
  } catch (error) {
    console.error('Ошибка при импорте серверной версии User:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    User = ClientUser.ClientUser;
    getInitializedUserModel = ClientUser.getInitializedUserModel;
    initializeUserModel = ClientUser.initializeUserModel;
    userAPI = ClientUser.userAPI;
  }
}

// Экспорт через CommonJS
module.exports = User;
module.exports.getInitializedUserModel = getInitializedUserModel;
module.exports.initializeUserModel = initializeUserModel;
module.exports.userAPI = userAPI;