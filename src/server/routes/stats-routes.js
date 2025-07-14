const express = require('express');
const router = express.Router();
const CharacterStatsService = require('../../services/character-stats-service');
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');


// API маршруты для работы с характеристиками персонажа
router.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Используем сервис для получения характеристик персонажа
    const stats = await CharacterStatsService.getCharacterStats(userId);
    
    res.json(stats);
  } catch (error) {
    console.error('Ошибка при получении характеристик персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение комбинированных характеристик персонажа (с учетом эффектов)
router.get('/api/users/:userId/stats/combined', async (req, res) => {
  try {
    const userId = req.params.userId;
    const combinedState = await CharacterStatsService.getCombinedCharacterState(userId);
    console.log(combinedState);
    res.json(combinedState);
  } catch (error) {
    console.error('Ошибка при получении комбинированных характеристик персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление характеристик персонажа
router.put('/api/users/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = req.body;
    
    // Используем сервис для обновления характеристик персонажа
    const updatedStats = await CharacterStatsService.updateCharacterStats(userId, data);
    
    res.json(updatedStats);
  } catch (error) {
    console.error('Ошибка при обновлении характеристик персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});



// Распределение очков характеристик
router.post('/api/users/:userId/stats/allocate', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { attribute, amount } = req.body;
    
    if (!attribute || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Необходимо указать атрибут и положительное количество очков' });
    }
    
    const result = await CharacterStatsService.allocateStatPoints(userId, attribute, amount);
    res.json(result);
  } catch (error) {
    console.error('Ошибка при распределении очков характеристик:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Сброс характеристик персонажа
router.post('/api/users/:userId/stats/reset', async (req, res) => {
  try {
    const userId = req.params.userId;
    const stats = await CharacterStatsService.resetCharacterStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Ошибка при сбросе характеристик персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Расчет вторичных характеристик персонажа
router.post('/api/users/:userId/stats/calculate-secondary', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { stats, cultivation } = req.body;
    
    if (!stats || !cultivation) {
      return res.status(400).json({ error: 'Необходимо указать основные характеристики и данные о культивации' });
    }
    
    const secondaryStats = CharacterStatsService.calculateSecondaryStats(stats, cultivation);
    res.json(secondaryStats);
  } catch (error) {
    console.error('Ошибка при расчете вторичных характеристик персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;