/**
 * Константы рангов в секте
 * Основаны на ограничениях в базе данных: rank IN ('ученик', 'внутренний ученик', 'старший ученик', 'старейшина', 'глава')
 */

// Все возможные ранги в секте (для сопоставления с базой данных)
export const SECT_RANKS = {
  DISCIPLE: 'ученик',
  INNER_DISCIPLE: 'внутренний ученик',
  SENIOR_DISCIPLE: 'старший ученик',
  ELDER: 'старейшина',
  LEADER: 'глава'
};

// Ранги, доступные для изменения (глава исключен, так как должен быть только один)
export const AVAILABLE_RANKS = [
  SECT_RANKS.DISCIPLE,
  SECT_RANKS.INNER_DISCIPLE, 
  SECT_RANKS.SENIOR_DISCIPLE,
  SECT_RANKS.ELDER
];

// Объект для отображения рангов в интерфейсе
export const RANK_DISPLAY_NAMES = {
  [SECT_RANKS.DISCIPLE]: 'Начальный ученик',
  [SECT_RANKS.INNER_DISCIPLE]: 'Внутренний ученик',
  [SECT_RANKS.SENIOR_DISCIPLE]: 'Старший ученик',
  [SECT_RANKS.ELDER]: 'Старейшина',
  [SECT_RANKS.LEADER]: 'Глава секты'
};

export default {
  SECT_RANKS,
  AVAILABLE_RANKS,
  RANK_DISPLAY_NAMES
};