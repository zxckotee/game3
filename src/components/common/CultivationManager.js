import React, { useState, useEffect, useCallback } from 'react';
import CultivationService from '../../services/cultivation-adapter';
import CultivationSynchronizer from './CultivationSynchronizer';

/**
 * Компонент для управления данными культивации
 * Предоставляет методы для работы с культивацией и синхронизирует данные с сервером
 */
const CultivationManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [cultivation, setCultivation] = useState(null);
  
  // Получаем ID пользователя из токена при монтировании
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Извлекаем ID пользователя из токена
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id || payload.userId || payload.sub);
      }
    } catch (error) {
      console.error('Ошибка при получении ID пользователя из токена:', error);
    }
  }, []);
  
  /**
   * Получение данных о культивации пользователя
   * @returns {Promise<Object>} Данные о культивации
   */
  const getCultivationProgress = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить данные о культивации: пользователь не авторизован');
      return null;
    }
    
    try {
      const cultivationData = await CultivationService.getCultivationProgress(userId);
      
      // Обновляем локальное состояние
      setCultivation(cultivationData);
      
      // Уведомляем другие компоненты об обновлении
      window.dispatchEvent(new CustomEvent('cultivation-updated', { 
        detail: cultivationData 
      }));
      
      return cultivationData;
    } catch (error) {
      console.error('Ошибка при получении данных о культивации:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Обновление данных о культивации пользователя
   * @param {Object} updates - Данные для обновления
   * @returns {Promise<Object>} Обновленные данные о культивации
   */
  const updateCultivationProgress = useCallback(async (updates, explicitUserId = null) => {
    // Используем явно переданный userId или значение из замыкания
    const effectiveUserId = explicitUserId || userId;
    
    if (!effectiveUserId) {
      console.error('Невозможно обновить данные о культивации: пользователь не авторизован');
      return null;
    }
    
    try {
      const cultivationData = await CultivationService.updateCultivationProgress(effectiveUserId, updates);
      
      // Обновляем локальное состояние
      setCultivation(cultivationData);
      
      // Уведомляем другие компоненты об обновлении
      window.dispatchEvent(new CustomEvent('cultivation-updated', { 
        detail: cultivationData 
      }));
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('cultivation-changed'));
      
      return cultivationData;
    } catch (error) {
      console.error('Ошибка при обновлении данных о культивации:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Проверка возможности прорыва на следующий уровень
   * @returns {Promise<Object>} Результат проверки
   */
  const checkBreakthroughPossibility = useCallback(async (explicitUserId = null) => {
    // Используем явно переданный userId или значение из замыкания
    const effectiveUserId = explicitUserId || userId;
    
    if (!effectiveUserId) {
      console.error('Невозможно проверить возможность прорыва: пользователь не авторизован');
      return null;
    }
    
    try {
      const result = await CultivationService.checkBreakthroughPossibility(effectiveUserId);
      return result;
    } catch (error) {
      console.error('Ошибка при проверке возможности прорыва:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Завершение трибуляции
   * @param {Object} tribulationResult - Результат трибуляции
   * @returns {Promise<Object>} Результат обработки трибуляции
   */
  const completeTribulation = useCallback(async (tribulationResult, explicitUserId = null) => {
    // Используем явно переданный userId или значение из замыкания
    const effectiveUserId = explicitUserId || userId;
    
    if (!effectiveUserId) {
      console.error('Невозможно завершить трибуляцию: пользователь не авторизован');
      return null;
    }
    
    try {
      const result = await CultivationService.completeTribulation(effectiveUserId, tribulationResult);
      
      // Обновляем локальное состояние
      if (result.cultivation) {
        setCultivation(result.cultivation);
        
        // Уведомляем другие компоненты об обновлении
        window.dispatchEvent(new CustomEvent('cultivation-updated', { 
          detail: result.cultivation 
        }));
      }
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('tribulation-complete', { 
        detail: { result } 
      }));
      
      return result;
    } catch (error) {
      console.error('Ошибка при завершении трибуляции:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Увеличение прогресса "бутылочного горлышка"
   * @param {number} amount - Количество прогресса для добавления
   * @returns {Promise<Object>} Обновленные данные о культивации
   */
  const increaseBottleneckProgress = useCallback(async (amount, explicitUserId = null) => {
    // Используем явно переданный userId или значение из замыкания
    const effectiveUserId = explicitUserId || userId;
    
    if (!effectiveUserId) {
      console.error('Невозможно увеличить прогресс: пользователь не авторизован');
      return null;
    }
    
    try {
      const result = await CultivationService.increaseBottleneckProgress(effectiveUserId, amount);
      console.log('CultivationManager: Результат вызова увеличения прогресса:', result);
      
      // Обновляем локальное состояние
      if (result.cultivation) {
        setCultivation(result.cultivation);
        
        // Уведомляем другие компоненты об обновлении
        window.dispatchEvent(new CustomEvent('cultivation-updated', {
          detail: result.cultivation
        }));
      }
      
      // Извлекаем данные о прогрессе из результата
      const bottleneckProgress = result.bottleneckProgress || result.currentProgress;
      const requiredBottleneckProgress = result.requiredBottleneckProgress || result.requiredProgress;
      
      // 1. Напрямую обновляем Redux-состояние
      if (window.__GAME_DISPATCH__) {
        console.log('CultivationManager: Обновляем Redux с bottleneckProgress =', bottleneckProgress);
        
        window.__GAME_DISPATCH__({
          type: 'UPDATE_CULTIVATION',
          payload: {
            bottleneckProgress: bottleneckProgress,
            requiredBottleneckProgress: requiredBottleneckProgress
          }
        });
      }
      
      // 2. Создаем событие с данными для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('cultivation-changed', {
        detail: {
          bottleneckProgress: bottleneckProgress,
          requiredBottleneckProgress: requiredBottleneckProgress
        }
      }));
      
      // 3. Проверяем обновление Redux через небольшую задержку
      setTimeout(() => {
        if (window.__GAME_STATE__?.player?.cultivation) {
          console.log('CultivationManager: Проверка обновления Redux:',
            window.__GAME_STATE__.player.cultivation.bottleneckProgress);
        }
      }, 100);
      
      return result;
    } catch (error) {
      console.error('Ошибка при увеличении прогресса:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Получение озарения
   * @returns {Promise<Object>} Результат озарения
   */
  const gainInsight = useCallback(async (explicitUserId = null) => {
    // Используем явно переданный userId или значение из замыкания
    const effectiveUserId = explicitUserId || userId;
    
    if (!effectiveUserId) {
      console.error('Невозможно получить озарение: пользователь не авторизован');
      return null;
    }
    
    try {
      const result = await CultivationService.gainInsight(effectiveUserId);
      
      // Обновляем локальное состояние
      if (result.cultivation) {
        setCultivation(result.cultivation);
        
        // Уведомляем другие компоненты об обновлении
        window.dispatchEvent(new CustomEvent('cultivation-updated', {
          detail: result.cultivation
        }));
      }
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('insight-gained', {
        detail: { insight: result.insight }
      }));
      
      return result;
    } catch (error) {
      console.error('Ошибка при получении озарения:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Выполнение прорыва на следующий уровень культивации
   * @returns {Promise<Object>} Результат прорыва
   */
  const performBreakthrough = useCallback(async (explicitUserId = null) => {
    // Используем явно переданный userId или значение из замыкания
    const effectiveUserId = explicitUserId || userId;
    
    if (!effectiveUserId) {
      console.error('Невозможно выполнить прорыв: пользователь не авторизован');
      return null;
    }
    
    try {
      console.log('CultivationManager: Вызов метода performBreakthrough для userId:', effectiveUserId);
      const result = await CultivationService.performBreakthrough(effectiveUserId);
      console.log('CultivationManager: Результат выполнения прорыва:', result);
      
      // Обновляем локальное состояние
      if (result.cultivation) {
        setCultivation(result.cultivation);
        
        // Уведомляем другие компоненты об обновлении
        window.dispatchEvent(new CustomEvent('cultivation-updated', {
          detail: result.cultivation
        }));
      }
      
      // Обновляем Redux-состояние, если доступно
      if (window.__GAME_DISPATCH__ && result.cultivation) {
        window.__GAME_DISPATCH__({
          type: 'UPDATE_CULTIVATION',
          payload: result.cultivation
        });
        
        // Если были получены очки характеристик
        if (result.statsPointsAwarded) {
          window.__GAME_DISPATCH__({
            type: 'UPDATE_PLAYER_STATS',
            payload: {
              unassignedPoints: (window.__GAME_STATE__?.player?.stats?.unassignedPoints || 0) + result.statsPointsAwarded
            }
          });
        }
      }
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('breakthrough-complete', {
        detail: { result }
      }));
      
      return result;
    } catch (error) {
      console.error('Ошибка при выполнении прорыва:', error);
      console.error('Тип ошибки:', error.name);
      console.error('Сообщение ошибки:', error.message);
      console.error('Стек вызовов:', error.stack);
      return {
        success: false,
        error: error.message,
        message: 'Произошла ошибка при выполнении прорыва'
      };
    }
  }, [userId]);
  
  // Загрузка данных о культивации при монтировании
  useEffect(() => {
    if (userId && !cultivation) {
      getCultivationProgress();
    }
  }, [userId, cultivation, getCultivationProgress]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      if (!window.cultivationManager) {
        window.cultivationManager = {};
      }
      
      window.cultivationManager = {
        getCultivationProgress,
        updateCultivationProgress,
        checkBreakthroughPossibility,
        completeTribulation,
        increaseBottleneckProgress,
        gainInsight,
        performBreakthrough,
        getCultivationData: () => cultivation
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { cultivation: {} };
      } else if (!window.gameManager.cultivation) {
        window.gameManager.cultivation = {};
      }
      
      window.gameManager.cultivation = {
        ...window.cultivationManager
      };
    }
  }, [
    userId,
    cultivation,
    getCultivationProgress,
    updateCultivationProgress,
    checkBreakthroughPossibility,
    completeTribulation,
    increaseBottleneckProgress,
    gainInsight,
    performBreakthrough
  ]);
  
  return <CultivationSynchronizer userId={userId} cultivation={cultivation} />;
};

export default CultivationManager;