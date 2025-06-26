/**
 * Клиентская версия данных о заданиях без серверных зависимостей
 * Используется в браузере вместо оригинального quests.js
 */

// Типы заданий
const questTypes = {
  MAIN: 'main',           // Основной сюжет
  SIDE: 'side',           // Побочные задания
  DAILY: 'daily',         // Ежедневные задания
  SECT: 'sect',           // Задания секты
  REPUTATION: 'rep',      // Задания репутации
  EVENT: 'event'          // Событийные задания
};

// Сложность заданий
const questDifficulty = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  EXPERT: 'expert',
  MASTER: 'master'
};

// Категории квестов для интерфейса
const questCategories = [
  { id: 'all', name: 'Все задания', filter: () => true },
  { id: 'main', name: 'Основной сюжет', filter: q => q.type === questTypes.MAIN },
  { id: 'side', name: 'Побочные', filter: q => q.type === questTypes.SIDE },
  { id: 'daily', name: 'Ежедневные', filter: q => q.type === questTypes.DAILY },
  { id: 'sect', name: 'Секта', filter: q => q.type === questTypes.SECT },
  { id: 'rep', name: 'Репутация', filter: q => q.type === questTypes.REPUTATION },
  { id: 'event', name: 'События', filter: q => q.type === questTypes.EVENT }
];

// Примеры заданий для клиентского использования
const quests = [
  {
    id: 1,
    title: 'Первые шаги на пути культивации',
    description: 'Освойте базовые техники культивации для начала вашего пути.',
    type: questTypes.MAIN,
    level: 1,
    difficulty: questDifficulty.EASY,
    rewards: {
      exp: 100,
      resources: [
        { id: 'spirit_stone', amount: 5 },
        { id: 'low_grade_herb', amount: 2 }
      ],
      techniques: []
    },
    objectives: [
      { id: 'q1_obj1', text: 'Поговорите с Мастером Ли', completed: false },
      { id: 'q1_obj2', text: 'Выполните базовую технику медитации', completed: false },
      { id: 'q1_obj3', text: 'Соберите 3 травы низкого качества', completed: false }
    ],
    requirements: {
      level: 1,
      cultivation: { stage: 'Закалка тела', level: 1 }
    },
    location: 'Деревня Нефритового Ручья'
  },
  {
    id: 2,
    title: 'Проблема с бандитами',
    description: 'Группа бандитов терроризирует местных жителей. Помогите решить эту проблему.',
    type: questTypes.SIDE,
    level: 2,
    difficulty: questDifficulty.NORMAL,
    rewards: {
      exp: 150,
      resources: [
        { id: 'spirit_stone', amount: 10 },
        { id: 'basic_pill', amount: 1 }
      ],
      techniques: []
    },
    objectives: [
      { id: 'q2_obj1', text: 'Поговорите со старостой деревни', completed: false },
      { id: 'q2_obj2', text: 'Найдите логово бандитов', completed: false },
      { id: 'q2_obj3', text: 'Победите 5 бандитов', completed: false },
      { id: 'q2_obj4', text: 'Победите главаря бандитов', completed: false },
      { id: 'q2_obj5', text: 'Вернитесь к старосте с отчетом', completed: false }
    ],
    requirements: {
      level: 2,
      cultivation: { stage: 'Закалка тела', level: 2 }
    },
    location: 'Деревня Нефритового Ручья'
  },
  {
    id: 3,
    title: 'Духовные травы',
    description: 'Соберите редкие травы для Алхимика Чжана.',
    type: questTypes.DAILY,
    level: 3,
    difficulty: questDifficulty.EASY,
    rewards: {
      exp: 100,
      resources: [
        { id: 'spirit_stone', amount: 15 },
        { id: 'qi_pill', amount: 1 }
      ],
      techniques: []
    },
    objectives: [
      { id: 'q3_obj1', text: 'Соберите 5 трав среднего качества', completed: false },
      { id: 'q3_obj2', text: 'Найдите редкий духовный цветок', completed: false },
      { id: 'q3_obj3', text: 'Доставьте травы Алхимику Чжану', completed: false }
    ],
    requirements: {
      level: 3,
      cultivation: { stage: 'Закалка тела', level: 3 }
    },
    location: 'Лес Тысячи Листьев'
  },
  {
    id: 4,
    title: 'Вступление в секту',
    description: 'Пройдите испытания для вступления в Секту Пяти Стихий.',
    type: questTypes.MAIN,
    level: 5,
    difficulty: questDifficulty.HARD,
    rewards: {
      exp: 500,
      resources: [
        { id: 'spirit_stone', amount: 50 },
        { id: 'medium_grade_herb', amount: 3 },
        { id: 'qi_pill', amount: 2 }
      ],
      techniques: [{ id: 'basic_five_elements', level: 1 }]
    },
    objectives: [
      { id: 'q4_obj1', text: 'Поговорите с привратником секты', completed: false },
      { id: 'q4_obj2', text: 'Пройдите испытание силы', completed: false },
      { id: 'q4_obj3', text: 'Пройдите испытание ума', completed: false },
      { id: 'q4_obj4', text: 'Пройдите испытание духа', completed: false },
      { id: 'q4_obj5', text: 'Встретьтесь со старейшиной секты', completed: false }
    ],
    requirements: {
      level: 5,
      cultivation: { stage: 'Закалка тела', level: 8 }
    },
    location: 'Гора Пяти Стихий'
  }
];

/**
 * Получение всех заданий (клиентская версия)
 * @returns {Promise<Array>} Массив всех заданий
 */
async function getAllQuests() {
  return quests;
}

/**
 * Получение задания по ID (клиентская версия)
 * @param {number} id ID задания
 * @returns {Promise<Object|null>} Объект задания или null, если задание не найдено
 */
async function getQuestById(id) {
  return quests.find(quest => quest.id === id) || null;
}

/**
 * Получение заданий по типу (клиентская версия)
 * @param {string} type Тип задания
 * @returns {Promise<Array>} Массив заданий указанного типа
 */
async function getQuestsByType(type) {
  return quests.filter(quest => quest.type === type);
}

/**
 * Получение заданий, доступных игроку (клиентская версия)
 * @param {Object} player Объект игрока с уровнем и информацией о культивации
 * @returns {Promise<Array>} Массив доступных заданий
 */
async function getAvailableQuests(player) {
  return quests.filter(quest => {
    // Проверяем требования по уровню
    if (quest.requirements.level > player.level) {
      return false;
    }
    
    // Проверяем требования по культивации
    const reqCult = quest.requirements.cultivation;
    if (reqCult) {
      const playerStage = player.cultivation.stage;
      const playerLevel = player.cultivation.level;
      
      // Сравниваем ступени культивации
      const stages = ['Закалка тела', 'Очищение ци', 'Золотое ядро', 'Формирование души'];
      const reqStageIndex = stages.indexOf(reqCult.stage);
      const playerStageIndex = stages.indexOf(playerStage);
      
      if (playerStageIndex < reqStageIndex) {
        return false;
      }
      
      // Если на той же ступени, проверяем уровень
      if (playerStageIndex === reqStageIndex && playerLevel < reqCult.level) {
        return false;
      }
    }
    
    return true;
  });
}
module.exports = {quests, getAllQuests, getAvailableQuests, getQuestsByType, getQuestById};
/**
 * Инициализация данных о заданиях (клиентская версия - ничего не делает)
 */
async function initQuestData() {
  console.log('Client version: Quest data initialization skipped');
  return;
}