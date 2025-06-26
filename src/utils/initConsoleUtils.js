/**
 * Инициализация консольных утилит
 * Этот файл импортирует и регистрирует все консольные команды
 */

import { initDevConsole } from './devConsole';
import registerConsoleCommands from './consoleCommands';
import './directConsoleCommands'; // Просто импортируем для выполнения самовызывающейся функции
import './equipmentDebug'; // Импортируем отладочные инструменты для экипировки
import initAlchemyConsole from './initAlchemyConsole'; // Импортируем алхимические команды
import sectCommands from './sectConsoleCommands'; // Импортируем команды для работы с сектами
import effectsCommands from './effectsConsoleCommands'; // Импортируем команды для работы с эффектами
import { registerAuthCommands } from './consoleCommands'; // Импортируем команды для работы с авторизацией

/**
 * Инициализирует все консольные утилиты
 * @param {Object} gameContext - Контекст игры с доступом к состоянию и действиям
 */
export const initConsoleUtils = (gameContext) => {
  // Инициализируем консоль разработчика
  initDevConsole(gameContext);
  
  // Регистрируем консольные команды
  registerConsoleCommands(gameContext);
  
  // Инициализируем алхимические консольные команды
  initAlchemyConsole(gameContext.devConsole);
  
  // Регистрируем команды для работы с авторизацией
  registerAuthCommands(window.console);
  
  // Сохраняем ссылку на контекст игры в глобальном объекте
  if (typeof window !== 'undefined') {
    window.__GAME_CONTEXT__ = gameContext;
    window.__GAME_STATE__ = gameContext.state;
    window.__GAME_DISPATCH__ = gameContext.actions.dispatch;
  }
  
  console.log('🛠️ Консольные утилиты инициализированы');
  console.log('Доступные команды:');
  console.log('- add1000Currency() - Добавляет 1000 единиц каждой валюты');
  console.log('- дать1000Ресурсов() - То же самое на русском');
  console.log('- addCurrency() - Добавляет 1000 единиц каждой валюты');
  console.log('- addResource(type, amount) - Добавляет указанное количество ресурса');
  console.log('- initAlchemy() - Инициализирует алхимическую систему');
  console.log('- getAllRecipes() - Получает список всех доступных рецептов алхимии');
  console.log('- getRecipesByType(type) - Получает рецепты определенного типа (pill, talisman, weapon, armor, accessory)');
  console.log('- printSectData() - Выводит текущие данные о секте для проверки формата');
  console.log('- normalizeSectData() - Проверяет и исправляет формат данных секты');
  console.log('- printEffectsData() - Показывает текущие эффекты персонажа');
  console.log('- normalizeEffectsData() - Нормализует эффекты персонажа');
  console.log('- repairAllEffects() - Восстанавливает все эффекты');
  console.log('- authCheckDb() - Проверка подключения к БД и структуры таблиц');
  console.log('- authMigrateUsers() - Миграция пользователей из localStorage в БД');
  console.log('- authClearLocalStorage() - Очистка данных авторизации в localStorage');
  
  // Регистрируем функции секты в глобальном объекте
  if (typeof window !== 'undefined') {
    window.printSectData = sectCommands.printSectData;
    window.normalizeSectData = sectCommands.normalizeSectData;
    
    // Регистрируем функции для работы с эффектами
    window.printEffectsData = effectsCommands.printEffectsData;
    window.показатьЭффекты = effectsCommands.показатьЭффекты;
    window.normalizeEffectsData = effectsCommands.normalizeEffectsData;
    window.нормализоватьЭффекты = effectsCommands.нормализоватьЭффекты;
    window.repairAllEffects = effectsCommands.repairAllEffects;
    window.восстановитьЭффекты = effectsCommands.восстановитьЭффекты;
  }
  
  // Инициализируем команды для работы с эффектами
  effectsCommands.initEffectsConsoleCommands();
  
  return {
    addCurrency: window.addCurrency,
    add1000Currency: window.add1000Currency,
    дать1000Ресурсов: window.дать1000Ресурсов,
    addResource: window.addResource,
    // Добавляем функции секты в возвращаемый объект
    printSectData: window.printSectData,
    normalizeSectData: window.normalizeSectData,
    // Добавляем функции эффектов в возвращаемый объект
    printEffectsData: window.printEffectsData,
    normalizeEffectsData: window.normalizeEffectsData,
    repairAllEffects: window.repairAllEffects,
    // Добавляем функции авторизации в возвращаемый объект
    authCheckDb: window.console.authCheckDb,
    authMigrateUsers: window.console.authMigrateUsers,
    authClearLocalStorage: window.console.authClearLocalStorage
  };
};

export default initConsoleUtils;
