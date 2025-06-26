import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ResourceBar from './ResourceBar';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EffectsContainer = styled.div`
  margin-top: 10px;
`;

const EffectsTitle = styled.div`
  font-size: 0.9rem;
  color: #e0e0e0;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const EffectsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const EffectItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
`;

const EffectName = styled.div`
  color: #e0e0e0;
`;

const EffectValue = styled.div`
  color: ${props => props.positive ? '#8bc34a' : '#f44336'};
`;

const NoEffectsText = styled.div`
  font-size: 0.85rem;
  color: #aaa;
  font-style: italic;
  text-align: center;
  padding: 5px 0;
`;

/**
 * Компонент для отображения характеристик персонажа и активных эффектов
 */
function CharacterStats({ 
  stats, 
  weatherEffects = [], 
  locationEffects = [],
  statusEffects = []
}) {
  // Преобразование значений здоровья и энергии
  const [healthValues, setHealthValues] = useState({ current: 100, max: 100 });
  const [energyValues, setEnergyValues] = useState({ current: 100, max: 100 });
  
  useEffect(() => {
    // Исправленная логика для правильного отображения здоровья
    // В бою всегда устанавливаем начальные значения на максимум
    const currentHealth = stats?.health || 100;
    const maxHealth = stats?.maxHealth || 100;
    
    // Значения для отображения
    setHealthValues({
      current: currentHealth,
      max: maxHealth
    });
    
    // Аналогично для энергии
    const currentEnergy = stats?.energy || 100;
    const maxEnergy = stats?.maxEnergy || 100;
    
    setEnergyValues({
      current: currentEnergy,
      max: maxEnergy
    });
    
    // Отладочный вывод для проверки значений
    console.log('CharacterStats: health', currentHealth, maxHealth);
    console.log('CharacterStats: energy', currentEnergy, maxEnergy);
    
  }, [stats]);
  
  // Объединяем все эффекты для отображения
  const allEffects = [
    ...(weatherEffects || []).map(effect => ({ ...effect, source: 'Погода' })),
    ...(locationEffects || []).map(effect => ({ ...effect, source: 'Локация' })),
    ...(statusEffects || []).map(effect => ({ ...effect, source: 'Статус' }))
  ];
  
  return (
    <Container>
      <ResourceBar
        type="health"
        value={healthValues.current}
        maxValue={healthValues.max}
        label="Здоровье"
        showValues={true}
      />
      
      {/* Отображаем полосу энергии */}
      {energyValues.max > 0 && (
        <ResourceBar
          type="energy"
          value={energyValues.current}
          maxValue={energyValues.max}
          label="Энергия"
          showValues={true}
        />
      )}
      
      <EffectsContainer>
        <EffectsTitle>
          Активные эффекты {allEffects.length > 0 && `(${allEffects.length})`}
        </EffectsTitle>
        
        {allEffects.length > 0 ? (
          <EffectsList>
            {allEffects.map((effect, index) => (
              <EffectItem key={index}>
                <EffectName>
                  {effect.name || effect.type}
                  {effect.source && ` [${effect.source}]`}
                </EffectName>
                <EffectValue positive={effect.positive !== false}>
                  {effect.value || (effect.modifier ? 
                    (effect.modifier > 0 ? 
                      // Округляем положительные числа с + в начале
                      `+${typeof effect.modifier === 'number' ? 
                          Math.round(effect.modifier) : 
                          effect.modifier}` 
                      : 
                      // Округляем отрицательные числа
                      typeof effect.modifier === 'number' ? 
                          Math.round(effect.modifier) : 
                          effect.modifier
                    ) : 
                    '')}
                </EffectValue>
              </EffectItem>
            ))}
          </EffectsList>
        ) : (
          <NoEffectsText>Нет активных эффектов</NoEffectsText>
        )}
      </EffectsContainer>
    </Container>
  );
}

export default CharacterStats;
