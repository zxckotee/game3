/**
 * Утилита для проверки выполнения подзадач квестов
 * Реализует логику проверки на основе идентификатора подзадачи
 */

/**
 * Проверяет, выполнена ли подзадача квеста
 * @param {string} objectiveId - Идентификатор подзадачи квеста (например, q1_obj1)
 * @param {object} state - Текущее состояние Redux
 * @returns {boolean} - Результат проверки (true - выполнена, false - не выполнена)
 */
export function checkQuestObjective(objectiveId, state) {
  // Таблица соответствия ID подзадач и функций проверки
  const checkers = {
    // Квест 1: Первые шаги в культивации
    "q1_obj1": (state) => state.player?.cultivation?.level >= 1,
    "q1_obj2": (state) => state.player?.cultivation?.energy >= 100,
    "q1_obj3": (state) => hasLearnedTechnique(state, "breathing_heavens"),
    
    // Квест 2: Помощь старейшине
    "q2_obj1": (state) => hasItemInInventory(state, "crimson_herb"),
    "q2_obj2": (state) => hasItemInInventory(state, "moon_flower"),
    
    // Квест 3: Ежедневная медитация
    "q3_obj1": (state) => state.player?.meditation?.totalTime >= 30,
    "q3_obj2": (state) => state.player?.cultivation?.energy >= 50,
    
    // Квест 4: Тайны горы Тысячи Духов
    "q4_obj1": (state) => state.player?.location?.id === "spirit_mountain_peak",
    "q4_obj2": (state) => hasQuestEvent(state, "found_spirit_traces"),
    "q4_obj3": (state) => hasBlessing(state, "spirit_blessing"),
    
    // Квест 5: Турнир молодых мастеров
    "q5_obj1": (state) => hasEventStatus(state, "tournament_registered"),
    "q5_obj2": (state) => hasEventStatus(state, "tournament_qualifying_victory"),
    "q5_obj3": (state) => hasEventStatus(state, "tournament_semifinal"),
    "q5_obj4": (state) => hasEventStatus(state, "tournament_prize_place"),
    
    // Квест 6: Начало пути
    "q6_obj1": (state) => hasTechniqueLevel(state, "basic_qi_breathing", 2),
    "q6_obj2": (state) => hasItemInInventory(state, "qi_herb", 5),
    
    // Квест 7: Поиск духовных трав
    "q7_obj1": (state) => hasItemInInventory(state, "spirit_herb", 10),
    "q7_obj2": (state) => hasKilledEnemies(state, "spirit_beast", 3),
    
    // Квест 8: Секретная техника
    "q8_obj1": (state) => hasItemInInventory(state, "ancient_scroll_fragment", 3),
    "q8_obj2": (state) => state.player?.cultivation?.qiUnderstanding >= 5,
    "q8_obj3": (state) => hasDefeatedBoss(state, "library_guardian")
  };
  
  // Проверяем, есть ли функция проверки для данного ID
  if (objectiveId in checkers) {
    try {
      return checkers[objectiveId](state);
    } catch (error) {
      console.error(`Ошибка при проверке цели ${objectiveId}:`, error);
      return false;
    }
  }
  
  // Если функции проверки нет - возвращаем false
  console.warn(`Нет проверки для цели ${objectiveId}`);
  return false;
}

/**
 * Проверяет, изучена ли указанная техника
 * @param {object} state - Состояние Redux
 * @param {string} techniqueId - ID техники или часть её названия
 * @returns {boolean}
 */
function hasLearnedTechnique(state, techniqueId) {
  if (!state.player?.techniques || !Array.isArray(state.player.techniques)) {
    return false;
  }
  
  return state.player.techniques.some(technique => 
    technique.id === techniqueId || 
    (technique.name && technique.name.toLowerCase().includes(techniqueId.toLowerCase()))
  );
}

/**
 * Проверяет, есть ли предмет в инвентаре в указанном количестве
 * @param {object} state - Состояние Redux
 * @param {string} itemId - ID предмета или часть его названия
 * @param {number} quantity - Требуемое количество (по умолчанию 1)
 * @returns {boolean}
 */
function hasItemInInventory(state, itemId, quantity = 1) {
  if (!state.inventory?.items || !Array.isArray(state.inventory.items)) {
    return false;
  }
  
  const item = state.inventory.items.find(item => 
    item.id === itemId || 
    (item.name && item.name.toLowerCase().includes(itemId.toLowerCase()))
  );
  
  return item && item.quantity >= quantity;
}

/**
 * Проверяет наличие события в журнале квестов
 * @param {object} state - Состояние Redux
 * @param {string} eventId - ID события
 * @returns {boolean}
 */
function hasQuestEvent(state, eventId) {
  if (!state.player?.questEvents || !Array.isArray(state.player.questEvents)) {
    return false;
  }
  
  return state.player.questEvents.includes(eventId);
}

/**
 * Проверяет наличие благословения
 * @param {object} state - Состояние Redux
 * @param {string} blessingId - ID благословения
 * @returns {boolean}
 */
function hasBlessing(state, blessingId) {
  if (!state.player?.blessings || !Array.isArray(state.player.blessings)) {
    return false;
  }
  
  return state.player.blessings.some(blessing => 
    blessing === blessingId || 
    (typeof blessing === 'object' && blessing.id === blessingId)
  );
}

/**
 * Проверяет, имеет ли игрок определенный статус события
 * @param {object} state - Состояние Redux
 * @param {string} statusId - ID статуса события
 * @returns {boolean}
 */
function hasEventStatus(state, statusId) {
  if (!state.player?.eventStatuses) {
    return false;
  }
  
  return !!state.player.eventStatuses[statusId];
}

/**
 * Проверяет, имеет ли техника указанный уровень
 * @param {object} state - Состояние Redux
 * @param {string} techniqueId - ID техники
 * @param {number} level - Требуемый уровень
 * @returns {boolean}
 */
function hasTechniqueLevel(state, techniqueId, level) {
  if (!state.player?.techniques || !Array.isArray(state.player.techniques)) {
    return false;
  }
  
  const technique = state.player.techniques.find(t => 
    t.id === techniqueId || 
    (t.name && t.name.toLowerCase().includes(techniqueId.toLowerCase()))
  );
  
  return technique && technique.level >= level;
}

/**
 * Проверяет, убил ли игрок указанное количество врагов
 * @param {object} state - Состояние Redux
 * @param {string} enemyType - Тип врага
 * @param {number} count - Требуемое количество
 * @returns {boolean}
 */
function hasKilledEnemies(state, enemyType, count) {
  if (!state.player?.enemyKills) {
    return false;
  }
  
  return state.player.enemyKills[enemyType] >= count;
}

/**
 * Проверяет, побежден ли указанный босс
 * @param {object} state - Состояние Redux
 * @param {string} bossId - ID босса
 * @returns {boolean}
 */
function hasDefeatedBoss(state, bossId) {
  if (!state.player?.defeatedBosses || !Array.isArray(state.player.defeatedBosses)) {
    return false;
  }
  
  return state.player.defeatedBosses.includes(bossId);
}