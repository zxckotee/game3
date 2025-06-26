/**
 * Отладочные инструменты для работы с алхимией
 */

// Глобальные переменные для доступа из консоли
let alchemyDebugTools = {};

/**
 * Инициализирует инструменты отладки алхимии в глобальном пространстве
 */
export function initAlchemyDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки алхимии...');
  
  // Функция для получения рецептов из Redux-состояния
  const getRecipesFromState = () => {
    if (!window.__GAME_STATE__?.alchemy?.recipes) {
      console.error('Данные о рецептах алхимии не найдены в состоянии игры');
      return [];
    }
    return window.__GAME_STATE__.alchemy.recipes;
  };
  
  // Функция для получения предметов пользователя из Redux-состояния
  const getUserItemsFromState = () => {
    if (!window.__GAME_STATE__?.alchemy?.userItems) {
      console.error('Данные о предметах алхимии пользователя не найдены в состоянии игры');
      return [];
    }
    return window.__GAME_STATE__.alchemy.userItems;
  };
  
  // Функция для отображения рецептов алхимии в консоли
  const displayRecipes = (recipes = null) => {
    const recipesData = recipes || getRecipesFromState();
    if (!recipesData || recipesData.length === 0) {
      console.log('Рецепты алхимии не найдены');
      return null;
    }
    
    console.log(`Найдено ${recipesData.length} рецептов алхимии:`);
    console.table(recipesData.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      rarity: r.rarity,
      requiredLevel: r.requiredLevel,
      requiredStage: r.requiredStage,
      successRate: r.successRate
    })));
    
    return recipesData;
  };
  
  // Функция для отображения детальной информации о рецепте
  const displayRecipeDetails = async (recipeId) => {
    if (!recipeId) {
      console.error('Необходимо указать ID рецепта');
      return null;
    }
    
    // Используем alchemyManager для получения рецепта
    if (!window.alchemyManager) {
      console.error('AlchemyManager не инициализирован');
      return null;
    }
    
    const recipe = await window.alchemyManager.getRecipeById(recipeId);
    
    if (!recipe) {
      console.error(`Рецепт с ID ${recipeId} не найден`);
      return null;
    }
    
    console.log(`Детальная информация о рецепте ID ${recipeId}:`);
    console.log('Название:', recipe.name);
    console.log('Описание:', recipe.description);
    console.log('Тип:', recipe.type);
    console.log('Редкость:', recipe.rarity);
    console.log('Требуемый уровень:', recipe.requiredLevel);
    console.log('Требуемая ступень:', recipe.requiredStage);
    console.log('Шанс успеха:', recipe.successRate + '%');
    
    // Вывод информации об ингредиентах
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      console.group('Ингредиенты:');
      recipe.ingredients.forEach(ingredient => {
        console.log(`- ${ingredient.item?.name || ingredient.itemId}: ${ingredient.quantity} шт.`);
      });
      console.groupEnd();
    }
    
    // Вывод информации о результатах
    if (recipe.results && recipe.results.length > 0) {
      console.group('Результаты:');
      recipe.results.forEach(result => {
        console.log(`- ${result.item?.name || result.itemId}: ${result.quantity} шт.`);
      });
      console.groupEnd();
    }
    
    return recipe;
  };
  
  // Функция для отображения рецептов определенного типа
  const displayRecipesByType = async (type) => {
    if (!type) {
      console.error('Необходимо указать тип рецепта');
      return null;
    }
    
    // Используем alchemyManager для получения рецептов
    if (!window.alchemyManager) {
      console.error('AlchemyManager не инициализирован');
      return null;
    }
    
    const recipes = await window.alchemyManager.getRecipesByType(type);
    
    if (!recipes || recipes.length === 0) {
      console.log(`Рецепты типа ${type} не найдены`);
      return [];
    }
    
    console.log(`Найдено ${recipes.length} рецептов типа "${type}":`);
    console.table(recipes.map(r => ({
      id: r.id,
      name: r.name,
      rarity: r.rarity,
      requiredLevel: r.requiredLevel,
      requiredStage: r.requiredStage,
      successRate: r.successRate
    })));
    
    return recipes;
  };
  
  // Функция для отображения рецептов определенной редкости
  const displayRecipesByRarity = async (rarity) => {
    if (!rarity) {
      console.error('Необходимо указать редкость рецепта');
      return null;
    }
    
    // Используем alchemyManager для получения рецептов
    if (!window.alchemyManager) {
      console.error('AlchemyManager не инициализирован');
      return null;
    }
    
    const recipes = await window.alchemyManager.getRecipesByRarity(rarity);
    
    if (!recipes || recipes.length === 0) {
      console.log(`Рецепты редкости ${rarity} не найдены`);
      return [];
    }
    
    console.log(`Найдено ${recipes.length} рецептов редкости "${rarity}":`);
    console.table(recipes.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      requiredLevel: r.requiredLevel,
      requiredStage: r.requiredStage,
      successRate: r.successRate
    })));
    
    return recipes;
  };
  
  // Функция для отображения доступных рецептов для уровня культивации
  const displayAvailableRecipes = async (stage, level) => {
    if (!stage) {
      console.error('Необходимо указать ступень культивации');
      return null;
    }
    
    if (!level) {
      console.error('Необходимо указать уровень культивации');
      return null;
    }
    
    // Используем alchemyManager для получения рецептов
    if (!window.alchemyManager) {
      console.error('AlchemyManager не инициализирован');
      return null;
    }
    
    const recipes = await window.alchemyManager.getAvailableRecipes(stage, parseInt(level));
    
    if (!recipes || recipes.length === 0) {
      console.log(`Рецепты для ступени ${stage} уровня ${level} не найдены`);
      return [];
    }
    
    console.log(`Найдено ${recipes.length} доступных рецептов для ступени "${stage}" уровня ${level}:`);
    console.table(recipes.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      rarity: r.rarity,
      requiredLevel: r.requiredLevel,
      requiredStage: r.requiredStage,
      successRate: r.successRate
    })));
    
    return recipes;
  };
  
  // Функция для отображения предметов алхимии пользователя
  const displayUserItems = async () => {
    // Используем alchemyManager для получения предметов
    if (!window.alchemyManager) {
      console.error('AlchemyManager не инициализирован');
      return null;
    }
    
    const items = await window.alchemyManager.getUserAlchemyItems();
    
    if (!items || items.length === 0) {
      console.log('Предметы алхимии не найдены в инвентаре пользователя');
      return [];
    }
    
    console.log(`Найдено ${items.length} предметов алхимии в инвентаре пользователя:`);
    console.table(items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      quantity: item.quantity
    })));
    
    return items;
  };
  
  // Функция для получения ID текущего пользователя
  const getCurrentUserId = () => {
    return window.__GAME_STATE__?.auth?.user?.id;
  };
  
  // Функция для тестирования API-запроса на получение всех рецептов
  const testGetAllRecipes = async () => {
    try {
      console.log('Запрос GET /api/alchemy/recipes...');
      const response = await fetch('/api/alchemy/recipes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const recipes = await response.json();
      console.log('Получены рецепты алхимии с сервера:', recipes);
      return recipes;
    } catch (error) {
      console.error('Ошибка при получении рецептов алхимии:', error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение рецепта по ID
  const testGetRecipeById = async (recipeId) => {
    if (!recipeId) {
      console.error('Необходимо указать ID рецепта');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/alchemy/recipes/${recipeId}...`);
      const response = await fetch(`/api/alchemy/recipes/${recipeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.status === 404) {
        console.error(`Рецепт с ID ${recipeId} не найден`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const recipe = await response.json();
      console.log(`Получен рецепт с ID ${recipeId}:`, recipe);
      return recipe;
    } catch (error) {
      console.error(`Ошибка при получении рецепта с ID ${recipeId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение рецептов по типу
  const testGetRecipesByType = async (type) => {
    if (!type) {
      console.error('Необходимо указать тип рецепта');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/alchemy/recipes/type/${type}...`);
      const response = await fetch(`/api/alchemy/recipes/type/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const recipes = await response.json();
      console.log(`Получены рецепты типа ${type}:`, recipes);
      return recipes;
    } catch (error) {
      console.error(`Ошибка при получении рецептов типа ${type}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение доступных рецептов
  const testGetAvailableRecipes = async (stage, level) => {
    if (!stage || !level) {
      console.error('Необходимо указать ступень культивации и уровень');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/alchemy/recipes/available?stage=${encodeURIComponent(stage)}&level=${level}...`);
      const response = await fetch(`/api/alchemy/recipes/available?stage=${encodeURIComponent(stage)}&level=${level}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const recipes = await response.json();
      console.log(`Получены доступные рецепты для ступени ${stage} уровня ${level}:`, recipes);
      return recipes;
    } catch (error) {
      console.error(`Ошибка при получении доступных рецептов:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на создание предмета
  const testCraftItem = async (recipeId) => {
    if (!recipeId) {
      console.error('Необходимо указать ID рецепта');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/alchemy/craft/${recipeId}...`);
      const response = await fetch(`/api/alchemy/craft/${recipeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат создания предмета:`, result);
      
      // Обновляем инвентарь и предметы алхимии
      window.dispatchEvent(new CustomEvent('inventory-changed'));
      window.dispatchEvent(new CustomEvent('alchemy-items-changed'));
      
      return result;
    } catch (error) {
      console.error(`Ошибка при создании предмета:`, error);
      return null;
    }
  };
  
  // Функция для тестирования создания случайного предмета
  const craftRandomItem = async () => {
    // Получаем все рецепты
    const recipes = getRecipesFromState();
    
    if (!recipes || recipes.length === 0) {
      console.error('Рецепты не найдены. Получите рецепты перед созданием предмета.');
      return null;
    }
    
    // Выбираем случайный рецепт
    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    
    console.log(`Выбран случайный рецепт: ${randomRecipe.name} (ID: ${randomRecipe.id})`);
    
    // Создаем предмет
    return await testCraftItem(randomRecipe.id);
  };
  
  // Функция для тестирования API-запроса на получение выпадения ингредиентов с врага
  const testGetEnemyDrops = async (enemyType, enemyLevel, isBoss = false, element = null) => {
    if (!enemyType || !enemyLevel) {
      console.error('Необходимо указать тип врага и уровень');
      return null;
    }
    
    try {
      let url = `/api/alchemy/enemy-drops?enemyType=${encodeURIComponent(enemyType)}&enemyLevel=${enemyLevel}`;
      
      if (isBoss) {
        url += '&isBoss=true';
      }
      
      if (element) {
        url += `&element=${encodeURIComponent(element)}`;
      }
      
      console.log(`Запрос GET ${url}...`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const drops = await response.json();
      console.log(`Получены выпадения с врага ${enemyType} (уровень ${enemyLevel}):`, drops);
      return drops;
    } catch (error) {
      console.error(`Ошибка при получении выпадений с врага:`, error);
      return null;
    }
  };
  
  // Функция для тестирования синхронизации алхимии
  const testSynchronization = async () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события alchemy-recipes-changed...');
    window.dispatchEvent(new CustomEvent('alchemy-recipes-changed'));
    console.log('Генерация события alchemy-items-changed...');
    window.dispatchEvent(new CustomEvent('alchemy-items-changed'));
    console.log('События отправлены. Компонент AlchemySynchronizer должен обновить данные.');
  };
  
  // Создаем объект с функциями отладки
  alchemyDebugTools = {
    getRecipes: getRecipesFromState,
    getUserItems: getUserItemsFromState,
    displayRecipes,
    displayRecipeDetails,
    displayRecipesByType,
    displayRecipesByRarity,
    displayAvailableRecipes,
    displayUserItems,
    testGetAllRecipes,
    testGetRecipeById,
    testGetRecipesByType,
    testGetAvailableRecipes,
    testCraftItem,
    craftRandomItem,
    testGetEnemyDrops,
    testSynchronization
  };
  
  // Экспортируем функции в глобальное пространство
  window.alchemyDebug = alchemyDebugTools;
  console.log('Инструменты отладки алхимии инициализированы. Используйте window.alchemyDebug для доступа.');
  console.log('Доступные методы:', Object.keys(alchemyDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default alchemyDebugTools;