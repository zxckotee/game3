const { models } = require('../db');
const { SpiritPet, UserSpiritPet, User, sequelize, Item } = models;
const { Op } = require('sequelize');
const { ApiError } = require('../utils/errors');

// Получить все типы питомцев
exports.getAllPets = async (req, res, next) => {
  try {
    const pets = await SpiritPet.findAll({
      order: [
        ['rarity', 'DESC'],
        ['name', 'ASC']
      ]
    });
    return res.json(pets);
  } catch (error) {
    next(error);
  }
};

// Получить всех питомцев пользователя
exports.getUserPets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const userPets = await UserSpiritPet.findAll({
      where: { user_id: userId },
      include: [
        {
          model: SpiritPet,
          as: 'pet',
          attributes: ['id', 'name', 'type', 'element', 'rarity', 'abilities', 'combat_abilities', 'evolution_stage']
        }
      ],
      order: [
        ['is_active', 'DESC'],
        ['level', 'DESC'],
        ['loyalty', 'DESC']
      ]
    });
    
    return res.json(userPets);
  } catch (error) {
    next(error);
  }
};

// Получить активного питомца пользователя
exports.getActivePet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const activePet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        is_active: true
      },
      include: [
        {
          model: SpiritPet,
          as: 'pet',
          attributes: ['id', 'name', 'type', 'element', 'rarity', 'abilities', 'combat_abilities', 'evolution_stage']
        }
      ]
    });
    
    if (!activePet) {
      return res.json(null);
    }
    
    return res.json(activePet);
  } catch (error) {
    next(error);
  }
};

// Получить детальную информацию о питомце пользователя
exports.getUserPet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const petId = req.params.petId;
    
    const userPet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        id: petId
      },
      include: [
        {
          model: SpiritPet,
          as: 'pet'
        }
      ]
    });
    
    if (!userPet) {
      return next(new ApiError('Питомец не найден', 404));
    }
    
    return res.json(userPet);
  } catch (error) {
    next(error);
  }
};

// Активировать питомца пользователя
exports.activatePet = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const petId = req.params.petId;
    
    // Проверяем, существует ли питомец
    const userPet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        id: petId
      },
      transaction
    });
    
    if (!userPet) {
      await transaction.rollback();
      return next(new ApiError('Питомец не найден', 404));
    }
    
    // Деактивируем текущего активного питомца
    await UserSpiritPet.update(
      { is_active: false },
      { 
        where: { 
          user_id: userId,
          is_active: true
        },
        transaction
      }
    );
    
    // Активируем выбранного питомца
    userPet.is_active = true;
    await userPet.save({ transaction });
    
    await transaction.commit();
    
    // Получаем обновленные данные питомца вместе с информацией о базовом питомце
    const updatedPet = await UserSpiritPet.findOne({
      where: { id: petId },
      include: [
        {
          model: SpiritPet,
          as: 'pet'
        }
      ]
    });
    
    return res.json(updatedPet);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Накормить питомца
exports.feedPet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const petId = req.params.petId;
    const { foodItemId } = req.body;
    
    const userPet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        id: petId
      },
      include: [
        {
          model: SpiritPet,
          as: 'pet'
        }
      ]
    });
    
    if (!userPet) {
      return next(new ApiError('Питомец не найден', 404));
    }
    
    // Проверяем, нужно ли кормить питомца
    if (userPet.hunger >= 100) {
      return next(new ApiError('Питомец не голоден', 400));
    }
    
    // Получаем информацию о еде из инвентаря
    let foodItem = null;
    
    if (foodItemId) {
      // Проверяем наличие еды в инвентаре
      const inventoryItem = await Item.findOne({
        where: {
          id: foodItemId,
          user_id: userId,
          type: 'pet_food'
        }
      });
      
      if (!inventoryItem || inventoryItem.quantity < 1) {
        return next(new ApiError('Указанная еда не найдена в инвентаре', 404));
      }
      
      // Получаем информацию о еде
      const foodDetails = await sequelize.query(
        "SELECT * FROM spirit_pet_food_items WHERE id = :foodId",
        {
          replacements: { foodId: foodItemId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (foodDetails && foodDetails.length > 0) {
        foodItem = foodDetails[0];
      }
      
      // Уменьшаем количество еды в инвентаре
      inventoryItem.quantity -= 1;
      if (inventoryItem.quantity <= 0) {
        await inventoryItem.destroy();
      } else {
        await inventoryItem.save();
      }
    }
    
    // Рассчитываем, сколько очков голода восстановить
    let nutritionValue = 25; // Значение по умолчанию
    let loyaltyBonus = 0;
    
    if (foodItem) {
      nutritionValue = foodItem.nutrition_value || 25;
      loyaltyBonus = foodItem.loyalty_bonus || 0;
    }
    
    const feedAmount = Math.min(nutritionValue, 100 - userPet.hunger);
    userPet.hunger += feedAmount;
    
    // Если питомец был очень голоден, повышаем лояльность
    if (userPet.hunger < 25) {
      const baseBonus = 5; // Базовый бонус лояльности
      const totalBonus = Math.min(baseBonus + loyaltyBonus, 100 - userPet.loyalty);
      userPet.loyalty += totalBonus;
    } else if (loyaltyBonus > 0) {
      // Если питомец не очень голоден, но еда дает бонус лояльности
      const totalBonus = Math.min(loyaltyBonus, 100 - userPet.loyalty);
      userPet.loyalty += totalBonus;
    }
    
    // Применяем бонусы к характеристикам, если они есть
    if (foodItem && foodItem.stat_bonus_type && foodItem.stat_bonus_value > 0) {
      if (['strength', 'intelligence', 'agility', 'vitality', 'spirit'].includes(foodItem.stat_bonus_type)) {
        userPet[foodItem.stat_bonus_type] += foodItem.stat_bonus_value;
      }
    }
    
    userPet.last_fed = new Date();
    await userPet.save();
    
    return res.json(userPet);
  } catch (error) {
    next(error);
  }
};

// Тренировать питомца
exports.trainPet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const petId = req.params.petId;
    const { stat } = req.body;
    
    if (!['strength', 'intelligence', 'agility', 'vitality', 'spirit'].includes(stat)) {
      return next(new ApiError('Неверный параметр тренировки', 400));
    }
    
    const userPet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        id: petId
      },
      include: [
        {
          model: SpiritPet,
          as: 'pet'
        }
      ]
    });
    
    if (!userPet) {
      return next(new ApiError('Питомец не найден', 404));
    }
    
    // Проверяем, не голоден ли питомец
    if (userPet.hunger < 30) {
      return next(new ApiError('Питомец слишком голоден для тренировки', 400));
    }
    
    // Уменьшаем сытость
    userPet.hunger = Math.max(0, userPet.hunger - 15);
    
    // Начисляем опыт
    const expGain = 10;
    const currentExp = userPet.experience || 0;
    const expRequired = userPet.level * 100;
    
    // Безопасно добавляем опыт с проверкой границ
    userPet.experience = safeUpdateExperience(currentExp, expGain, expRequired);
    
    // Проверяем на повышение уровня
    if (userPet.experience >= expRequired) {
      userPet.level += 1;
      userPet.experience = Math.max(0, userPet.experience - expRequired);
      
      // Увеличиваем характеристики при повышении уровня
      userPet.strength += 1;
      userPet.intelligence += 1;
      userPet.agility += 1;
      userPet.vitality += 1;
      userPet.spirit += 1;
    }
    
    // Увеличиваем выбранную характеристику
    userPet[stat] += 1;
    
    // Увеличиваем лояльность
    const loyaltyBonus = Math.min(3, 100 - userPet.loyalty);
    userPet.loyalty += loyaltyBonus;
    
    userPet.last_trained = new Date();
    await userPet.save();
    
    return res.json(userPet);
  } catch (error) {
    next(error);
  }
};

// Получить питомца (для новых игроков или при нахождении питомца)
exports.acquirePet = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const petTypeId = req.params.petTypeId;
    
    // Проверяем, существует ли такой тип питомца
    const petType = await SpiritPet.findByPk(petTypeId, { transaction });
    
    if (!petType) {
      await transaction.rollback();
      return next(new ApiError('Тип питомца не найден', 404));
    }
    
    // Проверяем, есть ли у пользователя уже такой питомец
    const existingPet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        pet_id: petTypeId
      },
      transaction
    });
    
    if (existingPet) {
      await transaction.rollback();
      return next(new ApiError('У вас уже есть питомец этого типа', 400));
    }
    
    // Создаем нового питомца для пользователя
    const newPet = await UserSpiritPet.create({
      user_id: userId,
      pet_id: petTypeId,
      is_active: false, // По умолчанию не активный
      hunger: 100,
      loyalty: 100,
      experience: 0,
      level: 1,
      strength: petType.strength,
      intelligence: petType.intelligence,
      agility: petType.agility,
      vitality: petType.vitality,
      spirit: petType.spirit,
      last_fed: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    
    // Проверяем, есть ли у пользователя активный питомец
    const hasActivePet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        is_active: true
      },
      transaction
    });
    
    // Если нет активного питомца, делаем нового питомца активным
    if (!hasActivePet) {
      newPet.is_active = true;
      await newPet.save({ transaction });
    }
    
    await transaction.commit();
    
    // Получаем полные данные питомца с информацией о типе
    const fullPetData = await UserSpiritPet.findOne({
      where: { id: newPet.id },
      include: [
        {
          model: SpiritPet,
          as: 'pet'
        }
      ]
    });
    
    return res.status(201).json(fullPetData);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Получить еду для питомцев
exports.getPetFood = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Получаем всю доступную еду для питомцев
    const petFood = await sequelize.query(
      `SELECT spfi.*, i.quantity 
       FROM spirit_pet_food_items spfi 
       LEFT JOIN items i ON i.id = spfi.id AND i.user_id = :userId AND i.type = 'pet_food'
       ORDER BY spfi.rarity, spfi.name`,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    return res.json(petFood);
  } catch (error) {
    next(error);
  }
};

// Проверить состояние питомцев (уменьшение голода и лояльности с течением времени)
exports.checkPetsStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const userPets = await UserSpiritPet.findAll({
      where: { user_id: userId },
      include: [
        {
          model: SpiritPet,
          as: 'pet'
        }
      ]
    });
    
    const now = new Date();
    const updatedPets = [];
    
    for (const pet of userPets) {
      let updated = false;
      
      // Уменьшаем голод, если прошло более 4 часов с последнего кормления
      if (pet.last_fed) {
        const hoursSinceLastFed = (now - new Date(pet.last_fed)) / (1000 * 60 * 60);
        const hungerDecrease = Math.floor(hoursSinceLastFed / 4) * 10;
        
        if (hungerDecrease > 0) {
          pet.hunger = Math.max(0, pet.hunger - hungerDecrease);
          updated = true;
        }
      }
      
      // Уменьшаем лояльность, если питомец голоден
      if (pet.hunger < 20) {
        const loyaltyDecrease = pet.hunger === 0 ? 15 : 5;
        pet.loyalty = Math.max(0, pet.loyalty - loyaltyDecrease);
        updated = true;
      }
      
      // Сохраняем изменения, если были обновления
      if (updated) {
        await pet.save();
        updatedPets.push(pet);
      }
    }
    
    return res.json(updatedPets);
  } catch (error) {
    next(error);
  }
};