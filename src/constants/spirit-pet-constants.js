/**
 * Модуль с константами для духовных питомцев
 * Выделен отдельно для предотвращения циклических зависимостей
 */

// Типы питомцев
const PET_TYPES = {
  ELEMENTAL: 'elemental',
  BEAST: 'beast',
  MYTHICAL: 'mythical',
  CELESTIAL: 'celestial',
  DEMONIC: 'demonic',
  SPECTRAL: 'spectral'
};

// Элементы питомцев
const PET_ELEMENTS = {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  WIND: 'wind',
  LIGHTNING: 'lightning',
  ICE: 'ice',
  LIGHT: 'light',
  DARK: 'dark',
  VOID: 'void'
};

// Редкость питомцев
const PET_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic',
  DIVINE: 'divine'
};

// Базовые статы для разных типов питомцев
const petTypeBaseStats = {
  elemental: {
    hp: 80,
    attack: 120,
    defense: 80,
    speed: 100,
    specialAttack: 150,
    specialDefense: 100
  },
  beast: {
    hp: 150,
    attack: 130,
    defense: 100,
    speed: 90,
    specialAttack: 70,
    specialDefense: 80
  },
  mythical: {
    hp: 100,
    attack: 100,
    defense: 100,
    speed: 100,
    specialAttack: 130,
    specialDefense: 120
  },
  celestial: {
    hp: 120,
    attack: 100,
    defense: 100,
    speed: 120,
    specialAttack: 140,
    specialDefense: 130
  },
  demonic: {
    hp: 110,
    attack: 150,
    defense: 90,
    speed: 110,
    specialAttack: 120,
    specialDefense: 80
  },
  spectral: {
    hp: 90,
    attack: 110,
    defense: 70,
    speed: 140,
    specialAttack: 130,
    specialDefense: 120
  }
};

// Стадии эволюции
const evolutionStages = {
  BABY: 'baby',
  JUVENILE: 'juvenile',
  MATURE: 'mature',
  ELDER: 'elder',
  ANCIENT: 'ancient',
  TRANSCENDENT: 'transcendent'
};

// Экспортируем константы
module.exports = {
  PET_TYPES,
  PET_ELEMENTS,
  PET_RARITY,
  petTypeBaseStats,
  evolutionStages
};