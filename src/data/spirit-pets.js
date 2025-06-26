/**
 * Данные о типах духовных питомцев
 */

// Типы духовных питомцев
const petTypes = {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  WIND: 'wind',
  LIGHTNING: 'lightning',
  WOOD: 'wood',
  METAL: 'metal',
  DARKNESS: 'darkness',
  LIGHT: 'light',
};

// Названия типов на русском
const petTypeNames = {
  [petTypes.FIRE]: 'Огненный',
  [petTypes.WATER]: 'Водный',
  [petTypes.EARTH]: 'Земляной',
  [petTypes.WIND]: 'Ветряной',
  [petTypes.LIGHTNING]: 'Молниевый',
  [petTypes.WOOD]: 'Древесный',
  [petTypes.METAL]: 'Металлический',
  [petTypes.DARKNESS]: 'Теневой',
  [petTypes.LIGHT]: 'Светлый',
};

// Описания типов
const petTypeDescriptions = {
  [petTypes.FIRE]: 'Огненные питомцы обладают высокой атакующей силой и способностью наносить урон от огня. Они отлично подходят для боя, но требуют особого ухода из-за своего пылкого нрава.',
  [petTypes.WATER]: 'Водные питомцы обладают целительными способностями и могут помогать в восстановлении энергии. Они спокойны и легко приручаются, но слабы против молниевых атак.',
  [petTypes.EARTH]: 'Земляные питомцы имеют высокую защиту и выносливость. Они медлительны, но очень надежны в бою и при исследовании опасных территорий.',
  [petTypes.WIND]: 'Ветряные питомцы отличаются высокой скоростью и ловкостью. Они помогают быстрее перемещаться по миру и уклоняться от атак в бою.',
  [petTypes.LIGHTNING]: 'Молниевые питомцы наносят мощные атаки и могут оглушать противников. Они быстры и смертоносны, но сложны в приручении из-за своего непредсказуемого характера.',
  [petTypes.WOOD]: 'Древесные питомцы специализируются на регенерации и поддержке. Они могут усиливать рост растений и помогать в сборе редких трав.',
  [petTypes.METAL]: 'Металлические питомцы обладают высокой защитой и проникающими атаками. Они помогают в поиске руд и минералов при исследовании.',
  [petTypes.DARKNESS]: 'Теневые питомцы специализируются на скрытности и ослаблении противников. Они могут помогать в незаметном перемещении и обнаружении скрытых сокровищ.',
  [petTypes.LIGHT]: 'Светлые питомцы обладают очищающими способностями и могут рассеивать иллюзии. Они эффективны против теневых существ и помогают в исследовании темных мест.',
};

// Базовые характеристики для каждого типа
const petTypeBaseStats = {
  [petTypes.FIRE]: {
    strength: 8,
    intelligence: 5,
    agility: 7,
    vitality: 4,
    spirit: 6
  },
  [petTypes.WATER]: {
    strength: 4,
    intelligence: 8,
    agility: 6,
    vitality: 6,
    spirit: 6
  },
  [petTypes.EARTH]: {
    strength: 7,
    intelligence: 4,
    agility: 3,
    vitality: 9,
    spirit: 7
  },
  [petTypes.WIND]: {
    strength: 5,
    intelligence: 6,
    agility: 9,
    vitality: 4,
    spirit: 6
  },
  [petTypes.LIGHTNING]: {
    strength: 7,
    intelligence: 7,
    agility: 8,
    vitality: 3,
    spirit: 5
  },
  [petTypes.WOOD]: {
    strength: 5,
    intelligence: 7,
    agility: 4,
    vitality: 8,
    spirit: 6
  },
  [petTypes.METAL]: {
    strength: 8,
    intelligence: 5,
    agility: 4,
    vitality: 8,
    spirit: 5
  },
  [petTypes.DARKNESS]: {
    strength: 6,
    intelligence: 8,
    agility: 7,
    vitality: 4,
    spirit: 5
  },
  [petTypes.LIGHT]: {
    strength: 6,
    intelligence: 7,
    agility: 6,
    vitality: 5,
    spirit: 8
  }
};

// Способности питомцев по типам
const petTypeAbilities = {
  [petTypes.FIRE]: [
    {
      id: 'fire_breath',
      name: 'Огненное дыхание',
      description: 'Питомец выдыхает поток пламени, нанося урон от огня всем противникам.',
      unlockLevel: 1,
      cooldown: 3,
      energyCost: 20,
      damageMultiplier: 1.5,
      type: 'attack',
      element: 'fire'
    },
    {
      id: 'heat_aura',
      name: 'Аура жара',
      description: 'Питомец создает ауру жара, увеличивая атаку хозяина и нанося периодический урон противникам.',
      unlockLevel: 5,
      cooldown: 5,
      energyCost: 30,
      buffDuration: 3,
      buffStrength: 1.2,
      type: 'buff',
      element: 'fire'
    },
    {
      id: 'meteor_strike',
      name: 'Метеоритный удар',
      description: 'Питомец призывает небольшой метеорит, наносящий большой урон одному противнику с шансом поджечь его.',
      unlockLevel: 10,
      cooldown: 6,
      energyCost: 50,
      damageMultiplier: 2.5,
      burnChance: 0.3,
      burnDuration: 2,
      type: 'attack',
      element: 'fire'
    }
  ],
  [petTypes.WATER]: [
    {
      id: 'water_splash',
      name: 'Водяной всплеск',
      description: 'Питомец создает всплеск воды, нанося урон противникам и имея шанс замедлить их.',
      unlockLevel: 1,
      cooldown: 2,
      energyCost: 15,
      damageMultiplier: 1.0,
      slowChance: 0.3,
      slowDuration: 2,
      type: 'attack',
      element: 'water'
    },
    {
      id: 'healing_rain',
      name: 'Исцеляющий дождь',
      description: 'Питомец вызывает целебный дождь, восстанавливающий здоровье хозяина и союзников.',
      unlockLevel: 5,
      cooldown: 4,
      energyCost: 35,
      healingMultiplier: 1.5,
      duration: 3,
      type: 'heal',
      element: 'water'
    },
    {
      id: 'tidal_wave',
      name: 'Приливная волна',
      description: 'Питомец создает мощную волну, наносящую большой урон всем противникам и отбрасывающую их назад.',
      unlockLevel: 10,
      cooldown: 6,
      energyCost: 45,
      damageMultiplier: 2.0,
      knockbackChance: 0.7,
      type: 'attack',
      element: 'water'
    }
  ],
  // Другие типы питомцев и их способности...
  [petTypes.EARTH]: [
    {
      id: 'stone_armor',
      name: 'Каменная броня',
      description: 'Питомец создает защитную броню из камня для хозяина, увеличивая его защиту.',
      unlockLevel: 1,
      cooldown: 4,
      energyCost: 25,
      buffDuration: 3,
      defenseBonus: 1.5,
      type: 'buff',
      element: 'earth'
    },
    {
      id: 'earth_spike',
      name: 'Земляной шип',
      description: 'Питомец создает острый шип из земли, наносящий урон одному противнику и замедляющий его.',
      unlockLevel: 5,
      cooldown: 3,
      energyCost: 20,
      damageMultiplier: 1.3,
      slowChance: 0.5,
      slowDuration: 2,
      type: 'attack',
      element: 'earth'
    },
    {
      id: 'earthquake',
      name: 'Землетрясение',
      description: 'Питомец вызывает локальное землетрясение, наносящее урон всем противникам и имеющее шанс оглушить их.',
      unlockLevel: 10,
      cooldown: 7,
      energyCost: 55,
      damageMultiplier: 1.8,
      stunChance: 0.3,
      stunDuration: 1,
      type: 'attack',
      element: 'earth'
    }
  ],
  [petTypes.WIND]: [
    {
      id: 'swift_winds',
      name: 'Быстрые ветра',
      description: 'Питомец создает потоки ветра, увеличивающие скорость хозяина и шанс уклонения.',
      unlockLevel: 1,
      cooldown: 4,
      energyCost: 20,
      buffDuration: 3,
      speedBonus: 1.3,
      evasionBonus: 0.15,
      type: 'buff',
      element: 'wind'
    },
    {
      id: 'wind_slash',
      name: 'Ветряной разрез',
      description: 'Питомец создает острые потоки воздуха, наносящие урон одному противнику несколько раз.',
      unlockLevel: 5,
      cooldown: 3,
      energyCost: 25,
      damageMultiplier: 0.7,
      hitCount: 3,
      type: 'attack',
      element: 'wind'
    },
    {
      id: 'cyclone',
      name: 'Циклон',
      description: 'Питомец создает мощный циклон, наносящий урон всем противникам и отбрасывающий их.',
      unlockLevel: 10,
      cooldown: 6,
      energyCost: 45,
      damageMultiplier: 1.6,
      knockbackChance: 0.8,
      type: 'attack',
      element: 'wind'
    }
  ]
};

// Стадии эволюции питомцев
const evolutionStages = {
  1: {
    name: 'Детеныш',
    description: 'Первая стадия развития духовного питомца. Слабый, но с большим потенциалом.',
    statMultiplier: 1.0,
    expToNextLevel: 100
  },
  2: {
    name: 'Подросток',
    description: 'Вторая стадия развития. Питомец становится сильнее и получает доступ к новым способностям.',
    statMultiplier: 1.5,
    expToNextLevel: 300,
    requiredLevel: 10
  },
  3: {
    name: 'Взрослый',
    description: 'Третья стадия развития. Питомец достигает зрелости и раскрывает большую часть своего потенциала.',
    statMultiplier: 2.0,
    expToNextLevel: 600,
    requiredLevel: 20
  },
  4: {
    name: 'Духовный',
    description: 'Четвертая стадия развития. Питомец становится настоящим духовным существом с огромной силой.',
    statMultiplier: 3.0,
    expToNextLevel: 1000,
    requiredLevel: 30
  },
  5: {
    name: 'Легендарный',
    description: 'Финальная стадия развития. Питомец достигает легендарного статуса и обладает невероятной мощью.',
    statMultiplier: 5.0,
    requiredLevel: 40
  }
};

// Места для поиска питомцев
const petSpawnLocations = {
  'Огненные горы': [petTypes.FIRE],
  'Озеро духов': [petTypes.WATER],
  'Каменистые равнины': [petTypes.EARTH],
  'Долина ветров': [petTypes.WIND],
  'Грозовой пик': [petTypes.LIGHTNING],
  'Древний лес': [petTypes.WOOD],
  'Рудные пещеры': [petTypes.METAL],
  'Сумрачная долина': [petTypes.DARKNESS],
  'Светящийся лес': [petTypes.LIGHT],
  'Мистический лес': [petTypes.FIRE, petTypes.WATER, petTypes.EARTH, petTypes.WIND],
  'Пещеры стихий': [petTypes.FIRE, petTypes.WATER, petTypes.EARTH, petTypes.METAL],
  'Небесные острова': [petTypes.WIND, petTypes.LIGHTNING, petTypes.LIGHT]
};

// Предметы для кормления питомцев
const petFoodItems = {
  'common_meat': {
    name: 'Обычное мясо',
    nutritionValue: 10,
    loyaltyBonus: 1,
    description: 'Обычное мясо диких животных. Подходит для кормления большинства питомцев.'
  },
  'spirit_fruit': {
    name: 'Духовный фрукт',
    nutritionValue: 15,
    loyaltyBonus: 2,
    description: 'Фрукт, наполненный духовной энергией. Питомцы любят его сладкий вкус.'
  },
  'elemental_essence': {
    name: 'Стихийная эссенция',
    nutritionValue: 20,
    loyaltyBonus: 3,
    statBonus: {
      strength: 0.5,
      intelligence: 0.5,
      agility: 0.5,
      vitality: 0.5,
      spirit: 0.5
    },
    description: 'Концентрированная стихийная энергия. Восстанавливает голод и немного повышает все характеристики питомца.'
  },
  'fire_crystal': {
    name: 'Огненный кристалл',
    nutritionValue: 25,
    loyaltyBonus: 2,
    statBonus: {
      strength: 1.5
    },
    preferredTypes: [petTypes.FIRE],
    description: 'Кристалл, наполненный огненной энергией. Особенно полезен для огненных питомцев.'
  },
  'water_pearl': {
    name: 'Водяная жемчужина',
    nutritionValue: 25,
    loyaltyBonus: 2,
    statBonus: {
      intelligence: 1.5
    },
    preferredTypes: [petTypes.WATER],
    description: 'Жемчужина, наполненная водной энергией. Особенно полезна для водных питомцев.'
  },
  'earth_core': {
    name: 'Земляное ядро',
    nutritionValue: 25,
    loyaltyBonus: 2,
    statBonus: {
      vitality: 1.5
    },
    preferredTypes: [petTypes.EARTH],
    description: 'Ядро, наполненное земляной энергией. Особенно полезно для земляных питомцев.'
  },
  'wind_feather': {
    name: 'Ветряное перо',
    nutritionValue: 25,
    loyaltyBonus: 2,
    statBonus: {
      agility: 1.5
    },
    preferredTypes: [petTypes.WIND],
    description: 'Перо, наполненное энергией ветра. Особенно полезно для ветряных питомцев.'
  },
  'lightning_shard': {
    name: 'Осколок молнии',
    nutritionValue: 25,
    loyaltyBonus: 2,
    statBonus: {
      strength: 1.0,
      agility: 1.0
    },
    preferredTypes: [petTypes.LIGHTNING],
    description: 'Осколок, наполненный энергией молнии. Особенно полезен для молниевых питомцев.'
  }
};

// Расчет опыта, необходимого для повышения уровня
const calculateExpForLevel = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Расчет бонуса к характеристикам от уровня питомца
const calculateStatBonus = (baseStats, level, evolutionStage) => {
  const stageMultiplier = evolutionStages[evolutionStage].statMultiplier;
  const levelMultiplier = 1 + (level - 1) * 0.1;
  
  return {
    strength: Math.floor(baseStats.strength * stageMultiplier * levelMultiplier),
    intelligence: Math.floor(baseStats.intelligence * stageMultiplier * levelMultiplier),
    agility: Math.floor(baseStats.agility * stageMultiplier * levelMultiplier),
    vitality: Math.floor(baseStats.vitality * stageMultiplier * levelMultiplier),
    spirit: Math.floor(baseStats.spirit * stageMultiplier * levelMultiplier)
  };
};

// Расчет бонуса к боевым характеристикам от питомца
const calculateCombatBonus = (pet) => {
  const stats = calculateStatBonus(
    petTypeBaseStats[pet.type], 
    pet.level, 
    pet.evolutionStage
  );
  
  return {
    attack: Math.floor(stats.strength * 1.5 + stats.intelligence * 0.5),
    defense: Math.floor(stats.vitality * 1.5 + stats.strength * 0.5),
    speed: Math.floor(stats.agility * 1.5 + stats.spirit * 0.5),
    critChance: Math.min(0.05 + stats.agility * 0.002, 0.3),
    healthBonus: Math.floor(stats.vitality * 5),
    energyBonus: Math.floor(stats.spirit * 5)
  };
};

module.exports = {
  petTypes,
  petTypeNames,
  petTypeDescriptions,
  petTypeBaseStats,
  petTypeAbilities,
  evolutionStages,
  petSpawnLocations,
  petFoodItems,
  calculateExpForLevel,
  calculateStatBonus,
  calculateCombatBonus
};
