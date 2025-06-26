import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { updateGameTime } from '../../context/actions/weather-actions';
import WeatherService from '../../services/weather-service-adapter';
import { connectDebugTools } from '../../utils/debugTools';

// Отключаем избыточные логи в консоль для улучшения производительности
const ENABLE_LOGS = false;

// Стилизованные компоненты для отладочной панели
const DebugPanel = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.8);
  border: 1px solid #444;
  border-radius: 5px;
  padding: 15px;
  color: #fff;
  font-family: monospace;
  min-width: 300px;
  z-index: 9999;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
`;

const PanelTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #ffd700;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  &:hover {
    color: #fff;
  }
`;

const TimeInfo = styled.div`
  margin-bottom: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
`;

const Label = styled.span`
  color: #aaa;
`;

const Value = styled.span`
  color: #fff;
  font-weight: bold;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
`;

const SliderContainer = styled.div`
  margin-top: 15px;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
`;

const Slider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
  background: #333;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffd700;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffd700;
    cursor: pointer;
  }
`;

const Button = styled.button`
  background-color: #333;
  border: 1px solid #555;
  border-radius: 3px;
  color: #fff;
  padding: 5px 10px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #444;
  }
  
  &:active {
    background-color: #555;
  }
`;

/**
 * Компонент отладочной панели для работы с временем
 * Позволяет наблюдать и контролировать течение игрового времени
 */
function TimeDebugPanel({ onClose }) {
  const { state, actions } = useGame();
  const [timeInfo, setTimeInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [customMultiplier, setCustomMultiplier] = useState(WeatherService.TIME_MULTIPLIER);
  const [clickedButton, setClickedButton] = useState(null);
  const refreshTimerRef = useRef(null);
  
  // Функция получения информации о времени
  const fetchTimeInfo = useCallback(() => {
      console.log('📊 TimeDebugPanel - fetchTimeInfo, полное состояние:', {
        world_time: state.world?.time,
        weather: state.weather
      });
      
      // Для отладки показываем полное состояние world.time
      if (state.world?.time) {
        console.log('⭐⭐ ЕДИНСТВЕННЫЙ ИСТОЧНИК ПРАВДЫ: state.world.time =', state.world.time);
      }
  
      // ПРИНУДИТЕЛЬНО используем ТОЛЬКО state.world.time, игнорируя weather
      const worldTime = state.world?.time || {};
      
      // ВАЖНО: Явно извлекаем все значения из worldTime с дефолтами
      const hour = worldTime.hour !== undefined ? Number(worldTime.hour) : 12;
      const minute = worldTime.minute !== undefined ? Number(worldTime.minute) : 0;
      const day = worldTime.day !== undefined ? Number(worldTime.day) : 1;
      const season = worldTime.season || 'spring';
      
      // Отладочный лог, чтобы точно знать откуда взяты данные
      console.log('🔍 ИЗВЛЕЧЕННЫЕ ДАННЫЕ ИЗ state.world.time:', { 
        hour, 
        minute, 
        day,
        season
      });
      
      // Вычисляем дополнительные параметры на основе hour/minute
      const isDayTime = hour >= 6 && hour < 20;
      const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const currentTime = hour * 60 + minute;
      
      // Определяем период суток напрямую, без зависимости от сервиса
      const daytimePeriod = 
        (hour >= 5 && hour < 7) ? 'dawn' :
        (hour >= 7 && hour < 11) ? 'morning' :
        (hour >= 11 && hour < 14) ? 'noon' :
        (hour >= 14 && hour < 17) ? 'afternoon' :
        (hour >= 17 && hour < 20) ? 'evening' :
        (hour >= 20 && hour < 23) ? 'night' : 'deepNight';
      
      const daytimeName = {
        dawn: 'Рассвет',
        morning: 'Утро',
        noon: 'Полдень',
        afternoon: 'День',
        evening: 'Вечер',
        night: 'Ночь',
        deepNight: 'Глубокая ночь'
      }[daytimePeriod] || 'Неизвестно';
      
      // ИСПРАВЛЕНИЕ: Принудительно синхронизируем день сезона с мировым днем
      const synchronizedSeasonDay = day; // Всегда берем день сезона = мировой день
      
      // Если день сезона отличается, исправляем его
      if (state.weather?.seasonDay !== day) {
        console.log('🔄 TimeDebugPanel: исправление несоответствия дня сезона', {
          текущий_день_сезона: state.weather?.seasonDay,
          мировой_день: day,
          действие: 'принудительная синхронизация'
        });
        
        // Вызываем диспетчер для принудительной синхронизации (только если оба значения определены)
        if (day !== undefined && actions && actions.dispatch) {
          setTimeout(() => {
            actions.dispatch({ type: 'SYNC_SEASON_DAY' });
          }, 100);
        }
      }
      
      // Собираем финальный объект с данными о времени
      const computedTimeInfo = {
        hour,
        minute,
        dayCount: day,
        formattedTime,
        isDayTime,
        daytimePeriod,
        daytimeName,
        currentTime,
        currentSeason: season,
        seasonDay: synchronizedSeasonDay, // Используем синхронизированное значение
        
        // Эти поля только для совместимости с существующим кодом
        currentWeather: state.weather?.currentWeather || 'clear',
        nextWeatherChange: state.weather?.nextWeatherChange || 60
      };
      
      console.log('⏰⏰ TimeDebugPanel - ИТОГОВАЯ информация о времени:', computedTimeInfo);
      
      setTimeInfo(computedTimeInfo);
    }, [state]);
  // Для отслеживания изменений дня
  const prevDayRef = useRef(null);

  // Отправляем ссылку на состояние в отладочные инструменты
  useEffect(() => {
    // Подключаем состояние к отладочным инструментам
    connectDebugTools({ context: { state } });
    
    // Получаем информацию о времени
    fetchTimeInfo();
    
    // Устанавливаем интервал обновления данных о времени (реже - каждые 3 секунды)
    refreshTimerRef.current = setInterval(fetchTimeInfo, 3000);
    
    // Очищаем интервал при размонтировании
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [state, fetchTimeInfo]);

  // Отдельный эффект для отслеживания изменений дня
  useEffect(() => {
    const currentDay = state.world?.time?.day;
    
    // Проверяем, инициализировано ли предыдущее значение
    if (prevDayRef.current === null) {
      prevDayRef.current = currentDay;
      return;
    }
    
    // Если день изменился, логируем это событие
    if (currentDay !== prevDayRef.current) {
      console.log('🎯🎯🎯 ДЕНЬ ИЗМЕНИЛСЯ В UI КОМПОНЕНТЕ:', {
        prevDay: prevDayRef.current,
        newDay: currentDay,
        worldTimeObject: {...state.world?.time},
        timeInfo: timeInfo,
        detectedChange: true
      });
      
      // Обновляем ссылку на предыдущий день
      prevDayRef.current = currentDay;
    }
  }, [state.world?.time?.day, timeInfo]);
  
  // Обработчик для обновления времени (старая версия для реального времени)
  const advanceTime = useCallback((minutes) => {
    try {
      console.log('🔍 advanceTime вызван с параметром:', minutes);
      
      // Проверяем, что actions и dispatch существуют
      if (!actions) {
        console.error('🚫 actions не существует');
        return;
      }
      
      if (!actions.dispatch) {
        console.error('🚫 actions.dispatch не существует. actions:', actions);
        return;
      }
      
      console.log('✅ actions и dispatch существуют и готовы к использованию');
      
      // ВАЖНО: Отдельный лог для diag, чтобы видеть состояние перед обновлением
      console.log('🔬 DIAG: Исходные значения перед обновлением:', {
        worldTime: state.world?.time, 
        weather: {
          hour: state.weather?.hour,
          minute: state.weather?.minute,
          dayCount: state.weather?.dayCount
        }
      });
      
      console.log('⚡⚡ Используем updateGameTime для СИНХРОННОГО обновления времени');
      
      // Создаем экшен с явным флагом ручного обновления
      const action = updateGameTime(minutes, true);
      
      // ВАЖНО: явно маркируем как отправку для отладки
      console.log('📌 ОТПРАВЛЯЕМ updateGameTime:', {
        minutes,
        isManual: true,
        action
      });
      
      // Отправляем в диспетчер 
      actions.dispatch(action);
      
      // Отправляем пользовательское событие о ручном обновлении времени
      window.dispatchEvent(new CustomEvent('manual_time_update', {
        detail: { type: 'manual_time_update', minutes, timestamp: Date.now() }
      }));
      
      // Отправляем диспетчерам принудительное обновление
      window.__forceSyncWeatherTime = true;

      // Запрашиваем принудительное обновление с интервалом для гарантии синхронизации
      const checkTimestamps = [100, 500, 1500]; // Проверки через 0.1, 0.5 и 1.5 секунды
      
      // Создаем функцию для планирования проверок
      const scheduleChecks = () => {
        checkTimestamps.forEach((timestamp, index) => {
          setTimeout(() => {
            console.log(`🔄 Проверка #${index + 1} (${timestamp} мс)...`);
            
            // Сперва запрашиваем свежую информацию
            fetchTimeInfo();
            
            // ⚠️⚠️ ОЧЕНЬ ВАЖНО! Мы отправляем ПРЯМУЮ команду синхронизации
            // Это обходное решение для гарантии синхронизации между состояниями
            if (index === checkTimestamps.length - 1) { // Только на последней проверке
              console.log('🔄 ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ');
              
              // Используем существующий метод dispatch для принудительной синхронизации
              if (actions && actions.dispatch) {
                console.log('🔄 Отправляем DIRECT_FORCE_SYNC_WEATHER_TIME');
                actions.dispatch({
                  type: 'DIRECT_FORCE_SYNC_WEATHER_TIME',
                  payload: {} // Параметры не нужны, редьюсер сам получит актуальные значения
                });
              }
            }
            
            // Обновляем информацию еще раз после синхронизации
            setTimeout(() => {
              fetchTimeInfo();
              
              // Проверка синхронизации между world.time и weather - ТОЛЬКО если есть оба объекта
              if (state.world?.time && state.weather) {
                // Подробная отладка типов данных до преобразования
                console.log('🔍 АНАЛИЗ ТИПОВ ДАННЫХ ДЛЯ СРАВНЕНИЯ:', {
                  worldHour: {
                    value: state.world.time.hour,
                    type: typeof state.world.time.hour,
                    isNumber: !isNaN(Number(state.world.time.hour))
                  },
                  worldMinute: {
                    value: state.world.time.minute,
                    type: typeof state.world.time.minute,
                    isNumber: !isNaN(Number(state.world.time.minute))
                  },
                  weatherHour: {
                    value: state.weather.hour,
                    type: typeof state.weather.hour,
                    isNumber: !isNaN(Number(state.weather.hour))
                  },
                  weatherMinute: {
                    value: state.weather.minute,
                    type: typeof state.weather.minute,
                    isNumber: !isNaN(Number(state.weather.minute))
                  }
                });
                
                // КРИТИЧЕСКИ ВАЖНО: не просто Number(), а parseInt() с проверкой на NaN
                // Это гарантирует, что строки и числа будут корректно сравниваться
                const worldHour = parseInt(state.world.time.hour, 10);
                const worldMinute = parseInt(state.world.time.minute, 10);
                const weatherHour = parseInt(state.weather.hour, 10);
                const weatherMinute = parseInt(state.weather.minute, 10);
                
                // ДОПОЛНИТЕЛЬНО выполним проверку, что все значения являются числами
                const valuesAreValid = 
                  !isNaN(worldHour) && 
                  !isNaN(worldMinute) && 
                  !isNaN(weatherHour) && 
                  !isNaN(weatherMinute);
                
                // СТРОГАЯ ПРОВЕРКА: ещё и на равенство строковых представлений для минут
                // Это страховка на случай, если изменяются только строковые значения
                const minuteStringsEqual = String(state.world.time.minute) === String(state.weather.minute);
                
                // ОСНОВНАЯ ПРОВЕРКА на синхронизацию всех значений
                const isHourSynced = worldHour === weatherHour;
                // Двойная проверка для минут - по числам И по строкам
                const isMinuteSynced = (worldMinute === weatherMinute) || minuteStringsEqual;
                const isDaySynced = parseInt(state.world.time.day, 10) === parseInt(state.weather.dayCount, 10);
                const isSeasonSynced = state.world.time.season === state.weather.currentSeason;
                
                if (!isHourSynced || !isMinuteSynced || !isDaySynced || !isSeasonSynced || !valuesAreValid) {
                  console.error('⚠️ ОШИБКА СИНХРОНИЗАЦИИ между world.time и weather:', {
                    hourSynced: isHourSynced,
                    minuteSynced: isMinuteSynced,
                    minuteStringsEqual, // Дополнительная проверка на равенство строк
                    daySynced: isDaySynced,
                    seasonSynced: isSeasonSynced,
                    valuesAreValid, // Все ли значения являются числами
                    worldTime: {
                      hour: worldHour,
                      minute: worldMinute,
                      hourRaw: state.world.time.hour,
                      minuteRaw: state.world.time.minute,
                      day: state.world.time.day,
                      season: state.world.time.season,
                    },
                    weather: {
                      hour: weatherHour,
                      minute: weatherMinute,
                      hourRaw: state.weather.hour,
                      minuteRaw: state.weather.minute,
                      dayCount: state.weather.dayCount,
                      currentSeason: state.weather.currentSeason
                    }
                  });
                  
                  // АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ: если обнаружена проблема с минутами,
                  // пробуем исправить её вручную
                  if (!isMinuteSynced && actions && actions.dispatch) {
                    console.log('🔧 РУЧНОЕ ИСПРАВЛЕНИЕ минут в weather: принудительно устанавливаем minute = ' + state.world.time.minute);
                    // Отправляем экшен для исправления только минут
                    actions.dispatch({
                      type: 'FIX_WEATHER_MINUTES',
                      payload: {
                        minute: state.world.time.minute
                      }
                    });
                  }
                } else {
                  console.log('✅ Синхронизация времени успешна!');
                }
              }
            }, 200); // Небольшая задержка после синхронизации
          }, timestamp);
        });
      };
      
      // Запускаем серию проверок
      scheduleChecks();
    } catch (error) {
      console.error('❌ Ошибка в advanceTime:', error);
      // Сохраняем только критические ошибки
      if (error && error.toString().includes('TypeError')) {
        console.error('Критическая ошибка:', error);
      }
    }
  }, [actions, fetchTimeInfo]);
  
  // НОВАЯ ФУНКЦИЯ: Обработчик для прямого добавления игровых часов
  const advanceGameHours = useCallback((hours) => {
    try {
      console.log(`🕒 Добавление ${hours} игровых часов напрямую`);
      
      // Проверяем, что actions и dispatch существуют
      if (!actions) {
        console.error('🚫 actions не существует');
        return;
      }
      
      if (!actions.dispatch) {
        console.error('🚫 actions.dispatch не существует. actions:', actions);
        return;
      }
      
      console.log('✅ actions и dispatch существуют и готовы к использованию');
      
      // Отладочная информация перед обновлением
      console.log('🔬 DIAG: Исходные значения перед добавлением часов:', {
        worldTime: state.world?.time, 
        hours
      });
      
      // Отправляем экшен для добавления игровых часов напрямую
      actions.dispatch({
        type: 'DIRECT_ADD_GAME_HOURS',
        payload: {
          hours: hours,
          timestamp: Date.now()
        }
      });
      
      // Отправляем пользовательское событие о ручном обновлении времени
      window.dispatchEvent(new CustomEvent('manual_time_update', {
        detail: { type: 'manual_game_hours_update', hours, timestamp: Date.now() }
      }));
      
      // Запрашиваем обновление информации после изменения
      const checkTimestamps = [100, 500];
      
      checkTimestamps.forEach((timestamp, index) => {
        setTimeout(() => {
          // Запрашиваем свежую информацию
          fetchTimeInfo();
          
          // Принудительная синхронизация для гарантии
          if (index === checkTimestamps.length - 1) {
            console.log('🔄 Принудительная синхронизация после добавления часов');
            if (actions && actions.dispatch) {
              actions.dispatch({
                type: 'DIRECT_FORCE_SYNC_WEATHER_TIME',
                payload: {}
              });
              
              // Обновляем информацию еще раз после синхронизации
              setTimeout(fetchTimeInfo, 200);
            }
          }
        }, timestamp);
      });
    } catch (error) {
      console.error('❌ Ошибка в advanceGameHours:', error);
    }
  }, [actions, fetchTimeInfo]);
  
  // Запускаем консольную функцию отладки
  const showConsoleDebug = useCallback(() => {
    if (typeof window !== 'undefined' && window.getGameTime) {
      window.getGameTime({ state });
    } else {
      console.info('Функция getGameTime() недоступна. Возможно, нужно перезагрузить страницу.');
    }
  }, [state]);
  
  // Обработчик для изменения множителя времени
  const updateTimeMultiplier = useCallback((newValue) => {
    console.log('🔧 updateTimeMultiplier вызван с параметром:', newValue);
    
    const multiplier = parseInt(newValue, 10);
    if (!isNaN(multiplier) && multiplier > 0) {
      // Старое значение для сравнения
      const oldMultiplier = WeatherService.TIME_MULTIPLIER;
      
      // Устанавливаем новое значение
      WeatherService.TIME_MULTIPLIER = multiplier;
      setCustomMultiplier(multiplier);
      
      console.log(`✅ TIME_MULTIPLIER изменен: ${oldMultiplier} → ${multiplier}`);
      
      // Сообщаем другим компонентам об изменении множителя через кастомное событие
      window.dispatchEvent(new CustomEvent('time_multiplier_changed', {
        detail: { timeMultiplier: multiplier }
      }));
      
      // Принудительное обновление UI
      try {
        if (actions && actions.dispatch) {
          // Отправляем специальный экшен для обновления интерфейса
          actions.dispatch({
            type: 'UPDATE_TIME_MULTIPLIER',
            payload: { multiplier }
          });
        }
      } catch (error) {
        console.error('❌ Ошибка при отправке UPDATE_TIME_MULTIPLIER:', error);
      }
    } else {
      console.warn('⚠️ Недопустимое значение множителя:', newValue);
    }
  }, [actions]);
  
  // Скрываем панель при нажатии на кнопку закрытия
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  if (!isVisible || !timeInfo) return null;
  
  return (
    <DebugPanel>
      <PanelTitle>
        Отладка игрового времени
        <CloseButton onClick={handleClose}>×</CloseButton>
      </PanelTitle>
      
      <TimeInfo>
        <Label>Время:</Label>
        <Value>{timeInfo.formattedTime}</Value>
        
        <Label>Период суток:</Label>
        <Value>{timeInfo.daytimeName}</Value>
        
        <Label>День:</Label>
        <Value>{timeInfo.dayCount}</Value>
        
        <Label>Сезон:</Label>
        <Value>
          {timeInfo.currentSeason} (день {timeInfo.seasonDay})
          {(timeInfo.dayCount !== timeInfo.seasonDay) && 
            <span style={{ color: '#ff6666', marginLeft: '5px' }}>
              ⚠️ Несоответствие!
            </span>
          }
        </Value>
        
        <Label>Погода:</Label>
        <Value>{timeInfo.currentWeather}</Value>
        
        <Label>До смены погоды:</Label>
        <Value>
          {timeInfo.nextWeatherChange 
            ? `${timeInfo.nextWeatherChange} мин. игр. / ${Math.ceil(timeInfo.nextWeatherChange / WeatherService.TIME_MULTIPLIER)} мин. реал.` 
            : 'Н/Д'}
        </Value>
        
        <Label>Множитель времени:</Label>
        <Value>1:{customMultiplier}</Value>
      </TimeInfo>
      
      <SliderContainer>
        <Label>Настройка множителя времени:</Label>
        <SliderRow>
          <span>1</span>
          <Slider 
            type="range" 
            min="1" 
            max="240" 
            value={customMultiplier}
            onChange={(e) => {
              console.log('🔧 Изменение ползунка множителя времени:', e.target.value);
              updateTimeMultiplier(e.target.value);
            }}
            style={{
              background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${(customMultiplier/240)*100}%, #333 ${(customMultiplier/240)*100}%, #333 100%)`
            }}
          />
          <span>240</span>
        </SliderRow>
        <Value style={{ textAlign: 'center', color: '#ffd700' }}>
          1 мин. реального времени = {customMultiplier} мин. игрового времени
        </Value>
      </SliderContainer>
      
      <ButtonGroup>
        <Button 
          onClick={() => {
            // НОВАЯ ФУНКЦИЯ: принудительная синхронизация дня сезона с мировым днем
            setClickedButton('sync_day');
            
            try {
              if (actions && actions.dispatch) {
                console.log('🔄 Запрос на принудительную синхронизацию дня сезона с мировым днем');
                actions.dispatch({
                  type: 'SYNC_SEASON_DAY'
                });
                
                // Обновляем информацию после синхронизации
                setTimeout(() => {
                  fetchTimeInfo();
                  console.log('✅ Синхронизация дня сезона завершена');
                }, 300);
              }
            } catch (error) {
              console.error('❌ Ошибка при синхронизации дня сезона:', error);
            }
            
            setTimeout(() => setClickedButton(null), 1000);
          }}
          style={{
            backgroundColor: clickedButton === 'sync_day' ? '#00663d' : '#006633',
            transform: clickedButton === 'sync_day' ? 'scale(0.95)' : undefined,
            boxShadow: clickedButton === 'sync_day' ? '0 0 10px #00cc66' : undefined,
            borderColor: clickedButton === 'sync_day' ? '#00cc66' : undefined
          }}
        >
          Синхр. день сезона
        </Button>
        
        <Button 
          onClick={() => {
            // НОВАЯ ФУНКЦИЯ: принудительная смена погоды
            setClickedButton('change_weather');
            
            try {
              if (actions && actions.dispatch) {
                console.log('🌤️ Запрос на принудительную смену погоды');
                actions.dispatch({
                  type: 'FORCE_WEATHER_CHANGE'
                });
                
                // Обновляем информацию после смены погоды
                setTimeout(() => {
                  fetchTimeInfo();
                  console.log('✅ Погода принудительно изменена');
                }, 300);
              }
            } catch (error) {
              console.error('❌ Ошибка при смене погоды:', error);
            }
            
            setTimeout(() => setClickedButton(null), 1000);
          }}
          style={{
            backgroundColor: clickedButton === 'change_weather' ? '#1a538c' : '#0066cc',
            transform: clickedButton === 'change_weather' ? 'scale(0.95)' : undefined,
            boxShadow: clickedButton === 'change_weather' ? '0 0 10px #66aaff' : undefined,
            borderColor: clickedButton === 'change_weather' ? '#66aaff' : undefined
          }}
        >
          Сменить погоду
        </Button>
        
        <Button 
          onClick={() => {
            setClickedButton('1hour');
            advanceGameHours(1);
            // Сбросить выделение кнопки через 1 секунду
            setTimeout(() => setClickedButton(null), 1000);
          }}
          style={{
            backgroundColor: clickedButton === '1hour' ? '#7a5c00' : undefined,
            transform: clickedButton === '1hour' ? 'scale(0.95)' : undefined,
            boxShadow: clickedButton === '1hour' ? '0 0 10px #ffd700' : undefined,
            borderColor: clickedButton === '1hour' ? '#ffd700' : undefined
          }}
        >
          +1 час игр.
        </Button>
        <Button 
          onClick={() => {
            setClickedButton('3hours');
            advanceGameHours(3);
            setTimeout(() => setClickedButton(null), 1000);
          }}
          style={{
            backgroundColor: clickedButton === '3hours' ? '#7a5c00' : undefined,
            transform: clickedButton === '3hours' ? 'scale(0.95)' : undefined,
            boxShadow: clickedButton === '3hours' ? '0 0 10px #ffd700' : undefined,
            borderColor: clickedButton === '3hours' ? '#ffd700' : undefined
          }}
        >
          +3 часа игр.
        </Button>
        <Button 
          onClick={() => {
            setClickedButton('6hours');
            advanceGameHours(6);
            setTimeout(() => setClickedButton(null), 1000);
          }}
          style={{
            backgroundColor: clickedButton === '6hours' ? '#7a5c00' : undefined,
            transform: clickedButton === '6hours' ? 'scale(0.95)' : undefined,
            boxShadow: clickedButton === '6hours' ? '0 0 10px #ffd700' : undefined,
            borderColor: clickedButton === '6hours' ? '#ffd700' : undefined
          }}
        >
          +6 часов игр.
        </Button>
        <Button 
          onClick={() => {
            setClickedButton('12hours');
            advanceGameHours(12);
            setTimeout(() => setClickedButton(null), 1000);
          }}
          style={{
            backgroundColor: clickedButton === '12hours' ? '#7a5c00' : undefined,
            transform: clickedButton === '12hours' ? 'scale(0.95)' : undefined,
            boxShadow: clickedButton === '12hours' ? '0 0 10px #ffd700' : undefined,
            borderColor: clickedButton === '12hours' ? '#ffd700' : undefined
          }}
        >
          +12 часов игр.
        </Button>
        <Button 
          onClick={() => {
            setClickedButton('console');
            showConsoleDebug();
            setTimeout(() => setClickedButton(null), 500);
          }}
          style={{
            backgroundColor: clickedButton === 'console' ? '#666' : undefined,
            transform: clickedButton === 'console' ? 'scale(0.95)' : undefined
          }}
        >
          Консоль
        </Button>
      </ButtonGroup>
    </DebugPanel>
  );
}

export default TimeDebugPanel;
