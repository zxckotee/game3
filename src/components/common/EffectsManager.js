import React, { useState, useEffect } from 'react';
import EffectsService from '../../services/effects-service-adapter';
import EffectsSynchronizer from './EffectsSynchronizer';

/**
 * Компонент для управления эффектами в приложении
 * Включает синхронизацию эффектов с сервером и обновление погодных эффектов
 */
const EffectsManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [weather, setWeather] = useState(null);
  const [dayPeriod, setDayPeriod] = useState(null);
  const [effects, setEffects] = useState([]);
  
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
  
  // Слушаем события обновления погоды и времени суток
  useEffect(() => {
    const handleWeatherUpdate = (event) => {
      setWeather(event.detail);
    };
    
    const handleDayPeriodUpdate = (event) => {
      setDayPeriod(event.detail);
    };
    
    const handleEffectsUpdated = (event) => {
      setEffects(event.detail);
    };
    
    // Регистрируем слушатели событий
    window.addEventListener('weather-updated', handleWeatherUpdate);
    window.addEventListener('day-period-updated', handleDayPeriodUpdate);
    window.addEventListener('effects-updated', handleEffectsUpdated);
    
    // Начальная загрузка данных
    const loadWeatherData = async () => {
      // Получаем данные о погоде из сервиса погоды, если доступен
      try {
        if (window.weatherManager && window.weatherManager.getCurrentWeather) {
          const currentWeather = await window.weatherManager.getCurrentWeather();
          if (currentWeather) {
            setWeather(currentWeather);
          }
        }
        
        if (window.weatherManager && window.weatherManager.getDayPeriod) {
          const currentDayPeriod = await window.weatherManager.getDayPeriod();
          if (currentDayPeriod) {
            setDayPeriod(currentDayPeriod);
          }
        }
      } catch (error) {
        console.error('Ошибка при получении данных о погоде:', error);
      }
    };
    
    loadWeatherData();
    
    // Очищаем слушатели при размонтировании
    return () => {
      window.removeEventListener('weather-updated', handleWeatherUpdate);
      window.removeEventListener('day-period-updated', handleDayPeriodUpdate);
      window.removeEventListener('effects-updated', handleEffectsUpdated);
    };
  }, []);
  
  // Обновление эффектов погоды при изменении погоды или времени суток
  useEffect(() => {
    const updateWeatherEffects = async () => {
      if (!userId || !weather || !dayPeriod) return;
      
      try {
        // Обновляем эффекты погоды на сервере
        const updatedEffects = await EffectsService.updateWeatherEffects(userId, {
          weather: weather.type,
          dayPeriod
        });
        
        // Если есть обновленные эффекты, обновляем локальное состояние
        if (updatedEffects) {
          setEffects(prev => {
            // Удаляем старые погодные эффекты
            const filteredEffects = prev.filter(e => e.source !== 'weather');
            // Добавляем новые погодные эффекты
            return [...filteredEffects, ...updatedEffects];
          });
          
          // Отправляем событие с обновленными эффектами
          window.dispatchEvent(new CustomEvent('effects-updated', { 
            detail: effects 
          }));
        }
        
        // Создаем событие об изменении погоды для других компонентов
        window.dispatchEvent(new CustomEvent('weather-changed'));
      } catch (error) {
        console.error('Ошибка при обновлении эффектов погоды:', error);
      }
    };
    
    // Обновляем эффекты при изменении погоды или времени суток
    if (weather && weather.type && dayPeriod) {
      updateWeatherEffects();
    }
  }, [userId, weather, dayPeriod, effects]);
  
  // Экспортируем глобальные методы для работы с эффектами
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      if (!window.effectsManager) {
        window.effectsManager = {};
      }
      
      // Метод для получения всех активных эффектов
      const getActiveEffects = () => effects;
      
      // Метод для получения эффектов по типу
      const getEffectsByType = (type) => {
        return effects.filter(effect => effect.type === type);
      };
      
      // Метод для расчета суммарного значения модификатора от эффектов
      const calculateModifierTotal = (modifierKey) => {
        return effects.reduce((total, effect) => {
          if (effect.modifiers && effect.modifiers[modifierKey]) {
            return total + effect.modifiers[modifierKey];
          }
          return total;
        }, 0);
      };
      
      // Экспортируем методы в глобальный объект
      window.effectsManager = {
        getActiveEffects,
        getEffectsByType,
        calculateModifierTotal
      };
      
      // Для обратной совместимости
      if (!window.gameManager) {
        window.gameManager = { effects: {} };
      } else if (!window.gameManager.effects) {
        window.gameManager.effects = {};
      }
      
      window.gameManager.effects = {
        ...window.effectsManager
      };
    }
  }, [userId, effects]);
  
  // Если пользователь не авторизован, ничего не рендерим
  if (!userId) return null;
  
  return (
    <>
      {/* Компонент для автоматической синхронизации эффектов */}
      <EffectsSynchronizer userId={userId} effects={effects} />
    </>
  );
};

export default EffectsManager;