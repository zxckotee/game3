import { useEffect, useRef, useState, useCallback } from 'react';
import WeatherService from '../../services/weather-service-adapter';
import { restockMerchantItems } from '../../data/merchants-adapter';

// Время последнего ручного обновления времени (глобальное)
const lastManualUpdateStamp = { time: 0 };

// Отключаем логи для улучшения производительности
const ENABLE_LOGS = false;

/**
 * Компонент для обновления игрового времени
 * Обновляет игровое время каждые 15 секунд, что вызывает обновление погоды
 * Использует события вместо Redux
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.debug - Флаг для включения отладочной информации
 */
function GameTimeUpdater({ debug = false }) {
  // Локальное состояние для игрового времени и погоды
  const [gameTime, setGameTime] = useState({
    timestamp: Date.now(),
    date: new Date(),
    dayPeriod: 'день',
    gameDay: 1,
    gameMonth: 1,
    gameYear: 1,
    season: 'весна'
  });
  
  const [weather, setWeather] = useState({
    type: 'ясно',
    temperature: 20,
    effects: []
  });
  
  // Используем useRef для хранения ссылки на интервал и предотвращения утечек памяти
  const intervalRef = useRef(null);
  
  // Используем useRef вместо useState для отслеживания последнего обновления времени
  // чтобы избежать перерендеринга компонента
  const lastUpdateRef = useRef(new Date());
  // Длительность интервала обновления в миллисекундах (15 секунд вместо 60 секунд)
  const updateInterval = 15000;

  // Функция для проверки, можно ли выполнить автоматическое обновление
  const canPerformAutoUpdate = useCallback(() => {
    const timeSinceLastManual = Date.now() - lastManualUpdateStamp.time;
    if (timeSinceLastManual < 2000) {
      return false;
    }
    return true;
  }, []);
  
  // Функция для отправки события обновления времени
  const dispatchTimeUpdate = useCallback((updatedTime) => {
    window.dispatchEvent(new CustomEvent('game-time-updated', { 
      detail: updatedTime 
    }));
    
    if (ENABLE_LOGS) console.log('Событие game-time-updated отправлено:', updatedTime);
  }, []);
  
  // Функция для отправки события обновления погоды
  const dispatchWeatherUpdate = useCallback((updatedWeather) => {
    window.dispatchEvent(new CustomEvent('weather-updated', { 
      detail: updatedWeather 
    }));
    
    // Также отправляем событие изменения дневного периода
    window.dispatchEvent(new CustomEvent('day-period-updated', { 
      detail: updatedWeather.dayPeriod 
    }));
    
    if (ENABLE_LOGS) console.log('Событие weather-updated отправлено:', updatedWeather);
  }, []);

  // Создаем функцию обновления с помощью useCallback, чтобы она была стабильной между рендерами
  const updateTime = useCallback(() => {
    // Проверяем, можно ли выполнить автоматическое обновление
    if (!canPerformAutoUpdate()) {
      if (ENABLE_LOGS) console.log('Пропускаем автоматическое обновление из-за недавнего ручного обновления');
      return;
    }

    const now = new Date();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Если прошло достаточно времени с последнего обновления
    if (timeSinceLastUpdate >= updateInterval) {
      // Обновляем время последнего обновления
      lastUpdateRef.current = now;
      
      // Рассчитываем новое игровое время
      const newGameTime = {
        timestamp: Date.now(),
        date: new Date(),
        // Сохраняем текущий период дня или вычисляем новый
        dayPeriod: gameTime.dayPeriod || calculateDayPeriod(now),
        // Увеличиваем игровой день и другие показатели по необходимости
        gameDay: gameTime.gameDay,
        gameMonth: gameTime.gameMonth,
        gameYear: gameTime.gameYear,
        season: gameTime.season
      };
      
      // Обновляем локальное состояние
      setGameTime(newGameTime);
      
      // Отправляем событие обновления времени
      dispatchTimeUpdate(newGameTime);
      
      // Пытаемся обновить погоду
      updateWeather(newGameTime);
      
      // Пытаемся обновить товары у торговцев (раз в 6 часов)
      restockMerchantItems();
      
      if (ENABLE_LOGS) console.log('Автоматическое обновление игрового времени:', now);
    }
  }, [canPerformAutoUpdate, updateInterval, gameTime, dispatchTimeUpdate]);
  
  // Функция для вычисления периода дня по текущему времени
  const calculateDayPeriod = (date) => {
    const hours = date.getHours();
    if (hours >= 5 && hours < 12) return 'утро';
    if (hours >= 12 && hours < 17) return 'день';
    if (hours >= 17 && hours < 21) return 'вечер';
    return 'ночь';
  };
  
  // Функция для обновления погоды на основе времени
  const updateWeather = useCallback(async (time) => {
    try {
      // Получаем текущую погоду через сервис
      const weatherData = await WeatherService.getCurrentWeather();
      
      // Обновляем локальное состояние
      setWeather(weatherData);
      
      // Отправляем событие обновления погоды
      dispatchWeatherUpdate(weatherData);
      
      if (ENABLE_LOGS) console.log('Погода обновлена:', weatherData);
    } catch (error) {
      console.error('Ошибка при обновлении погоды:', error);
    }
  }, [dispatchWeatherUpdate]);

  // Настраиваем интервал обновления при монтировании компонента
  useEffect(() => {
    if (debug) {
      // В новой архитектуре подключаем инструменты отладки через события
      window.gameTimeDebug = {
        manualUpdate: () => {
          lastManualUpdateStamp.time = Date.now();
          updateTime();
        },
        getTime: () => gameTime,
        getWeather: () => weather,
        setWeather: (newWeather) => {
          setWeather(newWeather);
          dispatchWeatherUpdate(newWeather);
        }
      };
    }
    
    // Сначала инициализируем погоду, если она еще не инициализирована
    const initWeather = async () => {
      try {
        // Получаем текущую погоду и время суток
        const weatherData = await WeatherService.getCurrentWeather();
        
        // Обновляем локальное состояние
        setWeather(weatherData);
        
        // Отправляем событие инициализации погоды
        dispatchWeatherUpdate(weatherData);
        
        if (ENABLE_LOGS) console.log('Погода инициализирована:', weatherData);
      } catch (error) {
        console.error('Ошибка при инициализации погоды:', error);
      }
    };
    
    // Инициализируем погоду
    initWeather();
    
    // Устанавливаем интервал для регулярного обновления времени
    intervalRef.current = setInterval(updateTime, 1000);
    
    // Очистка интервала при размонтировании компонента
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Очищаем объект отладки
      if (debug && window.gameTimeDebug) {
        delete window.gameTimeDebug;
      }
    };
  }, [updateTime, weather, gameTime, dispatchWeatherUpdate, debug]);

  // Компонент не рендерит видимый UI
  return null;
}

export default GameTimeUpdater;
