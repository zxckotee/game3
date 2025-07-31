const { models } = require('../db');
const { SpiritPet, UserSpiritPet, User, sequelize } = models;
const { ApiError } = require('../utils/errors');

// Получить боевые бонусы от активного питомца
exports.getPetCombatBonuses = async (req, res, next) => {
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
          as: 'pet'
        }
      ]
    });
    
    if (!activePet) {
      return res.json({ bonuses: null, hasActivePet: false });
    }
    
    // Рассчитываем бонусы на основе характеристик питомца и уровня лояльности
    const loyaltyFactor = activePet.loyalty / 100;
    const baseDamage = activePet.pet.damage_base;
    const petLevel = activePet.level;
    
    const bonuses = {
      // Базовые характеристики
      strength: Math.floor(activePet.strength * 0.5 * loyaltyFactor),
      intelligence: Math.floor(activePet.intelligence * 0.5 * loyaltyFactor),
      agility: Math.floor(activePet.agility * 0.5 * loyaltyFactor),
      vitality: Math.floor(activePet.vitality * 0.5 * loyaltyFactor),
      spirit: Math.floor(activePet.spirit * 0.5 * loyaltyFactor),
      
      // Боевые характеристики
      damageBonus: Math.floor(baseDamage * activePet.pet.damage_multiplier * petLevel * loyaltyFactor * 0.1),
      critChanceBonus: Math.floor(activePet.agility * 0.05 * loyaltyFactor),
      dodgeChanceBonus: Math.floor(activePet.agility * 0.05 * loyaltyFactor),
      healthBonus: Math.floor(activePet.vitality * 5 * loyaltyFactor),
      energyBonus: Math.floor(activePet.spirit * 3 * loyaltyFactor),
      
      // Информация о питомце
      petId: activePet.id,
      petTypeId: activePet.pet_id,
      petName: activePet.pet.name,
      petType: activePet.pet.type,
      petElement: activePet.pet.element,
      petRarity: activePet.pet.rarity,
      petLevel: activePet.level,
      petLoyalty: activePet.loyalty,
      petHunger: activePet.hunger,
      
      // Боевые способности
      combatAbilities: activePet.pet.combat_abilities,
      
      // Стихийные бонусы
      element: activePet.pet.element,
      elementalBonus: calculateElementalBonus(activePet.pet.element, petLevel, loyaltyFactor)
    };
    
    return res.json({ bonuses, hasActivePet: true });
  } catch (error) {
    next(error);
  }
};

// Использовать способность питомца в бою
exports.usePetAbility = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { abilityId, battleId } = req.body;
    
    const activePet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        is_active: true
      },
      include: [
        {
          model: SpiritPet,
          as: 'pet'
        }
      ]
    });
    
    if (!activePet) {
      return next(new ApiError('У вас нет активного питомца', 400));
    }
    
    // Проверяем лояльность питомца
    if (activePet.loyalty < 30) {
      return next(new ApiError('Лояльность питомца слишком низкая для использования способностей', 400));
    }
    
    // Проверяем голод питомца
    if (activePet.hunger < 20) {
      return next(new ApiError('Питомец слишком голоден для использования способностей', 400));
    }
    
    // Находим способность в списке боевых способностей питомца
    const petAbilities = activePet.pet.combat_abilities || [];
    const ability = petAbilities.find(a => a.id === abilityId);
    
    if (!ability) {
      return next(new ApiError('Способность не найдена у данного питомца', 404));
    }
    
    // Рассчитываем эффективность способности на основе лояльности
    const loyaltyFactor = activePet.loyalty / 100;
    const hungerFactor = activePet.hunger / 100;
    const effectivenessMultiplier = loyaltyFactor * hungerFactor;
    
    // Модифицируем способность с учетом эффективности
    const modifiedAbility = {
      ...ability,
      effectiveness: effectivenessMultiplier
    };
    
    if (ability.damage_multiplier) {
      modifiedAbility.damage_multiplier = ability.damage_multiplier * effectivenessMultiplier;
    }
    
    if (ability.effect_value) {
      modifiedAbility.effect_value = Math.floor(ability.effect_value * effectivenessMultiplier);
    }
    
    // Обновляем статистику использования питомца в боях
    activePet.last_combat_used = new Date();
    activePet.combat_uses_count += 1;
    
    // Уменьшаем голод питомца при использовании способности
    activePet.hunger = Math.max(0, activePet.hunger - 10);
    
    await activePet.save();
    
    return res.json({
      success: true,
      ability: modifiedAbility,
      petStatus: {
        hunger: activePet.hunger,
        loyalty: activePet.loyalty
      }
    });
  } catch (error) {
    next(error);
  }
};

// Обработка результатов боя для питомца
exports.processBattleResults = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { battleId, victory, damageDealt, fled } = req.body;
    
    const activePet = await UserSpiritPet.findOne({
      where: { 
        user_id: userId,
        is_active: true
      }
    });
    
    if (!activePet) {
      return res.json({ success: true, petUpdated: false });
    }
    
    // Обновляем статистику боя
    if (fled) {
      activePet.combat_flee_count += 1;
      
      // Уменьшаем лояльность при побеге из боя
      const loyaltyDecrease = 10;
      activePet.loyalty = Math.max(0, activePet.loyalty - loyaltyDecrease);
    } else {
      // Учитываем нанесенный урон
      activePet.combat_damage_dealt += damageDealt || 0;
      
      // Увеличиваем опыт питомца при победе
      if (victory) {
        const expGain = 20;
        activePet.experience += expGain;
        
        // Увеличиваем лояльность при победе
        const loyaltyBonus = Math.min(5, 100 - activePet.loyalty);
        activePet.loyalty += loyaltyBonus;
        
        // Проверяем на повышение уровня
        const expRequired = activePet.level * 100;
        if (activePet.experience >= expRequired) {
          activePet.level += 1;
          activePet.experience -= expRequired;
          
          // Увеличиваем характеристики при повышении уровня
          activePet.strength += 1;
          activePet.intelligence += 1;
          activePet.agility += 1;
          activePet.vitality += 1;
          activePet.spirit += 1;
        }
      } else {
        // Небольшой опыт даже при поражении
        const expGain = 5;
        const currentExp = activePet.experience || 0;
        const expRequired = activePet.level * 100;
        
        // Безопасно добавляем опыт с проверкой границ
        activePet.experience = safeUpdateExperience(currentExp, expGain, expRequired);
      }
    }
    
    await activePet.save();
    
    return res.json({
      success: true,
      petUpdated: true,
      petStats: {
        level: activePet.level,
        experience: activePet.experience,
        loyalty: activePet.loyalty,
        hunger: activePet.hunger,
        combatUses: activePet.combat_uses_count,
        combatFlees: activePet.combat_flee_count,
        damageDealt: activePet.combat_damage_dealt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Проверка возможности бегства питомца из боя
exports.checkPetFlee = async (req, res, next) => {
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
          as: 'pet'
        }
      ]
    });
    
    if (!activePet) {
      return res.json({ willFlee: false, hasActivePet: false });
    }
    
    // Проверяем на возможность бегства на основе лояльности и голода
    let fleeChance = 0;
    
    // Низкая лояльность увеличивает шанс бегства
    if (activePet.loyalty < 30) {
      fleeChance += (30 - activePet.loyalty) * 2; // до +60% при лояльности 0
    }
    
    // Голод увеличивает шанс бегства
    if (activePet.hunger < 20) {
      fleeChance += (20 - activePet.hunger) * 2; // до +40% при голоде 0
    }
    
    // Окончательный шанс бегства (максимум 80%)
    fleeChance = Math.min(80, fleeChance);
    
    // Определяем, сбежит ли питомец
    const willFlee = Math.random() * 100 < fleeChance;
    
    return res.json({
      willFlee,
      hasActivePet: true,
      fleeChance,
      petStats: {
        loyalty: activePet.loyalty,
        hunger: activePet.hunger
      }
    });
  } catch (error) {
    next(error);
  }
};

// Вспомогательная функция для расчета стихийных бонусов
function calculateElementalBonus(element, level, loyaltyFactor) {
  const baseBonus = 5 + Math.floor(level * 0.5);
  const bonusValue = Math.floor(baseBonus * loyaltyFactor);
  
  switch (element) {
    case 'fire':
      return {
        damageBonus: bonusValue,
        type: 'fire',
        description: 'Увеличение урона от огня'
      };
    case 'water':
      return {
        healingBonus: bonusValue,
        type: 'water',
        description: 'Увеличение эффективности лечения'
      };
    case 'earth':
      return {
        defenseBonus: bonusValue,
        type: 'earth',
        description: 'Увеличение защиты'
      };
    case 'wind':
      return {
        speedBonus: bonusValue,
        type: 'wind',
        description: 'Увеличение скорости'
      };
    case 'lightning':
      return {
        critDamageBonus: bonusValue,
        type: 'lightning',
        description: 'Увеличение критического урона'
      };
    case 'ice':
      return {
        slowEffect: bonusValue,
        type: 'ice',
        description: 'Шанс замедлить противника'
      };
    case 'light':
      return {
        healOverTimeBonus: bonusValue,
        type: 'light',
        description: 'Восстановление здоровья с течением времени'
      };
    case 'dark':
      return {
        lifeStealBonus: bonusValue,
        type: 'dark',
        description: 'Похищение жизни при атаке'
      };
    case 'void':
      return {
        penetrationBonus: bonusValue,
        type: 'void',
        description: 'Игнорирование части защиты противника'
      };
    default:
      return {
        universalBonus: Math.floor(bonusValue * 0.5),
        type: 'none',
        description: 'Небольшое увеличение всех характеристик'
      };
  }
}