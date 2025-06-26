/**
 * Клиентская версия данных о предметах экипировки без серверных зависимостей
 * Используется в браузере вместо оригинального equipment-items.js
 */

// Типы предметов экипировки
const EQUIPMENT_TYPES = {
  WEAPON: 'weapon',        // Оружие
  ARMOR: 'armor',          // Броня
  ACCESSORY: 'accessory',  // Аксессуары
  SET: 'set'               // Комплекты
};

// Редкость предметов экипировки
const EQUIPMENT_RARITY = {
  COMMON: 'common',         // Обычный
  UNCOMMON: 'uncommon',     // Необычный
  RARE: 'rare',             // Редкий
  EPIC: 'epic',             // Эпический
  LEGENDARY: 'legendary',   // Легендарный
  MYTHIC: 'mythic',         // Мифический
  ARTIFACT: 'artifact'      // Артефакт
};

// Подтипы оружия
const WEAPON_SUBTYPES = {
  SWORD: 'sword',           // Меч
  SPEAR: 'spear',           // Копье
  DAGGER: 'dagger',         // Кинжал
  STAFF: 'staff',           // Посох
  BOW: 'bow',               // Лук
  FAN: 'fan',               // Веер
  WHIP: 'whip'              // Кнут
};

// Подтипы брони
const ARMOR_SUBTYPES = {
  ROBE: 'robe',             // Роба
  LIGHT: 'light',           // Легкая броня
  MEDIUM: 'medium',         // Средняя броня
  HEAVY: 'heavy'            // Тяжелая броня
};

// Подтипы аксессуаров
const ACCESSORY_SUBTYPES = {
  RING: 'ring',             // Кольцо
  NECKLACE: 'necklace',     // Ожерелье
  BELT: 'belt',             // Пояс
  BRACELET: 'bracelet',     // Браслет
  TALISMAN: 'talisman'      // Талисман
};

// Слоты экипировки
const EQUIPMENT_SLOTS = {
  WEAPON: 'weapon',         // Оружие
  HEAD: 'head',             // Голова
  CHEST: 'chest',           // Грудь
  LEGS: 'legs',             // Ноги
  HANDS: 'hands',           // Руки
  FEET: 'feet',             // Ступни
  RING1: 'ring1',           // Кольцо 1
  RING2: 'ring2',           // Кольцо 2
  NECKLACE: 'necklace',     // Ожерелье
  BELT: 'belt',             // Пояс
  BRACELET: 'bracelet',     // Браслет
  TALISMAN: 'talisman'      // Талисман
};

// Базовые предметы экипировки для клиентского использования
const equipmentItems = [
  {
    id: 'training_sword',
    name: 'Тренировочный меч',
    type: EQUIPMENT_TYPES.WEAPON,
    subType: WEAPON_SUBTYPES.SWORD,
    slot: EQUIPMENT_SLOTS.WEAPON,
    rarity: EQUIPMENT_RARITY.COMMON,
    level: 1,
    description: 'Простой деревянный меч для начинающих культиваторов.',
    requirements: {
      cultivation: { stage: 'Закалка тела', level: 1 },
      playerLevel: 1
    },
    stats: {
      attack: 5,
      speed: 2
    },
    bonuses: {
      strength: 1
    },
    value: 100,
    setId: null
  },
  {
    id: 'iron_sword',
    name: 'Железный меч',
    type: EQUIPMENT_TYPES.WEAPON,
    subType: WEAPON_SUBTYPES.SWORD,
    slot: EQUIPMENT_SLOTS.WEAPON,
    rarity: EQUIPMENT_RARITY.COMMON,
    level: 5,
    description: 'Стандартный железный меч. Прочный и надежный.',
    requirements: {
      cultivation: { stage: 'Закалка тела', level: 3 },
      playerLevel: 5
    },
    stats: {
      attack: 12,
      speed: 3
    },
    bonuses: {
      strength: 2
    },
    value: 300,
    setId: null
  },
  {
    id: 'bamboo_staff',
    name: 'Бамбуковый посох',
    type: EQUIPMENT_TYPES.WEAPON,
    subType: WEAPON_SUBTYPES.STAFF,
    slot: EQUIPMENT_SLOTS.WEAPON,
    rarity: EQUIPMENT_RARITY.COMMON,
    level: 1,
    description: 'Легкий бамбуковый посох для практики боевых искусств.',
    requirements: {
      cultivation: { stage: 'Закалка тела', level: 1 },
      playerLevel: 1
    },
    stats: {
      attack: 4,
      speed: 4
    },
    bonuses: {
      agility: 1,
      spirit: 1
    },
    value: 100,
    setId: null
  },
  {
    id: 'novice_robe',
    name: 'Роба новичка',
    type: EQUIPMENT_TYPES.ARMOR,
    subType: ARMOR_SUBTYPES.ROBE,
    slot: EQUIPMENT_SLOTS.CHEST,
    rarity: EQUIPMENT_RARITY.COMMON,
    level: 1,
    description: 'Простая роба из хлопка, которую носят начинающие культиваторы.',
    requirements: {
      cultivation: { stage: 'Закалка тела', level: 1 },
      playerLevel: 1
    },
    stats: {
      defense: 3,
      energyRegen: 1
    },
    bonuses: {
      spirit: 1
    },
    value: 150,
    setId: 'novice_set'
  },
  {
    id: 'novice_belt',
    name: 'Пояс новичка',
    type: EQUIPMENT_TYPES.ACCESSORY,
    subType: ACCESSORY_SUBTYPES.BELT,
    slot: EQUIPMENT_SLOTS.BELT,
    rarity: EQUIPMENT_RARITY.COMMON,
    level: 1,
    description: 'Простой пояс из хлопка для новичков.',
    requirements: {
      cultivation: { stage: 'Закалка тела', level: 1 },
      playerLevel: 1
    },
    stats: {
      defense: 1,
      energyMax: 5
    },
    bonuses: {},
    value: 100,
    setId: 'novice_set'
  },
  {
    id: 'jade_ring',
    name: 'Нефритовое кольцо',
    type: EQUIPMENT_TYPES.ACCESSORY,
    subType: ACCESSORY_SUBTYPES.RING,
    slot: EQUIPMENT_SLOTS.RING1,
    rarity: EQUIPMENT_RARITY.UNCOMMON,
    level: 5,
    description: 'Кольцо из нефрита, помогающее концентрировать духовную энергию.',
    requirements: {
      cultivation: { stage: 'Закалка тела', level: 5 },
      playerLevel: 5
    },
    stats: {
      energyMax: 10,
      energyRegen: 2
    },
    bonuses: {
      spirit: 2
    },
    value: 500,
    setId: null
  },
  {
    id: 'qi_gathering_bracelet',
    name: 'Браслет сбора Ци',
    type: EQUIPMENT_TYPES.ACCESSORY,
    subType: ACCESSORY_SUBTYPES.BRACELET,
    slot: EQUIPMENT_SLOTS.BRACELET,
    rarity: EQUIPMENT_RARITY.UNCOMMON,
    level: 8,
    description: 'Браслет, помогающий собирать и направлять энергию Ци.',
    requirements: {
      cultivation: { stage: 'Закалка тела', level: 8 },
      playerLevel: 8
    },
    stats: {
      energyRegen: 3,
      cultivationSpeed: 0.05
    },
    bonuses: {
      spirit: 3
    },
    value: 800,
    setId: null
  }
];

// Наборы (сеты) экипировки
const equipmentSets = [
  {
    id: 'novice_set',
    name: 'Набор новичка',
    description: 'Базовый набор для начинающих культиваторов',
    pieces: ['novice_robe', 'novice_belt'],
    bonuses: [
      { count: 2, stats: { energyMax: 10, energyRegen: 1 } }
    ]
  }
];

/**
 * Загружает все предметы экипировки (клиентская версия)
 * @returns {Promise<Array>} Массив предметов экипировки
 */
async function loadEquipmentItems() {
  return equipmentItems;
}

/**
 * Получает предмет экипировки по ID (клиентская версия)
 * @param {string} id ID предмета
 * @returns {Promise<Object|null>} Предмет экипировки или null, если предмет не найден
 */
async function getEquipmentItemById(id) {
  return equipmentItems.find(item => item.id === id) || null;
}

/**
 * Получает предметы экипировки по типу (клиентская версия)
 * @param {string} type Тип предмета
 * @returns {Promise<Array>} Массив предметов указанного типа
 */
async function getEquipmentItemsByType(type) {
  return equipmentItems.filter(item => item.type === type);
}

/**
 * Получает предметы экипировки по уровню редкости (клиентская версия)
 * @param {string} rarity Уровень редкости
 * @returns {Promise<Array>} Массив предметов указанной редкости
 */
async function getEquipmentItemsByRarity(rarity) {
  return equipmentItems.filter(item => item.rarity === rarity);
}

/**
 * Получает информацию о наборе (сете) экипировки (клиентская версия)
 * @param {string} setId ID набора
 * @returns {Promise<Object|null>} Информация о наборе или null, если набор не найден
 */
async function getEquipmentSet(setId) {
  return equipmentSets.find(set => set.id === setId) || null;
}

/**
 * Получает все доступные наборы (сеты) экипировки (клиентская версия)
 * @returns {Promise<Array>} Массив наборов экипировки
 */
async function getAllEquipmentSets() {
  return equipmentSets;
}

/**
 * Получает все предметы, входящие в указанный набор (сет) (клиентская версия)
 * @param {string} setId ID набора
 * @returns {Promise<Array>} Массив предметов, входящих в набор
 */
async function getEquipmentSetItems(setId) {
  const set = await getEquipmentSet(setId);
  if (!set) return [];
  
  return equipmentItems.filter(item => item.setId === setId);
}

/**
 * Инициализирует данные о предметах экипировки (клиентская версия - ничего не делает)
 */
async function initEquipmentItems() {
  console.log('Client version: Equipment items initialization skipped');
  return;
}