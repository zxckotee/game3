/**
 * Маршруты API для работы с ресурсами
 * Обрабатывает HTTP-запросы к API ресурсов
 */

const express = require('express');
const router = express.Router();
const resourceService = require('../../services/resource-service');
const { validateAdmin } = require('../middleware/auth-middleware');

/**
 * @route GET /api/resources
 * @desc Получить все ресурсы
 * @access Public
 */ 
router.get('/', async (req, res) => {
  try {
    const resources = await resourceService.getAllResources();
    res.json(resources);
  } catch (error) {
    console.error('Ошибка при получении ресурсов:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении ресурсов' });
  }
});

/**
 * @route GET /api/resources/:id
 * @desc Получить ресурс по ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Ресурс не найден' });
    }
    res.json(resource);
  } catch (error) {
    console.error(`Ошибка при получении ресурса с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении ресурса' });
  }
});

/**
 * @route GET /api/resources/type/:type
 * @desc Получить ресурсы по типу
 * @access Public
 */
router.get('/type/:type', async (req, res) => {
  try {
    const resources = await resourceService.getResourcesByType(req.params.type);
    res.json(resources);
  } catch (error) {
    console.error(`Ошибка при получении ресурсов типа ${req.params.type}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении ресурсов по типу' });
  }
});

/**
 * @route GET /api/resources/rarity/:rarity
 * @desc Получить ресурсы по редкости
 * @access Public
 */
router.get('/rarity/:rarity', async (req, res) => {
  try {
    const resources = await resourceService.getResourcesByRarity(req.params.rarity);
    res.json(resources);
  } catch (error) {
    console.error(`Ошибка при получении ресурсов редкости ${req.params.rarity}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении ресурсов по редкости' });
  }
});

/**
 * @route POST /api/resources
 * @desc Добавить новый ресурс
 * @access Admin
 */
router.post('/', validateAdmin, async (req, res) => {
  try {
    const resource = await resourceService.addNewResource(req.body);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Ошибка при добавлении ресурса:', error);
    if (error.message.includes('уже существует')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера при добавлении ресурса' });
  }
});

/**
 * @route PUT /api/resources/:id
 * @desc Обновить существующий ресурс
 * @access Admin
 */
router.put('/:id', validateAdmin, async (req, res) => {
  try {
    const resource = await resourceService.updateResource(req.params.id, req.body);
    if (!resource) {
      return res.status(404).json({ message: 'Ресурс не найден' });
    }
    res.json(resource);
  } catch (error) {
    console.error(`Ошибка при обновлении ресурса с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении ресурса' });
  }
});

/**
 * @route DELETE /api/resources/:id
 * @desc Удалить ресурс
 * @access Admin
 */
router.delete('/:id', validateAdmin, async (req, res) => {
  try {
    const result = await resourceService.deleteResource(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Ресурс не найден' });
    }
    res.json({ message: 'Ресурс успешно удален' });
  } catch (error) {
    console.error(`Ошибка при удалении ресурса с ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении ресурса' });
  }
});

/**
 * @route POST /api/resources/initialize
 * @desc Инициализировать ресурсы по умолчанию
 * @access Admin
 */
router.post('/initialize', validateAdmin, async (req, res) => {
  try {
    const resources = await resourceService.initializeDefaultResources();
    res.json({ 
      message: `Успешно инициализировано ${resources.length} ресурсов по умолчанию`,
      resources
    });
  } catch (error) {
    console.error('Ошибка при инициализации ресурсов по умолчанию:', error);
    res.status(500).json({ message: 'Ошибка сервера при инициализации ресурсов' });
  }
});

/**
 * @route GET /api/resources/breakthrough
 * @desc Получить требуемые ресурсы для прорыва культивации
 * @access Public
 */
router.get('/breakthrough', async (req, res) => {
  try {
    const { stage, level } = req.query;
    
    if (!stage || !level) {
      return res.status(400).json({ message: 'Отсутствуют обязательные параметры: stage, level' });
    }
    
    const resources = await resourceService.getBreakthroughResources(stage, parseInt(level, 10));
    
    res.json(resources);
  } catch (error) {
    console.error('Ошибка при получении ресурсов для прорыва:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении ресурсов для прорыва' });
  }
});

module.exports = router;