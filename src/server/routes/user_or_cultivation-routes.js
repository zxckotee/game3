const express = require('express');
const router = express.Router();
const CultivationService = require('../../services/cultivation-service');
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');

const { unifiedDatabase, initializeDatabaseConnection } = require('../../services/database-connection-manager');
let sequelize; const { Sequelize } = require('sequelize');

async function getSequelizeInstance() {
  if (!sequelize) {
    const { db } = await initializeDatabaseConnection();
    sequelize = db;
  } 
  return sequelize;
}

// API маршруты для работы с пользователями
router.get('/api/users/:id', async (req, res) => {
  try {
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Для доступа к модели пользователя без импорта
    const users = await sequelizeDb.query(
      'SELECT * FROM users WHERE id = :id',
      {
        replacements: { id: req.params.id },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение пользователя по имени пользователя
router.get('/api/users/by-username/:username', async (req, res) => {
  try {
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    const users = await sequelizeDb.query(
      'SELECT id, username, email, cultivation_level, experience FROM users WHERE username = :username',
      {
        replacements: { username: req.params.username },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Ошибка при получении пользователя по имени:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление прогресса пользователя
router.put('/api/users/:userId/progress', async (req, res) => {
  try {
    const { experience, cultivationLevel } = req.body;
    
    if (experience === undefined || cultivationLevel === undefined) {
      return res.status(400).json({ error: 'Необходимо указать опыт и уровень культивации' });
    }
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    await sequelizeDb.query(
      'UPDATE users SET experience = :experience, cultivation_level = :cultivationLevel, updated_at = NOW() WHERE id = :userId',
      {
        replacements: {
          userId: req.params.userId,
          experience,
          cultivationLevel
        },
        type: Sequelize.QueryTypes.UPDATE
      }
    );
    
    const updatedUsers = await sequelizeDb.query(
      'SELECT id, username, email, cultivation_level, experience FROM users WHERE id = :userId',
      {
        replacements: { userId: req.params.userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!updatedUsers || updatedUsers.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(updatedUsers[0]);
  } catch (error) {
    console.error('Ошибка при обновлении прогресса пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API-эндпоинты для работы с системой культивации
router.get('/api/cultivation/:userId', async (req, res) => {
  try {
    // Получаем ID пользователя из параметра запроса
    const userId = req.params.userId;
    
    // Используем сервис для получения данных о культивации
    const cultivationData = await CultivationService.getCultivationProgress(userId);
    
    // Возвращаем данные о культивации
    res.json(cultivationData);
  } catch (error) {
    console.error('Ошибка при получении данных культивации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление данных культивации
router.put('/api/cultivation/:userId', async (req, res) => {
  try { 
    const userId = req.params.userId;
    const data = req.body;
    
    // Используем сервис для обновления данных о культивации
    const updatedCultivationData = await CultivationService.updateCultivationProgress(userId, data);
    
    // Возвращаем обновленные данные
    res.json(updatedCultivationData);
  } catch (error) {
    console.error('Ошибка при обновлении данных культивации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание данных культивации (для новых персонажей)
router.post('/api/cultivation/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = req.body;
    
    // Проверяем, существуют ли уже данные культивации для пользователя
    try {
      const existingData = await CultivationService.getCultivationProgress(userId);
      
      if (existingData) {
        // Если данные уже существуют, используем маршрут PUT для обновления
        return res.status(400).json({
          error: 'Данные культивации уже существуют для этого пользователя',
          message: 'Используйте PUT запрос для обновления существующих данных'
        });
      }
    } catch (err) {
      // Если данных нет, продолжаем создание
    }
    
    // Используем сервис для создания данных о культивации
    const cultivationData = await CultivationService.updateCultivationProgress(userId, data);
    
    // Возвращаем созданные данные
    res.status(201).json(cultivationData);
  } catch (error) {
    console.error('Ошибка при создании данных культивации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API маршруты для работы с системой культивации - дополнительные эндпоинты
router.get('/api/cultivation/:userId/breakthrough-check', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Используем сервис для проверки возможности прорыва
    const checkResult = await CultivationService.checkBreakthroughPossibility(userId);
    
    // Возвращаем результат проверки
    res.json(checkResult);
  } catch (error) {
    console.error('Ошибка при проверке возможности прорыва:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Увеличение прогресса "бутылочного горлышка"
router.post('/api/cultivation/:userId/increase-bottleneck', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { amount } = req.body;
    
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ error: 'Необходимо указать положительное количество прогресса' });
    }
    
    // Используем сервис для увеличения прогресса "бутылочного горлышка"
    const result = await CultivationService.increaseBottleneckProgress(userId, amount);
    
    // Возвращаем результат
    res.json(result);
  } catch (error) {
    console.error('Ошибка при увеличении прогресса "бутылочного горлышка":', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение инсайта
router.post('/api/cultivation/:userId/gain-insight', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Используем сервис для получения инсайта
    const result = await CultivationService.gainInsight(userId);
    
    // Возвращаем результат
    res.json(result);
  } catch (error) {
    console.error('Ошибка при получении инсайта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Завершение трибуляции
router.post('/api/cultivation/:userId/complete-tribulation', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { success, score } = req.body;
    
    if (success === undefined) {
      return res.status(400).json({ error: 'Необходимо указать результат трибуляции (success)' });
    }
    
    // Создаем объект с результатом трибуляции
    const tribulationResult = {
      success,
      score: score || 0
    };
    
    // Используем сервис для завершения трибуляции
    const result = await CultivationService.completeTribulation(userId, tribulationResult);
    
    // Возвращаем результат
    res.json(result);
  } catch (error) {
    console.error('Ошибка при завершении трибуляции:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Выполнение прорыва на следующий уровень культивации
router.post('/api/cultivation/:userId/breakthrough', async (req, res) => {
  console.log(`[API] Попытка вызвать прорыв для userId: ${req.params.userId}`);
  try {
    // Получаем ID пользователя из параметра запроса
    const userId = req.params.userId;
    
    // Используем сервис для выполнения прорыва
    const result = await CultivationService.performBreakthrough(userId);
    
    // Возвращаем результат прорыва
    res.json(result);
  } catch (error) {
    console.error('Ошибка при выполнении прорыва:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;