const express = require('express');
const router = express.Router();
const benefitsService = require('../../services/benefits-service');
const { validateAuth } = require('../middleware/auth-middleware');

// GET /api/benefits - Получить все бонусы пользователя
router.get('/', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const benefits = await benefitsService.collectAllBenefits(userId, true);
    res.json(benefits);
  } catch (error) {
    console.error('Ошибка при получении бонусов пользователя:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;