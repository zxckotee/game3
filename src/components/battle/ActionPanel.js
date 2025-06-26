import React from 'react';
import './ActionPanel.css';
import { techniques } from '../../data/combat';

/**
 * Компонент для отображения панели действий в бою
 * @param {Object} props - Свойства компонента
 * @param {Function} props.onAction - Функция обработки действия
 * @param {Object} props.cooldowns - Объект с информацией о перезарядке техник
 * @param {Array} props.availableTechniques - Массив доступных техник
 * @param {boolean} props.isMyTurn - Флаг, указывающий, ход ли текущего игрока
 * @param {string} props.selectedAction - Текущее выбранное действие
 * @param {string} props.selectedTechniqueId - ID выбранной техники
 */
const ActionPanel = ({
  onAction,
  cooldowns = {},
  availableTechniques = [],
  isMyTurn = true,
  selectedAction = null,
  selectedTechniqueId = null,
  currentEnergy = 100,
  maxEnergy = 100,
  isActionBlocked = false,     // Флаг блокировки действий во время таймаута
  actionCooldown = 0,          // Текущее значение таймаута в секундах
  actionCooldownTotal = 5,     // Общее время таймаута для отображения прогресса
  effects = [],               // Массив активных эффектов текущего участника
  statsModifiers = { damage: 0, defense: 0, speed: 0, energyRegen: 0 } // Модификаторы от эффектов
}) => {
  // Получаем текущее время для расчета оставшегося времени перезарядки
  const now = new Date();

  // Функция для проверки, находится ли техника в перезарядке
  const isOnCooldown = (techniqueId) => {
    if (!cooldowns[techniqueId]) return false;
    
    const cooldownEndTime = new Date(cooldowns[techniqueId]);
    return now < cooldownEndTime;
  };

  // Функция для получения оставшегося времени перезарядки в секундах
  const getRemainingCooldown = (techniqueId) => {
    if (!cooldowns[techniqueId]) return 0;
    
    const cooldownEndTime = new Date(cooldowns[techniqueId]);
    const remainingMs = Math.max(0, cooldownEndTime - now);
    return Math.ceil(remainingMs / 1000);
  };

  // Функция для получения иконки действия
  const getActionIcon = (actionType, techniqueId) => {
    switch (actionType) {
      case 'attack':
        return '⚔️';
      case 'defense':
        return '🛡️';
      case 'technique':
        // Если technique - это объект, используем его, иначе ищем в глобальном объекте techniques
        const techniqueObj = availableTechniques.find(t =>
          (typeof t === 'object' && t.id === techniqueId) || t === techniqueId
        );
        const technique = typeof techniqueObj === 'object' ? techniqueObj : techniques[techniqueId];
        return technique?.icon || '✨';
      default:
        return '❓';
    }
  };

  // Функция для форматирования времени перезарядки
  const formatCooldown = (seconds) => {
    if (seconds < 60) return `${seconds}с`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}м ${remainingSeconds}с`;
  };

  // Рассчитываем процент прогресса для таймера
  const cooldownProgress = actionCooldownTotal > 0
    ? ((actionCooldownTotal - actionCooldown) / actionCooldownTotal) * 100
    : 0;

  // Проверка наличия эффекта оглушения
  const isStunned = effects.some(effect => effect.type === 'stun');
  
  // Модификаторы от эффектов для отображения
  const showEffectModifiers = () => {
    const modifiers = [];
    
    if (statsModifiers.damage !== 0) {
      modifiers.push(
        <div key="damage" className={`effect-modifier ${statsModifiers.damage > 0 ? 'positive' : 'negative'}`}>
          Урон: {statsModifiers.damage > 0 ? '+' : ''}{statsModifiers.damage}%
        </div>
      );
    }
    
    if (statsModifiers.defense !== 0) {
      modifiers.push(
        <div key="defense" className={`effect-modifier ${statsModifiers.defense > 0 ? 'positive' : 'negative'}`}>
          Защита: {statsModifiers.defense > 0 ? '+' : ''}{statsModifiers.defense}%
        </div>
      );
    }
    
    if (statsModifiers.speed !== 0) {
      modifiers.push(
        <div key="speed" className={`effect-modifier ${statsModifiers.speed > 0 ? 'positive' : 'negative'}`}>
          Скорость: {statsModifiers.speed > 0 ? '+' : ''}{statsModifiers.speed}%
        </div>
      );
    }
    
    if (statsModifiers.energyRegen !== 0) {
      modifiers.push(
        <div key="energyRegen" className={`effect-modifier ${statsModifiers.energyRegen > 0 ? 'positive' : 'negative'}`}>
          Восст. энергии: +{statsModifiers.energyRegen}
        </div>
      );
    }
    
    return modifiers;
  };

  return (
    <div className="action-panel-container">
      {/* Индикатор таймаута между ходами */}
      {isActionBlocked && actionCooldown > 0 && (
        <div className="action-cooldown-container">
          <div className="cooldown-text">Ожидание следующего хода: {actionCooldown}с</div>
          <div className="cooldown-progress-bar">
            <div
              className="cooldown-progress-fill"
              style={{ width: `${cooldownProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Индикатор активных эффектов и их влияния */}
      {effects && effects.length > 0 && (
        <div className="active-effects-container">
          <div className="effects-summary">
            <div className="effects-title">Активные эффекты</div>
            <div className="effects-modifiers">
              {showEffectModifiers()}
            </div>
          </div>
          
          {/* Индикатор оглушения */}
          {isStunned && (
            <div className="stun-indicator">
              <div className="stun-icon">💫</div>
              <div className="stun-text">ОГЛУШЕНИЕ</div>
            </div>
          )}
        </div>
      )}

      {/* Кнопка обычной атаки */}
      <button
        className={`action-button attack ${selectedAction === 'attack' ? 'selected' : ''} ${!isMyTurn || isActionBlocked ? 'disabled' : ''}`}
        onClick={() => isMyTurn && !isActionBlocked && onAction('attack')}
        disabled={!isMyTurn || isActionBlocked}
      >
        <div className="tooltip">Базовая атака, наносящая физический урон противнику (0 энергии)</div>
        <div className="action-icon">{getActionIcon('attack')}</div>
        <div className="action-name">Обычная атака</div>
        <div className="energy-cost">0</div>
      </button>

      {/* Кнопка защиты */}
      <button
        className={`action-button defense ${selectedAction === 'defense' ? 'selected' : ''} ${!isMyTurn || isActionBlocked ? 'disabled' : ''}`}
        onClick={() => isMyTurn && !isActionBlocked && onAction('defense')}
        disabled={!isMyTurn || isActionBlocked}
      >
        <div className="tooltip">Защитная стойка, снижающая получаемый урон на 40% и восстанавливающая 20 единиц энергии</div>
        <div className="action-icon">{getActionIcon('defense')}</div>
        <div className="action-name">Защита</div>
        <div className="energy-cost" style={{ color: '#66bb6a' }}>+20</div>
      </button>

      {/* Кнопки техник */}
      {availableTechniques.map(technique => {
        // Если technique - это объект, используем его, иначе ищем в глобальном объекте techniques
        const techniqueObj = typeof technique === 'object' ? technique : techniques[technique];
        if (!techniqueObj) return null;
        
        const techniqueId = typeof technique === 'object' ? technique.id : technique;

        const onCooldown = isOnCooldown(techniqueId);
        const remainingCooldown = getRemainingCooldown(techniqueId);
        const isSelected = selectedAction === 'technique' && selectedTechniqueId === techniqueId;

        return (
          <button
            key={techniqueId}
            className={`action-button technique ${!isMyTurn || isActionBlocked || onCooldown || currentEnergy < (techniqueObj.energyCost || 20) ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => isMyTurn && !isActionBlocked && !onCooldown && currentEnergy >= (techniqueObj.energyCost || 20) && onAction('technique', techniqueId)}
            disabled={!isMyTurn || isActionBlocked || onCooldown || currentEnergy < (techniqueObj.energyCost || 20)}
          >
            <div className="tooltip">{techniqueObj.description || techniqueObj.name} (Затраты энергии: {techniqueObj.energyCost || 20})</div>
            <div className="action-icon">{getActionIcon('technique', techniqueId)}</div>
            <div className="action-name">{techniqueObj.name}</div>
            
            <div className="energy-cost">{techniqueObj.energyCost || 20}</div>
          </button>
        );
      })}
    </div>
  );
};

export default ActionPanel;