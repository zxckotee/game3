// Утилита для тестирования сбора и применения эффектов
import { collectAllEffects } from './effectsUtils';
import ACTION_TYPES from '../context/actions/actionTypes';

/**
 * Ручное обновление эффектов игрока
 * Функция для тестирования механизма эффектов
 */
export function manuallyUpdatePlayerEffects() {
  try {
    // Получаем состояние игры из глобальной переменной
    const state = window.__GAME_STATE__;
    if (!state) {
      console.error('❌ Состояние игры не найдено в глобальной переменной');
      return null;
    }
    
    console.log('🔄 Запуск ручного обновления эффектов игрока...');
    
    // Собираем все эффекты
    const allEffects = collectAllEffects(state);
    console.log('📊 Собраны эффекты:', allEffects);
    
    // Проверяем наличие диспетчера
    if (!window.__GAME_DISPATCH__) {
      console.error('❌ Диспетчер не найден в глобальной переменной');
      return allEffects;
    }
    
    // Применяем эффекты к игроку
    window.__GAME_DISPATCH__({
      type: ACTION_TYPES.UPDATE_PLAYER_EFFECTS,
      payload: allEffects
    });
    
    console.log('✅ Эффекты успешно обновлены');
    console.log('🔍 Текущие эффекты игрока:', window.__GAME_STATE__.player.statusEffects);
    
    // Проверяем наличие эффектов в игроке
    setTimeout(() => {
      console.log('🔄 Проверка обновленных эффектов:', 
                 window.__GAME_STATE__.player.statusEffects);
    }, 500);
    
    // Также обновляем эффекты в игровом состоянии
    if (window.__GAME_STATE__.gameState && window.__GAME_STATE__.gameState.combat) {
      console.log('🎮 Обнаружено активное боевое состояние, обновляю эффекты в бою');
      
      // Обновляем эффекты в боевом состоянии, если бой активен
      window.__GAME_DISPATCH__({
        type: ACTION_TYPES.UPDATE_COMBAT_EFFECTS,
        payload: allEffects
      });
      
      console.log('⚔️ Эффекты в боевом состоянии обновлены');
    }
    
    return allEffects;
  } catch (error) {
    console.error('❌ Ошибка при обновлении эффектов:', error);
    return null;
  }
}

/**
 * Добавляет кнопку для ручного обновления эффектов
 * Для использования в режиме разработки
 */
export function addEffectsDebugButton() {
  try {
    // Проверяем, не существует ли уже кнопка
    if (document.getElementById('update-effects-button')) {
      return;
    }
    
    // Создаем контейнер
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    
    // Создаем кнопку
    const button = document.createElement('button');
    button.id = 'update-effects-button';
    button.innerText = 'Обновить эффекты';
    button.style.padding = '5px 10px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    
    // Добавляем обработчик события
    button.onclick = () => {
      manuallyUpdatePlayerEffects();
      // Небольшая анимация для подтверждения нажатия
      button.style.backgroundColor = '#45a049';
      setTimeout(() => {
        button.style.backgroundColor = '#4CAF50';
      }, 200);
    };
    
    // Добавляем кнопку в контейнер
    container.appendChild(button);
    
    // Добавляем контейнер в body
    document.body.appendChild(container);
    
    console.log('✅ Добавлена кнопка для обновления эффектов игрока');
  } catch (error) {
    console.error('❌ Ошибка при добавлении кнопки:', error);
  }
}

// Запускаем добавление кнопки при загрузке скрипта
if (typeof window !== 'undefined') {
  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addEffectsDebugButton);
  } else {
    addEffectsDebugButton();
  }
}

// Экспортируем функции для использования в консоли
if (typeof window !== 'undefined') {
  window.__DEBUG_EFFECTS__ = {
    updateEffects: manuallyUpdatePlayerEffects,
    addDebugButton: addEffectsDebugButton
  };
}
