/**
 * Клиентская версия данных о духовных питомцах без серверных зависимостей
 * Используется в браузере вместо оригинального spirit-pets.js
 */

// Типы питомцев
const PET_TYPES = {
  ELEMENTAL: 'elemental',  // Элементальные
  BEAST: 'beast',          // Звери
  MYTHICAL: 'mythical',    // Мифические
  CELESTIAL: 'celestial',  // Небесные
  DEMONIC: 'demonic'       // Демонические
};

// Элементы питомцев
const PET_ELEMENTS = {
  NONE: 'none',
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  METAL: 'metal',
  WOOD: 'wood',
  LIGHTNING: 'lightning',
  WIND: 'wind',
  ICE: 'ice',
  DARK: 'dark',
  LIGHT: 'light'
};

// Редкость питомцев
const PET_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic'
};

// Названия типов питомцев
const petTypeNames = {
  elemental: 'Элементальный',
  beast: 'Зверь',
  mythical: 'Мифический',
  celestial: 'Небесный',
  demonic: 'Демонический'
};

// Описания типов питомцев
const petTypeDescriptions = {
  elemental: 'Сущности, состоящие из чистых элементов, сильны в стихийной магии',
  beast: 'Духовные звери с природными способностями и высокой адаптивностью',
  mythical: 'Редкие существа из древних легенд с уникальными способностями',
  celestial: 'Питомцы, связанные с небесными телами, обладают мощной энергией',
  demonic: 'Темные сущности с разрушительными способностями и высокой силой'
};

// Базовые характеристики типов питомцев
const petTypeBaseStats = {
  elemental: { attack: 8, defense: 8, health: 80, energy: 100, speed: 10 },
  beast: { attack: 12, defense: 10, health: 100, energy: 80, speed: 12 },
  mythical: { attack: 15, defense: 15, health: 120, energy: 120, speed: 15 },
  celestial: { attack: 20, defense: 18, health: 150, energy: 200, speed: 18 },
  demonic: { attack: 25, defense: 12, health: 130, energy: 150, speed: 20 }
};

// Способности типов питомцев
const petTypeAbilities = {
  elemental: [
    { name: 'Элементальное усиление', description: 'Усиливает стихийный урон хозяина' },
    { name: 'Стихийный щит', description: 'Снижает получаемый хозяином стихийный урон' }
  ],
  beast: [
    { name: 'Природная регенерация', description: 'Постепенно восстанавливает здоровье хозяина' },
    { name: 'Обострённые чувства', description: 'Повышает точность атак хозяина' }
  ],
  mythical: [
    { name: 'Мифическая аура', description: 'Повышает все характеристики хозяина' },
    { name: 'Тайное знание', description: 'Увеличивает скорость культивации хозяина' }
  ],
  celestial: [
    { name: 'Небесная защита', description: 'Шанс полностью блокировать атаку по хозяину' },
    { name: 'Звёздная энергия', description: 'Увеличивает максимальный запас энергии хозяина' }
  ],
  demonic: [
    { name: 'Демоническая ярость', description: 'Значительно повышает урон хозяина' },
    { name: 'Тёмная кровь', description: 'Хозяин восстанавливает здоровье при нанесении урона' }
  ]
};

// Стадии эволюции питомцев
const evolutionStages = [
  { name: 'Начальная форма', minLevel: 1, bonusMultiplier: 1.0 },
  { name: 'Развитая форма', minLevel: 15, bonusMultiplier: 1.5 },
  { name: 'Продвинутая форма', minLevel: 30, bonusMultiplier: 2.0 },
  { name: 'Духовная форма', minLevel: 50, bonusMultiplier: 3.0 },
  { name: 'Божественная форма', minLevel: 70, bonusMultiplier: 5.0 }
];

// Базовые духовные питомцы для клиентского использования
const spiritPets = [
  {
    id: 'fire_fox',
    name: 'Огненный лис',
    description: 'Маленький огненный лис с ярко-красным мехом. Обладает способностью создавать небольшие языки пламени.',
    type: PET_TYPES.BEAST,
    element: PET_ELEMENTS.FIRE,
    rarity: PET_RARITY.UNCOMMON,
    level: 1,
    maxLevel: 30,
    stats: {
      attack: 10,
      defense: 5,
      health: 50,
      energy: 80,
      speed: 15
    },
    skills: [
      {
        name: 'Огненное дыхание',
        description: 'Лис выдыхает небольшой поток пламени, наносящий урон огнем.',
        damage: 15,
        cooldown: 3,
        energyCost: 10,
        element: PET_ELEMENTS.FIRE
      },
      {
        name: 'Согревающая аура',
        description: 'Лис излучает тепло, повышая огненное сопротивление хозяина.',
        effect: { type: 'fireResistance', value: 0.1 },
        cooldown: 0,
        energyCost: 0,
        duration: 0
      }
    ],
    evolutionRequirements: {
      level: 15,
      items: [{ id: 'fire_essence', amount: 3 }]
    },
    evolutionId: 'flame_fox',
    bonuses: {
      fire: 0.1,
      perception: 0.05
    }
  },
  {
    id: 'stone_tortoise',
    name: 'Каменная черепаха',
    description: 'Маленькая черепаха с панцирем, покрытым каменными наростами. Очень выносливая и защищает хозяина.',
    type: PET_TYPES.BEAST,
    element: PET_ELEMENTS.EARTH,
    rarity: PET_RARITY.UNCOMMON,
    level: 1,
    maxLevel: 30,
    stats: {
      attack: 5,
      defense: 20,
      health: 100,
      energy: 60,
      speed: 5
    },
    skills: [
      {
        name: 'Каменный щит',
        description: 'Черепаха создает щит из камня, снижающий получаемый урон.',
        effect: { type: 'damageReduction', value: 0.2 },
        cooldown: 5,
        energyCost: 15,
        duration: 3
      },
      {
        name: 'Каменная кожа',
        description: 'Пассивная способность. Увеличивает защиту хозяина.',
        effect: { type: 'defense', value: 5 },
        cooldown: 0,
        energyCost: 0,
        duration: 0
      }
    ],
    evolutionRequirements: {
      level: 15,
      items: [{ id: 'earth_essence', amount: 3 }]
    },
    evolutionId: 'mountain_tortoise',
    bonuses: {
      earth: 0.1,
      endurance: 0.05
    }
  },
  {
    id: 'wind_sparrow',
    name: 'Ветряной воробей',
    description: 'Маленькая птица, окруженная легким ветерком. Очень быстрая и маневренная.',
    type: PET_TYPES.BEAST,
    element: PET_ELEMENTS.WIND,
    rarity: PET_RARITY.UNCOMMON,
    level: 1,
    maxLevel: 30,
    stats: {
      attack: 8,
      defense: 4,
      health: 40,
      energy: 70,
      speed: 25
    },
    skills: [
      {
        name: 'Порыв ветра',
        description: 'Воробей создает сильный порыв ветра, наносящий урон и отбрасывающий противника.',
        damage: 10,
        effect: { type: 'knockback', value: 2 },
        cooldown: 4,
        energyCost: 12,
        element: PET_ELEMENTS.WIND
      },
      {
        name: 'Ускорение',
        description: 'Воробей создает попутный ветер, увеличивающий скорость хозяина.',
        effect: { type: 'speed', value: 0.15 },
        cooldown: 6,
        energyCost: 10,
        duration: 4
      }
    ],
    evolutionRequirements: {
      level: 15,
      items: [{ id: 'wind_essence', amount: 3 }]
    },
    evolutionId: 'storm_hawk',
    bonuses: {
      wind: 0.1,
      agility: 0.05
    }
  },
  {
    id: 'water_carp',
    name: 'Водяной карп',
    description: 'Карп, способный левитировать в воздухе, окруженный водяной оболочкой.',
    type: PET_TYPES.BEAST,
    element: PET_ELEMENTS.WATER,
    rarity: PET_RARITY.UNCOMMON,
    level: 1,
    maxLevel: 30,
    stats: {
      attack: 7,
      defense: 8,
      health: 70,
      energy: 90,
      speed: 12
    },
    skills: [
      {
        name: 'Водяной шар',
        description: 'Карп создает шар из воды и запускает его в противника.',
        damage: 12,
        cooldown: 3,
        energyCost: 8,
        element: PET_ELEMENTS.WATER
      },
      {
        name: 'Очищающие брызги',
        description: 'Карп разбрызгивает воду, которая исцеляет хозяина.',
        effect: { type: 'heal', value: 10 },
        cooldown: 5,
        energyCost: 15,
        duration: 0
      }
    ],
    evolutionRequirements: {
      level: 15,
      items: [{ id: 'water_essence', amount: 3 }]
    },
    evolutionId: 'water_dragon',
    bonuses: {
      water: 0.1,
      spirit: 0.05
    }
  },
  {
    id: 'mini_thunderbird',
    name: 'Мини-громоптица',
    description: 'Маленькая птица, тело которой испускает электрические искры. Очень энергичная и быстрая.',
    type: PET_TYPES.MYTHICAL,
    element: PET_ELEMENTS.LIGHTNING,
    rarity: PET_RARITY.RARE,
    level: 1,
    maxLevel: 40,
    stats: {
      attack: 15,
      defense: 6,
      health: 60,
      energy: 100,
      speed: 20
    },
    skills: [
      {
        name: 'Электрический разряд',
        description: 'Громоптица высвобождает заряд электричества, наносящий урон нескольким противникам.',
        damage: 18,
        aoe: true,
        cooldown: 4,
        energyCost: 15,
        element: PET_ELEMENTS.LIGHTNING
      },
      {
        name: 'Наэлектризованные перья',
        description: 'Перья громоптицы наэлектризованы и наносят урон при прикосновении.',
        effect: { type: 'thorns', value: 5 },
        cooldown: 0,
        energyCost: 0,
        duration: 0
      }
    ],
    evolutionRequirements: {
      level: 20,
      items: [
        { id: 'lightning_essence', amount: 5 },
        { id: 'mythical_feather', amount: 1 }
      ]
    },
    evolutionId: 'thunderbird',
    bonuses: {
      lightning: 0.15,
      speed: 0.1
    }
  }
];

/**
 * Рассчитывает требуемый опыт для достижения определенного уровня
 * @param {number} level Уровень питомца
 * @returns {number} Количество опыта, необходимое для достижения этого уровня
 */
const calculateExpForLevel = (level) => {
  // Формула: 100 * (level^2.5)
  return Math.floor(100 * Math.pow(level, 2.5));
};

/**
 * Рассчитывает бонус к характеристикам от уровня питомца
 * @param {number} baseStat Базовое значение характеристики
 * @param {number} level Текущий уровень питомца
 * @param {number} rarity Редкость питомца (от 1 до 6)
 * @returns {number} Итоговое значение характеристики
 */
const calculateStatBonus = (baseStat, level, rarity = 1) => {
  const rarityMultiplier = 0.5 + (rarity * 0.1);
  // Прирост 5-10% за уровень в зависимости от редкости
  return Math.floor(baseStat * (1 + (level - 1) * 0.05 * rarityMultiplier));
};

/**
 * Рассчитывает бонус к боевым характеристикам от питомца
 * @param {Object} pet Объект питомца
 * @param {Object} baseStats Базовые характеристики персонажа
 * @returns {Object} Бонусы к характеристикам
 */
const calculateCombatBonus = (pet, baseStats) => {
  if (!pet) return {};
  
  const bonuses = {};
  const level = pet.level || 1;
  const petType = pet.type || 'beast';
  
  // Базовые бонусы в зависимости от типа питомца
  switch (petType) {
    case 'elemental':
      bonuses.elementalDamage = 0.05 + (level * 0.005);
      bonuses.elementalResistance = 0.03 + (level * 0.003);
      break;
    case 'beast':
      bonuses.physicalDamage = 0.04 + (level * 0.004);
      bonuses.critChance = 0.02 + (level * 0.002);
      break;
    case 'mythical':
      bonuses.allDamage = 0.03 + (level * 0.003);
      bonuses.allResistance = 0.03 + (level * 0.003);
      break;
    case 'celestial':
      bonuses.maxEnergy = 10 + (level * 2);
      bonuses.energyRegen = 0.1 + (level * 0.01);
      break;
    case 'demonic':
      bonuses.critDamage = 0.05 + (level * 0.005);
      bonuses.lifeSteal = 0.02 + (level * 0.002);
      break;
  }
  
  // Добавляем бонусы в зависимости от элемента питомца
  if (pet.element && pet.element !== 'none') {
    bonuses[`${pet.element}Damage`] = 0.05 + (level * 0.005);
    bonuses[`${pet.element}Resistance`] = 0.03 + (level * 0.003);
  }
  
  return bonuses;
};

/**
 * Загружает всех духовных питомцев (клиентская версия)
 * @returns {Promise<Array>} Массив духовных питомцев
 */
async function loadSpiritPets() {
  return spiritPets;
}

/**
 * Получает духовного питомца по ID (клиентская версия)
 * @param {string} id ID питомца
 * @returns {Promise<Object|null>} Духовный питомец или null, если питомец не найден
 */
async function getSpiritPetById(id) {
  return spiritPets.find(pet => pet.id === id) || null;
}

/**
 * Получает духовных питомцев по типу (клиентская версия)
 * @param {string} type Тип питомца
 * @returns {Promise<Array>} Массив духовных питомцев указанного типа
 */
async function getSpiritPetsByType(type) {
  return spiritPets.filter(pet => pet.type === type);
}

/**
 * Получает духовных питомцев по элементу (клиентская версия)
 * @param {string} element Элемент питомца
 * @returns {Promise<Array>} Массив духовных питомцев указанного элемента
 */
async function getSpiritPetsByElement(element) {
  return spiritPets.filter(pet => pet.element === element);
}

/**
 * Получает духовных питомцев по редкости (клиентская версия)
 * @param {string} rarity Редкость питомца
 * @returns {Promise<Array>} Массив духовных питомцев указанной редкости
 */
async function getSpiritPetsByRarity(rarity) {
  return spiritPets.filter(pet => pet.rarity === rarity);
}

/**
 * Получает информацию об эволюции питомца (клиентская версия)
 * @param {string} petId ID питомца
 * @returns {Promise<Object|null>} Информация об эволюции или null
 */
async function getPetEvolutionInfo(petId) {
  const pet = await getSpiritPetById(petId);
  if (!pet || !pet.evolutionId) return null;
  
  const evolutionPet = await getSpiritPetById(pet.evolutionId);
  return {
    currentPet: pet,
    evolutionPet: evolutionPet,
    requirements: pet.evolutionRequirements || {}
  };
}

/**
 * Получает навыки питомца (клиентская версия)
 * @param {string} petId ID питомца
 * @returns {Promise<Array>} Массив навыков питомца
 */
async function getPetSkills(petId) {
  const pet = await getSpiritPetById(petId);
  return pet ? pet.skills || [] : [];
}

/**
 * Инициализирует данные о духовных питомцах (клиентская версия - ничего не делает)
 */
async function initSpiritPetData() {
  console.log('Client version: Spirit pet data initialization skipped');
  return;
}