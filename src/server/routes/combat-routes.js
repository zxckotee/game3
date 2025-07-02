/**
 * Combat API Routes - маршруты API для PvE боев
 */
const express = require('express');
const router = express.Router();
const CombatService = require('../../services/combat-service');
const { validateAuth } = require('../middleware/auth-middleware');

/**
 * @route   POST /api/combat/start
 * @desc    Начать новый бой с NPC
 * @access  Private
 */
router.post('/start', validateAuth, async (req, res) => {
  try {
    const { enemyId } = req.body;
    const userId = req.user.id;

    if (!enemyId) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать ID врага (enemyId)'
      });
    }

    const result = await CombatService.startCombat(userId, enemyId);
    res.status(201).json(result);

  } catch (error) {
    console.error('Ошибка при начале боя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка на сервере при начале боя',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/combat/:combatId/action
 * @desc    Совершить действие в бою (атака, техника и т.д.)
 * @access  Private
 */
router.post('/:combatId/action', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { combatId } = req.params;
    const { action } = req.body; // e.g., { type: 'attack' }

    const result = await CombatService.performAction(combatId, userId, action);
    res.json(result);

  } catch (error) {
    console.error(`[CombatRoutes] Ошибка в бою ${req.params.combatId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Ошибка на сервере при совершении действия в бою',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/combat/:combatId/state
 * @desc    Получить актуальное состояние боя
 * @access  Private
 */
router.get('/:combatId/state', async (req, res) => {
  try {
    const { combatId } = req.params;

    const result = await CombatService.getCombatState(combatId);
    res.json(result);

  } catch (error) {
    console.error(`[CombatRoutes] Ошибка при получении состояния боя ${req.params.combatId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Ошибка на сервере при получении состояния боя',
      error: error.message
    });
  }
});

module.exports = router;