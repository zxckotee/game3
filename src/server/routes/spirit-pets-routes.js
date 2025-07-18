// API-эндпоинты для работы с духовными питомцами

// Импорт необходимых зависимостей
const express = require('express');
const router = express.Router();
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const { calculateETag } = require('../utils/etag-utils');

const SpiritPetService = require('../../services/spirit-pet-service');

/**
 * API-маршруты для работы с духовными питомцами
 * Адаптированы для работы с новой двухуровневой архитектурой:
 * - Каталог типов питомцев (spirit_pets)
 * - Экземпляры питомцев у пользователей (user_spirit_pets)
 */

// Получение констант для питомцев
router.get('/api/spirit-pets/constants', (req, res) => {
  try {
    const constants = {
      PET_TYPES,
      PET_ELEMENTS,
      PET_RARITY,
      BOND_LEVELS
    };
    
    res.json(constants);
  } catch (error) {
    console.error('Ошибка при получении констант духовных питомцев:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение всех доступных кормов для питомцев
router.get('/api/spirit-pets/food', async (req, res) => {
  try {
    // Получаем userId из запроса, если он указан
    const userId = req.query.userId || req.user?.id;
    const foodItems = await SpiritPetService.getAllPetFood(userId);
    res.json(foodItems);
  } catch (error) {
    console.error('Ошибка при получении кормов для духовных питомцев:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение всех типов питомцев из каталога
router.get('/api/spirit-pets/types', async (req, res) => {
  try {
    const petTypes = await SpiritPetService.getAllPetTypes();
    res.json(petTypes);
  } catch (error) {
    console.error('Ошибка при получении типов духовных питомцев:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение конкретного типа духовного питомца по ID
router.get('/api/spirit-pets/types/:petTypeId', async (req, res) => {
  try {
    const petTypeId = req.params.petTypeId;
    const petType = await SpiritPetService.getPetTypeById(petTypeId);
    
    if (!petType) {
      return res.status(404).json({ error: 'Тип духовного питомца не найден' });
    }
    
    res.json(petType);
  } catch (error) {
    console.error(`Ошибка при получении типа духовного питомца с ID ${req.params.petTypeId}:`, error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение всех духовных питомцев пользователя
router.get('/api/users/:userId/spirit-pets', async (req, res) => {
  try {
    const userId = req.params.userId;
    const pets = await SpiritPetService.getPetsByUserId(userId);
    res.json(pets);
  } catch (error) {
    console.error('Ошибка при получении духовных питомцев пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение конкретного духовного питомца по ID
router.get('/api/spirit-pets/:petId', async (req, res) => {
  try {
    const petId = req.params.petId;
    
    // Проверка, что petId является числом
    if (!/^\d+$/.test(petId)) {
      return res.status(400).json({ error: 'ID питомца должен быть числом' });
    }
    
    const pet = await SpiritPetService.getPetById(petId);
    
    if (!pet) {
      return res.status(404).json({ error: 'Духовный питомец не найден' });
    }
    
    res.json(pet);
  } catch (error) {
    console.error(`Ошибка при получении духовного питомца с ID ${req.params.petId}:`, error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение активного питомца пользователя
router.get('/api/users/:userId/spirit-pets/active', async (req, res) => {
  try {
    const userId = req.params.userId;
    const pet = await SpiritPetService.getActivePet(userId);
    
    if (!pet) {
      return res.status(404).json({ error: 'Активный духовный питомец не найден' });
    }
    
    res.json(pet);
  } catch (error) {
    console.error(`Ошибка при получении активного духовного питомца пользователя ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение боевых бонусов от активного питомца
router.get('/api/users/:userId/spirit-pets/combat-bonus', async (req, res) => {
  try {
    const userId = req.params.userId;
    const bonuses = await SpiritPetService.getActivePetCombatBonus(userId);
    res.json(bonuses);
  } catch (error) {
    console.error('Ошибка при получении боевых бонусов питомца:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение способностей активного питомца
router.get('/api/users/:userId/spirit-pets/abilities', async (req, res) => {
  try {
    const userId = req.params.userId;
    const abilities = await SpiritPetService.getActivePetAbilities(userId);
    res.json(abilities);
  } catch (error) {
    console.error('Ошибка при получении способностей питомца:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обратно-совместимый маршрут для получения питомца (включает userId, но не использует его)
router.get('/api/users/:userId/spirit-pets/:petId', async (req, res) => {
  try {
    const petId = req.params.petId;

    // Проверка, что petId является числом
    if (!/^\d+$/.test(petId)) {
      return res.status(400).json({ error: 'ID питомца должен быть числом' });
    }
    
    const pet = await SpiritPetService.getPetById(petId);
    
    if (!pet) {
      return res.status(404).json({ error: 'Духовный питомец не найден' });
    }
    
    res.json(pet);
  } catch (error) {
    console.error(`Ошибка при получении духовного питомца с ID ${req.params.petId}:`, error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание нового питомца для пользователя
router.post('/api/users/:userId/spirit-pets', async (req, res) => {
  try {
    const userId = req.params.userId;
    const petData = req.body;
    
    // Добавляем userId к данным питомца
    petData.userId = userId;
    
    const pet = await SpiritPetService.createPet(petData);
    res.status(201).json(pet);
  } catch (error) {
    console.error('Ошибка при создании духовного питомца:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Активация питомца (сделать питомца активным)
router.post('/api/users/:userId/spirit-pets/:petId/activate', async (req, res) => {
  try {
    const userId = req.params.userId;
    const petId = req.params.petId;
    
    // Проверка, что petId является числом
    if (!/^\d+$/.test(petId)) {
      return res.status(400).json({ error: 'ID питомца должен быть числом' });
    }
    
    const result = await SpiritPetService.activatePet(userId, petId);
    res.json(result);
  } catch (error) {
    console.error('Ошибка при активации духовного питомца:', error);
    
    if (error.message && error.message.includes('не найден')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Переименование духовного питомца
router.put('/api/users/:userId/spirit-pets/:petId/rename', async (req, res) => {
  try {
    const petId = req.params.petId;
    const { newName } = req.body;
    
    // Проверка, что petId является числом
    if (!/^\d+$/.test(petId)) {
      return res.status(400).json({ error: 'ID питомца должен быть числом' });
    }
    
    if (!newName) {
      return res.status(400).json({ error: 'Необходимо указать новое имя питомца' });
    }
    
    // Обновляем имя питомца
    const result = await SpiritPetService.updatePet(petId, { customName: newName });
    res.json(result);
  } catch (error) {
    console.error('Ошибка при переименовании духовного питомца:', error);
    
    if (error.message && error.message.includes('не найден')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Тренировка духовного питомца
router.post('/api/users/:userId/spirit-pets/:petId/train', async (req, res) => {
  try {
    const petId = req.params.petId;
    const { attribute } = req.body;
    
    // Проверка, что petId является числом
    if (!/^\d+$/.test(petId)) {
      return res.status(400).json({ error: 'ID питомца должен быть числом' });
    }
    
    if (!attribute) {
      return res.status(400).json({ error: 'Необходимо указать атрибут для тренировки' });
    }
    
    const result = await SpiritPetService.trainPet(petId, attribute);
    res.json(result);
  } catch (error) {
    console.error('Ошибка при тренировке духовного питомца:', error);
    
    if (error.message && error.message.includes('не найден')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message && error.message.includes('Неизвестная характеристика')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message && error.message.includes('голоден')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Кормление духовного питомца
router.post('/api/users/:userId/spirit-pets/:petId/feed', async (req, res) => {
  try {
    const petId = req.params.petId;
    const userId = req.params.userId;
    const { foodItemId } = req.body;
    
    // Проверка, что petId является числом
    if (!/^\d+$/.test(petId)) {
      return res.status(400).json({ error: 'ID питомца должен быть числом' });
    }
    
    if (!foodItemId) {
      return res.status(400).json({ error: 'Необходимо указать ID предмета для кормления' });
    }
    
    const result = await SpiritPetService.feedPet(petId, foodItemId, userId);
    res.json(result);
  } catch (error) {
    console.error('Ошибка при кормлении духовного питомца:', error);
    
    if (error.message && error.message.includes('не найден')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Ранее перемещены в начало для предотвращения конфликтов с маршрутом :petId

// Использование способности питомца в бою
router.post('/api/users/:userId/spirit-pets/use-ability', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { abilityId } = req.body;
    
    if (!abilityId) {
      return res.status(400).json({ error: 'Необходимо указать ID способности' });
    }
    
    const result = await SpiritPetService.usePetAbility(userId, abilityId);
    res.json(result);
  } catch (error) {
    console.error('Ошибка при использовании способности питомца:', error);
    
    if (error.message && error.message.includes('нет активного питомца')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message && error.message.includes('способность') && error.message.includes('не найдена')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Приручение нового питомца в локации
router.post('/api/users/:userId/spirit-pets/tame', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'Необходимо указать локацию для приручения' });
    }
    
    const pet = await SpiritPetService.tamePetInLocation(userId, location);
    res.status(201).json(pet);
  } catch (error) {
    console.error('Ошибка при приручении питомца:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление состояния всех питомцев пользователя
router.post('/api/users/:userId/spirit-pets/update-state', async (req, res) => {
  try {
    const userId = req.params.userId;
    const pets = await SpiritPetService.updatePetsState(userId);
    res.json(pets);
  } catch (error) {
    console.error('Ошибка при обновлении состояния питомцев:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Константы для совместимости
const PET_TYPES = {
  FIRE: 'fire_fox',
  WATER: 'water_dragon',
  EARTH: 'earth_turtle',
  LIGHTNING: 'lightning_bird',
  DARKNESS: 'shadow_wolf'
};

const PET_ELEMENTS = {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  LIGHTNING: 'lightning',
  DARKNESS: 'darkness',
  AIR: 'air'
};

const PET_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

const BOND_LEVELS = {
  STRANGER: { min: 0, max: 20, name: 'Незнакомец' },
  ACQUAINTANCE: { min: 21, max: 40, name: 'Знакомый' },
  FRIEND: { min: 41, max: 60, name: 'Друг' },
  COMPANION: { min: 61, max: 80, name: 'Компаньон' },
  SOULMATE: { min: 81, max: 100, name: 'Родственная душа' }
};

module.exports = router;