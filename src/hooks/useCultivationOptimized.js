import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getCultivationProgress } from '../services/cultivation-api';
import CultivationAdapter from '../services/cultivation-adapter';
import { getInterval, INTERVAL_TYPES, simpleDebounce, simpleThrottle } from '../config/clientIntervals';

/**
 * Оптимизированный хук для управления состоянием культивации
 * Предотвращает избыточные запросы и обеспечивает эффективную синхронизацию
 */
export const useCultivationOptimized = () => {
  const { state, actions } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(0);
  
  // Рефы для предотвращения дублирующих запросов
  const activeRequestsRef = useRef(new Set());
  const lastDataRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // Получаем интервал синхронизации из конфигурации
  const syncInterval = getInterval(INTERVAL_TYPES.CULTIVATION_SYNC);

  // Проверка, нужна ли синхронизация
  const needsSync = useCallback(() => {
    const now = Date.now();
    return (now - lastSyncTime) > syncInterval;
  }, [lastSyncTime, syncInterval]);

  // Дебаунсированная функция обновления данных культивации
  const debouncedRefresh = useCallback(
    simpleDebounce(async (userId, forceRefresh = false) => {
      // Предотвращаем дублирующие запросы
      const requestKey = `refresh-${userId}`;
      if (activeRequestsRef.current.has(requestKey) && !forceRefresh) {
        console.log('[CultivationOptimized] Пропускаем дублирующий запрос обновления');
        return;
      }

      // Проверяем, нужна ли синхронизация
      if (!forceRefresh && !needsSync()) {
        console.log('[CultivationOptimized] Синхронизация не требуется, используем кэш');
        return lastDataRef.current;
      }

      activeRequestsRef.current.add(requestKey);
      setIsLoading(true);

      try {
        console.log('[CultivationOptimized] Обновление данных культивации...');
        const cultivationData = await getCultivationProgress(userId);
        
        if (cultivationData) {
          // Проверяем, изменились ли данные
          const dataChanged = JSON.stringify(cultivationData) !== JSON.stringify(lastDataRef.current);
          
          if (dataChanged || forceRefresh) {
            actions.updateCultivation(cultivationData);
            lastDataRef.current = cultivationData;
            setLastSyncTime(Date.now());
            console.log('[CultivationOptimized] Данные культивации обновлены');
          } else {
            console.log('[CultivationOptimized] Данные не изменились, обновление пропущено');
          }
        }
        
        return cultivationData;
      } catch (error) {
        console.error('[CultivationOptimized] Ошибка при обновлении данных культивации:', error);
        actions.addNotification({
          message: 'Не удалось обновить данные о культивации.',
          type: 'error'
        });
        throw error;
      } finally {
        activeRequestsRef.current.delete(requestKey);
        setIsLoading(false);
      }
    }, 1000, 'cultivation-refresh'),
    [actions, needsSync, lastDataRef]
  );

  // Троттлированная функция для операций культивации
  const throttledCultivationOperation = useCallback(
    simpleThrottle(async (operation, userId, ...args) => {
      const requestKey = `operation-${operation}-${userId}`;
      if (activeRequestsRef.current.has(requestKey)) {
        console.log(`[CultivationOptimized] Пропускаем дублирующую операцию: ${operation}`);
        return;
      }

      activeRequestsRef.current.add(requestKey);
      
      try {
        let result;
        switch (operation) {
          case 'increaseBottleneckProgress':
            result = await CultivationAdapter.increaseBottleneckProgress(userId, ...args);
            break;
          case 'updateCultivationProgress':
            result = await CultivationAdapter.updateCultivationProgress(userId, ...args);
            break;
          case 'performBreakthrough':
            result = await CultivationAdapter.performBreakthrough(userId);
            break;
          case 'gainInsight':
            result = await CultivationAdapter.gainInsight(userId);
            break;
          default:
            throw new Error(`Неизвестная операция: ${operation}`);
        }

        // Обновляем данные только если операция была успешной
        if (result && result.success !== false) {
          // Небольшая задержка перед обновлением для избежания конфликтов
          setTimeout(() => {
            debouncedRefresh(userId, true);
          }, 500);
        }

        return result;
      } catch (error) {
        console.error(`[CultivationOptimized] Ошибка операции ${operation}:`, error);
        throw error;
      } finally {
        activeRequestsRef.current.delete(requestKey);
      }
    }, 2000, 'cultivation-operation'),
    [debouncedRefresh]
  );

  // Автоматическая синхронизация данных
  useEffect(() => {
    const userId = state.player?.id;
    if (!userId) return;

    // Инициальная загрузка данных
    if (!lastDataRef.current) {
      debouncedRefresh(userId, true);
    }

    // Настройка периодической синхронизации
    syncIntervalRef.current = setInterval(() => {
      if (needsSync()) {
        debouncedRefresh(userId);
      }
    }, Math.min(syncInterval, 300000)); // Максимум каждые 5 минут

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [state.player?.id, debouncedRefresh, needsSync, syncInterval]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      activeRequestsRef.current.clear();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Публичные методы
  const refreshCultivationData = useCallback((forceRefresh = false) => {
    const userId = state.player?.id;
    if (userId) {
      return debouncedRefresh(userId, forceRefresh);
    }
  }, [state.player?.id, debouncedRefresh]);

  const performCultivationOperation = useCallback((operation, ...args) => {
    const userId = state.player?.id;
    if (userId) {
      return throttledCultivationOperation(operation, userId, ...args);
    }
  }, [state.player?.id, throttledCultivationOperation]);

  // Проверка активности запросов
  const hasActiveRequests = useCallback(() => {
    return activeRequestsRef.current.size > 0;
  }, []);

  return {
    isLoading,
    lastSyncTime,
    needsSync: needsSync(),
    hasActiveRequests,
    refreshCultivationData,
    performCultivationOperation,
    
    // Вспомогательные методы для конкретных операций
    increaseBottleneckProgress: useCallback((amount) => 
      performCultivationOperation('increaseBottleneckProgress', amount), [performCultivationOperation]),
    
    updateCultivationProgress: useCallback((data) => 
      performCultivationOperation('updateCultivationProgress', data), [performCultivationOperation]),
    
    performBreakthrough: useCallback(() => 
      performCultivationOperation('performBreakthrough'), [performCultivationOperation]),
    
    gainInsight: useCallback(() => 
      performCultivationOperation('gainInsight'), [performCultivationOperation])
  };
};

export default useCultivationOptimized;