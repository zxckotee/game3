/**
 * Event Plugins Module
 * Центральный модуль для всех плагинов случайных событий
 */

import NatureEventsPlugin from './nature';
import SocialEventsPlugin from './social';
import CombatEventsPlugin from './combat';
import CycleEventsPlugin from './cycle';
import ConflictsEventsPlugin from './conflicts';

/**
 * Список всех плагинов событий в системе
 */
const eventPlugins = [
  NatureEventsPlugin,
  SocialEventsPlugin,
  CombatEventsPlugin,
  CycleEventsPlugin,
  ConflictsEventsPlugin
];

export default eventPlugins;

/**
 * Регистрирует все плагины событий в реестре событий
 * @param {Object} eventRegistry - Реестр событий, в котором будут зарегистрированы плагины
 */
export const registerAllEventPlugins = (eventRegistry) => {
  if (!eventRegistry) {
    console.error('EventRegistry не предоставлен для регистрации плагинов');
    return;
  }
  
  let totalEventsRegistered = 0;
  
  // Для каждого плагина регистрируем все его события
  for (const plugin of eventPlugins) {
    if (plugin.events && Array.isArray(plugin.events)) {
      for (const EventClass of plugin.events) {
        try {
          eventRegistry.registerEvent(EventClass);
          totalEventsRegistered++;
        } catch (error) {
          console.error(`Ошибка при регистрации события из плагина ${plugin.name}:`, error);
        }
      }
      console.log(`Зарегистрированы события из плагина "${plugin.name}" (${plugin.events.length} событий)`);
    } else {
      console.warn(`Плагин "${plugin.name}" не содержит списка событий или формат неверный`);
    }
  }
  
  console.log(`Всего зарегистрировано событий: ${totalEventsRegistered}`);
};
