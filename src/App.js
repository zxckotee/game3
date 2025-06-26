import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';

// Импорт утилит отладки
import { initDebugTools } from './utils/debugTools';
import DebugTools from './components/debug/DebugTools';

// Импорт страниц
import LoginPage from './components/pages/LoginPage';
import CharacterCreationPage from './components/pages/CharacterCreationPage';
import GamePage from './components/pages/GamePage';

// Импорт компонентов
import GameTimeUpdater from './components/common/GameTimeUpdater';
import EffectsManager from './components/common/EffectsManager';
import InventoryManager from './components/common/InventoryManager';
import CultivationManager from './components/common/CultivationManager';
import CharacterStatsManager from './components/common/CharacterStatsManager';
import TechniqueManager from './components/common/TechniqueManager';
import SectManager from './components/common/SectManager';
import ResourceManager from './components/common/ResourceManager';
import AlchemyManager from './components/common/AlchemyManager';
import SpiritPetManager from './components/common/SpiritPetManager';
import MarketManager from './components/common/MarketManager';
import QuestManager from './components/common/QuestManager';

// Импорт контекста для хранения состояния игры
import { GameContextProvider as OriginalGameContextProvider } from './context/GameContext';
import { integrateRelationshipSyncer } from './utils/sectRelationshipSyncer';

// Создаем расширенный GameContextProvider с синхронизацией отношений
const GameContextProvider = integrateRelationshipSyncer(OriginalGameContextProvider);

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
`;

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #111;
  color: #f0f0f0;
  font-family: '"Ma Shan Zheng", cursive';
  font-size: 2rem;
  flex-direction: column;
  text-align: center;
`;

const ErrorScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #111;
  color: #ff6b6b;
  font-family: '"Ma Shan Zheng", cursive';
  font-size: 1.5rem;
  flex-direction: column;
  text-align: center;
  padding: 20px;
`;

const ErrorTitle = styled.h1`
  color: #ff6b6b;
  margin-bottom: 20px;
`;

const ErrorMessage = styled.p`
  margin-bottom: 20px;
`;

const RetryButton = styled.button`
  padding: 10px 20px;
  background: #d4af37;
  color: #000;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 20px;
  font-weight: bold;
  
  &:hover {
    background: #f4cf47;
  }
`;

// Функция для определения браузера
function detectBrowser() {
  const userAgent = navigator.userAgent;
  let browserName;

  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
  } else {
    browserName = "Unknown";
  }

  return browserName;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [browserInfo, setBrowserInfo] = useState(null);
  
  useEffect(() => {
    // Определяем браузер
    const browser = detectBrowser();
    setBrowserInfo(browser);
    console.log('Обнаружен браузер:', browser);
    
    // Если это Chrome, проверяем и исправляем localStorage
    if (browser === 'Chrome') {
      try {
        // Проверяем, есть ли сохраненная игра
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
          try {
            // Проверяем, что сохранение валидное
            const parsedState = JSON.parse(savedState);
            
            // Проверяем и исправляем структуру состояния для Chrome
            if (parsedState && typeof parsedState === 'object') {
              // Убедимся, что все необходимые объекты существуют
              if (!parsedState.player) parsedState.player = {};
              if (!parsedState.player.social) parsedState.player.social = {};
              if (!parsedState.player.social.relationships) parsedState.player.social.relationships = {};
              if (!parsedState.player.progress) parsedState.player.progress = {};
              if (!parsedState.player.progress.discoveries) parsedState.player.progress.discoveries = {};
              
              // Сохраняем исправленное состояние
              localStorage.setItem('gameState', JSON.stringify(parsedState));
              console.log('Состояние исправлено для Chrome');
            }
          } catch (parseError) {
            console.error('Ошибка при парсинге сохранения:', parseError);
            // Если сохранение повреждено, удаляем его
            localStorage.removeItem('gameState');
            console.log('Удалено поврежденное сохранение');
          }
        }
      } catch (err) {
        console.error('Ошибка при работе с localStorage:', err);
      }
    }
    
    // Имитация загрузки ресурсов
    const timer = setTimeout(() => {
      try {
        setIsLoading(false);
      } catch (err) {
        console.error('Ошибка при инициализации приложения:', err);
        setError('Произошла ошибка при загрузке приложения. Пожалуйста, попробуйте еще раз.');
        setIsLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Инициализация инструментов отладки
  useEffect(() => {
    // Инициализируем инструменты отладки без передачи store,
    // т.к. мы используем React Context вместо Redux
    initDebugTools();
    
    // Для удобства, добавляем метод, который будет выводить сообщение о том,
    // как получить доступ к информации о времени
    if (typeof window !== 'undefined') {
      window.showTimeHelp = () => {
        console.group('🕒 Как получить информацию о времени суток:');
        console.log('1. В консоли введите команду: getGameTime()');
        console.log('2. Это выведет подробную информацию о текущем игровом времени');
        console.log('3. Альтернативный способ: gameDebug.getTime()');
        console.log('4. Для получения только текущего часа и минуты: getGameTime().formattedTime');
        console.log('5. Для получения названия периода суток: getGameTime().daytimeName');
        console.groupEnd();
      };
      
      // Автоматически показываем справку в консоли
      setTimeout(() => {
        console.info('💡 Для помощи по получению игрового времени введите: showTimeHelp()');
      }, 3000);
    }
  }, []);
  
  const handleRetry = () => {
    window.location.reload();
  };
  
  if (isLoading) {
    return (
      <LoadingScreen>
        <h1>Путь к Бессмертию</h1>
        <p>Загрузка мира культивации...</p>
        {browserInfo && <p style={{ fontSize: '1rem', marginTop: '10px' }}>Браузер: {browserInfo}</p>}
      </LoadingScreen>
    );
  }
  
  if (error) {
    return (
      <ErrorScreen>
        <ErrorTitle>Ошибка загрузки</ErrorTitle>
        <ErrorMessage>{error}</ErrorMessage>
        {browserInfo && <p>Браузер: {browserInfo}</p>}
        <RetryButton onClick={handleRetry}>Попробовать снова</RetryButton>
      </ErrorScreen>
    );
  }
  
  return (
    <GameContextProvider>
      {/* GameTimeUpdater обновляет время и погоду автоматически */}
      <GameTimeUpdater debug={true} />
      {/* EffectsManager синхронизирует эффекты с сервером */}
      <EffectsManager />
      {/* InventoryManager синхронизирует инвентарь с сервером */}
      <InventoryManager />
      {/* CultivationManager синхронизирует данные культивации с сервером */}
      <CultivationManager />
      {/* CharacterStatsManager синхронизирует характеристики персонажа с сервером */}
      <CharacterStatsManager />
      {/* TechniqueManager синхронизирует техники с сервером */}
      <TechniqueManager />
      {/* SectManager синхронизирует данные о секте с сервером */}
      <SectManager />
      {/* ResourceManager синхронизирует данные о ресурсах с сервером */}
      <ResourceManager />
      {/* AlchemyManager синхронизирует данные о рецептах и предметах алхимии с сервером */}
      <AlchemyManager />
      {/* SpiritPetManager синхронизирует данные о духовных питомцах с сервером */}
      <SpiritPetManager />
      {/* MarketManager синхронизирует данные о рынке с сервером */}
      <MarketManager />
      {/* QuestManager синхронизирует данные о квестах с сервером */}
      <QuestManager />
      {/* Инструменты отладки */}
      <DebugTools enabled={true} />
      <Router>
        <AppContainer>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/character-creation" element={<CharacterCreationPage />} />
            <Route path="/game" element={<GamePage />} />
          </Routes>
        </AppContainer>
      </Router>
    </GameContextProvider>
  );
}

export default App;
