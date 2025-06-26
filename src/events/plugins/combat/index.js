/**
 * Combat Events Plugin
 * Плагин с боевыми событиями для системы случайных событий
 */

import { BanditAttackEvent } from './BanditAttackEvent';

/**
 * Плагин боевых событий
 */
const CombatEventsPlugin = {
  id: 'combat_events',
  name: 'Боевые столкновения',
  description: 'Плагин с различными боевыми событиями, нападениями и сражениями',
  version: '1.0.0',
  
  // Список всех классов событий в этом плагине
  events: [
    BanditAttackEvent,
    // Здесь будут добавлены другие боевые события:
    // - DemonicCultivatorEvent - Вторжение демонических культиваторов
    // - AncientCreatureEvent - Появление древних существ
    // - DimensionalBreachEvent - Прорывы из других измерений
    // - SectConflictEvent - Конфликты между сектами
  ]
};

export default CombatEventsPlugin;
