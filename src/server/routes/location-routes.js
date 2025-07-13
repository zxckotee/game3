/**
 * Маршруты API для работы с локациями
 * Обрабатывает HTTP-запросы к API локаций
 */

const express = require('express');
const router = express.Router();
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const LocationService = require('../../services/location-service');

// ==============================
// МАРШРУТЫ API ДЛЯ ЛОКАЦИЙ
// ==============================

/**
 * @route GET /api/locations
 * @desc Получить все локации
 * @access Public
 */
router.get('/api/locations', async (req, res) => {
  try {
    console.log('Запрос на получение всех локаций');
    
    // Используем сервис для получения всех локаций
    const locations = await LocationService.getAllLocations();
    
    console.log('ПОЛУЧЕНИЕ ЗАПРОСА НА [API] locations');
    // Если массив пуст, вернем хотя бы стартовую локацию
    if (locations.length === 0) {
      const defaultLocations = [{
        id: 'starting_valley',
        name: 'Долина Начала',
        description: 'Мирная долина, где начинают свой путь молодые культиваторы.',
        type: 'forest',
        energyCost: 0,
        backgroundImage: '/assets/images/map/1.png',
        enemies: ['training_dummy', 'weak_spirit_beast'],
        coordinates: { x: 1, y: 1 },
        effects: [],
        requirements: null,
        spawns: []
      }];
      
      return res.json(defaultLocations);
    }
    console.log(locations);
    res.json(locations);
  } catch (error) {
    console.error('Ошибка при получении всех локаций:', error);
    
    // В случае ошибки возвращаем хотя бы стартовую локацию
    const defaultLocations = [{
      id: 'starting_valley',
      name: 'Долина Начала',
      description: 'Мирная долина, где начинают свой путь молодые культиваторы.',
      type: 'forest',
      energyCost: 0,
      backgroundImage: '/assets/images/map/1.png',
      enemies: ['training_dummy', 'weak_spirit_beast'],
      coordinates: { x: 1, y: 1 },
      effects: [],
      requirements: null,
      spawns: []
    }];
    
    res.json(defaultLocations);
  }
});

/**
 * @route GET /api/locations/:id
 * @desc Получить локацию по ID
 * @access Public
 */
router.get('/api/locations/:id', async (req, res) => {
  try {
    const locationId = req.params.id;
    
    // Используем сервис для получения локации по ID
    const location = await LocationService.getLocationById(locationId);
    
    if (!location) {
      return res.status(404).json({ message: 'Локация не найдена' });
    }
    
    res.json(location);
  } catch (error) {
    console.error(`Ошибка при получении локации с ID ${req.params.id}:`, error);
    
    // В случае ошибки возвращаем базовые данные для starting_valley
    if (req.params.id === 'starting_valley') {
      const defaultLocation = {
        id: 'starting_valley',
        name: 'Долина Начала',
        description: 'Мирная долина, где начинают свой путь молодые культиваторы.',
        type: 'forest',
        energyCost: 0,
        backgroundImage: '/assets/images/map/1.png',
        enemies: ['training_dummy', 'weak_spirit_beast'],
        coordinates: { x: 1, y: 1 },
        effects: [],
        requirements: null,
        spawns: []
      };
      
      return res.json(defaultLocation);
    }
    
    res.status(500).json({ message: 'Ошибка сервера при получении локации' });
  }
});

/**
 * @route GET /api/locations/:id/enemies
 * @desc Получить врагов локации
 * @access Public
 */
router.get('/api/locations/:id/enemies', async (req, res) => {
  try {
    const locationId = req.params.id;
    
    // Используем сервис для получения врагов локации
    const enemies = await LocationService.getLocationEnemies(locationId);
    
    res.json(enemies);
  } catch (error) {
    console.error(`Ошибка при получении врагов локации ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении врагов локации' });
  }
});

/**
 * @route POST /api/locations
 * @desc Добавить новую локацию
 * @access Admin
 */
router.post('/api/locations', validateAdmin, async (req, res) => {
  try {
    const locationData = req.body;
    
    // Проверка обязательных полей
    if (!locationData.id || !locationData.name || !locationData.type) {
      return res.status(400).json({
        message: 'Необходимо указать идентификатор (id), имя (name) и тип (type) локации'
      });
    }
    
    // TODO: Реализовать создание новой локации через сервис
    res.status(501).json({ message: 'Создание локаций пока не реализовано' });
  } catch (error) {
    console.error('Ошибка при добавлении новой локации:', error);
    res.status(500).json({ message: 'Ошибка сервера при добавлении локации' });
  }
});

/**
 * @route PUT /api/locations/:id
 * @desc Обновить существующую локацию
 * @access Admin
 */
router.put('/api/locations/:id', validateAdmin, async (req, res) => {
  try {
    const locationId = req.params.id;
    const locationData = req.body;
    
    // TODO: Реализовать обновление локации через сервис
    res.status(501).json({ message: 'Обновление локаций пока не реализовано' });
  } catch (error) {
    console.error(`Ошибка при обновлении локации с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении локации' });
  }
});

/**
 * @route DELETE /api/locations/:id
 * @desc Удалить локацию
 * @access Admin
 */
router.delete('/api/locations/:id', validateAdmin, async (req, res) => {
  try {
    const locationId = req.params.id;
    
    // TODO: Реализовать удаление локации через сервис
    res.status(501).json({ message: 'Удаление локаций пока не реализовано' });
  } catch (error) {
    console.error(`Ошибка при удалении локации с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении локации' });
  }
});

module.exports = router;