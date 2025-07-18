const express = require('express');
const router = express.Router(); const app = router;
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const { calculateETag } = require('../utils/etag-utils');

// Импортируем сервис техник
const TechniqueService = require('../../services/technique-service');
 
// API - Маршруты для техник


// API маршруты для работы с техниками
router.get('/api/users/:userId/techniques', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Используем метод сервиса для получения изученных техник
    const techniques = await TechniqueService.getLearnedTechniques(userId);
    
    console.log("[API] ==> Загружены мои техники: ", techniques.length);
    res.json(techniques);
  } catch (error) {
    console.error('Ошибка при получении техник:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение всех техник
router.get('/api/techniques', async (req, res) => {
  try {
    // Используем метод сервиса для получения всех техник
    const techniques = await TechniqueService.getAllTechniques();
    
    console.log("[API] ==> Загружены техники: ", techniques.length);
    res.json(techniques);
  } catch (error) {
    console.error('Ошибка при получении всех техник:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});



// Получение техники по ID
router.get('/api/techniques/:id', async (req, res) => {
  try {
    const techniqueId = req.params.id;
    
    // Используем метод сервиса для получения техники по ID
    const technique = await TechniqueService.getTechniqueById(techniqueId);
    
    if (!technique) {
      return res.status(404).json({ error: 'Техника не найдена' });
    }
    
    res.json(technique);
  } catch (error) {
    console.error('Ошибка при получении техники по ID:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение техники по названию
router.get('/api/techniques/by-name/:name', async (req, res) => {
  try {
    const techniqueName = req.params.name;
    
    // Используем метод сервиса для получения техники по названию
    const technique = await TechniqueService.getTechniqueByName(techniqueName);
    
    if (!technique) {
      return res.status(404).json({ error: 'Техника не найдена' });
    }
    
    res.json(technique);
  } catch (error) {
    console.error('Ошибка при получении техники по названию:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Изучение новой техники
router.post('/api/users/:userId/techniques/:techniqueId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const techniqueId = req.params.techniqueId;
    
    // Используем метод сервиса для изучения новой техники
    const result = await TechniqueService.learnTechnique(userId, techniqueId);
    
    // Если результат не определен, техника не найдена
    if (!result) {
      return res.status(404).json({ error: 'Техника не найдена' });
    }
    
    // Проверяем наличие ошибок
    if (result.error) {
      return res.status(400).json({
        error: result.message || 'Ошибка при изучении техники',
        required: result.required,
        available: result.available
      });
    }
    
    // Успешное изучение техники
    res.status(201).json(result);
  } catch (error) {
    console.error('Ошибка при изучении техники:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Повышение уровня техники
router.put('/api/users/:userId/techniques/:techniqueId/upgrade', async (req, res) => {
  try {
    const userId = req.params.userId;
    const techniqueId = req.params.techniqueId;
    
    // Используем метод сервиса для повышения уровня техники
    const result = await TechniqueService.upgradeTechnique(userId, techniqueId);
    
    // Если результат не определен, техника не найдена
    if (!result) {
      return res.status(404).json({ error: 'Техника не найдена' });
    }
    
    // Проверяем наличие ошибок
    if (result.error) {
      return res.status(400).json({
        error: result.message || 'Ошибка при повышении уровня техники',
        required: result.required,
        available: result.available
      });
    }
    
    // Успешное повышение уровня техники
    res.json(result);
  } catch (error) {
    console.error('Ошибка при повышении уровня техники:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Использование техники
router.post('/api/users/:userId/techniques/:techniqueId/use', async (req, res) => {
  try {
    const userId = req.params.userId;
    const techniqueId = req.params.techniqueId;
    
    // Используем метод сервиса для использования техники
    const result = await TechniqueService.useTechnique(userId, techniqueId);
    
    // Если результат не определен, техника не найдена
    if (!result) {
      return res.status(404).json({ error: 'Техника не найдена' });
    }
    
    // Проверяем, изучена ли техника
    if (result.error) {
      return res.status(404).json({ error: result.message || 'Ошибка при использовании техники' });
    }
    
    // Успешное использование техники
    res.json(result);
  } catch (error) {
    console.error('Ошибка при использовании техники:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
