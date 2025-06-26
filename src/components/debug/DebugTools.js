import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import TimeDebugPanel from './TimeDebugPanel';
import { GameContext } from '../../context/GameContext';
import { getCharacterProfile, updateCurrency as updateCurrencyAPI } from '../../services/character-profile-service-api';
import '../../utils/directConsoleCommands'; // Импортируем команды консоли

// Стили для контейнера кнопки активации отладки
const DebugButtonContainer = styled.div`
  position: fixed;
  bottom: 10px;
  right: 10px;
  z-index: 9999;
`;

// Стили для кнопки активации отладки
const DebugButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #333;
  color: #ddd;
  border: 1px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  transition: all 0.2s;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
`;

/**
 * Компонент для интеграции инструментов отладки в интерфейс игры
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.enabled - Флаг активации отладки
 */
function DebugTools({ enabled = false }) {
  // Состояние для отслеживания видимости отладочных инструментов
  const [showTools, setShowTools] = useState(false);
  // Флаг активации кнопки отладки с клавиатуры
  const [keyActivated, setKeyActivated] = useState(false);
  
  // Получаем доступ к контексту игры
  const gameContext = useContext(GameContext);
  
  // Обработчик переключения видимости инструментов
  const toggleTools = () => {
    setShowTools(prev => !prev);
    
    // Информируем пользователя о доступных инструментах отладки
    if (!showTools) {
      console.info('🛠️ Отладочные инструменты активированы:');
      console.info('• getGameTime() - получить информацию об игровом времени');
      console.info('• showTimeHelp() - показать подсказки по использованию отладки времени');
      console.info('• add1000Currency() - добавить 1000 единиц каждой валюты');
      console.info('• дать1000Ресурсов() - то же самое на русском');
    }
    
    // Сохраняем ссылку на контекст игры в глобальном объекте
    if (typeof window !== 'undefined' && gameContext) {
      window.__GAME_CONTEXT__ = gameContext;
      window.__GAME_STATE__ = gameContext.state;
      window.__GAME_DISPATCH__ = gameContext.actions.dispatch;
    }
  };
  
  // Функция для добавления 1000 единиц каждой валюты
  const addCurrency = async () => {
    if (!gameContext || !gameContext.state || !gameContext.state.player || !gameContext.state.player.id) {
      console.error('[DebugTools] Не удалось получить доступ к ID игрока из контекста.');
      gameContext.actions.addNotification({ message: 'Ошибка: ID игрока не найден.', type: 'error' });
      return;
    }
    const userId = gameContext.state.player.id;

    try {
      console.log(`[DebugTools] Запрос текущего профиля для userId: ${userId}`);
      const profile = await getCharacterProfile(userId);
      
      if (!profile || !profile.currency) {
        console.error('[DebugTools] Не удалось получить текущий профиль или валюту.');
        gameContext.actions.addNotification({ message: 'Ошибка получения профиля для добавления валюты.', type: 'error' });
        return;
      }
      
      const currentCurrency = profile.currency;
      console.log('[DebugTools] Текущая валюта:', currentCurrency);

      const newCurrencyData = {
        copper: (currentCurrency.copper || 0) + 1000,
        silver: (currentCurrency.silver || 0) + 1000,
        gold: (currentCurrency.gold || 0) + 1000,
        spiritStones: (currentCurrency.spiritStones || 0) + 1000
      };
      
      console.log(`[DebugTools] Попытка обновить валюту для userId: ${userId} на`, newCurrencyData);
      await updateCurrencyAPI(userId, newCurrencyData);
      console.log('[DebugTools] Валюта успешно обновлена через API.');
      
      // Обновляем данные инвентаря (включая валюту) в глобальном состоянии
      if (gameContext.actions.loadInventoryData) {
        await gameContext.actions.loadInventoryData(userId);
        console.log('[DebugTools] Глобальное состояние инвентаря обновлено.');
      } else {
        console.warn('[DebugTools] gameContext.actions.loadInventoryData не найдено.');
      }
      
      gameContext.actions.addNotification({ message: 'Добавлено по 1000 единиц каждой валюты.', type: 'success' });
      console.log('[DebugTools] Добавлено по 1000 единиц каждой валюты! Новые значения (после обновления из API):', newCurrencyData);

    } catch (error) {
      console.error('[DebugTools] Ошибка при добавлении валюты:', error);
      gameContext.actions.addNotification({ message: `Ошибка добавления валюты: ${error.message}`, type: 'error' });
    }
  };
  
  // Обработчик нажатия клавиш для активации отладки
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e) => {
      // Комбинация Ctrl+Shift+D для активации отладки
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setKeyActivated(true);
        toggleTools();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, toggleTools]);
  
  // Если отладка не включена, не отображаем ничего
  if (!enabled && !keyActivated) return null;
  
  return (
    <>
      {/* Кнопка активации отладочных инструментов */}
      <DebugButtonContainer>
        <DebugButton onClick={toggleTools} title="Отладочные инструменты (Ctrl+Shift+D)">
          🛠️
        </DebugButton>
      </DebugButtonContainer>
      
      {/* Отладочные панели (отображаются только при активации) */}
      {showTools && (
        <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9998, maxWidth: '350px' }}>
          <TimeDebugPanel onClose={() => setShowTools(false)} />
          
          {/* Кнопка для добавления валюты */}
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#333', 
            borderRadius: '5px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            color: '#fff' 
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Валюта</h3>
            <button 
              onClick={addCurrency}
              style={{
                padding: '5px 10px',
                backgroundColor: '#d4af37',
                color: '#000',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              Добавить 1000 всех валют
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default DebugTools;
