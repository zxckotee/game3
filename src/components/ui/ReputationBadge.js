/**
 * Компонент для отображения значка уровня репутации
 */
import React from 'react';
import styled from 'styled-components';

// Стили компонента
const Badge = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: ${props => {
    switch (props.level) {
      case 'враждебный': return '#c94c4c';
      case 'неприязненный': return '#d07c4c';
      case 'подозрительный': return '#d09f61';
      case 'нейтральный': return '#8b9bb4';
      case 'дружелюбный': return '#65a880';
      case 'уважаемый': return '#4e8ac7';
      case 'почитаемый': return '#8a6fc1';
      case 'легендарный': return '#d4af37';
      default: return '#8b9bb4';
    }
  }};
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
`;

/**
 * Компонент для отображения уровня репутации
 * @param {Object} props - Свойства компонента
 * @param {string} props.level - Уровень репутации
 * @returns {JSX.Element} - Визуальный компонент
 */
const ReputationBadge = ({ level }) => {
  // Получение локализованного отображаемого текста
  const getDisplayText = (level) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <Badge level={level}>
      {getDisplayText(level)}
    </Badge>
  );
};

export default ReputationBadge;
