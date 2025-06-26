import React, { useState, useEffect, useCallback } from 'react';
import AlchemyService from '../../services/alchemy-service-adapter';
import AlchemySynchronizer from './AlchemySynchronizer';

/**
 * Компонент для управления алхимией
 * Предоставляет методы для работы с рецептами и предметами алхимии,
 * и синхронизирует данные с сервером
 */
const AlchemyManager = () => {
  // Локальное состояние вместо Redux
  const [recipes, setRecipes] = useState([]);
  const [userItems, setUserItems] = useState([]);
  const [userId, setUserId] = useState(null);
  
  // Получаем ID пользователя из токена при монтировании
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Извлекаем ID пользователя из токена
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id || payload.userId || payload.sub);
      }
    } catch (error) {
      console.error('Ошибка при получении ID пользователя из токена:', error);
    }
  }, []);
  
  /**
   * Получение всех рецептов алхимии
   * @returns {Promise<Array>} Массив рецептов
   */
  const getAllRecipes = useCallback(async () => {
    try {
      const recipesData = await AlchemyService.getAllRecipes();
      
      // Обновляем локальное состояние
      if (recipesData && recipesData.length > 0) {
        setRecipes(recipesData);
        
        // Отправляем событие для синхронизации с другими компонентами
        window.dispatchEvent(new CustomEvent('alchemy-recipes-updated', { 
          detail: recipesData 
        }));
      }
      
      return recipesData;
    } catch (error) {
      console.error('Ошибка при получении рецептов алхимии:', error);
      return recipes; // Возвращаем текущие рецепты из состояния в случае ошибки
    }
  }, [recipes]);
  
  /**
   * Получение рецепта алхимии по ID
   * @param {number} recipeId - ID рецепта
   * @returns {Promise<Object|null>} Рецепт или null, если рецепт не найден
   */
  const getRecipeById = useCallback(async (recipeId) => {
    try {
      // Проверяем, есть ли рецепт в локальном состоянии
      const cachedRecipe = recipes.find(recipe => recipe.id === recipeId);
      
      if (cachedRecipe) {
        console.log(`Использование кэшированного рецепта с ID ${recipeId}`);
        return cachedRecipe;
      }
      
      // Если нет в кэше, запрашиваем через API
      const recipe = await AlchemyService.getRecipeById(recipeId);
      return recipe;
    } catch (error) {
      console.error(`Ошибка при получении рецепта с ID ${recipeId}:`, error);
      
      // Проверяем, есть ли рецепт в кэше для повторной попытки
      const cachedRecipe = recipes.find(recipe => recipe.id === recipeId);
      if (cachedRecipe) {
        console.log(`Использование кэшированного рецепта с ID ${recipeId} после ошибки API`);
        return cachedRecipe;
      }
      
      return null;
    }
  }, [recipes]);
  
  /**
   * Получение рецептов алхимии по типу
   * @param {string} type - Тип рецепта
   * @returns {Promise<Array>} Массив рецептов указанного типа
   */
  const getRecipesByType = useCallback(async (type) => {
    try {
      // Проверяем, есть ли рецепты этого типа в локальном состоянии
      const cachedRecipes = recipes.filter(recipe => recipe.type === type);
      
      if (cachedRecipes.length > 0) {
        console.log(`Использование кэшированных рецептов типа ${type}`);
        return cachedRecipes;
      }
      
      // Если нет в кэше, запрашиваем через API
      const filteredRecipes = await AlchemyService.getRecipesByType(type);
      return filteredRecipes;
    } catch (error) {
      console.error(`Ошибка при получении рецептов типа ${type}:`, error);
      
      // В случае ошибки, фильтруем локальные данные
      return recipes.filter(recipe => recipe.type === type);
    }
  }, [recipes]);
  
  /**
   * Получение рецептов алхимии по редкости
   * @param {string} rarity - Редкость рецепта
   * @returns {Promise<Array>} Массив рецептов указанной редкости
   */
  const getRecipesByRarity = useCallback(async (rarity) => {
    try {
      // Проверяем, есть ли рецепты этой редкости в локальном состоянии
      const cachedRecipes = recipes.filter(recipe => recipe.rarity === rarity);
      
      if (cachedRecipes.length > 0) {
        console.log(`Использование кэшированных рецептов редкости ${rarity}`);
        return cachedRecipes;
      }
      
      // Если нет в кэше, запрашиваем через API
      const filteredRecipes = await AlchemyService.getRecipesByRarity(rarity);
      return filteredRecipes;
    } catch (error) {
      console.error(`Ошибка при получении рецептов редкости ${rarity}:`, error);
      
      // В случае ошибки, фильтруем локальные данные
      return recipes.filter(recipe => recipe.rarity === rarity);
    }
  }, [recipes]);
  
  /**
   * Получение доступных рецептов для определенного уровня культивации
   * @param {string} stage - Ступень культивации
   * @param {number} level - Уровень культивации
   * @returns {Promise<Array>} Массив доступных рецептов
   */
  const getAvailableRecipes = useCallback(async (stage, level) => {
    try {
      // Запрашиваем через API
      const url = `/api/alchemy/recipes/available?stage=${encodeURIComponent(stage)}&level=${level}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при получении доступных рецептов');
      }
      
      const availableRecipes = await response.json();
      return availableRecipes;
    } catch (error) {
      console.error(`Ошибка при получении доступных рецептов для ступени ${stage}, уровень ${level}:`, error);
      
      // В случае ошибки, фильтруем локальные данные
      // Определяем порядок ступеней для сравнения
      const stagesOrder = ['Закалка тела', 'Очищение Ци', 'Золотое ядро', 'Формирование души'];
      const stageIndex = stagesOrder.indexOf(stage);
      
      // Фильтруем рецепты, доступные для текущего уровня культивации
      return recipes.filter(recipe => {
        const recipeStageIndex = stagesOrder.indexOf(recipe.requiredStage);
        
        // Если требуемая ступень ниже текущей - рецепт доступен
        if (recipeStageIndex < stageIndex) {
          return true;
        }
        
        // Если ступень та же, проверяем уровень
        if (recipeStageIndex === stageIndex && recipe.requiredLevel <= level) {
          return true;
        }
        
        return false;
      });
    }
  }, [recipes]);
  
  /**
   * Получение предметов алхимии пользователя
   * @returns {Promise<Array>} Массив предметов алхимии пользователя
   */
  const getUserAlchemyItems = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить предметы: пользователь не авторизован');
      return [];
    }
    
    try {
      const items = await AlchemyService.getUserAlchemyItems(userId);
      
      // Обновляем локальное состояние
      if (items) {
        setUserItems(items);
        
        // Отправляем событие для синхронизации с другими компонентами
        window.dispatchEvent(new CustomEvent('user-alchemy-items-updated', {
          detail: items
        }));
      }
      
      return items;
    } catch (error) {
      console.error('Ошибка при получении предметов алхимии пользователя:', error);
      return userItems; // Возвращаем текущие предметы из состояния в случае ошибки
    }
  }, [userId, userItems]);
  
  /**
   * Создание предмета по рецепту алхимии
   * @param {number} recipeId - ID рецепта
   * @returns {Promise<Object>} Результат создания предмета
   */
  const craftItem = useCallback(async (recipeId) => {
    if (!userId) {
      console.error('Невозможно создать предмет: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      const result = await AlchemyService.craftItem(userId, recipeId);
      
      // Обновляем предметы пользователя после создания
      if (result && result.success) {
        // После успешного создания обновляем список предметов
        getUserAlchemyItems();
        
        // Отправляем событие о создании предмета
        window.dispatchEvent(new CustomEvent('alchemy-item-crafted', { 
          detail: { 
            result,
            recipeId
          } 
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при создании предмета по рецепту с ID ${recipeId}:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при создании предмета'
      };
    }
  }, [userId, getUserAlchemyItems]);
  
  /**
   * Использование алхимического предмета
   * @param {string} itemId - ID предмета
   * @param {number} quantity - Количество предметов для использования
   * @returns {Promise<Object>} Результат использования предмета
   */
  const useAlchemyItem = useCallback(async (itemId, quantity = 1) => {
    if (!userId) {
      console.error('Невозможно использовать предмет: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      const result = await AlchemyService.useAlchemyItem(userId, itemId, quantity);
      
      // Отправляем событие об использовании предмета
      if (result && result.success) {
        // После успешного использования обновляем список предметов
        getUserAlchemyItems();
        
        window.dispatchEvent(new CustomEvent('alchemy-item-used', { 
          detail: { 
            result,
            itemId,
            quantity
          } 
        }));
        
        // Также обновляем инвентарь
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при использовании предмета с ID ${itemId}:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при использовании предмета'
      };
    }
  }, [userId, getUserAlchemyItems]);
  
  /**
   * Получение константных данных о типах предметов
   * @returns {Object} Объект с типами предметов
   */
  const getItemTypes = useCallback(() => {
    return AlchemyService.getItemTypes();
  }, []);
  
  /**
   * Получение константных данных о редкостях предметов
   * @returns {Object} Объект с редкостями предметов
   */
  const getRarityLevels = useCallback(() => {
    return AlchemyService.getRarityLevels();
  }, []);
  
  // Инициализация данных при первом рендере
  useEffect(() => {
    if (userId) {
      getAllRecipes();
      getUserAlchemyItems();
    }
  }, [userId, getAllRecipes, getUserAlchemyItems]);
  
  // Слушатели событий для обновления данных
  useEffect(() => {
    const handleRecipesChanged = () => getAllRecipes();
    const handleUserItemsChanged = () => getUserAlchemyItems();
    
    // Добавляем слушатели событий
    window.addEventListener('alchemy-recipes-changed', handleRecipesChanged);
    window.addEventListener('user-alchemy-items-changed', handleUserItemsChanged);
    
    // Очистка слушателей при размонтировании
    return () => {
      window.removeEventListener('alchemy-recipes-changed', handleRecipesChanged);
      window.removeEventListener('user-alchemy-items-changed', handleUserItemsChanged);
    };
  }, [getAllRecipes, getUserAlchemyItems]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.alchemyManager) {
        window.alchemyManager = {};
      }
      
      window.alchemyManager = {
        getAllRecipes,
        getRecipeById,
        getRecipesByType,
        getRecipesByRarity,
        getAvailableRecipes,
        craftItem,
        useAlchemyItem,
        getUserAlchemyItems,
        getItemTypes,
        getRarityLevels
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { alchemy: {} };
      } else if (!window.gameManager.alchemy) {
        window.gameManager.alchemy = {};
      }
      
      window.gameManager.alchemy = {
        ...window.alchemyManager
      };
    }
  }, [
    getAllRecipes,
    getRecipeById,
    getRecipesByType,
    getRecipesByRarity,
    getAvailableRecipes,
    craftItem,
    useAlchemyItem,
    getUserAlchemyItems,
    getItemTypes,
    getRarityLevels
  ]);
  
  return <AlchemySynchronizer userId={userId} recipesData={recipes} userItemsData={userItems} />;
};

export default AlchemyManager;