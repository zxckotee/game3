/**
 * Начальные социальные отношения для нового игрока
 * Этот файл содержит данные NPC, с которыми игрок начинает игру
 */

const initialRelationships = [
  { 
    id: 1, 
    name: 'Мастер Ли', 
    role: 'Наставник', 
    level: 80, 
    events: ['Вы получили урок от Мастера Ли', 'Мастер Ли похвалил ваш прогресс'] 
  },
  { 
    id: 2, 
    name: 'Старейшина Чжан', 
    role: 'Старейшина секты', 
    level: 60, 
    events: ['Вы помогли Старейшине Чжану собрать травы'] 
  },
  { 
    id: 3, 
    name: 'Ученик Ван', 
    role: 'Соученик', 
    level: 45, 
    events: ['Вы тренировались вместе с Ваном', 'Вы одолжили Вану духовный камень'] 
  },
  { 
    id: 4, 
    name: 'Ученица Мэй', 
    role: 'Соученица', 
    level: 40, 
    events: ['Мэй поделилась с вами техникой культивации'] 
  },
  { 
    id: 5, 
    name: 'Торговец Чен', 
    role: 'Торговец', 
    level: 30, 
    events: ['Вы купили товары у Чена', 'Чен дал вам скидку'] 
  },
  { 
    id: 6, 
    name: 'Глава клана Сюй', 
    role: 'Глава враждебного клана', 
    level: 10, 
    events: ['Глава клана Сюй угрожал вам', 'Вы избежали ловушки клана Сюй'] 
  }
];

/**
 * Функция для получения начальных социальных отношений
 * @returns {Array} Массив начальных отношений
 */
// Функция для получения начальных социальных отношений
const getInitialRelationships = () => {
  return JSON.parse(JSON.stringify(initialRelationships)); // Возвращаем копию массива
};

// Экспортируем с использованием CommonJS
module.exports = initialRelationships;
module.exports.getInitialRelationships = getInitialRelationships;
