/**
 * Скрипт для запуска тестов адаптеров из командной строки
 * Использует CommonJS синтаксис для совместимости с Node.js
 */

// Импортируем функцию тестирования
const { runAdapterTests } = require('./adapter-test');

// Выводим информацию о версии Node.js
console.log(`Node.js версия: ${process.version}`);
console.log('Окружение: ' + (typeof window === 'undefined' ? 'Server (Node.js)' : 'Browser'));

// Запускаем тесты
console.log('Запуск тестов адаптеров из командной строки...');

runAdapterTests()
  .then(results => {
    console.log('Тесты завершены:', results);
    
    // Выходим с соответствующим кодом
    const hasErrors = !results.characterProfile || !results.database;
    process.exit(hasErrors ? 1 : 0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении тестов:', error);
    process.exit(1);
  });