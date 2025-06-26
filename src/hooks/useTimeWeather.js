import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

/**
 * Пользовательский хук для получения данных о времени и погоде
 * Обеспечивает синхронизацию между различными компонентами отображения
 * @returns {Object} Объект с данными о времени и погоде
 */
function useTimeWeather() {
  const { state } = useGame();
  
  // Состояние для отслеживания обновлений и анимации
  const [updating, setUpdating] = useState(false);
  const [lastTime, setLastTime] = useState(null);
  const [lastWeather, setLastWeather] = useState(null);
  
  // Получаем данные
  const weather = state.weather || {};
  const worldTime = state.world?.time || {};
  
  // Используем ТОЛЬКО данные из worldTime для времени и дня
  // Важно: если время не указано в worldTime, используем безопасные значения по умолчанию
  const hour = worldTime.hour !== undefined ? worldTime.hour : 12; // Дефолт - полдень
  const minute = worldTime.minute !== undefined ? worldTime.minute : 0; // Дефолт - 0 минут
  
  // Форматируем время
  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  
  // Определяем другие параметры
  const isDayTime = hour >= 6 && hour < 20;
  
  // Получаем время суток, вычисляем на основе hour (не используем weather.daytimePeriod)
  const daytimePeriod = 
    (hour >= 5 && hour < 7) ? 'dawn' :
    (hour >= 7 && hour < 11) ? 'morning' :
    (hour >= 11 && hour < 14) ? 'noon' :
    (hour >= 14 && hour < 17) ? 'afternoon' :
    (hour >= 17 && hour < 20) ? 'evening' :
    (hour >= 20 && hour < 23) ? 'night' : 'deepNight';
  
  // Получаем текущую погоду (тут можно использовать weather, так как это данные о погоде, а не времени)
  const currentWeather = weather.currentWeather || weather.weatherType || 'clear';
  
  // Получаем интенсивность погоды
  const weatherIntensity = weather.weatherIntensity || 1.0;
  
  // Получаем погодные эффекты
  const weatherEffects = weather.weatherEffects || null;
  
  // Получаем время до следующей смены погоды
  const nextWeatherChange = weather.nextWeatherChange || 60;
  
  // Получаем данные о сезоне
  const seasonDay = weather.seasonDay || worldTime.seasonDay || 1;
  const seasonLength = weather.seasonLength || worldTime.seasonLength || 30;
  
  // Данные о событиях
  const activeEvent = weather.activeEvent || null;
  const eventRemainingTime = weather.eventRemainingTime || 0;
  
  // Получаем день ТОЛЬКО из worldTime - это ЕДИНСТВЕННЫЙ источник правды о дне
  const dayCount = worldTime.day !== undefined ? worldTime.day : 1;
  
  // Получаем сезон ТОЛЬКО из worldTime
  const season = worldTime.season || 'spring';
  
  // ОТКЛЮЧАЕМ ПРОВЕРКУ: state.world.time - это единственный источник правды
  // Предупреждения о несоответствии игнорируются, так как worldTime - единственный важный источник 
  /*
  useEffect(() => {
    if (weather.hour !== undefined && worldTime.hour !== undefined && weather.hour !== worldTime.hour) {
      console.warn('⚠️ Несоответствие времени:', {
        worldTime: `${worldTime.hour}:${worldTime.minute}`,
        weather: `${weather.hour}:${weather.minute}`,
        dayWorld: worldTime.day,
        dayWeather: weather.dayCount
      });
    }
  }, [weather.hour, worldTime.hour, weather.minute, worldTime.minute, weather.dayCount, worldTime.day]);
  */
  
  // Используем useRef для отслеживания обновлений состояния
  const prevStateRef = useRef({ hour, minute, worldTime });
  
  // Принудительное обновление для компонентов
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  
  // Обработчик ручных обновлений времени
  useEffect(() => {
    // Функция обработки события ручного обновления времени
    const handleManualTimeUpdate = () => {
      // Принудительно обновляем счетчик для перерисовки компонентов
      setForceUpdateCounter(prev => prev + 1);
      console.log('🔄 useTimeWeather: Получено событие manual_time_update, обновляем компоненты');
    };
    
    // Добавляем обработчик события
    window.addEventListener('manual_time_update', handleManualTimeUpdate);
    
    // Очищаем обработчик при размонтировании
    return () => {
      window.removeEventListener('manual_time_update', handleManualTimeUpdate);
    };
  }, []);
  
  // Отслеживаем изменения времени и погоды
  useEffect(() => {
    // Сравниваем текущие значения с предыдущими
    const prevState = prevStateRef.current;
    const hasTimeChanged = prevState.hour !== hour || prevState.minute !== minute;
    
    // Улучшенная проверка изменения дня для отслеживания перехода через полночь
    // и отладки проблем с обновлением счётчика дней
    const prevDay = prevState.worldTime?.day !== undefined ? Number(prevState.worldTime.day) : 1;
    const currentDay = worldTime.day !== undefined ? Number(worldTime.day) : 1;
    const hasDayChanged = currentDay !== prevDay;
    
    // Отладочный лог для отслеживания изменений дня
    if (hasDayChanged) {
      console.log('📅📅 useTimeWeather: ОБНАРУЖЕНО ИЗМЕНЕНИЕ ДНЯ:', {
        prevDay,
        currentDay,
        diff: currentDay - prevDay,
        worldTime,
        prevWorldTime: prevState.worldTime
      });
    }
    
    // Определяем текущую погоду
    const currentWeatherValue = weather.currentWeather || weather.weatherType || 'clear';
    
    // Если время или день изменились, обновляем счетчик для принудительного обновления
    if (hasTimeChanged || hasDayChanged) {
      setForceUpdateCounter(prev => prev + 1);
      
      // Для отладки
      console.log('⏰ useTimeWeather: ИЗМЕНЕНИЕ ВРЕМЕНИ или ДНЯ!', {
        oldHour: prevState.hour,
        newHour: hour,
        oldMinute: prevState.minute,
        newMinute: minute,
        oldDay: prevState.worldTime?.day,
        newDay: worldTime.day,
        forceUpdateCounter: forceUpdateCounter + 1
      });
    }
    
    // Если есть предыдущие значения и они изменились, запускаем анимацию обновления
    if (lastTime !== null && (lastTime !== formattedTime || lastWeather !== currentWeatherValue)) {
      setUpdating(true);
      setTimeout(() => setUpdating(false), 500);
      
      // Для отладки
      console.log('🔄 useTimeWeather обновляется:', {
        oldTime: lastTime,
        newTime: formattedTime,
        oldWeather: lastWeather,
        newWeather: currentWeatherValue,
        day: dayCount,
        worldTime,
        forceUpdateCounter
      });
    }
    
    // Обновляем предыдущее состояние
    prevStateRef.current = { hour, minute, worldTime };
    
    // Сохраняем текущие значения для следующего сравнения
    setLastTime(formattedTime);
    setLastWeather(currentWeatherValue);
  }, [hour, minute, formattedTime, weather, worldTime, dayCount, lastTime, lastWeather, forceUpdateCounter]);
  
  // Включаем forceUpdateCounter в возвращаемый объект, чтобы компоненты реагировали на его изменение
  return {
    hour,
    minute,
    formattedTime,
    isDayTime,
    daytimePeriod,
    currentWeather,
    weatherIntensity,
    weatherEffects,
    dayCount,
    season,
    seasonDay,
    seasonLength,
    activeEvent,
    eventRemainingTime,
    nextWeatherChange,
    updating,
    worldTime,
    weather,
    forceUpdateCounter // Добавляем счетчик для принудительного обновления компонентов
  };
}

export default useTimeWeather;
