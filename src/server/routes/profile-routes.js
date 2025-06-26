const express = require('express');
const router = express.Router();
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const CharacterProfileService = require('../../services/character-profile-service');

// API маршруты для работы с профилем персонажа
router.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Используем сервис для получения профиля персонажа
    const profile = await CharacterProfileService.getCharacterProfile(userId);
    
    if (!profile) {
      console.log(`Профиль персонажа для пользователя ${userId} не найден`);
      return res.status(404).json({ error: 'Профиль персонажа не найден' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Ошибка при получении профиля персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление профиля персонажа
router.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = req.body;
    
    console.log(`Обновление профиля персонажа для пользователя ${userId}`);
    
    // Используем сервис для обновления профиля персонажа
    const updatedProfile = await CharacterProfileService.updateCharacterProfile(userId, data);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Ошибка при обновлении профиля персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;