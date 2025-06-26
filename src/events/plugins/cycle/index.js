/**
 * Cycle Events Plugin
 * Плагин с цикличными событиями для системы случайных событий
 */

import { LunarPhaseEvent } from './LunarPhaseEvent';

/**
 * Плагин цикличных событий
 */
const CycleEventsPlugin = {
  id: 'cycle_events',
  name: 'Цикличные события',
  description: 'Плагин с циклическими и повторяющимися событиями, которые формируют закономерности игрового мира',
  version: '1.0.0',
  
  // Список всех классов событий в этом плагине
  events: [
    LunarPhaseEvent,
    // Здесь будут добавлены другие цикличные события:
    // - SeasonChangeEvent - Смена времен года
    // - SpiritualFloweringEvent - Столетнее цветение духовных деревьев
    // - EcologicalBalanceEvent - Система экологического баланса
    // - RumorSystemEvent - Система слухов о предстоящих событиях
  ]
};

export default CycleEventsPlugin;
