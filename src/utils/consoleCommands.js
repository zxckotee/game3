// Добавим к консольным командам команды для работы с авторизацией
const { runAllChecks } = require('./initDbAuth');
const { runMigration } = require('./migrateLocalStorageUsers');

/**
 * Добавляет команды для работы с авторизацией в консоль разработчика
 * @param {Object} console - Консоль для регистрации команд
 */
function registerAuthCommands(console) {
  if (!console) return;

  console.log('Регистрация команд для работы с авторизацией...');

  // Команда для проверки базы данных
  console.authCheckDb = async () => {
    console.log('Запуск проверки базы данных...');
    const result = await runAllChecks();
    return { success: result };
  };

  // Команда для миграции пользователей из localStorage
  console.authMigrateUsers = async () => {
    console.log('Запуск миграции пользователей из localStorage в БД...');
    return await runMigration();
  };

  // Команда для очистки данных авторизации в localStorage
  console.authClearLocalStorage = () => {
    console.log('Очистка данных авторизации в localStorage...');
    localStorage.removeItem('users');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('gameState');
    console.log('Данные авторизации в localStorage очищены');
    return { success: true };
  };

  console.log(`
  Доступны команды для работы с авторизацией:
  - console.authCheckDb() - проверка подключения к БД и структуры таблиц
  - console.authMigrateUsers() - миграция пользователей из localStorage в БД
  - console.authClearLocalStorage() - очистка данных авторизации в localStorage
  `);
}

// Экспортируем функцию для использования в initConsoleUtils.js
module.exports = { registerAuthCommands };
