/**
 * Клиентская версия данных о рецептах алхимии без серверных зависимостей
 * Используется в браузере вместо оригинального alchemy-recipes.js
 */

// Импортируем константы из client-alchemy-items.js вместо alchemy-items.js
// чтобы избежать серверных зависимостей
const AlchemyItems = require('./client-alchemy-items');
const { ITEM_TYPES, RARITY } = AlchemyItems;

// Экспортируем константы для совместимости
export { ITEM_TYPES, RARITY };

// Ключ для хранения данных в localStorage
const STORAGE_KEY = 'alchemy_recipes_cache';

// Заглушка для базовых рецептов (используются, если нет данных в localStorage)
const DEFAULT_RECIPES = [
  {
    id: 1,
    name: 'Пилюля сбора ци',
    description: 'Базовая пилюля, помогающая собирать и очищать ци. Ускоряет культивацию на начальных этапах.',
    type: ITEM_TYPES.PILL,
    rarity: RARITY.COMMON,
    requiredLevel: 1,
    requiredStage: 'Закалка тела',
    successRate: 95,
    ingredients: [
      { itemId: 'low_grade_herb', quantity: 3 },
      { itemId: 'medium_grade_herb', quantity: 1 }
    ],
    results: [
      { itemId: 'qi_gathering_pill', quantity: 1 }
    ]
  },
  {
    id: 2,
    name: 'Пилюля укрепления тела',
    description: 'Укрепляет физическое тело, повышая выносливость и силу культиватора.',
    type: ITEM_TYPES.PILL,
    rarity: RARITY.UNCOMMON,
    requiredLevel: 3,
    requiredStage: 'Закалка тела',
    successRate: 85,
    ingredients: [
      { itemId: 'low_grade_herb', quantity: 2 },
      { itemId: 'medium_grade_herb', quantity: 2 },
      { itemId: 'spirit_iron', quantity: 1 }
    ],
    results: [
      { itemId: 'body_strengthening_pill', quantity: 1 }
    ]
  },
  {
    id: 3,
    name: 'Эликсир энергии',
    description: 'Восстанавливает энергию и помогает восполнить силы после тренировок.',
    type: ITEM_TYPES.ELIXIR,
    rarity: RARITY.COMMON,
    requiredLevel: 2,
    requiredStage: 'Закалка тела',
    successRate: 90,
    ingredients: [
      { itemId: 'low_grade_herb', quantity: 4 },
      { itemId: 'spirit_water', quantity: 1 }
    ],
    results: [
      { itemId: 'energy_elixir', quantity: 1 }
    ]
  }
];

/**
 * Получение всех рецептов алхимии из локального хранилища
 * @returns {Promise<Array>} Список всех рецептов
 */
async function getAllRecipes() {
  try {
    // Пытаемся получить данные из localStorage
    if (typeof localStorage !== 'undefined') {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    }
    
    // Если данных нет, возвращаем значения по умолчанию
    return DEFAULT_RECIPES;
  } catch (error) {
    console.error('Ошибка при получении рецептов алхимии из localStorage:', error);
    return DEFAULT_RECIPES;
  }
}

/**
 * Получение одного рецепта по ID
 * @param {number} recipeId - ID рецепта
 * @returns {Promise<Object|null>} Найденный рецепт или null
 */
async function getRecipeById(recipeId) {
  try {
    const recipes = await getAllRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe || null;
  } catch (error) {
    console.error(`Ошибка при получении рецепта с ID ${recipeId}:`, error);
    return null;
  }
}

/**
 * Получение рецептов, доступных для определенного уровня и стадии культивации
 * @param {number} level - Уровень культивации
 * @param {string} stage - Стадия культивации
 * @returns {Promise<Array>} Список доступных рецептов
 */
async function getAvailableRecipesForCultivator(level, stage) {
  try {
    const recipes = await getAllRecipes();
    return recipes.filter(recipe => 
      recipe.requiredLevel <= level && 
      (!recipe.requiredStage || recipe.requiredStage === stage)
    );
  } catch (error) {
    console.error('Ошибка при получении доступных рецептов:', error);
    return [];
  }
}

/**
 * Проверка наличия всех необходимых ингредиентов для рецепта
 * @param {number} recipeId - ID рецепта
 * @param {Array} inventory - Инвентарь игрока
 * @returns {Promise<boolean>} Результат проверки
 */
async function hasRequiredIngredientsForRecipe(recipeId, inventory) {
  try {
    const recipe = await getRecipeById(recipeId);
    if (!recipe) return false;
    
    // Проверяем наличие каждого ингредиента в инвентаре
    return recipe.ingredients.every(ingredient => {
      const inventoryItem = inventory.find(item => item.itemId === ingredient.itemId);
      return inventoryItem && inventoryItem.quantity >= ingredient.quantity;
    });
  } catch (error) {
    console.error(`Ошибка при проверке ингредиентов для рецепта ${recipeId}:`, error);
    return false;
  }
}

/**
 * Сохранение рецептов в локальное хранилище
 * @param {Array} recipes - Список рецептов для сохранения
 */
function saveRecipesToStorage(recipes) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    }
  } catch (error) {
    console.error('Ошибка при сохранении рецептов алхимии в localStorage:', error);
  }
}

/**
 * Добавление нового рецепта (только для клиентской версии)
 * @param {Object} recipe - Данные нового рецепта
 * @returns {Promise<Object>} Добавленный рецепт с ID
 */
async function addNewRecipe(recipe) {
  try {
    const recipes = await getAllRecipes();
    
    // Генерируем новый ID на основе максимального существующего
    const maxId = recipes.reduce((max, r) => Math.max(max, r.id || 0), 0);
    const newRecipe = { ...recipe, id: maxId + 1 };
    
    // Добавляем в список и сохраняем
    const updatedRecipes = [...recipes, newRecipe];
    saveRecipesToStorage(updatedRecipes);
    
    return newRecipe;
  } catch (error) {
    console.error('Ошибка при добавлении нового рецепта:', error);
    throw error;
  }
}

// Другие необходимые методы для работы с рецептами в клиентской среде