const express = require('express');
const router = express.Router();
const QuestService = require('../../services/quest-service');
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');

// Новый маршрут для получения конфигурации квестов
router.get('/api/quests/config', async (req, res) => {
  try {
    // В будущем эти данные можно будет загружать из БД
    const config = {
      categories: [
        { id: 'все', name: 'все' },
        { id: 'main', name: 'основной сюжет' },
        { id: 'side', name: 'побочные' },
        { id: 'daily', name: 'ежедневные' }
      ],
      types: {
        MAIN: 'main',
        SIDE: 'side',
        DAILY: 'daily'
      },
      difficulty: {
        EASY: 'Легко',
        MEDIUM: 'Средне',
        HARD: 'Сложно'
      }
    };

    res.json(config);
  } catch (error) {
    console.error('Ошибка при получении конфигурации квестов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

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
    if (error.message.includes('Задание уже принято или выполнено')) {
      return res.status(200).json({ success: false, message: error.message });
    }
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

// Новый эндпоинт для проверки событий квестов
router.post('/api/users/:userId/quests/check-event', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { eventType, eventData } = req.body;
    
    if (!eventType || !eventData) {
      return res.status(400).json({ error: 'Необходимо указать eventType и eventData' });
    }
    
    // Проверяем событие квеста через сервис
    const result = await QuestService.checkQuestEvent(userId, eventType, eventData);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Ошибка при проверке события квеста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
// Новые маршруты для работы с прогрессом целей квестов

// Добавление прогресса к цели квеста
router.post('/api/users/:userId/quest-objectives/:objectiveId/progress', async (req, res) => {
  try {
    const { userId, objectiveId } = req.params;
    const { amount, metadata } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Некорректное количество прогресса' });
    }

    const result = await QuestService.addObjectiveProgress(
      parseInt(userId), 
      parseInt(objectiveId), 
      amount, 
      metadata || {}
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка при добавлении прогресса цели:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение прогресса конкретной цели квеста
router.get('/api/users/:userId/quest-objectives/:objectiveId/progress', async (req, res) => {
  try {
    const { userId, objectiveId } = req.params;

    const progress = await QuestService.getObjectiveProgress(
      parseInt(userId), 
      parseInt(objectiveId)
    );

    if (!progress) {
      return res.status(404).json({ error: 'Прогресс цели не найден' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Ошибка при получении прогресса цели:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение прогресса всех целей квеста
router.get('/api/users/:userId/quests/:questId/objectives-progress', async (req, res) => {
  try {
    const { userId, questId } = req.params;

    const progress = await QuestService.getQuestObjectivesProgress(
      parseInt(userId), 
      parseInt(questId)
    );

    res.json(progress);
  } catch (error) {
    console.error('Ошибка при получении прогресса целей квеста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Проверка событий квеста для автоматического обновления прогресса
router.post('/api/users/:userId/quest-events', async (req, res) => {
  try {
    const { userId } = req.params;
    const { eventType, payload } = req.body;

    if (!eventType || !payload) {
      return res.status(400).json({ error: 'Некорректные данные события' });
    }

    const result = await QuestService.checkQuestEvent(
      parseInt(userId), 
      eventType, 
      payload
    );

    res.json(result);
  } catch (error) {
    console.error('Ошибка при проверке событий квеста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});
