/**
 * Клиентская версия AlchemyService
 * Обращается к API серверной части или использует мок-данные в качестве запасного варианта
 */

// Базовый URL для API алхимии
const API_BASE_URL = '/api/alchemy';

// Клиентские данные об алхимических рецептах (запасной вариант)
const mockAlchemyRecipes = [
  {
    id: 1,
    name: 'Пилюля очищения',
    description: 'Базовая пилюля, очищающая тело от примесей и подготавливающая к культивации.',
    type: 'pill',
    rarity: 'common',
    requiredLevel: 1,
    requiredStage: 'Закалка тела',
    successRate: 95,
    ingredients: [
      { id: 'spirit_herb', name: 'Духовная трава', quantity: 2 },
      { id: 'clear_water', name: 'Чистая вода', quantity: 1 }
    ],
    results: [
      { id: 'basic_cleansing_pill', name: 'Пилюля очищения', quantity: 1 }
    ]
  },
  {
    id: 2,
    name: 'Эликсир энергии Ци',
    description: 'Эликсир, усиливающий циркуляцию энергии Ци в организме.',
    type: 'elixir',
    rarity: 'uncommon',
    requiredLevel: 3,
    requiredStage: 'Закалка тела',
    successRate: 85,
    ingredients: [
      { id: 'spirit_herb', name: 'Духовная трава', quantity: 3 },
      { id: 'energy_crystal', name: 'Энергетический кристалл', quantity: 1 },
      { id: 'clear_water', name: 'Чистая вода', quantity: 2 }
    ],
    results: [
      { id: 'qi_energy_elixir', name: 'Эликсир энергии Ци', quantity: 1 }
    ]
  },
  {
    id: 3,
    name: 'Духовный камень',
    description: 'Концентрированная духовная энергия в форме камня, используемая для создания артефактов.',
    type: 'material',
    rarity: 'rare',
    requiredLevel: 5,
    requiredStage: 'Закалка тела',
    successRate: 75,
    ingredients: [
      { id: 'high_grade_ore', name: 'Высококачественная руда', quantity: 3 },
      { id: 'spirit_essence', name: 'Духовная эссенция', quantity: 2 }
    ],
    results: [
      { id: 'spirit_stone', name: 'Духовный камень', quantity: 1 }
    ]
  }
];

/**
 * Выполняет запрос к API
 * @param {string} endpoint - Конечная точка API
 * @param {Object} options - Опции запроса (метод, тело и т.д.)
 * @returns {Promise<any>} - Результат запроса в формате JSON
 * @throws {Error} - В случае ошибки запроса
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    });

    // Проверяем статус ответа
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Неизвестная ошибка сервера'
      }));
      throw new Error(errorData.message || `Ошибка API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Ошибка в API запросе к ${endpoint}:`, error);
    throw error;
  }
}

// Типы алхимических предметов
const ITEM_TYPES = {
  PILL: 'pill',
  ELIXIR: 'elixir',
  MATERIAL: 'material',
  TALISMAN: 'talisman',
  WEAPON: 'weapon',
  ACCESSORY: 'accessory'
};

// Уровни редкости
const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic'
};

class AlchemyServiceAPI {
  /**
   * Получает все рецепты алхимии
   * @returns {Promise<Array>} Массив рецептов
   */
  static async getAllRecipes() {
    try {
      // Пытаемся получить данные с сервера
      const recipes = await fetchAPI('/recipes');
      return recipes;
    } catch (error) {
      console.warn('Ошибка при получении рецептов с сервера, используем мок-данные:', error);
      // В случае ошибки возвращаем мок-данные
      return mockAlchemyRecipes;
    }
  }

  /**
   * Получает рецепт по ID
   * @param {number} recipeId ID рецепта
   * @returns {Promise<Object|null>} Объект рецепта или null, если не найден
   */
  static async getRecipeById(recipeId) {
    try {
      // Пытаемся получить данные с сервера
      const recipe = await fetchAPI(`/recipes/${recipeId}`);
      return recipe;
    } catch (error) {
      console.warn(`Ошибка при получении рецепта с ID ${recipeId}, используем мок-данные:`, error);
      // В случае ошибки используем поиск в мок-данных
      return mockAlchemyRecipes.find(r => r.id === recipeId) || null;
    }
  }

  /**
   * Получает рецепты по типу
   * @param {string} type Тип рецепта
   * @returns {Promise<Array>} Массив рецептов указанного типа
   */
  static async getRecipesByType(type) {
    try {
      // Пытаемся получить данные с сервера
      const recipes = await fetchAPI(`/recipes/type/${type}`);
      return recipes;
    } catch (error) {
      console.warn(`Ошибка при получении рецептов типа ${type}, используем мок-данные:`, error);
      // В случае ошибки фильтруем мок-данные
      return mockAlchemyRecipes.filter(r => r.type === type);
    }
  }

  /**
   * Получает рецепты по редкости
   * @param {string} rarity Редкость рецепта
   * @returns {Promise<Array>} Массив рецептов указанной редкости
   */
  static async getRecipesByRarity(rarity) {
    try {
      // Пытаемся получить данные с сервера
      const recipes = await fetchAPI(`/recipes/rarity/${rarity}`);
      return recipes;
    } catch (error) {
      console.warn(`Ошибка при получении рецептов редкости ${rarity}, используем мок-данные:`, error);
      // В случае ошибки фильтруем мок-данные
      return mockAlchemyRecipes.filter(r => r.rarity === rarity);
    }
  }

  /**
   * Создает новый алхимический предмет по рецепту
   * @param {number} userId ID пользователя
   * @param {number} recipeId ID рецепта
   * @returns {Promise<Object>} Результат создания предмета
   */
  static async craftItem(userId, recipeId) {
    try {
      // Отправляем запрос на создание предмета на сервер
      const result = await fetchAPI('/craft', {
        method: 'POST',
        body: JSON.stringify({ userId, recipeId })
      });
      return result;
    } catch (error) {
      console.warn(`Ошибка при создании предмета по рецепту ${recipeId}, используем мок-данные:`, error);
      
      // В случае ошибки используем локальное поведение
      const recipe = mockAlchemyRecipes.find(r => r.id === recipeId);
      
      if (!recipe) {
        return Promise.reject(new Error('Рецепт не найден'));
      }
      
      // Симуляция успеха/неудачи создания предмета на основе шанса успеха
      const success = Math.random() * 100 <= recipe.successRate;
      
      if (success) {
        return {
          success: true,
          message: `Успешно создан предмет: ${recipe.name}`,
          items: recipe.results,
          // Добавляем информацию об использованных ингредиентах для соответствия серверному формату
          usedIngredients: recipe.ingredients.map(ing => ({
            id: ing.id,
            name: ing.name,
            quantity: ing.quantity
          }))
        };
      } else {
        return {
          success: false,
          message: 'Не удалось создать предмет. Попробуйте еще раз.',
          items: []
        };
      }
    }
  }

  /**
   * Получает список алхимических предметов в инвентаре пользователя
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Массив алхимических предметов
   */
  static async getUserAlchemyItems(userId) {
    try {
      // Пытаемся получить данные с сервера
      const items = await fetchAPI(`/user/${userId}/items`);
      return items;
    } catch (error) {
      console.warn(`Ошибка при получении алхимических предметов пользователя ${userId}, используем мок-данные:`, error);
      // В случае ошибки возвращаем мок-данные
      return [
        { id: 'basic_cleansing_pill', name: 'Пилюля очищения', quantity: 5, type: 'pill', rarity: 'common' },
        { id: 'qi_energy_elixir', name: 'Эликсир энергии Ци', quantity: 2, type: 'elixir', rarity: 'uncommon' }
      ];
    }
  }

  /**
   * Использует алхимический предмет
   * @param {number} userId ID пользователя
   * @param {string} itemId ID предмета
   * @param {number} quantity Количество предметов для использования
   * @returns {Promise<Object>} Результат использования предмета
   */
  static async useAlchemyItem(userId, itemId, quantity = 1) {
    try {
      // Отправляем запрос на использование предмета на сервер
      const result = await fetchAPI(`/user/${userId}/use/${itemId}`, {
        method: 'POST',
        body: JSON.stringify({ quantity })
      });
      return result;
    } catch (error) {
      console.warn(`Ошибка при использовании предмета ${itemId}, используем мок-данные:`, error);
      // В случае ошибки возвращаем моковые данные
      return {
        success: true,
        message: `Предмет ${itemId} успешно использован`,
        effects: [
          { type: 'cultivation_boost', value: 10 },
          { type: 'energy_restore', value: 25 }
        ]
      };
    }
  }

  /**
   * Возвращает константы типов предметов
   */
  static getItemTypes() {
    return ITEM_TYPES;
  }

  /**
   * Возвращает константы редкости
   */
  static getRarityLevels() {
    return RARITY;
  }
}

// Экспортируем класс
// Экспортируем класс через CommonJS
module.exports = AlchemyServiceAPI;

// Экспортируем константы для совместимости с оригинальным модулем
const alchemyItems = [];
const ITEM_TYPES_EXPORT = ITEM_TYPES;
const RARITY_EXPORT = RARITY;

// Экспортируем отдельные методы для совместимости
module.exports.getAllRecipes = AlchemyServiceAPI.getAllRecipes;
module.exports.getRecipeById = AlchemyServiceAPI.getRecipeById;
module.exports.getRecipesByType = AlchemyServiceAPI.getRecipesByType;
module.exports.getRecipesByRarity = AlchemyServiceAPI.getRecipesByRarity;
module.exports.craftItem = AlchemyServiceAPI.craftItem;
module.exports.getUserAlchemyItems = AlchemyServiceAPI.getUserAlchemyItems;
module.exports.useAlchemyItem = AlchemyServiceAPI.useAlchemyItem;