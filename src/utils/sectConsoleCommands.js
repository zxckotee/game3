/**
 * Консольные команды для работы с сектами
 * Этот файл содержит функции, которые могут быть выполнены через консоль браузера
 */

import { checkAndNormalizeSectData, normalizeSectData } from './sectUtils';

/**
 * Проверяет и исправляет формат данных секты в состоянии игры
 * @returns {boolean} Результат операции
 */
export const normalizeSectDataConsole = () => {
  try {
    // Проверяем наличие глобального объекта window (для работы в браузере)
    if (typeof window === 'undefined') {
      console.error('Ошибка: Функция должна выполняться в браузере');
      return false;
    }
    
    // Получаем доступ к состоянию игры и диспетчеру
    const gameState = window.__GAME_STATE__;
    const dispatch = window.__GAME_DISPATCH__;
    
    if (!gameState || !dispatch) {
      console.error('Ошибка: Глобальное состояние игры не найдено');
      return false;
    }
    
    console.log('🔍 Проверка формата данных секты...');
    
    // Проверяем и нормализуем данные
    const checkResult = checkAndNormalizeSectData(gameState);
    
    // Если данные были изменены, отправляем действие для обновления состояния
    if (checkResult !== gameState) {
      console.log('🔧 Выполняется нормализация данных секты');
      
      // Отправляем действие для нормализации данных секты
      dispatch({ type: 'NORMALIZE_SECT_DATA' });
      
      // Добавляем уведомление в интерфейс
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          message: 'Структура данных секты была нормализована', 
          type: 'info' 
        } 
      });
      
      // Вывод результата с задержкой для отображения после обновления состояния
      setTimeout(() => {
        console.log('✅ Данные секты после нормализации:', gameState.sect);
      }, 100);
      
      return true;
    } else {
      console.log('✅ Формат данных секты в порядке, нормализация не требуется');
      return true;
    }
  } catch (error) {
    console.error('❌ Ошибка при нормализации данных секты:', error);
    return false;
  }
};

/**
 * Выводит текущие данные о секте в консоль для проверки
 * @returns {Object} Данные о секте
 */
export const printSectData = () => {
  try {
    // Проверяем наличие глобального объекта window
    if (typeof window === 'undefined') {
      console.error('Ошибка: Функция должна выполняться в браузере');
      return null;
    }
    
    // Получаем доступ к состоянию игры
    const gameState = window.__GAME_STATE__;
    
    if (!gameState) {
      console.error('Ошибка: Глобальное состояние игры не найдено');
      return null;
    }
    
    // Получаем данные о секте
    const sectState = gameState.sect || {};
    
    // Проверка корректности форматов данных
    const sectBenefits = sectState.benefits || [];
    const sectSect = sectState.sect || null;
    
    // Выводим данные в консоль
    console.group('📊 Данные о секте:');
    console.log('Бонусы секты (benefits):', sectBenefits);
    console.log('Является ли benefits массивом:', Array.isArray(sectBenefits));
    
    if (sectSect) {
      console.log('Вложенный объект секты (sect.sect):', sectSect);
      console.log('Вложенные бонусы (sect.sect.benefits):', sectSect.benefits);
      console.log('Является ли sect.sect.benefits массивом:', Array.isArray(sectSect.benefits));
    }
    
    console.groupEnd();
    
    return sectState;
  } catch (error) {
    console.error('Ошибка при выводе данных о секте:', error);
    return null;
  }
};

// Экспортируем функции для прямого доступа
export default {
  normalizeSectData: normalizeSectDataConsole,
  printSectData
};
