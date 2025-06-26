/**
 * Модуль с константами для алхимии
 * Выделен отдельно для предотвращения циклических зависимостей
 */

// Типы алхимических предметов
const ITEM_TYPES = {
  INGREDIENT: 'ingredient',
  POTION: 'potion',
  ELIXIR: 'elixir',
  PILL: 'pill',
  TALISMAN: 'talisman',
  SCROLL: 'scroll',
  ESSENCE: 'essence'
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

// Типы эффектов алхимии
const EFFECT_TYPES = {
  BUFF: 'buff',
  HEALING: 'healing',
  DAMAGE: 'damage',
  UTILITY: 'utility',
  TRANSFORMATION: 'transformation',
  CULTIVATION: 'cultivation'
};

// Категории рецептов
const RECIPE_CATEGORIES = {
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  MASTER: 'master',
  GRANDMASTER: 'grandmaster',
  SECRET: 'secret'
};

// Экспортируем константы
module.exports = {
  ITEM_TYPES,
  RARITY,
  EFFECT_TYPES,
  RECIPE_CATEGORIES
};