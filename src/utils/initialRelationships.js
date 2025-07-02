/**
 * Начальные социальные отношения для нового игрока
 * Этот файл содержит данные NPC, с которыми игрок начинает игру
 */

const initialRelationships = [
  { id: 1, name: 'Мастер Ли', role: 'Наставник', level: 80, events: [] },
  { id: 2, name: 'Торговец Чен', role: 'Торговец', level: 40, events: [] },
  { id: 3, name: 'Госпожа Юнь', role: 'Торговец', level: 40, events: [] },
  { id: 4, name: 'Старейшина Чжан', role: 'Торговец', level: 60, events: [] },
  { id: 5, name: 'Торговец Чжао', role: 'Торговец', level: 30, events: [] },
  { id: 6, name: 'Староста деревни Ванг', role: 'Лидер общины', level: 50, events: [] },
  { id: 7, name: 'Загадочный отшельник Фэн', role: 'Отшельник', level: 20, events: [] }
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
