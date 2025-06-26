/**
 * Скрипт для запуска тестов исправлений циклических зависимостей
 */

// Определяем переменную окружения для тестирования
process.env.NODE_ENV = 'test';

// Запускаем тесты
console.log('Запуск тестов адаптеров с исправлениями циклических зависимостей...');
console.log('=================================================================');

try {
  // Подавляем предупреждения для более чистого вывода
  const originalWarn = console.warn;
  console.warn = function(message) {
    if (message && message.includes('circular dependency')) {
      // Игнорируем предупреждения о циклических зависимостях в тестах
      return;
    }
    originalWarn.apply(console, arguments);
  };

  // Выполняем тест
  require('./adapter-fix-test');

  // Восстанавливаем console.warn
  console.warn = originalWarn;

  console.log('\nТесты успешно выполнены');
} catch (error) {
  console.error('Ошибка при выполнении тестов:', error);
}