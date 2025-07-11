const express = require('express');
const router = express.Router();
const QuestService = require('../../services/quest-service');
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');

// API маршруты для работы с квестами
router.get('/api/quests', async (req, res) => {
  try {
    // Получаем все доступные квесты
    const quests = await QuestService.getAllQuests();
    
    res.json(quests);
  } catch (error) {
    console.error('Ошибка при получении квестов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/api/users/:userId/quests', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Получаем квесты пользователя через сервис
    const userQuests = await QuestService.getQuests(userId);
    
    console.log("[API] ==> Загружено квестов: ", 
      userQuests.active.length + userQuests.completed.length + userQuests.available.length);
    
    res.json(userQuests);
  } catch (error) {
    console.error('Ошибка при получении квестов пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/api/users/:userId/quests/:questId/accept', async (req, res) => {
  try {
    const userId = req.params.userId;
    const questId = req.params.questId;
    
    // Принимаем квест через сервис
    const quest = await QuestService.acceptQuest(userId, questId);
    
    res.json({ success: true, quest });
  } catch (error) {
    console.error('Ошибка при принятии квеста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление прогресса квеста
router.put('/api/users/:userId/quests/:questId/progress', async (req, res) => {
  try {
    const userId = req.params.userId;
    const questId = req.params.questId;
    const progress = req.body;
    
    if (!progress || typeof progress !== 'object') {
      return res.status(400).json({ error: 'Неверный формат данных о прогрессе' });
    }
    
    // Обновляем прогресс квеста через сервис
    const updatedQuest = await QuestService.updateQuestProgress(userId, questId, progress);
    
    // Проверяем, все ли цели выполнены для возможного автоматического завершения
    const allObjectives = updatedQuest.objectives || {};
    const allProgress = updatedQuest.progress || {};
    
    const allCompleted = Object.keys(allObjectives).length > 0 && 
                         Object.keys(allObjectives).every(objId => allProgress[objId] === true);
    
    // Если все цели выполнены и квест активен, автоматически завершаем его
    if (allCompleted && updatedQuest.status === 'active') {
      const completedQuest = await QuestService.completeQuest(userId, questId);
      
      return res.json({
        ...completedQuest,
        allCompleted: true
      });
    }
    
    res.json({
      ...updatedQuest,
      allCompleted
    });
  } catch (error) {
    console.error('Ошибка при обновлении прогресса квеста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.put('/api/users/:userId/quests/:questId/complete', async (req, res) => {
  try {
    const userId = req.params.userId;
    const questId = req.params.questId;
    
    // Завершаем квест через сервис
    const completedQuest = await QuestService.completeQuest(userId, questId);
    
    res.json({ success: true, quest: completedQuest });
  } catch (error) {
    console.error('Ошибка при завершении квеста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;