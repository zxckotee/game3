import React from 'react';
import styled from 'styled-components';
import { RANK_DISPLAY_NAMES, SECT_RANKS } from '../../../utils/sectRanks';

// Стили
const Container = styled.div`
  padding: 15px;
  background: ${props => props.isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  border: 1px solid ${props => props.isSelected ? '#d4af37' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
  }
`;

const MemberName = styled.div`
  color: ${props => props.isCurrentUser ? '#ffcc00' : '#f0f0f0'};
  font-weight: ${props => props.isCurrentUser ? 'bold' : 'normal'};
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  
  ${props => props.isCurrentUser && `
    &::after {
      content: '(Вы)';
      font-size: 0.8rem;
      margin-left: 5px;
      color: #aaa;
    }
  `}
`;

const MemberRole = styled.div`
  color: #aaa;
  font-size: 0.8rem;
  margin-bottom: 8px;
`;

const MemberStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  font-size: 0.8rem;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StatLabel = styled.span`
  color: #888;
`;

const StatValue = styled.span`
  color: #ccc;
`;

/**
 * Компонент элемента списка членов секты
 * @param {Object} member - Данные о члене секты
 * @param {boolean} isSelected - Флаг выбора элемента
 * @param {boolean} isCurrentUser - Флаг текущего пользователя
 * @param {Function} onClick - Обработчик клика
 */
function MemberListItem({ member, isSelected, isCurrentUser, onClick }) {
  // Форматирование даты вступления
  const formatDate = (dateString) => {
    if (!dateString) return 'Н/Д';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Ошибка форматирования даты:', e);
      return 'Н/Д';
    }
  };

  return (
    <Container
      isSelected={isSelected}
      onClick={onClick}
    >
      <MemberName isCurrentUser={isCurrentUser}>
        {member.name || 'Неизвестный'}
      </MemberName>
      
      <MemberRole>
        {RANK_DISPLAY_NAMES[member.role] || RANK_DISPLAY_NAMES[SECT_RANKS.DISCIPLE] || 'Ученик'}
      </MemberRole>
      
      <MemberStats>
        <StatItem>
          <StatLabel>Уровень:</StatLabel>
          <StatValue>{member.level}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Опыт:</StatLabel>
          <StatValue>
            {member.experience || 0}/{member.requiredExperience || 100}
          </StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Вступление:</StatLabel>
          <StatValue>{formatDate(member.joinedAt)}</StatValue>
        </StatItem>
      </MemberStats>
    </Container>
  );
}

export default MemberListItem;