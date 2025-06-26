/**
 * Эндпоинты API алхимии с использованием прямых SQL-запросов через Sequelize
 */
const express = require('express');
const router = express.Router();
const AlchemyService = require('../../services/alchemy-service');
const { validateAdmin } = require('../middleware/auth-middleware');

router.get('/api/alchemy/recipes', async (req, res) => {
  try {
    const recipes = await AlchemyService.getAllRecipes();
    res.json(recipes);
  } catch (error) {
    console.error('Ошибка при получении рецептов алхимии:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении рецептов алхимии' });
  }
});

router.get('/api/alchemy/recipes/:id', async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({ message: 'Некорректный ID рецепта' });
    }

    const recipe = await AlchemyService.getRecipeById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Рецепт не найден' });
    }

    res.json(recipe);
  } catch (error) {
    console.error(`Ошибка при получении рецепта с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении рецепта' });
  }
});

router.get('/api/alchemy/recipes/type/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const recipes = await AlchemyService.getRecipesByType(type);
    res.json(recipes);
  } catch (error) {
    console.error(`Ошибка при получении рецептов типа ${req.params.type}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении рецептов по типу' });
  }
});

router.get('/api/alchemy/recipes/rarity/:rarity', async (req, res) => {
  try {
    const rarity = req.params.rarity;
    const recipes = await AlchemyService.getRecipesByRarity(rarity);
    res.json(recipes);
  } catch (error) {
    console.error(`Ошибка при получении рецептов редкости ${req.params.rarity}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении рецептов по редкости' });
  }
});

router.post('/api/alchemy/craft', async (req, res) => {
  try {
    const { userId, recipeId } = req.body;
    
    if (!userId || !recipeId) {
      return res.status(400).json({ message: 'Необходимо указать ID пользователя и ID рецепта' });
    }
    
    const result = await AlchemyService.craftItem(recipeId, userId);
    res.json(result);
  } catch (error) {
    console.error('Ошибка при создании предмета по рецепту:', error);
    
    if (error.message.includes('не найден')) {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes('Недостаточно ингредиентов')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Ошибка сервера при создании предмета' });
  }
});

router.get('/api/alchemy/user/:userId/items', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Некорректный ID пользователя' });
    }
    
    const items = await AlchemyService.getUserAlchemyItems(userId);
    res.json(items);
  } catch (error) {
    console.error(`Ошибка при получении алхимических предметов пользователя ${req.params.userId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении алхимических предметов' });
  }
});

router.post('/api/alchemy/user/:userId/use/:itemId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const itemId = req.params.itemId;
    const { quantity } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Некорректный ID пользователя' });
    }
    
    const result = await AlchemyService.useConsumableItem(userId, itemId, quantity || 1);
    res.json(result);
  } catch (error) {
    console.error(`Ошибка при использовании предмета ${req.params.itemId}:`, error);
    
    if (error.message.includes('не найден')) {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes('недостаточно')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Ошибка сервера при использовании предмета' });
  }
});

module.exports = router;