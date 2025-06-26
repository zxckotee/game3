import React from 'react';
import styled from 'styled-components';

// Стили
const Container = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
`;

const Title = styled.h3`
  color: #d4af37;
  margin: 0 0 15px;
  font-size: 1.1rem;
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const BenefitItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
`;

const BenefitLabel = styled.span`
  color: #aaa;
  font-size: 0.9rem;
`;

const BenefitValue = styled.span`
  color: #d4af37;
  font-weight: ${props => props.highlight ? 'bold' : 'normal'};
`;

const NoBenefitsMessage = styled.div`
  color: #aaa;
  text-align: center;
  padding: 10px;
  font-style: italic;
`;

/**
 * Словарь для перевода типов бонусов
 */
const benefitTypes = {
  'cultivation_speed': 'Скорость культивации',
  'resource_gathering': 'Сбор ресурсов',
  'energy_regen': 'Регенерация энергии',
  'technique_discount': 'Скидка на техники',
  'max_energy': 'Макс. энергия',
  'experience_gain': 'Получение опыта',
  'item_drop': 'Шанс находки предметов',
  'reputation_gain': 'Получение репутации',
  'merchant_discount': 'Скидка у торговцев',
  'health_regen': 'Восстановление здоровья',
};

/**
 * Форматировать отображаемый текст бонуса
 * @param {string} type - Тип бонуса
 * @param {number} value - Значение бонуса
 * @returns {string} - Отформатированное значение
 */
const formatBenefitValue = (type, value) => {
  if (!value && value !== 0) return '';
  
  // Форматирование на основе типа бонуса
  switch (type) {
    case 'cultivation_speed':
    case 'resource_gathering':
    case 'technique_discount':
    case 'item_drop':
    case 'reputation_gain':
    case 'merchant_discount':
      return `+${value}%`;
      
    case 'energy_regen':
    case 'health_regen':
      return `+${value} ед/час`;
      
    case 'max_energy':
      return `+${value} ед`;
      
    case 'experience_gain':
      return `+${value}%`;
      
    default:
      return `+${value}`;
  }
};

/**
 * Компонент для отображения бонусов секты
 * @param {Object} sect - Данные о секте
 */
function SectBenefits({ sect }) {
  // Если бонусы отсутствуют или их массив пуст
  if (!sect.benefits || sect.benefits.length === 0) {
    return (
      <Container>
        <Title>Бонусы секты</Title>
        <NoBenefitsMessage>
          У секты пока нет активных бонусов
        </NoBenefitsMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Бонусы секты</Title>
      
      <BenefitsList>
        {sect.benefits.map((benefit, index) => (
          <BenefitItem key={`${benefit.type}-${index}`}>
            <BenefitLabel>
              {benefitTypes[benefit.type] || benefit.type}
            </BenefitLabel>
            <BenefitValue highlight={benefit.modifier > 10}>
              {formatBenefitValue(benefit.type, benefit.modifier)}
            </BenefitValue>
          </BenefitItem>
        ))}
      </BenefitsList>
    </Container>
  );
}

export default SectBenefits;