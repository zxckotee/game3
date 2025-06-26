/**
 * Инициализация консольных команд алхимии
 */

const registerAlchemyConsoleCommands = require('./alchemyConsoleCommands');
const AlchemyIntegrator = require('../services/alchemy-integrator');

/**
 * Инициализирует алхимическую систему и регистрирует консольные команды
 * @param {Object} consoleManager Менеджер консоли
 */
function initAlchemyConsole(consoleManager) {
  // Регистрируем консольные команды алхимии
  registerAlchemyConsoleCommands(consoleManager);
  
  // Добавляем базовую информацию в справку по консоли
  consoleManager.registerHelpSection(
    'alchemy',
    'Алхимическая система',
    `Алхимическая система позволяет создавать различные предметы из ингредиентов.
    
Основные команды:
- initAlchemy - Инициализировать алхимическую систему
- getAllRecipes - Получить список всех рецептов
- getRecipesByType - Получить рецепты по типу
- getAvailableRecipes - Получить доступные рецепты для игрока
- simulateEnemyDrop - Симулировать выпадение ингредиентов с врага
- simulateElementalEnemyDrop - Симулировать выпадение ингредиентов с элементального врага
- getAlchemyItem - Получить информацию о предмете по ID
- getResource - Получить информацию о ресурсе по ID

Примеры:
- initAlchemy - Инициализирует систему алхимии
- getRecipesByType pill - Показывает все рецепты пилюль
- getAvailableRecipes "Закалка тела" 5 - Показывает рецепты, доступные на указанной ступени и уровне
- simulateEnemyDrop beast 10 false - Симулирует выпадение ингредиентов с обычного зверя 10 уровня
- simulateElementalEnemyDrop fire 15 true - Симулирует выпадение ингредиентов с огненного элементаля-босса 15 уровня`
  );
  
  // Автоматически инициализируем алхимическую систему при запуске игры
  console.log('Инициализация алхимической системы...');
  setTimeout(async () => {
    try {
      await AlchemyIntegrator.initialize();
      console.log('Алхимическая система успешно инициализирована');
    } catch (error) {
      console.error('Ошибка при инициализации алхимической системы:', error);
    }
  }, 2000); // Задержка для гарантии загрузки других систем
}

module.exports = initAlchemyConsole;
