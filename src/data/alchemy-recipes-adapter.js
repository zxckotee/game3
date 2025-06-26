/**
 * Адаптер для выбора подходящей версии alchemy-recipes.js в зависимости от среды выполнения
 * Предотвращает включение серверных зависимостей в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const ClientAlchemyRecipes = require('./client-alchemy-recipes');

// Определение объекта в зависимости от окружения
let AlchemyRecipes;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  AlchemyRecipes = ClientAlchemyRecipes;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем динамический импорт только для сервера
    // Через функцию, чтобы webpack не пытался его включить в клиентскую сборку
    const serverPath = './alchemy-recipes';
    // Функция для загрузки модуля в рантайме только на сервере
    const loadServerModule = new Function('modulePath', 'return require(modulePath)');
    
    // На сервере должен быть доступен require
    const ServerAlchemyRecipes = loadServerModule(serverPath);
    AlchemyRecipes = ServerAlchemyRecipes;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии alchemy-recipes:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    AlchemyRecipes = ClientAlchemyRecipes;
  }
}

// Экспортируем константы и функции из выбранной реализации
const ITEM_TYPES = AlchemyRecipes.ITEM_TYPES;
const RARITY = AlchemyRecipes.RARITY;
const getAllRecipes = AlchemyRecipes.getAllRecipes;
const getRecipeById = AlchemyRecipes.getRecipeById;
const getAvailableRecipesForCultivator = AlchemyRecipes.getAvailableRecipesForCultivator;
const hasRequiredIngredientsForRecipe = AlchemyRecipes.hasRequiredIngredientsForRecipe;

// Серверный метод может отсутствовать в клиентской версии
const saveRecipesToStorage = AlchemyRecipes.saveRecipesToStorage;
const addNewRecipe = AlchemyRecipes.addNewRecipe;

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = AlchemyRecipes;