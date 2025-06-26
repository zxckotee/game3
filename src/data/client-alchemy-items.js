/**
 * Клиентская версия данных об алхимических предметах без серверных зависимостей
 * Используется в браузере вместо оригинального alchemy-items.js
 */

// Типы алхимических предметов
const ITEM_TYPES = {
  PILL: 'pill',         // Пилюли
  ELIXIR: 'elixir',     // Эликсиры
  POWDER: 'powder',     // Порошки
  TALISMAN: 'talisman', // Талисманы
  INGREDIENT: 'ingredient' // Ингредиенты
};

// Редкость предметов
const RARITY = {
  COMMON: 'common',           // Обычный
  UNCOMMON: 'uncommon',       // Необычный
  RARE: 'rare',               // Редкий
  VERY_RARE: 'very_rare',     // Очень редкий
  LEGENDARY: 'legendary',     // Легендарный
  MYTHICAL: 'mythical'        // Мифический
};

// Ключ для хранения данных в localStorage
const STORAGE_KEY = 'alchemy_items_cache';

// Базовые предметы алхимии (используются, если нет данных в localStorage)
const DEFAULT_ITEMS = [
  {
    id: 'low_grade_herb',
    name: 'Трава низкого качества',
    description: 'Распространенная трава с минимальными духовными свойствами. Используется в базовых рецептах.',
    type: ITEM_TYPES.INGREDIENT,
    rarity: RARITY.COMMON,
    value: 5,
    effects: [
      { type: 'qi_recovery', value: 1, duration: 0 }
    ]
  },
  {
    id: 'medium_grade_herb',
    name: 'Трава среднего качества',
    description: 'Трава с заметными духовными свойствами. Широко используется в алхимии.',
    type: ITEM_TYPES.INGREDIENT,
    rarity: RARITY.UNCOMMON,
    value: 15,
    effects: [
      { type: 'qi_recovery', value: 3, duration: 0 }
    ]
  },
  {
    id: 'high_grade_herb',
    name: 'Трава высокого качества',
    description: 'Редкая трава с сильными духовными свойствами.',
    type: ITEM_TYPES.INGREDIENT,
    rarity: RARITY.RARE,
    value: 50,
    effects: [
      { type: 'qi_recovery', value: 10, duration: 0 }
    ]
  },
  {
    id: 'spirit_water',
    name: 'Духовная вода',
    description: 'Вода, обогащенная духовной энергией. Важный компонент для создания эликсиров.',
    type: ITEM_TYPES.INGREDIENT,
    rarity: RARITY.UNCOMMON,
    value: 20,
    effects: []
  },
  {
    id: 'spirit_iron',
    name: 'Духовное железо',
    description: 'Минерал, впитавший духовную энергию. Используется для укрепляющих препаратов.',
    type: ITEM_TYPES.INGREDIENT,
    rarity: RARITY.UNCOMMON,
    value: 25,
    effects: []
  },
  {
    id: 'qi_gathering_pill',
    name: 'Пилюля сбора ци',
    description: 'Базовая пилюля, помогающая собирать и очищать ци.',
    type: ITEM_TYPES.PILL,
    rarity: RARITY.COMMON,
    value: 100,
    effects: [
      { type: 'cultivation_speed', value: 10, duration: 3600 },
      { type: 'qi_recovery', value: 5, duration: 1800 }
    ]
  },
  {
    id: 'body_strengthening_pill',
    name: 'Пилюля укрепления тела',
    description: 'Укрепляет физическое тело, повышая выносливость и силу культиватора.',
    type: ITEM_TYPES.PILL,
    rarity: RARITY.UNCOMMON,
    value: 150,
    effects: [
      { type: 'physical_defense', value: 5, duration: 3600 },
      { type: 'physical_strength', value: 3, duration: 3600 }
    ]
  },
  {
    id: 'energy_elixir',
    name: 'Эликсир энергии',
    description: 'Восстанавливает энергию и помогает восполнить силы после тренировок.',
    type: ITEM_TYPES.ELIXIR,
    rarity: RARITY.COMMON,
    value: 80,
    effects: [
      { type: 'stamina_recovery', value: 20, duration: 0 },
      { type: 'qi_recovery', value: 10, duration: 0 }
    ]
  }
];

/**
 * Получение всех алхимических предметов из локального хранилища
 * @returns {Promise<Array>} Список всех предметов
 */
async function getAllAlchemyItems() {
  try {
    // Пытаемся получить данные из localStorage
    if (typeof localStorage !== 'undefined') {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    }
    
    // Если данных нет, возвращаем значения по умолчанию
    return DEFAULT_ITEMS;
  } catch (error) {
    console.error('Ошибка при получении алхимических предметов из localStorage:', error);
    return DEFAULT_ITEMS;
  }
}

/**
 * Получение алхимического предмета по ID
 * @param {string} itemId - ID предмета
 * @returns {Promise<Object|null>} Найденный предмет или null
 */
async function getAlchemyItemById(itemId) {
  try {
    const items = await getAllAlchemyItems();
    const item = items.find(i => i.id === itemId);
    return item || null;
  } catch (error) {
    console.error(`Ошибка при получении алхимического предмета с ID ${itemId}:`, error);
    return null;
  }
}

/**
 * Получение предметов по типу
 * @param {string} type - Тип предметов (из ITEM_TYPES)
 * @returns {Promise<Array>} Список предметов указанного типа
 */
async function getAlchemyItemsByType(type) {
  try {
    const items = await getAllAlchemyItems();
    return items.filter(item => item.type === type);
  } catch (error) {
    console.error(`Ошибка при получении алхимических предметов типа ${type}:`, error);
    return [];
  }
}

/**
 * Получение предметов по редкости
 * @param {string} rarity - Редкость предметов (из RARITY)
 * @returns {Promise<Array>} Список предметов указанной редкости
 */
async function getAlchemyItemsByRarity(rarity) {
  try {
    const items = await getAllAlchemyItems();
    return items.filter(item => item.rarity === rarity);
  } catch (error) {
    console.error(`Ошибка при получении алхимических предметов редкости ${rarity}:`, error);
    return [];
  }
}

/**
 * Сохранение предметов в локальное хранилище
 * @param {Array} items - Список предметов для сохранения
 */
function saveItemsToStorage(items) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch (error) {
    console.error('Ошибка при сохранении алхимических предметов в localStorage:', error);
  }
}

/**
 * Добавление нового алхимического предмета (только для клиентской версии)
 * @param {Object} item - Данные нового предмета
 * @returns {Promise<Object>} Добавленный предмет
 */
async function addNewAlchemyItem(item) {
  try {
    const items = await getAllAlchemyItems();
    
    // Проверяем, что ID уникален
    if (items.some(i => i.id === item.id)) {
      throw new Error(`Предмет с ID ${item.id} уже существует`);
    }
    
    // Добавляем в список и сохраняем
    const updatedItems = [...items, item];
    saveItemsToStorage(updatedItems);
    
    return item;
  } catch (error) {
    console.error('Ошибка при добавлении нового алхимического предмета:', error);
    throw error;
  }
}