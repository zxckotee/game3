import { useState, useEffect, useCallback, useRef } from 'react';
import SectServiceAPI from '../services/sect-api';
import { getCachedData, setCachedData, getAvailableSectsCacheKey } from '../utils/cacheUtils';

/**
 * Простая функция глубокого сравнения массивов объектов
 * @param {Array} arr1 - Первый массив
 * @param {Array} arr2 - Второй массив
 * @returns {boolean} - true если массивы равны
 */
const isEqual = (arr1, arr2) => {
  // Если оба null/undefined или пусты, считаем их равными
  if ((!arr1 && !arr2) || (arr1?.length === 0 && arr2?.length === 0)) return true;
  // Если только один null/undefined или длины различаются, они не равны
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
  
  // Используем JSON.stringify для простого сравнения
  return JSON.stringify(arr1) === JSON.stringify(arr2);
};

/**
 * Хук для загрузки и кеширования списка доступных сект
 * @param {number} cacheDuration - Длительность кеша в мс (по умолчанию 30000 мс = 30 секунд)
 * @returns {Object} - Объект с данными сект, состоянием загрузки и функцией обновления
 */
const useAvailableSects = (cacheDuration = 30000) => {
  const [sects, setSects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Используем ref для хранения таймера дебаунсинга
  const debounceTimerRef = useRef(null);
  
  // Функция загрузки списка сект
  const loadSects = useCallback(async (force = false) => {
    try {
      setError(null);
      
      // Создаем ключ для кеша
      const cacheKey = getAvailableSectsCacheKey();
      
      // Проверяем кеш только если не требуется принудительное обновление
      if (!force) {
        const cachedData = getCachedData(cacheKey, cacheDuration);
        
        if (cachedData) {
          // Обновляем состояние только если данные отличаются
          if (!isEqual(cachedData, sects)) {
            setSects(cachedData);
          }
          setLoading(false);
          return;
        }
      }
      
      // Если кеш не найден или требуется обновление - загружаем с сервера
      setLoading(true);
      const freshData = await SectServiceAPI.getAvailableSects();
      
      // Обновляем состояние только если данные изменились
      if (!isEqual(freshData, sects)) {
        setSects(freshData || []);
        // Сохраняем новые данные в кеш
        setCachedData(cacheKey, freshData || []);
      }
    } catch (err) {
      console.error('Ошибка при загрузке доступных сект:', err);
      setError(err.message || 'Не удалось загрузить список доступных сект');
    } finally {
      setLoading(false);
    }
  }, [sects, cacheDuration]);
  
  // Дебаунсированная функция обновления
  const debouncedRefresh = useCallback((force = false) => {
    // Очищаем предыдущий таймер, если он был
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Устанавливаем новый таймер
    debounceTimerRef.current = setTimeout(() => {
      loadSects(force);
    }, 300); // 300мс задержка
  }, [loadSects]);
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    loadSects();
    
    // Очищаем таймер при размонтировании компонента
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [loadSects]);
  
  return {
    sects,
    loading,
    error,
    refreshSects: (force = true) => debouncedRefresh(force)
  };
};

export default useAvailableSects;