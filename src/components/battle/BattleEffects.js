import React from 'react';
import './BattleEffects.css';

/**
 * Компонент для отображения активных эффектов участника боя
 * @param {Object} props - Свойства компонента
 * @param {Array} props.effects - Массив активных эффектов
 */
const BattleEffects = ({ effects = [] }) => {
  if (!effects || effects.length === 0) {
    return (
      <div className="effects-container">
        <div className="effects-title">Активные эффекты</div>
        <div className="no-effects">Нет активных эффектов</div>
      </div>
    );
  }

  // Получение иконки для эффекта
  const getEffectIcon = (effect) => {
    // Если у эффекта есть собственная иконка, используем её
    if (effect.icon) {
      return effect.icon;
    }
    
    // Запасной вариант - эмодзи по типу эффекта
    switch (effect.type) {
      case 'regenerate': return '🔄';
      case 'burn': return '🔥';
      case 'bleed': return '💢';
      case 'pierce': return '⚔️';
      case 'weaken': return '⬇️';
      case 'protect': return '🛡️';
      case 'speed': return '⚡';
      case 'stun': return '💫';
      case 'buff': return '↗️';
      case 'debuff': return '↘️';
      default: return '•';
    }
  };

  // Получение типа эффекта для CSS класса
  const getEffectCssClass = (effect) => {
    // Определяем CSS класс по типу эффекта
    switch (effect.type) {
      case 'regenerate':
      case 'protect':
      case 'speed':
        return 'buff';
      case 'burn':
      case 'bleed':
      case 'pierce':
      case 'weaken':
      case 'stun':
        return 'debuff';
      default:
        // Резервный метод по свойствам эффекта
        if (effect.damage_boost) return 'buff';
        if (effect.damage_reduction) return 'buff';
        if (effect.healing_boost) return 'buff';
        if (effect.damage_over_time) return 'debuff';
        if (effect.stun) return 'debuff';
        if (effect.silence) return 'debuff';
        return 'neutral';
    }
  };

  // Группируем эффекты по типу для устранения стакинга
  const groupedEffects = effects.reduce((acc, effect) => {
    // Вычисляем оставшееся время в секундах
    let remainingSeconds = 0;
    
    // Проверяем формат эффекта - временной или старый
    if (effect.durationMs && effect.startTime) {
      // Временная система
      const now = Date.now();
      const elapsedMs = now - effect.startTime;
      const remainingMs = Math.max(0, effect.durationMs - elapsedMs);
      remainingSeconds = Math.ceil(remainingMs / 1000);
    } else if (effect.remainingSeconds !== undefined) {
      // Уже вычисленные секунды
      remainingSeconds = effect.remainingSeconds;
    } else if (effect.displayValue && typeof effect.displayValue === 'string') {
      // Если есть displayValue в формате "X сек."
      const match = effect.displayValue.match(/(\d+)\s*сек/);
      if (match) {
        remainingSeconds = parseInt(match[1], 10);
      }
    } else if (effect.duration) {
      // Используем значение duration напрямую, т.к. в БД хранятся секунды
      remainingSeconds = (effect.duration - (effect.elapsedTurns || 0));
    } else {
      // Значение по умолчанию, если ничего не нашли
      remainingSeconds = 3;
    }
    
    // Защита от NaN
    if (isNaN(remainingSeconds)) {
      remainingSeconds = 3;
    }
    
    if (!acc[effect.type]) {
      acc[effect.type] = {
        ...effect,
        count: 1,
        remainingSeconds: remainingSeconds,
        // Удаляем поля системы ходов, чтобы избежать путаницы
        elapsedTurns: undefined,
        remainingTurns: undefined
      };
    } else {
      // Для одинаковых эффектов увеличиваем счетчик
      acc[effect.type].count += 1;
      // Обновляем длительность до максимальной из имеющихся
      if (remainingSeconds > acc[effect.type].remainingSeconds) {
        acc[effect.type].remainingSeconds = remainingSeconds;
      }
    }
    return acc;
  }, {});
  
  // Преобразуем обратно в массив для отображения
  const uniqueEffects = Object.values(groupedEffects);

  return (
    <div className="battle-effects-container">
      <div className="effects-title">Эффекты</div>
      <ul className="effects-list">
        {uniqueEffects.map((effect, index) => {
          const effectCssClass = getEffectCssClass(effect);
          // Считаем эффект истекающим, если осталось менее 5 секунд
          const isExpiring = effect.remainingSeconds <= 5;
          
          return (
            <li
              key={`${effect.type}-${index}`}
              className={`effect-item ${effectCssClass} ${isExpiring ? 'expiring' : ''} ${effect.isNew ? 'new' : ''}`}
              title={`${effect.description || effect.name} (${effect.remainingSeconds} сек.)`}
            >
              <div className={`effect-icon ${effectCssClass}`}>
                {getEffectIcon(effect)}
                {effect.count > 1 && <span className="effect-count">{effect.count}</span>}
              </div>
              <div className="effect-name">{effect.name}</div>
              <div className={`effect-duration ${isExpiring ? 'expiring' : ''}`}>
                {effect.remainingSeconds} сек.
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BattleEffects;