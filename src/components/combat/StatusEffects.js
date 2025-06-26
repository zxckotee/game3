import React from 'react';
import styled from 'styled-components';

const EffectsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EffectItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const EffectIcon = styled.div`
  font-size: 1rem;
  color: ${props => {
    switch (props.type) {
      case 'buff': return '#7FFF7F'; // Зеленый для положительных эффектов
      case 'debuff': return '#FF7F7F'; // Красный для отрицательных эффектов
      default: return '#FFFF7F'; // Желтый для нейтральных эффектов
    }
  }};
`;

const EffectName = styled.div`
  flex: 1;
  font-size: 0.9rem;
`;

const EffectDuration = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

/**
 * Компонент для отображения активных эффектов и бонусов в бою
 */
function StatusEffects({ effects = [] }) {
  // Если нет эффектов, показываем сообщение
  if (!effects || effects.length === 0) {
    return <div style={{ color: "#aaa", fontSize: "0.9rem" }}>Нет активных эффектов</div>;
  }
  
  return (
    <EffectsWrapper>
      {effects.map((effect, index) => (
        <EffectItem key={index}>
          <EffectIcon type={effect.type || 'neutral'}>
            {effect.icon || (effect.type === 'buff' ? '✨' : effect.type === 'debuff' ? '⚠️' : '•')}
          </EffectIcon>
          <EffectName>{effect.name}</EffectName>
          {/* Отображаем длительность в секундах */}
          {effect.remainingSeconds ? (
            <EffectDuration>{effect.remainingSeconds} сек.</EffectDuration>
          ) : effect.durationMs ? (
            <EffectDuration>{Math.ceil(effect.durationMs / 1000)} сек.</EffectDuration>
          ) : effect.displayValue ? (
            <EffectDuration>{effect.displayValue}</EffectDuration>
          ) : effect.duration ? (
            <EffectDuration>{effect.duration} сек.</EffectDuration>
          ) : null}
        </EffectItem>
      ))}
    </EffectsWrapper>
  );
}

export default StatusEffects;
