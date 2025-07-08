const express = require('express');
const router = express.Router();
const BenefitsService = require('../../services/benefits-service');
const { validateAuth } = require('../middleware/auth-middleware');

// Получение всех бонусов пользователя
router.get('/api/users/:userId/benefits', validateAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const benefits = await BenefitsService.getUserBenefits(userId);
    res.json(benefits);
  } catch (error) {
    console.error('Ошибка при получении бонусов пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Сбор и применение всех бонусов пользователя
router.post('/api/users/:userId/benefits/collect', validateAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { secondaryStats, statusEffects } = req.body;
    
    // Собираем все бонусы и сохраняем их в БД
    const benefits = await BenefitsService.collectAllBenefits(userId, true);
    
    // Применяем бонусы к характеристикам персонажа
    let updatedStats = { ...secondaryStats };
    
    // Применяем каждый бонус к характеристикам
    for (const benefit of benefits) {
      // Преобразуем benefit в формат, понятный методу applyBenefitToCharacter
      const benefitObj = {
        type: benefit.type,
        modifier: benefit.modifier,
        modifier_type: benefit.modifier_type
      };
      
      updatedStats = await BenefitsService.applyBenefitToCharacter(updatedStats, benefitObj);
    }
    
    // Возвращаем обновленные характеристики и список бонусов
    res.json({
      benefits,
      updatedStats,
      statusEffects
    });
  } catch (error) {
    console.error('Ошибка при сборе и применении бонусов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Добавление бонуса пользователю
router.post('/api/users/:userId/benefits', validateAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const benefitData = req.body;
    
    const benefit = await BenefitsService.addUserBenefit(userId, benefitData);
    res.json(benefit);
  } catch (error) {
    console.error('Ошибка при добавлении бонуса пользователю:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление бонуса пользователя
router.delete('/api/users/:userId/benefits/:benefitId', validateAuth, async (req, res) => {
  try {
    const benefitId = req.params.benefitId;
    
    const result = await BenefitsService.removeUserBenefit(benefitId);
    if (result) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Бонус не найден' });
    }
  } catch (error) {
    console.error('Ошибка при удалении бонуса пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;