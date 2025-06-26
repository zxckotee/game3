/**
 * Файл с данными о рецептах алхимии
 * Получает информацию о рецептах через адаптер
 */

// Импортируем константы из alchemy-items для совместимости
const { ITEM_TYPES, RARITY } = require('./alchemy-items');

// Импортируем адаптер для работы с алхимией
const AlchemyAdapter = require('../services/alchemy-service-adapter');

// Импортируем методы из адаптера
const {
  getAllRecipes: adapterGetAllRecipes,
  getRecipeById: adapterGetRecipeById,
  getRecipesByType: adapterGetRecipesByType,
  getRecipesByRarity: adapterGetRecipesByRarity,
  createRecipe: adapterCreateRecipe,
  updateRecipe: adapterUpdateRecipe,
  deleteRecipe: adapterDeleteRecipe
} = AlchemyAdapter;

// Кэш для хранения данных
let alchemyRecipes = [];

// Экспортируем константы для совместимости
exports.ITEM_TYPES = ITEM_TYPES;
exports.RARITY = RARITY;

/**
 * Получение всех рецептов алхимии
 * @returns {Promise<Array>} Список всех рецептов
 */
exports.getAllRecipes = async function() {
  try {
    const recipes = await adapterGetAllRecipes();
    alchemyRecipes = recipes; // Обновляем кэш
    return recipes;
  } catch (error) {
    console.error('Ошибка при получении рецептов алхимии:', error);
    return alchemyRecipes; // В случае ошибки возвращаем кэшированные данные
  }
};

/**
 * Получение рецепта по ID
 * @param {number} id ID рецепта
 * @returns {Promise<Object|null>} Данные рецепта или null
 */
exports.getRecipeById = async function(id) {
  try {
    return await adapterGetRecipeById(id);
  } catch (error) {
    console.error(`Ошибка при получении рецепта алхимии с ID ${id}:`, error);
    // Пытаемся найти в кэше
    return alchemyRecipes.find(recipe => recipe.id === id) || null;
  }
};

/**
 * Получение рецептов по типу результата
 * @param {string} type Тип предмета из ITEM_TYPES
 * @returns {Promise<Array>} Список рецептов указанного типа
 */
exports.getRecipesByType = async function(type) {
  try {
    return await adapterGetRecipesByType(type);
  } catch (error) {
    console.error(`Ошибка при получении рецептов алхимии типа ${type}:`, error);
    // Фильтруем кэш
    return alchemyRecipes.filter(recipe => recipe.type === type);
  }
};

/**
 * Получение рецептов по редкости
 * @param {string} rarity Редкость из RARITY
 * @returns {Promise<Array>} Список рецептов указанной редкости
 */
exports.getRecipesByRarity = async function(rarity) {
  try {
    return await adapterGetRecipesByRarity(rarity);
  } catch (error) {
    console.error(`Ошибка при получении рецептов алхимии редкости ${rarity}:`, error);
    // Фильтруем кэш
    return alchemyRecipes.filter(recipe => recipe.rarity === rarity);
  }
};

/**
 * Получение рецептов по ингредиенту
 * @param {number} itemId ID ингредиента
 * @returns {Promise<Array>} Список рецептов использующих указанный ингредиент
 */
exports.getRecipesByIngredient = async function(itemId) {
  try {
    // Проверяем наличие метода в адаптере
    if (typeof AlchemyAdapter.getRecipesByIngredient === 'function') {
      return await AlchemyAdapter.getRecipesByIngredient(itemId);
    }
    
    // Если метода нет, фильтруем кэш
    return alchemyRecipes.filter(recipe => 
      recipe.ingredients && recipe.ingredients.some(ingredient => ingredient.itemId === itemId)
    );
  } catch (error) {
    console.error(`Ошибка при получении рецептов алхимии по ингредиенту ${itemId}:`, error);
    // Фильтруем кэш
    return alchemyRecipes.filter(recipe => 
      recipe.ingredients && recipe.ingredients.some(ingredient => ingredient.itemId === itemId)
    );
  }
};

/**
 * Создание нового рецепта
 * @param {Object} recipeData Данные рецепта
 * @returns {Promise<Object>} Созданный рецепт
 */
exports.createRecipe = async function(recipeData) {
  try {
    const newRecipe = await adapterCreateRecipe(recipeData);
    // Обновляем кэш
    alchemyRecipes.push(newRecipe);
    return newRecipe;
  } catch (error) {
    console.error('Ошибка при создании рецепта алхимии:', error);
    throw error;
  }
};

/**
 * Обновление существующего рецепта
 * @param {number} id ID рецепта
 * @param {Object} updates Обновляемые поля
 * @returns {Promise<Object>} Обновленный рецепт
 */
exports.updateRecipe = async function(id, updates) {
  try {
    const updatedRecipe = await adapterUpdateRecipe(id, updates);
    // Обновляем кэш
    const index = alchemyRecipes.findIndex(recipe => recipe.id === id);
    if (index !== -1) {
      alchemyRecipes[index] = updatedRecipe;
    }
    return updatedRecipe;
  } catch (error) {
    console.error(`Ошибка при обновлении рецепта алхимии с ID ${id}:`, error);
    throw error;
  }
};

/**
 * Удаление рецепта
 * @param {number} id ID рецепта
 * @returns {Promise<boolean>} Результат операции
 */
exports.deleteRecipe = async function(id) {
  try {
    const result = await adapterDeleteRecipe(id);
    // Обновляем кэш
    const index = alchemyRecipes.findIndex(recipe => recipe.id === id);
    if (index !== -1) {
      alchemyRecipes.splice(index, 1);
    }
    return result;
  } catch (error) {
    console.error(`Ошибка при удалении рецепта алхимии с ID ${id}:`, error);
    throw error;
  }
};

// Инициализация кэша при загрузке модуля
(async function() {
  try {
    alchemyRecipes = await exports.getAllRecipes();
    console.log(`Загружено ${alchemyRecipes.length} рецептов алхимии`);
  } catch (error) {
    console.error('Ошибка при инициализации данных рецептов алхимии:', error);
  }
})();

// Экспорт массива рецептов для обратной совместимости
exports.recipes = alchemyRecipes;
