/**
 * Модуль с константами для игровых предметов
 * Выделен отдельно для предотвращения циклических зависимостей
 */

// Типы предметов
const ITEM_TYPES = {
  CONSUMABLE: 'consumable',
  MATERIAL: 'material',
  QUEST: 'quest',
  CULTIVATION: 'cultivation',
  CURRENCY: 'currency',
  KEY: 'key',
  SCROLL: 'scroll',
  CONTAINER: 'container'
};

// Категории расходных предметов
const CONSUMABLE_CATEGORIES = {
  POTION: 'potion',
  FOOD: 'food',
  ELIXIR: 'elixir',
  PILL: 'pill',
  TALISMAN: 'talisman'
};

// Категории материалов
const MATERIAL_CATEGORIES = {
  HERB: 'herb',
  ORE: 'ore',
  WOOD: 'wood',
  LEATHER: 'leather',
  GEM: 'gem',
  ESSENCE: 'essence',
  SPIRIT: 'spirit',
  BONE: 'bone',
  METAL: 'metal',
  CLOTH: 'cloth',
  CRYSTAL: 'crystal'
};

// Уровни редкости
const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic',
  DIVINE: 'divine',
  TRANSCENDENT: 'transcendent'
};

// Типы эффектов предметов
const EFFECT_TYPES = {
  HEALING: 'healing',
  MANA_RESTORE: 'manaRestore',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  DAMAGE: 'damage',
  TELEPORT: 'teleport',
  TRANSFORM: 'transform',
  SUMMON: 'summon',
  CULTIVATION: 'cultivation',
  SPECIAL: 'special'
};

// Длительность эффектов
const DURATION_TYPES = {
  INSTANT: 'instant',
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long',
  PERMANENT: 'permanent'
};

// Базовые предметы, которые всегда доступны в игре
const BASIC_ITEMS = {
  healthPotion: {
    id: 'basic_health_potion',
    name: 'Зелье здоровья',
    type: ITEM_TYPES.CONSUMABLE,
    category: CONSUMABLE_CATEGORIES.POTION,
    rarity: RARITY.COMMON,
    description: 'Восстанавливает небольшое количество здоровья',
    effectType: EFFECT_TYPES.HEALING,
    effectValue: 50,
    effectDuration: DURATION_TYPES.INSTANT,
    stackSize: 10,
    value: 25
  },
  manaPotion: {
    id: 'basic_mana_potion',
    name: 'Зелье маны',
    type: ITEM_TYPES.CONSUMABLE,
    category: CONSUMABLE_CATEGORIES.POTION,
    rarity: RARITY.COMMON,
    description: 'Восстанавливает небольшое количество маны',
    effectType: EFFECT_TYPES.MANA_RESTORE,
    effectValue: 50,
    effectDuration: DURATION_TYPES.INSTANT,
    stackSize: 10,
    value: 25
  }
};

// Экспортируем константы
module.exports = {
  ITEM_TYPES,
  CONSUMABLE_CATEGORIES,
  MATERIAL_CATEGORIES,
  RARITY,
  EFFECT_TYPES,
  DURATION_TYPES,
  BASIC_ITEMS
};