import React, { useState, useEffect, useCallback } from 'react';
import CharacterStatsService from '../../services/character-stats-adapter';
import CharacterStatsSynchronizer from './CharacterStatsSynchronizer';

/**
 * Компонент для управления характеристиками персонажа
 * Предоставляет методы для работы с характеристиками и 
 * синхронизирует данные с сервером
 */
const CharacterStatsManager = () => {
  // Локальное состояние вместо Redux
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Получаем ID пользователя из токена при монтировании
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Безопасное извлечение ID пользователя из токена
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id);
      }
    } catch (err) {
      console.error('Ошибка при получении ID пользователя из токена:', err);
    }
  }, []);
  
  /**
   * Получает характеристики персонажа с сервера
   */
  const fetchCharacterStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const characterStats = await CharacterStatsService.getCharacterStats(userId);
      
      // Обновляем локальное состояние
      setStats(characterStats);
      setError(null);
      
      console.log('Характеристики персонажа успешно получены:', characterStats);
      return characterStats;
    } catch (err) {
      console.error('Ошибка при получении характеристик персонажа:', err);
      setError(err.message || 'Ошибка при получении характеристик персонажа');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  /**
   * Обновляет характеристики персонажа на сервере
   * @param {Object} updatedStats - Новые характеристики
   */
  const updateCharacterStats = useCallback(async (updatedStats) => {
    if (!userId) {
      console.error('Невозможно обновить характеристики: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      setLoading(true);
      const result = await CharacterStatsService.updateCharacterStats(userId, updatedStats);
      
      // Обновляем локальное состояние
      setStats(result);
      setError(null);
      
      // Создаем событие об обновлении характеристик
      window.dispatchEvent(new CustomEvent('character-stats-changed', {
        detail: { stats: result }
      }));
      
      return {
        success: true,
        message: 'Характеристики успешно обновлены',
        stats: result
      };
    } catch (err) {
      console.error('Ошибка при обновлении характеристик персонажа:', err);
      setError(err.message || 'Ошибка при обновлении характеристик персонажа');
      
      return {
        success: false,
        message: err.message || 'Ошибка при обновлении характеристик персонажа'
      };
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  /**
   * Рассчитывает вторичные характеристики персонажа
   * @param {Object} stats - Основные характеристики
   * @param {Object} cultivation - Данные о культивации
   * @returns {Object} - Вторичные характеристики
   */
  const calculateSecondaryStats = useCallback((stats, cultivation) => {
    return CharacterStatsService.calculateSecondaryStats(stats, cultivation);
  }, []);
  
  // Загружаем характеристики при монтировании компонента
  useEffect(() => {
    if (userId) {
      fetchCharacterStats();
    }
  }, [userId, fetchCharacterStats]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  if (typeof window !== 'undefined') {
    if (!window.characterStatsManager) {
      window.characterStatsManager = {};
    }
    
    window.characterStatsManager = {
      getStats: () => stats,
      isLoading: () => loading,
      getError: () => error,
      fetchStats: fetchCharacterStats,
      updateStats: updateCharacterStats,
      calculateSecondaryStats: calculateSecondaryStats
    };
    
    // Добавляем функции для обратной совместимости с существующим кодом
    if (!window.gameManager) {
      window.gameManager = { characterStats: {} };
    } else if (!window.gameManager.characterStats) {
      window.gameManager.characterStats = {};
    }
    
    window.gameManager.characterStats = {
      ...window.characterStatsManager
    };
  }
  
  // Компонент не рендерит никакого UI
  return <CharacterStatsSynchronizer userId={userId} />;
};

export default CharacterStatsManager;