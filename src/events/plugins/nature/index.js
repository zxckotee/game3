/**
 * Nature Events Plugin
 * Плагин с природными событиями для системы случайных событий
 */

import { SpiritStormEvent } from './SpiritStormEvent';
import { SpiritualRainEvent } from './SpiritualRainEvent';

/**
 * Плагин природных событий
 */
const NatureEventsPlugin = {
  id: 'nature_events',
  name: 'Природные явления',
  description: 'Плагин с природными явлениями и событиями окружающего мира',
  version: '1.0.0',
  
  // Список всех классов событий в этом плагине
  events: [
    SpiritStormEvent,
    SpiritualRainEvent,
    // Здесь будут добавлены другие природные события
  ]
};

export default NatureEventsPlugin;
