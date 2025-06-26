/**
 * Social Events Plugin
 * Плагин с социальными событиями для системы случайных событий
 */

import { CultivatorFairEvent } from './CultivatorFairEvent';

/**
 * Плагин социальных событий
 */
const SocialEventsPlugin = {
  id: 'social_events',
  name: 'Социальные события',
  description: 'Плагин с социальными событиями, ярмарками, турнирами и встречами культиваторов',
  version: '1.0.0',
  
  // Список всех классов событий в этом плагине
  events: [
    CultivatorFairEvent,
    // Здесь будут добавлены другие социальные события
    // - SectGatheringEvent - Собрания сект
    // - TournamentEvent - Турниры между талантливыми учениками
    // - AuctionEvent - Аукционы редкостей
    // - DiplomaticMeetingEvent - Дипломатические встречи
  ]
};

export default SocialEventsPlugin;
