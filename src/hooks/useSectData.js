import { useState, useEffect, useCallback, useRef } from 'react';
import SectServiceAPI from '../services/sect-api';
import { getCachedData, setCachedData, getSectCacheKey } from '../utils/cacheUtils';

/**
 * Простая функция глубокого сравнения объектов
 * @param {Object} obj1 - Первый объект
 * @param {Object} obj2 - Второй объект
 * @returns {boolean} - true если объекты равны
 */
const isEqual = (obj1, obj2) => {
  // Если оба null/undefined, считаем их равными
  if (!obj1 && !obj2) return true;
  // Если только один null/undefined, они не равны
  if (!obj1 || !obj2) return false;
  
  // Используем JSON.stringify для простого сравнения
  // Не самый эффективный метод, но работает для данного случая
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

/**
 * Хук для загрузки и кеширования данных о секте пользователя
 * @param {number|string} userId - ID пользователя
 * @param {number} cacheDuration - Длительность кеша в мс (по умолчанию 60000 мс = 1 минута)
 * @returns {Object} - Объект с данными секты, состоянием загрузки и функцией обновления
 */
const useSectData = (userId, cacheDuration = 60000) => {
  const [sect, setSect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Используем ref для хранения таймера дебаунсинга
  const debounceTimerRef = useRef(null);
  
  // Функция загрузки данных секты
  const loadSectData = useCallback(async (force = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      
      // Создаем ключ для кеша
      const cacheKey = getSectCacheKey(userId);
      
      // Проверяем кеш только если не требуется принудительное обновление
      if (!force) {
        const cachedData = getCachedData(cacheKey, cacheDuration);
        
        if (cachedData) {
          // Обновляем состояние только если данные отличаются
          if (!isEqual(cachedData, sect)) {
            setSect(cachedData);
          }
          setLoading(false);
          return;
        }
      }
      
      // Если кеш не найден или требуется обновление - загружаем с сервера
      setLoading(true);
      const freshData = await SectServiceAPI.getUserSect(userId);
      
      // Обновляем состояние только если данные изменились
      if (!isEqual(freshData, sect)) {
        setSect(freshData);
        // Сохраняем новые данные в кеш
        if (freshData) {
          setCachedData(cacheKey, freshData);
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке данных секты:', err);
      setError(err.message || 'Не удалось загрузить данные секты');
    } finally {
      setLoading(false);
    }
  }, [userId, sect, cacheDuration]);
  
  // Дебаунсированная функция обновления - предотвращает слишком частые запросы
  const debouncedRefresh = useCallback((force = false) => {
    // Очищаем предыдущий таймер, если он был
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Устанавливаем новый таймер
    debounceTimerRef.current = setTimeout(() => {
      loadSectData(force);
    }, 300); // 300мс задержка
  }, [loadSectData]);
  
  // Загружаем данные при изменении userId
  useEffect(() => {
    loadSectData();
    
    // Очищаем таймер при размонтировании компонента
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [userId, loadSectData]);
  
  return {
    sect,
    loading,
    error,
    refreshSectData: (force = true) => debouncedRefresh(force)
  };
};

export default useSectData;