import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { collectAllEffects } from '../../utils/effectsUtils';

// Стили для панели эффектов
const EffectsContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.8);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 15px;
  color: #fff;
  font-family: 'Arial', sans-serif;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`;

const PanelTitle = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const EffectsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EffectItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const EffectIcon = styled.div`
  font-size: 1.2rem;
  color: ${props => {
    switch (props.type) {
      case 'positive': return '#7FFF7F'; // Зеленый для положительных эффектов
      case 'negative': return '#FF7F7F'; // Красный для отрицательных эффектов
      case 'neutral': return '#FFFF7F'; // Желтый для нейтральных эффектов
      default: return '#FFFFFF'; // Белый по умолчанию
    }
  }};
`;

const EffectName = styled.div`
  flex: 1;
`;

const EffectValue = styled.div`
  font-weight: bold;
  color: ${props => {
    const value = parseFloat(props.value);
    if (isNaN(value)) return '#FFFFFF';
    return value > 0 ? '#7FFF7F' : value < 0 ? '#FF7F7F' : '#FFFFFF';
  }};
`;

/**
 * Компонент для отображения активных эффектов и бонусов
 */
function ActiveEffectsPanel() {
  const { state } = useGame();
  
  // Получаем данные о мире и локации
  const currentLocation = state.world?.currentLocation || {};
  
  // Получаем и обрабатываем активные эффекты
  const activeEffects = useMemo(() => {
    // Используем функцию из effectsUtils.js для получения всех эффектов
    // Она уже включает логику для объединения эффектов и русификации названий
    const effects = collectAllEffects(state);
    
    // Сортируем эффекты: сначала положительные, затем нейтральные, затем отрицательные
    return effects.sort((a, b) => {
      // Сначала сортируем по типу отображения
      if (a.displayType !== b.displayType) {
        if (a.displayType === 'positive') return -1;
        if (a.displayType === 'negative') return 1;
        if (a.displayType === 'neutral' && b.displayType === 'positive') return 1;
        if (a.displayType === 'neutral' && b.displayType === 'negative') return -1;
      }
      // Затем по имени
      return a.name.localeCompare(b.name);
    }).map(effect => ({
      // Преобразуем эффекты в формат для отображения
      name: effect.name,
      value: effect.displayValue,
      icon: effect.icon || '✨',
      type: effect.displayType,
      source: effect.source
    }));
  }, [state]);
  
  // Проверяем наличие активных эффектов
  if (activeEffects.length === 0) return null;
  
  return (
    <EffectsContainer>
      <PanelTitle>
        Активные эффекты ({activeEffects.length})
      </PanelTitle>
      
      <EffectsList>
        {activeEffects.map((effect, index) => (
          <EffectItem key={index}>
            <EffectIcon type={effect.type}>{effect.icon}</EffectIcon>
            <EffectName>{effect.name}</EffectName>
            <EffectValue value={effect.value}>{effect.value}</EffectValue>
          </EffectItem>
        ))}
      </EffectsList>
    </EffectsContainer>
  );
}

export default ActiveEffectsPanel;
