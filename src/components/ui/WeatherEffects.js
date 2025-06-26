import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';

// Стилизованный контейнер для эффектов
const EffectsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
`;

// Наложение для времени суток, затенение/осветление экрана
const DayNightOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-color: ${props => props.backgroundColor};
  opacity: ${props => props.opacity};
  transition: opacity 1.5s ease-in-out, background-color 1.5s ease-in-out;
  z-index: 5;
`;

// Контейнер для анимирующихся частиц (дождь, снег и т.д.)
const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 6;
`;

// Стили отдельных частиц
const Particle = styled.div`
  position: absolute;
  background-color: ${props => props.color || 'rgba(255, 255, 255, 0.8)'};
  width: ${props => props.size || '2px'};
  height: ${props => props.size || '2px'};
  border-radius: ${props => props.round ? '50%' : '0'};
  top: ${props => props.top};
  left: ${props => props.left};
  opacity: ${props => props.opacity || '0.8'};
  animation: ${props => props.animation} ${props => props.duration} linear infinite;
  transform: ${props => props.transform || 'rotate(0deg)'};
  box-shadow: ${props => props.glow ? '0 0 5px 1px rgba(255, 255, 255, 0.3)' : 'none'};
  z-index: 7;
`;

// Туман
const FogOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${props => props.color || 'rgba(200, 200, 200, 0.4)'};
  opacity: ${props => props.opacity || 0.6};
  pointer-events: none;
  z-index: 8;
  animation: fogAnimation 15s ease-in-out infinite alternate;
  
  @keyframes fogAnimation {
    0% {
      filter: blur(3px);
    }
    50% {
      filter: blur(5px);
    }
    100% {
      filter: blur(4px);
    }
  }
`;

// Специальные эффекты (северное сияние, кровавая луна и т.д.)
const SpecialEffectOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: ${props => props.gradient || 'none'};
  opacity: ${props => props.opacity || 0.4};
  mix-blend-mode: ${props => props.blendMode || 'normal'};
  z-index: 9;
  animation: ${props => props.animation || 'none'} 20s ease-in-out infinite alternate;
`;

/**
 * Компонент для отображения визуальных эффектов погоды
 */
const WeatherEffects = () => {
  const { state } = useGame();
  const [particles, setParticles] = useState([]);
  const [overlayProps, setOverlayProps] = useState({
    backgroundColor: 'transparent',
    opacity: 0
  });
  const [fogProps, setFogProps] = useState({
    active: false,
    color: 'rgba(200, 200, 200, 0.4)',
    opacity: 0
  });
  const [specialEffect, setSpecialEffect] = useState({
    active: false,
    type: null,
    props: {}
  });
  
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Функция для обновления эффектов на основе текущей погоды и времени
  useEffect(() => {
    if (!state.weather) return;
    
    // Обновляем оверлей времени суток
    updateDayNightCycle();
    
    // Обновляем частицы и другие эффекты на основе текущей погоды
    updateWeatherEffects();
    
    // Очистка ресурсов при размонтировании компонента
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.weather, state.world.time]);
  
  // Функция для обновления оверлея времени суток
  const updateDayNightCycle = () => {
    let timePeriod;
    let hour;
    
    if (state.weather && state.weather.timePeriod) {
      timePeriod = state.weather.timePeriod;
    } else {
      // Используем часы из старой системы
      hour = state.world.time.hour;
      
      // Определяем время суток на основе часа
      if (hour >= 5 && hour < 7) timePeriod = 'dawn';
      else if (hour >= 7 && hour < 12) timePeriod = 'morning';
      else if (hour >= 12 && hour < 17) timePeriod = 'day';
      else if (hour >= 17 && hour < 19) timePeriod = 'evening';
      else if (hour >= 19 && hour < 21) timePeriod = 'dusk';
      else if (hour >= 21 || hour < 1) timePeriod = 'night';
      else timePeriod = 'midnight';
    }
    
    // Устанавливаем свойства оверлея на основе времени суток
    switch (timePeriod) {
      case 'dawn':
        setOverlayProps({
          backgroundColor: 'rgba(255, 200, 150, 0.2)',
          opacity: 0.3
        });
        break;
      case 'morning':
        setOverlayProps({
          backgroundColor: 'rgba(255, 230, 180, 0.1)',
          opacity: 0.1
        });
        break;
      case 'day':
        setOverlayProps({
          backgroundColor: 'transparent',
          opacity: 0
        });
        break;
      case 'evening':
        setOverlayProps({
          backgroundColor: 'rgba(255, 180, 130, 0.2)',
          opacity: 0.2
        });
        break;
      case 'dusk':
        setOverlayProps({
          backgroundColor: 'rgba(180, 120, 150, 0.3)',
          opacity: 0.4
        });
        break;
      case 'night':
        setOverlayProps({
          backgroundColor: 'rgba(20, 30, 60, 0.6)',
          opacity: 0.6
        });
        break;
      case 'midnight':
        setOverlayProps({
          backgroundColor: 'rgba(10, 20, 40, 0.7)',
          opacity: 0.7
        });
        break;
      default:
        setOverlayProps({
          backgroundColor: 'transparent',
          opacity: 0
        });
    }
  };
  
  // Функция для обновления эффектов погоды
  const updateWeatherEffects = () => {
    if (!state.weather || !state.weather.currentWeather) {
      // Очищаем эффекты, если нет данных о погоде
      setParticles([]);
      setFogProps({ active: false, opacity: 0 });
      setSpecialEffect({ active: false, type: null, props: {} });
      return;
    }
    
    const { type, intensity } = state.weather.currentWeather;
    const normalizedIntensity = Math.min(Math.max(intensity, 0.1), 1.0);
    
    // Сначала сбрасываем все эффекты
    setFogProps({ active: false, opacity: 0 });
    setSpecialEffect({ active: false, type: null, props: {} });
    
    switch (type) {
      case 'clear':
        // Для ясной погоды не нужны частицы
        setParticles([]);
        break;
        
      case 'cloudy':
        // Для облачной погоды не нужны частицы, но можно немного затемнить небо
        setParticles([]);
        
        if (normalizedIntensity > 0.7) {
          // Сильная облачность
          setOverlayProps(prev => ({
            ...prev,
            opacity: prev.opacity + normalizedIntensity * 0.1
          }));
        }
        break;
        
      case 'foggy':
        // Туман
        setParticles([]);
        setFogProps({
          active: true,
          color: `rgba(200, 200, 200, ${normalizedIntensity * 0.4})`,
          opacity: normalizedIntensity
        });
        break;
        
      case 'rainy':
        // Дождь - генерируем капли
        generateRaindrops(normalizedIntensity);
        
        // Затемняем небо при сильном дожде
        if (normalizedIntensity > 0.5) {
          setOverlayProps(prev => ({
            ...prev,
            backgroundColor: 'rgba(50, 60, 70, 0.1)',
            opacity: prev.opacity + normalizedIntensity * 0.1
          }));
        }
        break;
        
      case 'stormy':
        // Гроза - генерируем капли и добавляем молнии
        generateRaindrops(normalizedIntensity);
        
        // Затемняем небо сильнее при грозе
        setOverlayProps(prev => ({
          ...prev,
          backgroundColor: 'rgba(30, 40, 50, 0.2)',
          opacity: prev.opacity + normalizedIntensity * 0.2
        }));
        
        // Периодически добавляем эффект молнии
        const lightningInterval = setInterval(() => {
          if (Math.random() < normalizedIntensity * 0.3) {
            flashLightning();
          }
        }, 5000);
        
        // Очищаем интервал
        return () => clearInterval(lightningInterval);
        
      case 'snowy':
        // Снег
        generateSnowflakes(normalizedIntensity);
        
        // Добавляем мягкое затенение для снега
        setOverlayProps(prev => ({
          ...prev,
          backgroundColor: 'rgba(220, 230, 255, 0.1)',
          opacity: prev.opacity + normalizedIntensity * 0.05
        }));
        break;
        
      case 'windy':
        // Для ветра можно добавить анимированные частицы пыли или листья
        generateWindParticles(normalizedIntensity);
        break;
        
      case 'blizzard':
        // Метель - снег + туман
        generateSnowflakes(normalizedIntensity);
        setFogProps({
          active: true,
          color: `rgba(230, 240, 255, ${normalizedIntensity * 0.3})`,
          opacity: normalizedIntensity * 0.7
        });
        
        // Добавляем затенение для метели
        setOverlayProps(prev => ({
          ...prev,
          backgroundColor: 'rgba(200, 210, 240, 0.1)',
          opacity: prev.opacity + normalizedIntensity * 0.1
        }));
        break;
        
      case 'aurora':
        // Северное сияние
        setSpecialEffect({
          active: true,
          type: 'aurora',
          props: {
            gradient: 'linear-gradient(0deg, transparent 40%, rgba(0, 220, 130, 0.3) 60%, rgba(100, 60, 200, 0.3) 80%)',
            opacity: normalizedIntensity * 0.6,
            blendMode: 'soft-light',
            animation: 'auroraAnimation'
          }
        });
        
        // Добавляем стили анимации северного сияния
        const style = document.createElement('style');
        style.textContent = `
          @keyframes auroraAnimation {
            0% {
              background-position: 0% 0%;
            }
            50% {
              background-position: 100% 0%;
            }
            100% {
              background-position: 0% 0%;
            }
          }
        `;
        document.head.appendChild(style);
        
        return () => {
          document.head.removeChild(style);
        };
        
      case 'bloodMoon':
        // Кровавая луна - красное свечение
        setSpecialEffect({
          active: true,
          type: 'bloodMoon',
          props: {
            gradient: 'radial-gradient(circle at 80% 20%, rgba(180, 0, 0, 0.5) 10%, transparent 70%)',
            opacity: normalizedIntensity * 0.5,
            blendMode: 'multiply'
          }
        });
        
        // Затемняем общий фон
        setOverlayProps(prev => ({
          ...prev,
          backgroundColor: 'rgba(60, 0, 10, 0.2)',
          opacity: prev.opacity + normalizedIntensity * 0.15
        }));
        break;
        
      case 'rainbow':
        // Радуга
        setSpecialEffect({
          active: true,
          type: 'rainbow',
          props: {
            gradient: 'linear-gradient(180deg, transparent 60%, rgba(255, 0, 0, 0.2) 65%, rgba(255, 165, 0, 0.2) 70%, rgba(255, 255, 0, 0.2) 75%, rgba(0, 255, 0, 0.2) 80%, rgba(0, 0, 255, 0.2) 85%, rgba(75, 0, 130, 0.2) 90%, rgba(238, 130, 238, 0.2) 95%, transparent 100%)',
            opacity: normalizedIntensity * 0.5,
            blendMode: 'soft-light'
          }
        });
        break;
        
      case 'meteor':
        // Метеоритный дождь - периодически появляющиеся падающие звезды
        const meteorInterval = setInterval(() => {
          if (Math.random() < normalizedIntensity * 0.2) {
            generateMeteor();
          }
        }, 3000);
        
        return () => clearInterval(meteorInterval);
        
      default:
        // По умолчанию очищаем все эффекты
        setParticles([]);
    }
  };
  
  // Функция для генерации капель дождя
  const generateRaindrops = (intensity) => {
    const count = Math.floor(intensity * 100); // От 10 до 100 капель
    
    const newParticles = Array.from({ length: count }, (_, i) => {
      const left = `${Math.random() * 100}%`;
      const animationDuration = `${0.5 + Math.random() * 1}s`;
      const top = `${Math.random() * -100}%`;
      const size = `${1 + Math.random() * 2}px`;
      const animationDelay = `${Math.random() * 2}s`;
      
      // Генерируем CSS для анимации падения
      const style = document.createElement('style');
      style.textContent = `
        @keyframes raindrop-${i} {
          from {
            transform: translateY(-100px) rotate(20deg);
          }
          to {
            transform: translateY(calc(100vh + 100px)) rotate(20deg);
          }
        }
      `;
      document.head.appendChild(style);
      
      return {
        id: `raindrop-${i}`,
        left,
        top,
        size: `${size} ${size * 5}`,
        color: 'rgba(200, 220, 255, 0.6)',
        animation: `raindrop-${i} ${animationDuration}`,
        animationDelay,
        transform: 'rotate(20deg)',
        round: false
      };
    });
    
    setParticles(newParticles);
  };
  
  // Функция для генерации снежинок
  const generateSnowflakes = (intensity) => {
    const count = Math.floor(intensity * 80); // От 8 до 80 снежинок
    
    const newParticles = Array.from({ length: count }, (_, i) => {
      const left = `${Math.random() * 100}%`;
      const animationDuration = `${5 + Math.random() * 10}s`;
      const top = `${Math.random() * -100}%`;
      const size = `${2 + Math.random() * 3}px`;
      const opacity = 0.5 + Math.random() * 0.5;
      const animationDelay = `${Math.random() * 5}s`;
      
      // Генерируем CSS для анимации падения снежинок
      const style = document.createElement('style');
      style.textContent = `
        @keyframes snowflake-${i} {
          0% {
            transform: translateY(-10px) rotate(0deg);
          }
          25% {
            transform: translateY(25vh) translateX(${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg);
          }
          50% {
            transform: translateY(50vh) translateX(${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg);
          }
          75% {
            transform: translateY(75vh) translateX(${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg);
          }
          100% {
            transform: translateY(calc(100vh + 10px)) translateX(${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg);
          }
        }
      `;
      document.head.appendChild(style);
      
      return {
        id: `snowflake-${i}`,
        left,
        top,
        size,
        color: 'rgba(255, 255, 255, 0.8)',
        opacity,
        animation: `snowflake-${i} ${animationDuration}`,
        animationDelay,
        round: true,
        glow: Math.random() > 0.7 // Некоторые снежинки светятся
      };
    });
    
    setParticles(newParticles);
  };
  
  // Функция для генерации частиц ветра (пыль, листья и т.д.)
  const generateWindParticles = (intensity) => {
    const count = Math.floor(intensity * 40); // От 4 до 40 частиц
    
    const newParticles = Array.from({ length: count }, (_, i) => {
      const left = `${Math.random() * 100}%`;
      const animationDuration = `${2 + Math.random() * 4}s`;
      const top = `${Math.random() * 100}%`;
      const size = `${1 + Math.random() * 4}px`;
      const opacity = 0.3 + Math.random() * 0.4;
      const color = Math.random() > 0.7 
        ? 'rgba(220, 190, 150, 0.6)' // Цвет для пыли
        : Math.random() > 0.5 
          ? 'rgba(100, 180, 100, 0.6)' // Цвет для листьев
          : 'rgba(200, 200, 200, 0.5)'; // Цвет для других частиц
      
      // Генерируем CSS для анимации ветра
      const style = document.createElement('style');
      style.textContent = `
        @keyframes wind-particle-${i} {
          0% {
            transform: translateX(-100px) translateY(${Math.random() * 20 - 10}px) rotate(0deg);
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(${Math.random() * 40 - 20}px) rotate(${Math.random() * 720}deg);
          }
        }
      `;
      document.head.appendChild(style);
      
      return {
        id: `wind-particle-${i}`,
        left,
        top,
        size,
        color,
        opacity,
        animation: `wind-particle-${i} ${animationDuration}`,
        round: Math.random() > 0.5
      };
    });
    
    setParticles(newParticles);
  };
  
  // Функция для создания эффекта вспышки молнии
  const flashLightning = () => {
    // Создаем временный слой с эффектом молнии
    const lightning = document.createElement('div');
    lightning.style.position = 'absolute';
    lightning.style.top = '0';
    lightning.style.left = '0';
    lightning.style.width = '100%';
    lightning.style.height = '100%';
    lightning.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    lightning.style.zIndex = '20';
    lightning.style.pointerEvents = 'none';
    lightning.style.opacity = '0';
    lightning.style.transition = 'opacity 0.1s ease-in, opacity 0.5s ease-out';
    document.body.appendChild(lightning);
    
    // Первая вспышка
    setTimeout(() => {
      lightning.style.opacity = '0.9';
      
      // Затухание
      setTimeout(() => {
        lightning.style.opacity = '0.1';
        
        // Вторая вспышка (более слабая)
        setTimeout(() => {
          lightning.style.opacity = '0.5';
          
          // Полное затухание
          setTimeout(() => {
            lightning.style.opacity = '0';
            
            // Удаляем элемент
            setTimeout(() => {
              document.body.removeChild(lightning);
            }, 500);
          }, 50);
        }, 80);
      }, 40);
    }, 10);
  };
  
  // Функция для генерации метеора
  const generateMeteor = () => {
    const meteor = document.createElement('div');
    const startLeft = Math.random() * 50 + 25; // От 25% до 75% ширины
    const startTop = -10;
    const size = 2 + Math.random() * 3;
    
    meteor.style.position = 'absolute';
    meteor.style.left = `${startLeft}%`;
    meteor.style.top = `${startTop}%`;
    meteor.style.width = `${size}px`;
    meteor.style.height = `${size * 15}px`;
    meteor.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,220,180,0.3) 70%, transparent 100%)';
    meteor.style.borderRadius = '50px';
    meteor.style.transform = 'rotate(45deg)';
    meteor.style.zIndex = '15';
    meteor.style.pointerEvents = 'none';
    meteor.style.boxShadow = '0 0 15px 1px rgba(255, 220, 180, 0.6)';
    
    if (containerRef.current) {
      containerRef.current.appendChild(meteor);
      
      // Анимируем падение метеора
      let progress = 0;
      const animate = () => {
        progress += 0.01;
        const x = startLeft + progress * 50; // Горизонтальное движение
        const y = startTop + progress * 150; // Вертикальное движение
        
        meteor.style.left = `${x}%`;
        meteor.style.top = `${y}%`;
        
        // Уменьшаем размер для эффекта перспективы
        const scale = 1 - progress * 0.5;
        meteor.style.transform = `rotate(45deg) scale(${scale})`;
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Удаляем метеор, когда он выходит за пределы экрана
          containerRef.current.removeChild(meteor);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };
  
  return (
    <EffectsContainer ref={containerRef}>
      {/* Оверлей времени суток */}
      <DayNightOverlay 
        backgroundColor={overlayProps.backgroundColor}
        opacity={overlayProps.opacity}
      />
      
      {/* Эффект тумана */}
      {fogProps.active && (
        <FogOverlay 
          color={fogProps.color}
          opacity={fogProps.opacity}
        />
      )}
      
      {/* Специальные эффекты (северное сияние, кровавая луна и т.д.) */}
      {specialEffect.active && (
        <SpecialEffectOverlay 
          gradient={specialEffect.props.gradient}
          opacity={specialEffect.props.opacity}
          blendMode={specialEffect.props.blendMode}
          animation={specialEffect.props.animation}
        />
      )}
      
      {/* Контейнер для анимирующихся частиц */}
      <ParticlesContainer>
        {particles.map(particle => (
          <Particle
            key={particle.id}
            left={particle.left}
            top={particle.top}
            size={particle.size}
            color={particle.color}
            opacity={particle.opacity}
            animation={particle.animation}
            duration={particle.animationDuration || '5s'}
            transform={particle.transform}
            round={particle.round}
            glow={particle.glow}
          />
        ))}
      </ParticlesContainer>
    </EffectsContainer>
  );
};

export default WeatherEffects;
