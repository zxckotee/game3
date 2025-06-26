/**
 * Прямые консольные команды для быстрого использования
 * Эти функции автоматически прикрепляются к объекту window и доступны сразу после загрузки
 */

// Самовыполняющаяся функция для прикрепления команд к window
(function(window) {
  /**
   * Получает актуальные значения здоровья и энергии игрока
   * Проверяет как боевое состояние, так и глобальное состояние
   */
  function getPlayerVitalStats() {
    try {
      // Проверяем, находится ли игрок в бою
      const gameContext = window.__GAME_CONTEXT__;
      const gameState = window.__GAME_STATE__;
      
      // Пытаемся найти данные боя через DOM (компонент CombatManager)
      let combatData = null;
      try {
        // Ищем элементы с атрибутами данных о здоровье/энергии
        const healthEl = document.querySelector('[data-health]');
        const energyEl = document.querySelector('[data-energy]'); 
        
        if (healthEl && energyEl) {
          combatData = {
            health: parseFloat(healthEl.getAttribute('data-health')),
            maxHealth: parseFloat(healthEl.getAttribute('data-max-health')),
            energy: parseFloat(energyEl.getAttribute('data-energy')),
            maxEnergy: parseFloat(energyEl.getAttribute('data-max-energy'))
          };
          console.debug('Найдены данные боя через DOM:', combatData);
        }
      } catch (domError) {
        console.debug('Не удалось получить данные боя через DOM:', domError);
      }
      
      // Если игрок в бою и есть данные боя - используем их
      if (combatData && combatData.health !== undefined) {
        return combatData;
      }
      
      // Иначе берем данные из глобального состояния, сначала проверяя stats
      if (gameState && gameState.player) {
        // Приоритет 1: player.stats (если есть полные данные)
        if (gameState.player.stats && 
            gameState.player.stats.health !== undefined && 
            gameState.player.stats.maxHealth !== undefined &&
            gameState.player.stats.energy !== undefined &&
            gameState.player.stats.maxEnergy !== undefined) {
          
          return {
            health: gameState.player.stats.health,
            maxHealth: gameState.player.stats.maxHealth,
            energy: gameState.player.stats.energy,
            maxEnergy: gameState.player.stats.maxEnergy
          };
        }
        
        // Приоритет 2: прямые свойства player (для совместимости)
        return {
          health: gameState.player.health !== undefined ? gameState.player.health : 100,
          maxHealth: gameState.player.maxHealth !== undefined ? gameState.player.maxHealth : 100,
          energy: gameState.player.energy !== undefined ? gameState.player.energy : 100, 
          maxEnergy: gameState.player.maxEnergy !== undefined ? gameState.player.maxEnergy : 100
        };
      }
      
      // Если ничего не нашли - возвращаем значения по умолчанию
      return { health: 100, maxHealth: 100, energy: 100, maxEnergy: 100 };
    } catch (error) {
      console.error('Ошибка при получении данных игрока:', error);
      return { health: 100, maxHealth: 100, energy: 100, maxEnergy: 100 };
    }
  }

  /**
   * Добавляет игроку 1000 единиц каждой валюты (медь, серебро, золото, духовные камни)
   */
  window.add1000Currency = function() {
    try {
      // Найти контекст игры
      const gameContext = window.__GAME_CONTEXT__;
      const gameState = window.__GAME_STATE__;
      const gameDispatch = window.__GAME_DISPATCH__;
      
      // Проверка наличия контекста
      if (gameContext && gameContext.actions && gameContext.actions.updateCurrency) {
        // Получаем текущую валюту
        const currentCurrency = gameContext.state?.player?.inventory?.currency || {};
        
        // Обновляем валюту через actions (используем аддитивный режим)
        const updatedCurrency = {
          copper: 1000,
          silver: 1000,
          gold: 1000,
          spiritStones: 1000
        };
        
        gameContext.actions.updateCurrency(updatedCurrency, true);
        console.log('Добавлено по 1000 единиц каждой валюты!', updatedCurrency);
        return true;
      } 
      // Проверка наличия стейта и диспетчера
      else if (gameState && gameDispatch) {
        // Получаем текущую валюту
        const currentCurrency = gameState?.player?.inventory?.currency || {};
        
        // Обновляем через диспетчер напрямую
        const updatedCurrency = {
          copper: (currentCurrency.copper || 0) + 1000,
          silver: (currentCurrency.silver || 0) + 1000,
          gold: (currentCurrency.gold || 0) + 1000,
          spiritStones: (currentCurrency.spiritStones || 0) + 1000
        };
        
        gameDispatch({ 
          type: 'UPDATE_CURRENCY', 
          payload: updatedCurrency 
        });
        
        console.log('Добавлено по 1000 единиц каждой валюты!', updatedCurrency);
        return true;
      }
      // Если не удалось найти контекст игры через глобальные переменные, пробуем найти через React DevTools
      else {
        // Ищем React DevTools instance
        let reactInstance = null;
        
        // Функция для поиска React-компонента с контекстом игры
        const findReactComponent = (node) => {
          const keys = Object.keys(node || {});
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactContainer$')) {
              return node[key];
            }
          }
          return null;
        };
        
        // Ищем корневой компонент React
        const rootElement = document.getElementById('root') || document.body.firstChild;
        if (rootElement) {
          reactInstance = findReactComponent(rootElement);
        }
        
        // Если нашли React-компонент
        if (reactInstance) {
          console.log('Найден React-компонент, пытаемся найти контекст игры...');
          
          // В режиме разработки создаем и вызываем простую функцию для обновления валюты
          console.log('Вызываем функцию через функцию разработчика для обновления валюты...');
          
          // Вставляем в DOM скрипт, который обновит валюту
          const script = document.createElement('script');
          script.textContent = `
            (function() {
              try {
                const dispatch = window.__GAME_DISPATCH__ || 
                                (window.__store__ && window.__store__.dispatch);
                
                if (dispatch) {
                  dispatch({
                    type: 'UPDATE_CURRENCY',
                    payload: {
                      copper: 1000,
                      silver: 1000,
                      gold: 1000,
                      spiritStones: 1000
                    }
                  });
                  console.log('Валюта успешно обновлена!');
                  return true;
                } else {
                  console.error('Не удалось найти функцию dispatch');
                  return false;
                }
              } catch (e) {
                console.error('Ошибка при обновлении валюты:', e);
                return false;
              }
            })();
          `;
          document.body.appendChild(script);
          document.body.removeChild(script);
          
          return true;
        }
        
        console.error('Не удалось найти контекст игры');
        return false;
      }
    } catch (error) {
      console.error('Ошибка при добавлении валюты:', error);
      return false;
    }
  };
  
  // Функция для отображения информации об игроке
  window.showPlayerInfo = function() {
    try {
      const gameContext = window.__GAME_CONTEXT__;
      const gameState = window.__GAME_STATE__;
      
      if (!gameContext && !gameState) {
        console.error('Не удалось получить состояние игры');
        return false;
      }
      
      const state = gameContext?.state || gameState;
      if (!state || !state.player) {
        console.error('Не удалось получить данные игрока');
        return false;
      }
      
      // Получаем актуальные значения здоровья и энергии
      const vitalStats = getPlayerVitalStats();
      
      // Выводим информацию об игроке в консоль
      console.log('🧙 Игрок:');
      console.log('Имя:', state.player.name || 'Нет данных');
      console.log('Уровень:', state.player.cultivation?.level || '1');
      console.log('Здоровье:', vitalStats.health + '/' + vitalStats.maxHealth);
      console.log('Энергия:', vitalStats.energy + '/' + vitalStats.maxEnergy);
      console.log('Статус-эффекты:', Object.keys(state.player.statusEffects || {}).length ? 'Активны' : 'Нет активных эффектов');
      
      return true;
    } catch (error) {
      console.error('Ошибка при отображении информации об игроке:', error);
      return false;
    }
  };
  
  // Автоматически показываем информацию об игроке при загрузке
  setTimeout(() => {
    try {
      window.showPlayerInfo();
    } catch (e) {
      console.debug('Не удалось автоматически показать информацию об игроке:', e);
    }
  }, 1000);
  
  /**
   * Восстанавливает все техники из базовых определений, сохраняя только id, level и прогресс
   */
  window.repairAllTechniques = function() {
    try {
      const gameContext = window.__GAME_CONTEXT__;
      const gameState = window.__GAME_STATE__;
      const gameDispatch = window.__GAME_DISPATCH__;
      
      if (!gameContext && !gameState) {
        console.error('❌ Не удалось получить состояние игры');
        return false;
      }
      
      // Получаем текущие техники игрока
      const playerTechniques = (gameContext?.state?.player?.techniques || gameState?.player?.techniques);
      if (!Array.isArray(playerTechniques) || playerTechniques.length === 0) {
        console.warn('⚠️ Техники не найдены или массив пуст');
        return false;
      }
      
      //console.log(`🔧 Запуск восстановления ${playerTechniques.length} техник...`);
      
      // Используем восстановление напрямую через action
      if (gameDispatch) {
        gameDispatch({ 
          type: 'REPAIR_TECHNIQUES', 
          payload: null 
        });
        console.log('✅ Техники обновлены через REPAIR_TECHNIQUES action');
        return true;
      }
      
      if (gameContext && gameContext.actions && gameContext.actions.repairTechniques) {
        gameContext.actions.repairTechniques();
        console.log('✅ Техники обновлены через GameContext.actions.repairTechniques()');
        return true;
      }
      
      // Применяем восстановленные техники
      if (gameContext && gameContext.actions) {
        // Обновляем через специальное действие для техник
        if (typeof gameContext.actions.repairTechniques === 'function') {
          gameContext.actions.repairTechniques();
          console.log('✅ Техники обновлены через GameContext.actions.repairTechniques()');
          return true;
        }
        
        // Альтернативный вариант - через dispatch
        if (gameDispatch) {
          gameDispatch({ 
            type: 'REPAIR_TECHNIQUES', 
            payload: null 
          });
          console.log('✅ Техники обновлены через REPAIR_TECHNIQUES action');
          return true;
        }
      }
      
      console.warn('⚠️ Техники восстановлены, но не применены автоматически');
      console.log('Для ручного применения используйте:');
      console.log('window.__GAME_DISPATCH__({ type: "REPAIR_TECHNIQUES", payload: null })');
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка при восстановлении техник:', error);
      return false;
    }
  };
  
  // Синоним для основной функции для удобства
  window.дать1000Ресурсов = window.add1000Currency;
  window.показатьИгрока = window.showPlayerInfo;
  window.восстановитьТехники = window.repairAllTechniques;
  
  // Рекомендуемая информация в консоли
  console.log('Доступны команды для разработки:');
  console.log('add1000Currency() - Добавляет по 1000 единиц меди, серебра, золота и духовных камней');
  console.log('дать1000Ресурсов() - То же самое, но на русском');
  console.log('showPlayerInfo() - Показывает информацию об игроке');
  console.log('показатьИгрока() - То же самое, но на русском');
  console.log('repairAllTechniques() - Восстанавливает все техники из базовых определений');
  console.log('восстановитьТехники() - То же самое, но на русском');
  
})(typeof window !== 'undefined' ? window : {});

// Экспортируем пустой объект для совместимости с import
export default {};
