/**
 * Маршруты API для работы с достижениями
 * Обрабатывает HTTP-запросы к API достижений
 */

const express = require('express');
const router = express.Router();
const achievementService = require('../../services/achievement-service');
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');

/**
 * @route GET /api/achievements
 * @desc Получить все достижения
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const achievements = await achievementService.getAllAchievements();
    res.json(achievements);
  } catch (error) {
    console.error('Ошибка при получении всех достижений:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении достижений' });
  }
});
 
/**
 * @route GET /api/achievements/:id
 * @desc Получить достижение по ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const achievement = await achievementService.getAchievementById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }
    res.json(achievement);
  } catch (error) {
    console.error(`Ошибка при получении достижения с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении достижения' });
  }
});

/**
 * @route GET /api/achievements/category/:category
 * @desc Получить достижения по категории
 * @access Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const achievements = await achievementService.getAchievementsByCategory(req.params.category);
    res.json(achievements);
  } catch (error) {
    console.error(`Ошибка при получении достижений категории ${req.params.category}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении достижений по категории' });
  }
});

/**
 * @route GET /api/achievements/user/:userId
 * @desc Получить прогресс достижений пользователя
 * @access Private
 */
router.get('/user/:userId', validateAuth, async (req, res) => {
  console.log("API запрос на GET /api/achievements/user/:userId");
  try {

    // Проверяем, что пользователь запрашивает свои достижения или это администратор
    if (parseInt(req.user.id) !== parseInt(req.params.userId) && req.user.role !== 'admin') {
      //console.log(`[API] req.user.id: ${req.user.id} => typeof req.user.id: ${typeof req.user.id} \n и  req.params.userId: ${req.params.userId} => typeof req.params.userId: ${typeof req.params.userId}`);
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const achievements = await achievementService.getUserAchievements(req.params.userId);
    //console.log('[API] : ',achievements);
    res.json(achievements);
  } catch (error) {
    console.error(`Ошибка при получении достижений пользователя ${req.params.userId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении достижений пользователя' });
  }
});

/**
 * @route POST /api/achievements/progress
 * @desc Обновить прогресс достижения
 * @access Private
 */
router.post('/progress', validateAuth, async (req, res) => {
  try {
    const { userId, achievementId, value } = req.body;
    
    // Проверяем, что пользователь запрашивает свои достижения или это администратор
    if (parseInt(req.user.id) !== parseInt(req.params.userId) && req.user.role !== 'admin') {
      //console.log(`[API] req.user.id: ${req.user.id} => typeof req.user.id: ${typeof req.user.id} \n и  req.params.userId: ${req.params.userId} => typeof req.params.userId: ${typeof req.params.userId}`);
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const progress = await achievementService.updateAchievementProgress(userId, achievementId, value);
    res.json(progress);
  } catch (error) {
    console.error('Ошибка при обновлении прогресса достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении прогресса достижения' });
  }
});

/**
 * @route POST /api/achievements/claim-reward
 * @desc Получить награду за достижение
 * @access Private
 */
router.post('/claim-reward', validateAuth, async (req, res) => {
  try {
    const { userId, achievementId } = req.body;
    
    // Проверяем, что пользователь запрашивает свои достижения или это администратор
    if (parseInt(req.user.id) !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const result = await achievementService.claimAchievementReward(userId, achievementId);
    
    // Формируем структурированный ответ с информацией о обновленных ресурсах
    res.json({
      success: true,
      message: 'Награда успешно выдана',
      achievement: {
        id: achievementId,
        isRewarded: true
      },
      // Включаем информацию о том, какие ресурсы обновились
      updates: result.updatedResources
    });
  } catch (error) {
    console.error('Ошибка при получении награды за достижение:', error);
    
    // Возвращаем более конкретную ошибку для клиента
    if (error.message === 'Достижение не выполнено' || error.message === 'Награда уже получена') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Ошибка сервера при получении награды за достижение' });
  }
});

/**
 * @route POST /api/achievements/check
 * @desc Проверить выполнение достижений
 * @access Private
 */
router.post('/check', validateAuth, async (req, res) => {
  try {
    const { userId, state } = req.body;
    
    // Проверяем, что пользователь запрашивает свои достижения или это администратор
    if (parseInt(req.user.id) !== parseInt(req.params.userId) && req.user.role !== 'admin') {
      //console.log(`[API] req.user.id: ${req.user.id} => typeof req.user.id: ${typeof req.user.id} \n и  req.params.userId: ${req.params.userId} => typeof req.params.userId: ${typeof req.params.userId}`);
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const newlyCompleted = await achievementService.checkAchievements(userId, state);
    res.json(newlyCompleted);
  } catch (error) {
    console.error('Ошибка при проверке достижений:', error);
    res.status(500).json({ message: 'Ошибка сервера при проверке достижений' });
  }
});

/**
 * @route POST /api/achievements
 * @desc Создать новое достижение
 * @access Admin
 */
router.post('/', validateAdmin, async (req, res) => {
  try {
    const achievement = await achievementService.createAchievement(req.body);
    res.status(201).json(achievement);
  } catch (error) {
    console.error('Ошибка при создании достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании достижения' });
  }
});

/**
 * @route PUT /api/achievements/:id
 * @desc Обновить достижение
 * @access Admin
 */
router.put('/:id', validateAdmin, async (req, res) => {
  try {
    const achievement = await achievementService.updateAchievement(req.params.id, req.body);
    if (!achievement) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }
    res.json(achievement);
  } catch (error) {
    console.error(`Ошибка при обновлении достижения ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении достижения' });
  }
});

/**
 * @route DELETE /api/achievements/:id
 * @desc Удалить достижение
 * @access Admin
 */
router.delete('/:id', validateAdmin, async (req, res) => {
  try {
    const result = await achievementService.deleteAchievement(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }
    res.json({ message: 'Достижение успешно удалено' });
  } catch (error) {
    console.error(`Ошибка при удалении достижения ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении достижения' });
  }
});

module.exports = router;