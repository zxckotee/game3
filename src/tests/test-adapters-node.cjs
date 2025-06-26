/**
 * Запуск тестов адаптеров в Node.js среде
 * Использует CommonJS синтаксис для совместимости
 */

// Извлекаем путь к директории проекта
const path = require('path');
const projectRoot = path.resolve(__dirname, '../..');

// Настройка consola для красивого вывода
try {
  const consola = require('consola');
  global.console = consola;
  consola.success('Используем улучшенный логгер consola');
} catch (error) {
  console.log('Модуль consola не установлен, используем стандартный логгер');
}

console.log('====== ТЕСТИРОВАНИЕ АДАПТЕРОВ В NODE.JS ======');
console.log('Директория проекта:', projectRoot);
console.log('Версия Node.js:', process.version);
console.log('Платформа:', process.platform);
console.log('Дата и время:', new Date().toLocaleString());
console.log('====================================');

// Подключаем тестовый файл
try {
  const { runAllTests } = require('./test-adapters');
  
  // Запускаем тесты
  runAllTests()
    .then(results => {
      console.log('====== ИТОГОВЫЕ РЕЗУЛЬТАТЫ ======');
      console.log('CharacterProfileService:', results.characterProfile ? '✅ УСПЕШНО' : '❌ ОШИБКА');
      console.log('DatabaseConnectionManager:', results.database ? '✅ УСПЕШНО' : '❌ ОШИБКА');
      
      const success = results.characterProfile && results.database;
      console.log('====================================');
      console.log(success ? '✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ' : '❌ ЕСТЬ ОШИБКИ В ТЕСТАХ');
      
      // Выходим с соответствующим кодом
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ ОШИБКА ЗАГРУЗКИ ТЕСТОВ:', error);
  process.exit(1);
}