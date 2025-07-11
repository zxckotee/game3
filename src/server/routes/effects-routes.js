const express = require('express');
const router = express.Router();
const EffectsService = require('../../services/effects-service');
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');


// API-эндпоинты для работы с эффектами

// Получение всех эффектов пользователя
router.get('/api/effects/:userId', validateAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const effects = await EffectsService.getAllEffects(userId);
    res.json(effects);
  } catch (error) {
    console.error('Ошибка при получении эффектов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Добавление нового эффекта
router.post('/api/effects/:userId', validateAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const effectData = req.body;
    const newEffect = await EffectsService.addEffect(userId, effectData);
    res.status(201).json(newEffect);
  } catch (error) {
    console.error('Ошибка при добавлении эффекта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление эффекта
router.delete('/api/effects/:userId/:effectId', validateAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const effectId = req.params.effectId;
    const success = await EffectsService.removeEffect(userId, effectId);
    
    if (!success) {
      return res.status(404).json({ error: 'Эффект не найден' });
    }
    
    res.json({ success: true, id: effectId });
  } catch (error) {
    console.error('Ошибка при удалении эффекта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление эффектов погоды
router.post('/api/effects/:userId/update-weather', validateAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const weatherData = req.body;
    
    // Проверка обязательных полей
    if (!weatherData.weather || !weatherData.dayPeriod) {
      return res.status(400).json({ error: 'Необходимо указать погоду и время суток' });
    }
    
    const effects = await EffectsService.updateWeatherEffects(userId, weatherData);
    res.json(effects);
  } catch (error) {
    console.error('Ошибка при обновлении эффектов погоды:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение активных эффектов для UI
router.get('/api/active-effects/:userId', validateAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const activeEffects = await EffectsService.getActivePlayerEffects(userId);
    res.json(activeEffects);
  } catch (error) {
    console.error('Ошибка при получении активных эффектов игрока:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;