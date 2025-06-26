/**
 * Утилиты для консоли разработчика
 * Файл содержит функции, которые могут быть использованы через консоль браузера
 */

import { GameContext } from '../context/GameContextProvider';

/**
 * Инициализация функций консоли разработчика
 * @param {Object} context - Контекст игры
 */
export const initDevConsole = () => {
  // Получаем глобальное окно браузера
  const windowObj = typeof window !== 'undefined' ? window : {};
  
  /**
   * Добавляет игроку 1000 единиц каждой валюты
   * @returns {boolean} - Результат операции
   */
  const addCurrency = () => {
    try {
      // Получаем контекст игры
      const gameContext = React.useContext(GameContext);
      
      if (!gameContext) {
        console.error('Ошибка: Контекст игры не найден');
        return false;
      }
      
      const { state, actions } = gameContext;
      
      // Получаем текущие значения валют
      const currentCurrency = state.player.inventory.currency;
      
      // Добавляем 1000 единиц каждой валюты (используем аддитивный режим)
      const updatedCurrency = {
        copper: 1000,
        silver: 1000,
        gold: 1000,
        spiritStones: 1000
      };
      
      // Обновляем валюту в состоянии игры (true для аддитивного режима)
      actions.updateCurrency(updatedCurrency, true);
      
      console.log('Добавлено по 1000 единиц каждой валюты!', updatedCurrency);
      return true;
    } catch (error) {
      console.error('Ошибка при добавлении валюты:', error);
      return false;
    }
  };
  
  // Добавляем функцию в глобальный объект window
  windowObj.addCurrency = addCurrency;
  
  // Возвращаем объект с функциями для тестирования
  return {
    addCurrency
  };
};

/**
 * Функция для добавления 1000 единиц каждой валюты через консоль
 * Версия функции, не требующая контекста React
 * @returns {boolean} - Результат операции
 */
export const givePlayerCurrency = () => {
  try {
    // Проверяем наличие глобального объекта window (для работы в браузере)
    if (typeof window === 'undefined') {
      console.error('Ошибка: Функция должна выполняться в браузере');
      return false;
    }
    
    // Получаем доступ к состоянию игры и диспетчеру
    // Это работает, потому что GameContext доступен глобально через window.__GAME_CONTEXT__
    const gameState = window.__GAME_STATE__;
    const dispatch = window.__GAME_DISPATCH__;
    
    if (!gameState || !dispatch) {
      console.error('Ошибка: Глобальное состояние игры не найдено');
      return false;
    }
    
    // Получаем текущие значения валют
    const currentCurrency = gameState.player.inventory.currency;
    
    // Добавляем 1000 единиц каждой валюты (используем аддитивный режим)
    const updatedCurrency = {
      copper: 1000,
      silver: 1000,
      gold: 1000,
      spiritStones: 1000
    };
    
    // Диспетчеризируем действие обновления валюты с флагом isAdditive
    dispatch({ 
      type: 'UPDATE_CURRENCY', 
      payload: updatedCurrency,
      isAdditive: true
    });
    
    console.log('Добавлено по 1000 единиц каждой валюты!', updatedCurrency);
    return true;
  } catch (error) {
    console.error('Ошибка при добавлении валюты:', error);
    return false;
  }
};

// Экспортируем функцию для прямого доступа
export default givePlayerCurrency;
