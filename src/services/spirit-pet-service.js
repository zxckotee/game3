// Используем централизованную инициализацию моделей
const {
  SpiritPetCatalog,
  UserSpiritPet,
  SpiritPetFood,
  initializeSpiritPetModels
} = require('../models/init-spirit-pet-models');

// Убедимся, что модели инициализированы перед использованием
(async () => {
  try {
    await initializeSpiritPetModels();
    console.log('Модели духовных питомцев успешно инициализированы для сервиса');
  } catch (error) {
    console.error('Ошибка при инициализации моделей для сервиса духовных питомцев:', error);
  }
})();
const petDataStore = require('../data/pet-data-store');
const { 
  petTypes, 
  petTypeBaseStats, 
  petTypeAbilities, 
  evolutionStages, 
  petSpawnLocations,
  calculateExpForLevel,
  calculateStatBonus,
  calculateCombatBonus
} = require('../data/spirit-pets');
const config = require('../config/app-config');

/**
 * Обновленный сервис для работы с духовными питомцами
 * Поддерживает двухуровневую архитектуру: каталог типов питомцев и экземпляры питомцев у пользователей
 */
class SpiritPetService {
  /**
   * Получить все типы питомцев из каталога
   * @returns {Promise<Array>} - Массив типов питомцев
   */
  async getAllPetTypes() {
    try {
      // Если в браузере, используем демо-данные
      if (typeof window !== 'undefined') {
        return petDataStore.getAllPetTypes();
      }
      
      // Иначе используем базу данных
      return await SpiritPetCatalog.findAll();
    } catch (error) {
      console.error('Ошибка при получении типов питомцев:', error);
      return [];
    }
  }

  /**
   * Получить тип питомца по ID
   * @param {string} petTypeId - ID типа питомца
   * @returns {Promise<Object|null>} - Тип питомца
   */
  async getPetTypeById(petTypeId) {
    try {
      // Если в браузере, используем демо-данные
      if (typeof window !== 'undefined') {
        return petDataStore.getPetTypeById(petTypeId);
      }
      
      // Иначе используем базу данных
      return await SpiritPetCatalog.findByPk(petTypeId);
    } catch (error) {
      console.error('Ошибка при получении типа питомца:', error);
      return null;
    }
  }

  /**
   * Получить всех питомцев пользователя
   * @param {number|string} userId - ID пользователя
   * @returns {Promise<Array>} - Массив питомцев
   */
  async getPetsByUserId(userId) {
    try {
      // Если ID не задан, используем демо-пользователя
      const effectiveUserId = userId || 'demo_user';
      console.log(`Получение питомцев для пользователя: ${effectiveUserId}`);
      
      // Если в браузере, используем localStorage
      if (typeof window !== 'undefined') {
        return petDataStore.getPetsByUserId(effectiveUserId);
      }
      
      // Иначе используем базу данных с включением данных о типе питомца
      return await UserSpiritPet.findAll({
        where: { userId: effectiveUserId },
        order: [['createdAt', 'DESC']],
        include: [{
          model: SpiritPetCatalog,
          as: 'petType'
        }]
      });
    } catch (error) {
      console.error('Ошибка при получении питомцев:', error);
      return [];
    }
  }

  /**
   * Получить активного питомца пользователя
   * @param {number|string} userId - ID пользователя
   * @returns {Promise<Object|null>} - Активный питомец или null, если нет активного питомца
   */
  async getActivePet(userId) {
    try {
      console.log(`getActivePet вызван с userId: ${userId} (тип: ${typeof userId})`);
      
      // Если ID не задан, используем демо-пользователя
      const effectiveUserId = userId || 'demo_user';
      
      // Если в браузере, используем localStorage
      if (typeof window !== 'undefined') {
        return petDataStore.getActivePet(effectiveUserId);
      }
      
      // Проверка типа userId, если строка проверяем на числовой формат
      if (typeof effectiveUserId === 'string' && effectiveUserId !== 'demo_user' && !/^\d+$/.test(effectiveUserId)) {
        console.warn(`Получен некорректный формат userId: "${effectiveUserId}"`);
      }
      
      // Для Sequelize преобразуем userId в число, если это строковое представление числа
      let queryUserId = effectiveUserId;
      if (typeof effectiveUserId === 'string' && effectiveUserId !== 'demo_user' && /^\d+$/.test(effectiveUserId)) {
        queryUserId = Number(effectiveUserId);
      }
      
      // Иначе используем базу данных с включением данных о типе питомца
      return await UserSpiritPet.findOne({
        where: {
          userId: queryUserId,
          isActive: true
        },
        include: [{
          model: SpiritPetCatalog,
          as: 'petType'
        }]
      });
    } catch (error) {
      console.error('Ошибка при получении активного питомца:', error);
      return null;
    }
  }

  /**
   * Получить питомца пользователя по ID
   * @param {number} petId - ID питомца пользователя
   * @returns {Promise<Object|null>} - Питомец или null, если питомец не найден
   */
  async getPetById(petId) {
    try {
      console.log(`getPetById вызван с аргументом: ${petId} (тип: ${typeof petId})`);
      
      // Проверка типа параметра и обработка специальных значений
      if (petId === 'active') {
        console.warn('Попытка получить питомца по ID "active", это некорректный ID');
        return null;
      }
      
      if (petId === 'constants') {
        console.warn('Попытка получить питомца по ID "constants", это некорректный ID');
        return null;
      }
      
      if (petId === 'food') {
        console.warn('Попытка получить питомца по ID "food", это некорректный ID');
        return null;
      }
      
      // Проверка, что ID является числом
      if (typeof petId === 'string' && !/^\d+$/.test(petId)) {
        console.error(`Получен неверный ID питомца: "${petId}" (тип: ${typeof petId})`);
        return null;
      }
      
      // Если в браузере, используем localStorage
      if (typeof window !== 'undefined') {
        return petDataStore.getPetById(petId);
      }
      
      // Преобразуем petId в число для Sequelize
      const numericPetId = Number(petId);
      
      // Проверка на NaN после преобразования
      if (isNaN(numericPetId)) {
        console.error(`Не удалось преобразовать ID питомца в число: "${petId}"`);
        return null;
      }
      
      // Иначе используем базу данных с включением данных о типе питомца
      return await UserSpiritPet.findByPk(numericPetId, {
        include: [{
          model: SpiritPetCatalog,
          as: 'petType'
        }]
      });
    } catch (error) {
      console.error(`Ошибка при получении питомца с ID ${petId}:`, error);
      return null;
    }
  }

  /**
   * Создать нового питомца для пользователя
   * @param {Object} petData - Данные питомца
   * @returns {Promise<Object>} - Созданный питомец
   */
  async createPet(petData) {
    try {
      // Проверяем и устанавливаем userId, если не задан
      const effectiveUserId = petData.userId || 'demo_user';
      
      // Определяем тип питомца и его ID в каталоге
      let petTypeId;
      if (petData.petTypeId) {
        // Если передан ID типа питомца, используем его
        petTypeId = petData.petTypeId;
      } else if (petData.type) {
        // Иначе пытаемся найти тип питомца по элементу
        // Это для обратной совместимости
        const petTypeMap = {
          'fire': 'fire_fox',
          'water': 'water_dragon',
          'earth': 'earth_turtle',
          'lightning': 'lightning_bird',
          'darkness': 'shadow_wolf'
        };
        petTypeId = petTypeMap[petData.type] || 'fire_fox';
      } else {
        // По умолчанию используем огненного лиса
        petTypeId = 'fire_fox';
      }
      
      // Получаем тип питомца из каталога
      let petType;
      if (typeof window !== 'undefined') {
        petType = petDataStore.getPetTypeById(petTypeId);
      } else {
        petType = await SpiritPetCatalog.findByPk(petTypeId);
      }
      
      if (!petType) {
        console.warn(`Тип питомца с ID ${petTypeId} не найден, используем fire_fox`);
        petTypeId = 'fire_fox';
        if (typeof window !== 'undefined') {
          petType = petDataStore.getPetTypeById(petTypeId);
        } else {
          petType = await SpiritPetCatalog.findByPk(petTypeId);
        }
      }
      
      // Проверяем, есть ли у пользователя другие питомцы
      const userPets = await this.getPetsByUserId(effectiveUserId);
      const isActive = !userPets || userPets.length === 0;
      
      // Формируем данные для создания нового питомца
      const newPetData = {
        userId: effectiveUserId,
        petId: petTypeId,
        customName: petData.name || petType.name,
        isActive: isActive,
        level: petData.level || 1,
        experience: petData.experience || 0,
        hunger: petData.hunger || 100,
        loyalty: petData.loyalty || 50,
        strength: petData.strength || (petType ? petTypeBaseStats[petType.type]?.strength : 5) || 5,
        intelligence: petData.intelligence || (petType ? petTypeBaseStats[petType.type]?.intelligence : 5) || 5,
        agility: petData.agility || (petType ? petTypeBaseStats[petType.type]?.agility : 5) || 5,
        vitality: petData.vitality || (petType ? petTypeBaseStats[petType.type]?.vitality : 5) || 5,
        spirit: petData.spirit || (petType ? petTypeBaseStats[petType.type]?.spirit : 5) || 5,
        lastFed: petData.lastFed || new Date(),
        lastTrained: petData.lastTrained || null
      };
      
      // Если в браузере, используем localStorage
      if (typeof window !== 'undefined') {
        const browserPetData = {
          ...newPetData,
          type: petType.type,
          element: petType.element,
          name: newPetData.customName,
          abilities: petData.abilities || []
        };
        return petDataStore.addPet(browserPetData);
      }
      
      // Иначе используем базу данных
      const userPet = await UserSpiritPet.create(newPetData);
      
      // Возвращаем питомца с включенным типом
      return await this.getPetById(userPet.id);
    } catch (error) {
      console.error('Ошибка при создании питомца:', error);
      throw error;
    }
  }

  /**
   * Обновить питомца
   * @param {number} petId - ID питомца пользователя
   * @param {Object} petData - Новые данные питомца
   * @returns {Promise<Object>} - Обновленный питомец
   */
  async updatePet(petId, petData) {
    try {
      const pet = await this.getPetById(petId);
      if (!pet) {
        throw new Error(`Питомец с ID ${petId} не найден`);
      }
      
      // Если в браузере, используем localStorage
      if (typeof window !== 'undefined') {
        return petDataStore.updatePet(petId, petData);
      }
      
      // Преобразуем поля, если необходимо
      const updateData = { ...petData };
      if (petData.name) {
        updateData.customName = petData.name;
        delete updateData.name;
      }
      
      // Округляем числовые значения для целочисленных полей
      // Для hunger и loyalty устанавливаем минимальное значение 1
      if (updateData.hunger !== undefined) {
        updateData.hunger = Math.max(Math.round(updateData.hunger), 1);
      }
      if (updateData.loyalty !== undefined) {
        updateData.loyalty = Math.max(Math.round(updateData.loyalty), 1);
      }
      if (updateData.level !== undefined) {
        updateData.level = Math.round(updateData.level);
      }
      if (updateData.experience !== undefined) {
        updateData.experience = Math.round(updateData.experience);
      }
      if (updateData.strength !== undefined) {
        updateData.strength = Math.round(updateData.strength);
      }
      if (updateData.intelligence !== undefined) {
        updateData.intelligence = Math.round(updateData.intelligence);
      }
      if (updateData.agility !== undefined) {
        updateData.agility = Math.round(updateData.agility);
      }
      if (updateData.vitality !== undefined) {
        updateData.vitality = Math.round(updateData.vitality);
      }
      if (updateData.spirit !== undefined) {
        updateData.spirit = Math.round(updateData.spirit);
      }
      
      // Иначе используем базу данных
      await pet.update(updateData);
      return await this.getPetById(petId);
    } catch (error) {
      console.error('Ошибка при обновлении питомца:', error);
      throw error;
    }
  }

  /**
   * Удалить питомца
   * @param {number} petId - ID питомца пользователя
   * @returns {Promise<boolean>} - true, если питомец успешно удален
   */
  async deletePet(petId) {
    try {
      const pet = await this.getPetById(petId);
      if (!pet) {
        throw new Error(`Питомец с ID ${petId} не найден`);
      }
      
      // Если в браузере, используем localStorage
      if (typeof window !== 'undefined') {
        return petDataStore.removePet(petId);
      }
      
      // Иначе используем базу данных
      await pet.destroy();
      return true;
    } catch (error) {
      console.error('Ошибка при удалении питомца:', error);
      throw error;
    }
  }

  /**
   * Сделать питомца активным
   * @param {number|string} userId - ID пользователя
   * @param {number|string} petId - ID питомца пользователя
   * @returns {Promise<Object>} - Активированный питомец
   */
  async activatePet(userId, petId) {
    try {
      // Если ID не задан, используем демо-пользователя
      const effectiveUserId = userId || 'demo_user';
      
      // Если в браузере, используем localStorage
      if (typeof window !== 'undefined') {
        return petDataStore.activatePet(effectiveUserId, petId);
      }
      
      // Деактивируем текущего активного питомца
      const activePet = await this.getActivePet(effectiveUserId);
      if (activePet) {
        await activePet.update({ isActive: false });
      }
      
      // Активируем нового питомца
      const pet = await this.getPetById(petId);
      if (!pet) {
        throw new Error(`Питомец с ID ${petId} не найден`);
      }
      
      // Проверяем принадлежность с учетом демо-пользователя
      if (pet.userId !== effectiveUserId) {
        // В режиме отладки не вызываем ошибку, а просто обновляем userId
        console.warn(`Питомец не принадлежит пользователю ${effectiveUserId}, обновляем принадлежность`);
        await pet.update({ userId: effectiveUserId });
      }
      
      await pet.update({ isActive: true });
      return await this.getPetById(petId);
    } catch (error) {
      console.error('Ошибка при активации питомца:', error);
      throw error;
    }
  }

  /**
   * Получить все доступные корма для питомцев
   * @param {number|string} userId - ID пользователя (опционально)
   * @returns {Promise<Array>} - Массив предметов еды
   */
  async getAllPetFood(userId) {
    try {
      // Если в браузере, используем демо-данные
      if (typeof window !== 'undefined') {
        return petDataStore.getAllPetFood();
      }
      
      // Импортируем необходимые модели
      const SpiritPetFood = require('../models/spirit-pet-food');
      const InventoryItem = require('../models/inventory-item');
      
      // Получаем все типы еды для питомцев из специализированной модели
      await SpiritPetFood.init();
      const foodItems = await SpiritPetFood.findAll();
      
      // Преобразуем данные для единообразия полей
      const formattedFoodItems = foodItems.map(item => {
        // Получаем данные и преобразуем экземпляр модели в простой объект
        const plainItem = item.get({ plain: true });
        return {
          id: plainItem.id,
          name: plainItem.name,
          description: plainItem.description,
          rarity: plainItem.rarity,
          price: plainItem.price,
          nutritionValue: plainItem.nutritionValue,
          loyaltyBonus: plainItem.loyaltyBonus,
          icon: plainItem.icon,
          type: 'pet_food',
          quantity: 0
        };
      });
      
      // Если userId не указан, возвращаем только каталог без информации о количестве
      if (!userId) {
        return formattedFoodItems;
      }
      
      // Получаем информацию о предметах в инвентаре пользователя
      await InventoryItem.init();
      const userInventory = await InventoryItem.findAll({
        where: {
          userId: parseInt(userId, 10), // Преобразуем userId в число
          type: 'pet_food'  // Используем поле type из модели (маппится на item_type в БД)
        }
      });
      
      // Преобразуем результаты в простые объекты
      const plainUserInventory = userInventory.map(item => item.get({ plain: true }));
      
      // Объединяем данные из каталога с инвентарем пользователя
      return formattedFoodItems.map(food => {
        const inventoryItem = plainUserInventory.find(item => item.itemId === food.id);
        return {
          ...food,
          quantity: inventoryItem ? inventoryItem.quantity : 0
        };
      });
    } catch (error) {
      console.error('Ошибка при получении кормов для питомцев:', error);
      return [];
    }
  }

  /**
   * Получить предмет еды по ID
   * @param {string} foodId - ID предмета еды
   * @returns {Promise<Object|null>} - Предмет еды или null, если не найден
   */
  async getPetFoodById(foodId) {
    try {
      // Если в браузере, используем демо-данные
      if (typeof window !== 'undefined') {
        return petDataStore.getPetFoodById(foodId);
      }
      
      // Иначе используем базу данных
      return await SpiritPetFood.findByPk(foodId);
    } catch (error) {
      console.error('Ошибка при получении предмета еды:', error);
      return null;
    }
  }

  /**
   * Покормить питомца
   * @param {number} petId - ID питомца пользователя
   * @param {string} foodItemId - ID предмета еды
   * @returns {Promise<Object>} - Обновленный питомец
   */
  async feedPet(petId, foodItemId, userId) {
    try {
      const pet = await this.getPetById(petId);
      if (!pet) {
        throw new Error(`Питомец с ID ${petId} не найден`);
      }
      
      // Получаем информацию о еде
      const foodItem = await this.getPetFoodById(foodItemId);
      if (!foodItem) {
        throw new Error(`Предмет еды с ID ${foodItemId} не найден`);
      }
      
      // Рассчитываем новые значения параметров
      const updatedData = {
        hunger: Math.min(pet.hunger + foodItem.nutritionValue, 100),
        loyalty: Math.min(pet.loyalty + foodItem.loyaltyBonus, 100),
        lastFed: new Date()
      };
      
      // Если есть бонус к статистике, применяем его
      if (foodItem.statBonusType && foodItem.statBonusValue > 0) {
        updatedData[foodItem.statBonusType] = pet[foodItem.statBonusType] + foodItem.statBonusValue;
      }
      
      // Удаляем предмет из инвентаря пользователя
      if (userId) {
        const InventoryService = require('./inventory-service');
        await InventoryService.removeInventoryItem(userId, foodItemId, 1);
      }
      
      return await this.updatePet(petId, updatedData);
    } catch (error) {
      console.error('Ошибка при кормлении питомца:', error);
      throw error;
    }
  }

  /**
   * Тренировать питомца
   * @param {number} petId - ID питомца пользователя
   * @param {string} statToTrain - Характеристика для тренировки (strength, intelligence, agility, vitality, spirit)
   * @returns {Promise<Object>} - Обновленный питомец
   */
  async trainPet(petId, statToTrain) {
    try {
      const pet = await this.getPetById(petId);
      if (!pet) {
        throw new Error(`Питомец с ID ${petId} не найден`);
      }
      
      // Проверяем, что характеристика существует
      const validStats = ['strength', 'intelligence', 'agility', 'vitality', 'spirit'];
      if (!validStats.includes(statToTrain)) {
        throw new Error(`Неизвестная характеристика: ${statToTrain}`);
      }
      
      // Проверяем, что питомец не голоден
      if (pet.hunger < 30) {
        throw new Error('Питомец слишком голоден для тренировки');
      }
      
      // Обновляем характеристику и другие параметры
      const updatedData = {
        [statToTrain]: pet[statToTrain] + 1,
        hunger: Math.max(pet.hunger - 15, 0),
        experience: pet.experience + 10,
        lastTrained: new Date()
      };
      
      // Проверяем, достаточно ли опыта для повышения уровня
      const expForNextLevel = calculateExpForLevel(pet.level);
      if (updatedData.experience >= expForNextLevel) {
        updatedData.level = pet.level + 1;
        updatedData.experience = updatedData.experience - expForNextLevel;
        
        // Проверяем, можно ли эволюционировать
        // В новой версии эта логика может быть в petType.evolutionPath
        if (
          pet.petType && 
          evolutionStages[pet.petType.type] && 
          evolutionStages[pet.petType.type][pet.level + 1]
        ) {
          console.log(`Питомец ${pet.customName} достиг уровня эволюции!`);
        }
      }
      
      return await this.updatePet(petId, updatedData);
    } catch (error) {
      console.error('Ошибка при тренировке питомца:', error);
      throw error;
    }
  }

  /**
   * Приручить нового питомца в локации
   * @param {number|string} userId - ID пользователя
   * @param {string} location - Название локации
   * @returns {Promise<Object>} - Приручённый питомец или null, если приручение не удалось
   */
  async tamePetInLocation(userId, location) {
    try {
      // Если ID не задан, используем демо-пользователя
      const effectiveUserId = userId || 'demo_user';
      
      // Проверяем, есть ли в локации питомцы для приручения
      let availablePetTypes;
      if (typeof window !== 'undefined') {
        // В браузере используем предопределенные локации
        availablePetTypes = petSpawnLocations[location] || Object.values(petTypes);
      } else {
        // В базе данных получаем питомцев, которые могут быть в этой локации
        availablePetTypes = await SpiritPetCatalog.findAll();
        availablePetTypes = availablePetTypes.map(pet => pet.id);
        
        if (!availablePetTypes || availablePetTypes.length === 0) {
          availablePetTypes = ['fire_fox', 'water_dragon', 'earth_turtle', 'lightning_bird', 'shadow_wolf'];
        }
      }
      
      // Выбираем случайный тип питомца
      const randomTypeId = availablePetTypes[Math.floor(Math.random() * availablePetTypes.length)];
      
      // Генерируем случайное имя
      const names = [
        'Искра', 'Шторм', 'Тень', 'Луна', 'Звезда', 'Гром', 'Молния', 
        'Ветер', 'Огонь', 'Вода', 'Земля', 'Камень', 'Лист', 'Туман'
      ];
      const randomName = names[Math.floor(Math.random() * names.length)];
      
      // Создаем нового питомца
      return await this.createPet({
        userId: effectiveUserId,
        petTypeId: randomTypeId,
        name: randomName,
        level: 1,
        experience: 0,
        loyalty: 50,
        hunger: 70
      });
    } catch (error) {
      console.error('Ошибка при приручении питомца:', error);
      throw error;
    }
  }

  /**
   * Получить бонусы к боевым характеристикам от активного питомца
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Бонусы к характеристикам или пустой объект, если нет активного питомца
   */
  async getActivePetCombatBonus(userId) {
    try {
      const activePet = await this.getActivePet(userId);
      if (!activePet) {
        return {
          attack: 0,
          defense: 0,
          speed: 0,
          critChance: 0,
          healthBonus: 0,
          energyBonus: 0
        };
      }
      
      return calculateCombatBonus(activePet);
    } catch (error) {
      console.error('Ошибка при получении боевых бонусов питомца:', error);
      throw error;
    }
  }

  /**
   * Получить способности активного питомца
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Массив способностей или пустой массив, если нет активного питомца
   */
  async getActivePetAbilities(userId) {
    try {
      const activePet = await this.getActivePet(userId);
      if (!activePet || !activePet.petType) {
        return [];
      }
      
      // Получаем способности в зависимости от типа питомца и уровня
      // В новой версии это может быть в petType.abilities
      const petTypeAbilitiesLocal = petTypeAbilities[activePet.petType.type] || [];
      return petTypeAbilitiesLocal
        .filter(ability => ability.unlockLevel <= activePet.level)
        .map(ability => ({
          id: ability.id,
          name: ability.name,
          description: ability.description,
          cooldown: ability.cooldown,
          energyCost: ability.energyCost,
          effects: ability.effects
        }));
    } catch (error) {
      console.error('Ошибка при получении способностей питомца:', error);
      throw error;
    }
  }

  /**
   * Использовать способность питомца в бою
   * @param {number} userId - ID пользователя
   * @param {string} abilityId - ID способности
   * @returns {Promise<Object>} - Результат использования способности
   */
  async usePetAbility(userId, abilityId) {
    try {
      const activePet = await this.getActivePet(userId);
      if (!activePet) {
        throw new Error('У вас нет активного питомца');
      }
      
      // Получаем способности питомца
      const abilities = await this.getActivePetAbilities(userId);
      const ability = abilities.find(a => a.id === abilityId);
      
      if (!ability) {
        throw new Error(`Способность ${abilityId} не найдена или не доступна вашему питомцу`);
      }
      
      // Здесь должна быть логика для применения способности в бою
      // Обновляем счетчик использования питомца в бою
      await this.updatePet(activePet.id, { 
        combatUsesCount: activePet.combatUsesCount + 1 
      });
      
      // Возвращаем информацию о способности для использования в боевой системе
      return {
        pet: activePet,
        ability,
        success: true
      };
    } catch (error) {
      console.error('Ошибка при использовании способности питомца:', error);
      throw error;
    }
  }

  /**
   * Обновить состояние всех питомцев пользователя (голод, лояльность и т.д.)
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Массив обновленных питомцев
   */
  async updatePetsState(userId) {
    try {
      const pets = await this.getPetsByUserId(userId);
      const now = new Date();
      
      const updatedPets = [];
      for (const pet of pets) {
        // Рассчитываем время с последнего кормления в часах
        const lastFed = new Date(pet.lastFed);
        const hoursSinceLastFed = (now - lastFed) / (1000 * 60 * 60);
        
        // Уменьшаем голод на 5 за каждый час и округляем до целого числа, но не меньше 1
        let hunger = Math.max(Math.round(Math.max(pet.hunger - hoursSinceLastFed * 5, 0)), 1);
        
        // Если питомец голоден, уменьшаем лояльность и округляем до целого числа, но не меньше 1
        let loyalty = pet.loyalty;
        if (hunger < 30) {
          loyalty = Math.max(Math.round(Math.max(loyalty - hoursSinceLastFed * 2, 0)), 1);
        }
        
        // Обновляем питомца, если изменились параметры
        if (hunger !== pet.hunger || loyalty !== pet.loyalty) {
          const updatedPet = await this.updatePet(pet.id, { hunger, loyalty });
          updatedPets.push(updatedPet);
        } else {
          updatedPets.push(pet);
        }
      }
      
      return updatedPets;
    } catch (error) {
      console.error('Ошибка при обновлении состояния питомцев:', error);
      throw error;
    }
  }
  
  /**
   * Методы-синонимы для обратной совместимости с API
   */
  
  // Синоним для getPetsByUserId
  async getUserPets(userId) {
    return this.getPetsByUserId(userId);
  }

  // Синоним для getPetById с проверкой пользователя
  async getUserPetById(userId, petId) {
    const pet = await this.getPetById(petId);
    
    // Проверяем, принадлежит ли питомец пользователю
    if (pet && pet.userId !== userId) {
      return null;
    }
    
    return pet;
  }

  // Метод для переименования питомца (обратная совместимость)
  async renamePet(userId, petId, newName) {
    const pet = await this.getPetById(petId);
    
    // Проверяем, существует ли питомец и принадлежит ли он пользователю
    if (!pet) {
      throw new Error('Питомец не найден');
    }
    
    if (pet.userId !== userId) {
      throw new Error('Питомец не принадлежит пользователю');
    }
    
    return await this.updatePet(petId, { customName: newName });
  }

  // Метод для отправки питомца на поиск ресурсов (заглушка для обратной совместимости)
  async sendPetForaging(userId, petId, location) {
    const pet = await this.getPetById(petId);
    
    // Проверяем, существует ли питомец и принадлежит ли он пользователю
    if (!pet) {
      throw new Error('Питомец не найден');
    }
    
    if (pet.userId !== userId) {
      throw new Error('Питомец не принадлежит пользователю');
    }
    
    // Здесь должна быть логика поиска ресурсов
    // Для примера просто возвращаем результат
    return {
      pet,
      location,
      result: {
        success: true,
        resources: [
          { type: 'wood', amount: Math.floor(Math.random() * 10) + 1 },
          { type: 'stone', amount: Math.floor(Math.random() * 5) + 1 }
        ],
        experience: 10
      }
    };
  }

  // Метод для изучения навыка питомцем (заглушка для обратной совместимости)
  async learnPetSkill(userId, petId, skillId) {
    const pet = await this.getPetById(petId);
    
    // Проверяем, существует ли питомец и принадлежит ли он пользователю
    if (!pet) {
      throw new Error('Питомец не найден');
    }
    
    if (pet.userId !== userId) {
      throw new Error('Питомец не принадлежит пользователю');
    }
    
    // Здесь должна быть логика изучения навыка
    // Для примера просто возвращаем результат
    return {
      pet,
      skillId,
      success: true,
      message: 'Навык успешно изучен'
    };
  }

  // Методы для получения констант (для обратной совместимости)
  getPetTypes() {
    return {
      FIRE: 'fire_fox',
      WATER: 'water_dragon',
      EARTH: 'earth_turtle',
      LIGHTNING: 'lightning_bird',
      DARKNESS: 'shadow_wolf'
    };
  }

  getPetElements() {
    return {
      FIRE: 'fire',
      WATER: 'water',
      EARTH: 'earth',
      LIGHTNING: 'lightning',
      DARKNESS: 'darkness',
      AIR: 'air'
    };
  }

  getPetRarity() {
    return {
      COMMON: 'common',
      UNCOMMON: 'uncommon',
      RARE: 'rare',
      EPIC: 'epic',
      LEGENDARY: 'legendary'
    };
  }

  getBondLevels() {
    return {
      STRANGER: { min: 0, max: 20, name: 'Незнакомец' },
      ACQUAINTANCE: { min: 21, max: 40, name: 'Знакомый' },
      FRIEND: { min: 41, max: 60, name: 'Друг' },
      COMPANION: { min: 61, max: 80, name: 'Компаньон' },
      SOULMATE: { min: 81, max: 100, name: 'Родственная душа' }
    };
  }
}

module.exports = new SpiritPetService();
