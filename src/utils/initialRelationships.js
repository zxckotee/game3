/**
 * Начальные социальные отношения для нового игрока
 * Этот файл содержит данные NPC, с которыми игрок начинает игру
 */

const initialRelationships = [
  { id: 'master_li', name: 'Мастер Ли', role: 'Наставник', level: 80, events: [], image: '/assets/images/npc/master_li.png' },
  { id: 'merchant_chen', name: 'Торговец Чен', role: 'Торговец', level: 40, events: [], image: '/assets/images/npc/merchant_chen.png' },
  { id: 'lady_yun', name: 'Госпожа Юнь', role: 'Торговец', level: 40, events: [], image: '/assets/images/npc/lady_yun.png' },
  { id: 'elder_zhang', name: 'Старейшина Чжан', role: 'Торговец', level: 60, events: [], image: '/assets/images/npc/elder_zhang.png' },
  { id: 'merchant_zhao', name: 'Торговец Чжао', role: 'Торговец', level: 30, events: [], image: '/assets/images/npc/merchant_zhao.png' },
  { id: 'village_chief_wang', name: 'Староста деревни Ванг', role: 'Лидер общины', level: 50, events: [], image: '/assets/images/npc/village_chief_wang.png' },
  { id: 'hermit_feng', name: 'Загадочный отшельник Фэн', role: 'Отшельник', level: 20, events: [], image: '/assets/images/npc/hermit_feng.png' }
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
