/**
 * Маршруты API для работы с врагами
 * Обрабатывает HTTP-запросы к API врагов
 */

const express = require('express');
const router = express.Router();
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const { calculateETag } = require('../utils/etag-utils');
const EnemyService = require('../../services/enemy-service');

// ==============================
// МАРШРУТЫ API ДЛЯ ВРАГОВ
// ==============================
 

/**
 * @route GET /api/enemies
 * @desc Получить всех врагов
 * @access Public
 */
router.get('/api/enemies', async (req, res) => {
  try {
    console.log('запрос в enemies');
    
    // Используем сервис для получения всех врагов
    const enemies = await EnemyService.getAllEnemies();
    
    console.log('ПОЛУЧЕНИЕ ЗАПРОСА НА [API] enemies');
    
    // Если массив пуст, вернем хотя бы тренировочный манекен
    if (enemies.length === 0) {
      const defaultEnemies = [{
        id: 'training_dummy',
        name: 'Тренировочный манекен',
        icon: '🎯',
        description: 'Простой деревянный манекен для тренировки базовых приёмов.',
        level: 1,
        category: 'construct',
        experience: 10,
        stats: {
          health: 50,
          energy: 0,
          physicalDefense: 5,
          spiritualDefense: 0,
          accuracy: 50,
          evasion: 0
        }
      }];
      
      return res.json(defaultEnemies);
    }
    
    res.json(enemies);
  } catch (error) {
    console.error('Ошибка при получении всех врагов:', error);
    
    // В случае ошибки возвращаем хотя бы тренировочный манекен
    const defaultEnemies = [{
      id: 'training_dummy',
      name: 'Тренировочный манекен',
      icon: '🎯',
      description: 'Простой деревянный манекен для тренировки базовых приёмов.',
      level: 1,
      category: 'construct',
      experience: 10,
      stats: {
        health: 50,
        energy: 0,
        physicalDefense: 5,
        spiritualDefense: 0,
        accuracy: 50,
        evasion: 0
      }
    }];
    
    res.json(defaultEnemies);
  }
});

/**
 * @route GET /api/enemies/:id
 * @desc Получить врага по ID
 * @access Public
 */

router.get('/api/enemies/:id', async (req, res) => {
  try {
    const enemyId = req.params.id;
    
    // Используем сервис для получения врага по ID
    const enemy = await EnemyService.getEnemyById(enemyId);
    
    if (!enemy) {
      return res.status(404).json({ message: 'Враг не найден' });
    }
    
    res.json(enemy);
  } catch (error) {
    console.error(`Ошибка при получении врага с ID ${req.params.id}:`, error);
    
    // В случае ошибки возвращаем базовые данные для training_dummy
    if (req.params.id === 'training_dummy') {
      const defaultEnemy = {
        id: 'training_dummy',
        name: 'Тренировочный манекен',
        icon: '🎯',
        description: 'Простой деревянный манекен для тренировки базовых приёмов.',
        level: 1,
        category: 'construct',
        experience: 10,
        stats: {
          health: 50,
          energy: 0,
          physicalDefense: 5,
          spiritualDefense: 0,
          accuracy: 50,
          evasion: 0
        },
        attacks: [{
          id: 1,
          name: 'Контратака',
          damage: 5,
          type: 'physical',
          chance: 30,
          energy_cost: 0,
          effects: []
        }],
        loot: [{
          itemId: 'wood_splinter',
          name: 'Щепка',
          chance: 50,
          icon: '🪵'
        }],
        currency: {
          minAmount: 1,
          maxAmount: 3
        }
      };
      
      return res.json(defaultEnemy);
    }
    
    res.status(500).json({ message: 'Ошибка сервера при получении врага' });
  }
});


/**
 * @route GET /api/enemies/category/:category
 * @desc Получить врагов по категории
 * @access Public
 */
router.get('/api/enemies/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    
    // Используем сервис для получения врагов по категории
    const enemies = await EnemyService.getEnemiesByCategory(category);
    
    res.json(enemies);
  } catch (error) {
    console.error(`Ошибка при получении врагов категории ${req.params.category}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении врагов по категории' });
  }
});


/**
 * @route GET /api/enemies/location/:locationId
 * @desc Получить врагов для указанной локации
 * @access Public
 */
router.get('/api/enemies/location/:locationId', async (req, res) => {
  try {
    const locationId = req.params.locationId;
    
    // Используем сервис для получения врагов по локации
    const enemies = await EnemyService.getEnemiesByLocation(locationId);
    
    res.json(enemies);
  } catch (error) {
    console.error(`Ошибка при получении врагов для локации ${req.params.locationId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении врагов по локации' });
  }
});

/**
 * @route GET /api/enemies/modifiers/time
 * @desc Получить модификаторы времени суток для врагов
 * @access Public
 */
router.get('/api/enemies/modifiers/time', async (req, res) => {
  try {
    // Используем сервис для получения модификаторов времени суток
    const modifiers = await EnemyService.getTimeOfDaySpawnModifiers();
    
    res.json(modifiers);
  } catch (error) {
    console.error('Ошибка при получении модификаторов времени суток:', error);
    
    // В случае ошибки сервис уже возвращает значения по умолчанию
    const modifiers = await EnemyService.getTimeOfDaySpawnModifiers();
    console.warn('Возвращаем модификаторы времени суток по умолчанию');
    res.json(modifiers);
  }
});

/**
 * @route GET /api/enemies/modifiers/weather
 * @desc Получить модификаторы погоды для врагов
 * @access Public
 */
router.get('/api/enemies/modifiers/weather', async (req, res) => {
  try {
    // Используем сервис для получения модификаторов погоды
    const modifiers = await EnemyService.getWeatherSpawnModifiers();
    
    res.json(modifiers);
  } catch (error) {
    console.error('Ошибка при получении модификаторов погоды:', error);
    
    // В случае ошибки сервис уже возвращает значения по умолчанию
    const modifiers = await EnemyService.getWeatherSpawnModifiers();
    console.warn('Возвращаем модификаторы погоды по умолчанию');
    res.json(modifiers); // Не отправляем статус ошибки, чтобы клиент мог продолжать работу
  }
});

/**
 * @route POST /api/enemies
 * @desc Добавить нового врага
 * @access Admin
 */
router.post('/api/enemies', validateAdmin, async (req, res) => {
  try {
    const enemyData = req.body;
    
    // Проверка обязательных полей
    if (!enemyData.id || !enemyData.name || !enemyData.category) {
      return res.status(400).json({
        message: 'Необходимо указать идентификатор (id), имя (name) и категорию (category) врага'
      });
    }
    
    try {
      // Используем сервис для создания нового врага
      const createdEnemy = await EnemyService.addNewEnemy(enemyData);
      
      res.status(201).json(createdEnemy);
    } catch (error) {
      // Проверяем тип ошибки
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Враг с таким ID уже существует' });
      }
      
      throw error; // Пробрасываем другие ошибки для обработки в основном блоке try-catch
    }
  } catch (error) {
    console.error('Ошибка при добавлении нового врага:', error);
    res.status(500).json({ message: 'Ошибка сервера при добавлении врага' });
  }
});

/**
 * @route PUT /api/enemies/:id
 * @desc Обновить существующего врага
 * @access Admin
 */
router.put('/api/enemies/:id', validateAdmin, async (req, res) => {
  try {
    const enemyId = req.params.id;
    const enemyData = req.body;
    
    // Используем сервис для обновления врага
    const updatedEnemy = await EnemyService.updateEnemy(enemyId, enemyData);
    
    // Проверяем результат
    if (!updatedEnemy) {
      return res.status(404).json({ message: 'Враг не найден' });
    }
    
    res.json(updatedEnemy);
  } catch (error) {
    console.error(`Ошибка при обновлении врага с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении врага' });
  }
});

/**
 * @route DELETE /api/enemies/:id
 * @desc Удалить врага
 * @access Admin
 */
router.delete('/api/enemies/:id', validateAdmin, async (req, res) => {
  try {
    const enemyId = req.params.id;
    
    // Получаем экземпляр sequelize
    const sequelizeDb = await getSequelizeInstance();
    
    // Начинаем транзакцию
    await sequelizeDb.query('BEGIN');
    
    try {
      // Проверяем, существует ли враг
      const existingEnemy = await sequelizeDb.query(
        `SELECT id FROM enemies WHERE id = :enemyId LIMIT 1`,
        {
          replacements: { enemyId },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      if (existingEnemy.length === 0) {
        await sequelizeDb.query('ROLLBACK');
        return res.status(404).json({ message: 'Враг не найден' });
      }
      
      // Удаляем связанные данные
      await sequelizeDb.query(
        `DELETE FROM enemy_stats WHERE enemy_id = :enemyId`,
        {
          replacements: { enemyId },
          type: Sequelize.QueryTypes.DELETE
        }
      );
      
      await sequelizeDb.query(
        `DELETE FROM enemy_attacks WHERE enemy_id = :enemyId`,
        {
          replacements: { enemyId },
          type: Sequelize.QueryTypes.DELETE
        }
      );
      
      await sequelizeDb.query(
        `DELETE FROM enemy_loot WHERE enemy_id = :enemyId`,
        {
          replacements: { enemyId },
          type: Sequelize.QueryTypes.DELETE
        }
      );
      
      await sequelizeDb.query(
        `DELETE FROM enemy_currency WHERE enemy_id = :enemyId`,
        {
          replacements: { enemyId },
          type: Sequelize.QueryTypes.DELETE
        }
      );
      
      await sequelizeDb.query(
        `DELETE FROM enemy_spawns WHERE enemy_id = :enemyId`,
        {
          replacements: { enemyId },
          type: Sequelize.QueryTypes.DELETE
        }
      );
      
      // Удаляем самого врага
      await sequelizeDb.query(
        `DELETE FROM enemies WHERE id = :enemyId`,
        {
          replacements: { enemyId },
          type: Sequelize.QueryTypes.DELETE
        }
      );
      
      // Фиксируем транзакцию
      await sequelizeDb.query('COMMIT');
      
      res.json({ message: 'Враг успешно удален' });
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await sequelizeDb.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error(`Ошибка при удалении врага с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении врага' });
  }
});

module.exports = router;