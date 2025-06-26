/**
 * Модуль для заполнения базы данных начальными квестами
 */

const Quest = require('../models/quest');
const { quests } = require('../data/quests');

/**
 * Преобразует объект квеста из формата data/quests.js 
 * в формат, подходящий для базы данных
 */
function transformQuestForDB(quest) {
  // Определяем шаги/этапы квеста из objectives
  const steps = quest.objectives.map((obj, idx) => {
    // Пытаемся определить тип задачи и цель из текста
    const objectiveInfo = getObjectiveInfoFromText(obj.text);
    
    return {
      id: idx + 1,
      description: obj.text,
      objective: objectiveInfo.type,
      target: objectiveInfo.target,
      ...(objectiveInfo.additionalParams || {}),
      completed: obj.completed
    };
  });

  // Определяем награды
  const experienceReward = quest.rewards.find(r => r.type === 'experience') || { amount: 0 };
  const itemRewards = quest.rewards.filter(r => r.type === 'item').map(i => ({
    id: getItemIdFromName(i.name),
    type: getItemTypeFromName(i.name),
    name: i.name,
    quantity: 1
  }));
  const techniqueReward = quest.rewards.find(r => r.type === 'technique');
  const currencyReward = quest.rewards.find(r => r.type === 'currency') || { amount: { gold: 0, silver: 0 } };
  
  // Преобразуем gold и silver в единую сумму gold
  const goldAmount = (currencyReward.amount.gold || 0) * 10 + (currencyReward.amount.silver || 0) / 10;

  // Построение награды в формате БД
  const rewards = {
    experience: experienceReward.amount,
    items: itemRewards,
    gold: Math.round(goldAmount * 10) // Округляем до ближайшего целого gold
  };

  // Добавляем технику в награду, если она есть
  if (techniqueReward) {
    rewards.technique = {
      id: getTechniqueIdFromName(techniqueReward.name),
      name: techniqueReward.name
    };
  }

  // Определяем требования
  const requirements = {
    level: quest.requiredLevel
  };

  // Дополнительные требования могут быть добавлены для определенных квестов
  if (quest.id === 'q8') { // Секретная техника
    requirements.technique = 'Базовое дыхание Ци';
    requirements.techniqueLevel = 3;
  }

  // Преобразуем статус
  const statusMap = {
    'available': 'active',
    'completed': 'completed',
    'locked': 'inactive'
  };

  return {
    title: quest.title,
    description: quest.description,
    requirements: JSON.stringify(requirements),
    rewards: JSON.stringify(rewards),
    status: statusMap[quest.status] || 'active',
    steps: JSON.stringify(steps)
  };
}

/**
 * Извлекает информацию о цели из текста
 */
function getObjectiveInfoFromText(text) {
  // Анализируем текст для определения типа цели и значения
  if (text.includes('Достигните') && text.includes('уровня')) {
    const level = parseInt(text.match(/\d+/)[0]);
    return { type: 'cultivationLevel', target: level };
  } 
  else if (text.includes('Соберите') && text.includes('единиц')) {
    const amount = parseInt(text.match(/\d+/)[0]);
    const resourceName = text.split('единиц ')[1].trim();
    let resourceId = 2; // Default qi herbs
    
    if (resourceName.includes('духовных трав')) {
      resourceId = 3;
    }
    
    return { 
      type: 'gatherResource', 
      target: amount,
      additionalParams: { resourceId }
    };
  }
  else if (text.includes('Победите') && text.includes('духовных зверей')) {
    const count = parseInt(text.match(/\d+/)[0]);
    return { 
      type: 'defeatEnemies', 
      target: count,
      additionalParams: { enemyType: 'spiritualBeast' }
    };
  }
  else if (text.includes('Найдите') && text.includes('фрагмента')) {
    const count = parseInt(text.match(/\d+/)[0]);
    return { 
      type: 'findItem', 
      target: count,
      additionalParams: { itemId: 101 }
    };
  }
  else if (text.includes('Достигните') && text.includes('понимания')) {
    const level = parseInt(text.match(/\d+/)[0]);
    return { 
      type: 'statLevel', 
      target: level,
      additionalParams: { stat: 'perception' }
    };
  }
  else if (text.includes('Победите хранителя')) {
    return { 
      type: 'defeatEnemy', 
      target: 1,
      additionalParams: { enemyId: 'libraryGuardian' }
    };
  }
  
  // Общий случай, если не удалось определить
  return { type: 'custom', target: 1 };
}

/**
 * Определяет ID предмета по имени
 */
function getItemIdFromName(name) {
  const itemMap = {
    'Бронзовый меч': 1001,
    'Нефритовый амулет': 3001,
    'Пилюля очищения': 5002,
    'Эссенция горного духа': 6002,
    'Медаль турнира': 7001
  };
  
  return itemMap[name] || 1000; // Если не найдено, возвращаем дефолтный ID
}

/**
 * Определяет тип предмета по имени
 */
function getItemTypeFromName(name) {
  if (name.includes('меч') || name.includes('клинок')) return 'weapon';
  if (name.includes('амулет') || name.includes('браслет')) return 'accessory';
  if (name.includes('пилюля')) return 'pill';
  if (name.includes('эссенция') || name.includes('трава')) return 'resource';
  return 'item'; // Общий тип, если не удалось определить
}

/**
 * Определяет ID техники по имени
 */
function getTechniqueIdFromName(name) {
  const techniqueMap = {
    'Техника защиты Ци': 4,
    'Искусство Багряного Пламени': 8,
    'Искусство Небесного Меча': 12
  };
  
  return techniqueMap[name] || 1;
}

class QuestSeeder {
  /**
   * Заполнить базу данных начальными квестами
   */
  static async seedQuests() {
    try {
      // Проверяем, есть ли уже квесты в базе
      const questCount = await Quest.count();
      if (questCount > 0) {
        console.log('Квесты уже добавлены в базу данных');
        return;
      }

      console.log('Заполняем базу данных начальными квестами...');
      
      // Преобразуем квесты из data/quests.js в формат для БД
      const dbQuests = quests.map(transformQuestForDB);

      // Вставляем квесты в базу данных
      await Quest.bulkCreate(dbQuests);

      console.log(`Успешно добавлено ${dbQuests.length} квестов в базу данных`);
    } catch (error) {
      console.error('Ошибка при заполнении квестов:', error);
      throw error;
    }
  }
}

module.exports = QuestSeeder;
