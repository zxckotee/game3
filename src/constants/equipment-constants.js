/**
 * Модуль с константами для оборудования
 * Выделен отдельно для предотвращения циклических зависимостей
 */

// Типы оборудования
const EQUIPMENT_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  HELMET: 'helmet',
  BOOTS: 'boots',
  GLOVES: 'gloves',
  BELT: 'belt',
  AMULET: 'amulet',
  RING: 'ring',
  TALISMAN: 'talisman',
  ACCESSORY: 'accessory'
};

// Категории оружия
const WEAPON_CATEGORIES = {
  SWORD: 'sword',
  SABER: 'saber',
  SPEAR: 'spear',
  BOW: 'bow',
  STAFF: 'staff',
  DAGGER: 'dagger',
  WHIP: 'whip',
  FAN: 'fan',
  FIST: 'fist'
};

// Категории брони
const ARMOR_CATEGORIES = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  ROBE: 'robe'
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
  ARTIFACT: 'artifact'
};

// Уровни качества изготовления
const QUALITY = {
  CRUDE: 'crude',
  NORMAL: 'normal',
  FINE: 'fine',
  SUPERIOR: 'superior',
  EXCEPTIONAL: 'exceptional',
  MASTERPIECE: 'masterpiece'
};

// Типы бонусов
const BONUS_TYPES = {
  PHYSICAL_DAMAGE: 'physicalDamage',
  MAGICAL_DAMAGE: 'magicalDamage',
  ELEMENTAL_DAMAGE: 'elementalDamage',
  PHYSICAL_DEFENSE: 'physicalDefense',
  MAGICAL_DEFENSE: 'magicalDefense',
  ELEMENTAL_DEFENSE: 'elementalDefense',
  HEALTH: 'health',
  MANA: 'mana',
  STAMINA: 'stamina',
  SPEED: 'speed',
  CRITICAL_CHANCE: 'criticalChance',
  CRITICAL_DAMAGE: 'criticalDamage',
  DODGE: 'dodge',
  ACCURACY: 'accuracy'
};

// Базовое оборудование для новых персонажей
const STARTER_GEAR = {
  weapon: {
    id: 'starter_sword',
    name: 'Ученический меч',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.SWORD,
    rarity: RARITY.COMMON,
    quality: QUALITY.NORMAL,
    level: 1,
    bonuses: {
      [BONUS_TYPES.PHYSICAL_DAMAGE]: 5
    }
  },
  armor: {
    id: 'starter_robe',
    name: 'Ученическое одеяние',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.ROBE,
    rarity: RARITY.COMMON,
    quality: QUALITY.NORMAL,
    level: 1,
    bonuses: {
      [BONUS_TYPES.PHYSICAL_DEFENSE]: 3,
      [BONUS_TYPES.MAGICAL_DEFENSE]: 3
    }
  }
};

// Экспортируем константы
module.exports = {
  EQUIPMENT_TYPES,
  WEAPON_CATEGORIES,
  ARMOR_CATEGORIES,
  RARITY,
  QUALITY,
  BONUS_TYPES,
  STARTER_GEAR
};