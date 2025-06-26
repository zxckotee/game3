// Адаптер для работы с данными о духовных питомцах
// Содержит константы, справочные данные и вспомогательные функции

// Названия типов питомцев
const petTypeNames = {
  'beast': 'Зверь',
  'mythical': 'Мифический',
  'elemental': 'Стихийный',
  'spectral': 'Призрачный',
  'celestial': 'Небесный',
  'infernal': 'Инфернальный',
  'mechanical': 'Механический',
  'plant': 'Растение',
  'insect': 'Насекомое',
  'aquatic': 'Водный'
};

// Названия элементов
const elementTypeNames = {
  'fire': 'Огонь',
  'water': 'Вода',
  'earth': 'Земля',
  'wind': 'Ветер',
  'lightning': 'Молния',
  'ice': 'Лёд',
  'light': 'Свет',
  'dark': 'Тьма',
  'void': 'Пустота',
  'unknown': 'Нейтральный'
};

// Названия редкостей
const rarityNames = {
  'common': 'Обычный',
  'uncommon': 'Необычный',
  'rare': 'Редкий',
  'epic': 'Эпический',
  'legendary': 'Легендарный',
  'mythic': 'Мифический'
};

// Описания типов питомцев
const petTypeDescriptions = {
  'beast': 'Духовные звери обладают инстинктивными способностями и сильным физическим присутствием. Они отличаются высокой силой и живучестью.',
  'mythical': 'Мифические существа редки и обладают уникальными способностями. Они могут иметь как защитные, так и атакующие свойства.',
  'elemental': 'Существа, созданные из чистой стихийной энергии. Обладают сильными атакующими способностями соответствующего элемента.',
  'spectral': 'Призрачные создания из потустороннего мира. Они могут проходить сквозь препятствия и обладают уникальными способностями к уклонению.',
  'celestial': 'Существа, созданные из небесной энергии. Обладают сильными целебными и защитными способностями.',
  'infernal': 'Существа из адских измерений. Обладают мощными разрушительными способностями и урон от огня.',
  'mechanical': 'Созданные при помощи технологий и магии, эти питомцы имеют высокую точность атак и стабильный урон.',
  'plant': 'Разумные растения, которые могут лечить и восстанавливать энергию своего хозяина.',
  'insect': 'Духовные насекомые быстры и ловки, часто обладают способностями к яду и дебаффам.',
  'aquatic': 'Водные существа с хорошими защитными и лечебными способностями.'
};

// Стадии эволюции
const evolutionStages = {
  'egg': {
    name: 'Яйцо',
    description: 'Питомец еще не вылупился и находится в яйце. В этой стадии питомец не может участвовать в боях, но вы можете ускорить его развитие, заботясь о нем.'
  },
  'baby': {
    name: 'Детёныш',
    description: 'Маленький и слабый, но очень милый! Может давать небольшие бонусы и участвовать в простых сражениях. Требует много заботы.'
  },
  'juvenile': {
    name: 'Подросток',
    description: 'Подрастающий питомец с формирующимися способностями. Становится сильнее и может участвовать в более сложных сражениях.'
  },
  'adult': {
    name: 'Взрослый',
    description: 'Полностью сформировавшийся питомец со всеми базовыми способностями. Предоставляет хорошие боевые бонусы и имеет все основные навыки своего вида.'
  },
  'mature': {
    name: 'Зрелый',
    description: 'Опытный и сильный питомец с продвинутыми способностями. Дает значительные бонусы в бою и может использовать специальные способности.'
  },
  'ancient': {
    name: 'Древний',
    description: 'Редкая и могущественная форма эволюции. Питомец достиг пика своего развития и обладает уникальными способностями и сильными боевыми бонусами.'
  },
  'transcendent': {
    name: 'Трансцендентный',
    description: 'Легендарная форма эволюции, доступная только некоторым питомцам. Питомец превзошел свои природные ограничения и обладает божественными способностями.'
  }
};

// Способности питомцев по типам
const petTypeAbilities = {
  'beast': [
    {
      id: 'bite',
      name: 'Укус',
      type: 'attack',
      description: 'Питомец кусает противника, нанося физический урон',
      cooldown: 2
    },
    {
      id: 'roar',
      name: 'Рёв',
      type: 'buff',
      description: 'Питомец издает громкий рёв, увеличивая силу атаки хозяина на 15%',
      cooldown: 4
    }
  ],
  'mythical': [
    {
      id: 'mystical_breath',
      name: 'Мистическое дыхание',
      type: 'attack',
      description: 'Питомец выдыхает поток мистической энергии, нанося магический урон',
      cooldown: 3
    },
    {
      id: 'time_warp',
      name: 'Искажение времени',
      type: 'buff',
      description: 'Питомец искажает время вокруг хозяина, увеличивая скорость на 20%',
      cooldown: 5
    }
  ],
  'elemental': [
    {
      id: 'elemental_surge',
      name: 'Стихийный всплеск',
      type: 'attack',
      description: 'Питомец высвобождает мощный взрыв своей стихии',
      cooldown: 3
    }
  ],
  'spectral': [
    {
      id: 'ghostly_touch',
      name: 'Призрачное касание',
      type: 'attack',
      description: 'Питомец атакует противника, игнорируя часть его защиты',
      cooldown: 3
    },
    {
      id: 'phase_shift',
      name: 'Фазовый сдвиг',
      type: 'buff',
      description: 'Питомец делает хозяина частично нематериальным, увеличивая шанс уклонения на 25%',
      cooldown: 5
    }
  ]
};

// Формулы расчета опыта для уровней
const calculateExpForLevel = (level) => {
  // Каждый следующий уровень требует больше опыта
  return level * 100;
};

// Расчет бонуса характеристик от питомца
const calculateStatBonus = (pet) => {
  if (!pet) return { strength: 0, intelligence: 0, agility: 0, vitality: 0, spirit: 0 };
  
  // Базовые характеристики
  const strength = pet.strength || 0;
  const intelligence = pet.intelligence || 0;
  const agility = pet.agility || 0;
  const vitality = pet.vitality || 0;
  const spirit = pet.spirit || 0;
  
  // Коэффициент от уровня питомца
  const levelFactor = (pet.level || 1) * 0.1;
  
  // Коэффициент от лояльности (влияет на эффективность бонусов)
  const loyaltyFactor = (pet.loyalty || 0) / 100;
  
  // Расчет бонусов
  return {
    strength: Math.floor(strength * levelFactor * loyaltyFactor),
    intelligence: Math.floor(intelligence * levelFactor * loyaltyFactor),
    agility: Math.floor(agility * levelFactor * loyaltyFactor),
    vitality: Math.floor(vitality * levelFactor * loyaltyFactor),
    spirit: Math.floor(spirit * levelFactor * loyaltyFactor)
  };
};

// Расчет боевых бонусов от питомца
const calculateCombatBonus = (pet) => {
  if (!pet) return {
    attack: 0,
    defense: 0,
    speed: 0,
    critChance: 0,
    healthBonus: 0,
    energyBonus: 0
  };
  
  // Базовые характеристики
  const strength = pet.strength || 0;
  const intelligence = pet.intelligence || 0;
  const agility = pet.agility || 0;
  const vitality = pet.vitality || 0;
  const spirit = pet.spirit || 0;
  
  // Уровень питомца
  const level = pet.level || 1;
  
  // Коэффициент от лояльности (влияет на эффективность бонусов)
  const loyaltyFactor = (pet.loyalty || 0) / 100;
  
  // Расчет боевых бонусов
  return {
    attack: Math.floor((strength * 1.5 + intelligence * 0.5) * loyaltyFactor),
    defense: Math.floor((vitality * 1.2 + strength * 0.3) * loyaltyFactor),
    speed: Math.floor(agility * 0.8 * loyaltyFactor),
    critChance: Math.min(0.25, (agility * 0.005 + intelligence * 0.002) * loyaltyFactor),
    healthBonus: Math.floor(vitality * 5 * loyaltyFactor),
    energyBonus: Math.floor(spirit * 3 * loyaltyFactor)
  };
};

// Расчет бонусов для стихийного урона
const calculateElementalBonus = (pet) => {
  if (!pet) return null;
  
  const element = pet.element || pet.pet?.element;
  if (!element) return null;
  
  const level = pet.level || 1;
  const loyaltyFactor = (pet.loyalty || 0) / 100;
  const baseDamage = 5 + level * 2;
  const damageBonus = Math.floor(baseDamage * loyaltyFactor);
  
  switch (element) {
    case 'fire':
      return {
        type: 'fire',
        damageBonus,
        description: 'Увеличение урона от огня'
      };
    case 'water':
      return {
        type: 'water',
        healingBonus: Math.floor(damageBonus * 0.8),
        description: 'Увеличение эффективности лечения'
      };
    case 'earth':
      return {
        type: 'earth',
        defenseBonus: Math.floor(damageBonus * 1.2),
        description: 'Увеличение защиты'
      };
    case 'wind':
      return {
        type: 'wind',
        speedBonus: Math.floor(damageBonus * 0.3),
        description: 'Увеличение скорости'
      };
    case 'lightning':
      return {
        type: 'lightning',
        critDamageBonus: Math.floor(damageBonus * 0.5),
        description: 'Увеличение критического урона'
      };
    case 'ice':
      return {
        type: 'ice',
        slowEffect: Math.floor(damageBonus * 0.25),
        description: 'Замедление противников'
      };
    case 'light':
      return {
        type: 'light',
        resistanceBonus: Math.floor(damageBonus * 0.6),
        description: 'Сопротивление негативным эффектам'
      };
    case 'dark':
      return {
        type: 'dark',
        lifestealBonus: Math.floor(damageBonus * 0.15),
        description: 'Похищение жизни при атаках'
      };
    default:
      return null;
  }
};

// Проверка условий для эволюции питомца
const checkEvolutionRequirements = (pet) => {
  if (!pet) return { canEvolve: false };
  
  const currentStage = pet.evolutionStage || pet.pet?.evolution_stage || 'baby';
  const level = pet.level || 1;
  const loyalty = pet.loyalty || 0;
  
  // Требования для каждой стадии эволюции
  const requirements = {
    'egg': { level: 1, loyalty: 20 },
    'baby': { level: 10, loyalty: 50 },
    'juvenile': { level: 25, loyalty: 70 },
    'adult': { level: 40, loyalty: 85 },
    'mature': { level: 60, loyalty: 95 },
    'ancient': { level: 80, loyalty: 100, special: true },
    'transcendent': { level: 100, loyalty: 100, special: true, items: true }
  };
  
  // Определяем следующую стадию
  const evolutionOrder = ['egg', 'baby', 'juvenile', 'adult', 'mature', 'ancient', 'transcendent'];
  const currentIndex = evolutionOrder.indexOf(currentStage);
  
  // Если питомец уже на максимальной стадии
  if (currentIndex === evolutionOrder.length - 1 || currentIndex === -1) {
    return { canEvolve: false };
  }
  
  const nextStage = evolutionOrder[currentIndex + 1];
  const req = requirements[nextStage];
  
  // Проверяем требования
  const meetsLevelReq = level >= req.level;
  const meetsLoyaltyReq = loyalty >= req.loyalty;
  const needsSpecialItem = req.special || false;
  const needsRareItems = req.items || false;
  
  return {
    canEvolve: meetsLevelReq && meetsLoyaltyReq && !needsSpecialItem && !needsRareItems,
    nextStage,
    requirements: {
      level: req.level,
      loyalty: req.loyalty,
      needsSpecialItem,
      needsRareItems
    },
    currentProgress: {
      level,
      loyalty,
      levelPercentage: Math.min(100, (level / req.level) * 100),
      loyaltyPercentage: Math.min(100, (loyalty / req.loyalty) * 100)
    }
  };
};

// Экспортируем объект в формате CommonJS
module.exports = {
  petTypeNames,
  elementTypeNames,
  rarityNames,
  petTypeDescriptions,
  evolutionStages,
  calculateExpForLevel,
  calculateStatBonus,
  calculateCombatBonus,
  calculateElementalBonus,
  checkEvolutionRequirements,
  petTypeAbilities
};