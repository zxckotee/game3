import React from 'react';
import styled from 'styled-components';
import MemberListItem from './MemberListItem';

// Стили
const Container = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
`;

const Title = styled.h3`
  color: #d4af37;
  margin: 0;
  font-size: 1.1rem;
`;

const Count = styled.span`
  color: #aaa;
  font-size: 0.9rem;
`;

const MembersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
`;

const NoMembersMessage = styled.div`
  color: #aaa;
  text-align: center;
  padding: 30px;
  font-style: italic;
`;

const FilterContainer = styled.div`
  display: flex;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
`;

const FilterButton = styled.button`
  padding: 5px 10px;
  background: ${props => props.active ? 'rgba(212, 175, 55, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
  border: 1px solid ${props => props.active ? '#d4af37' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 4px;
  color: ${props => props.active ? '#d4af37' : '#aaa'};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.2);
    border-color: rgba(212, 175, 55, 0.5);
  }
`;

/**
 * Компонент списка членов секты
 * @param {Array} members - Массив членов секты
 * @param {Function} onSelectMember - Функция для выбора члена секты
 * @param {number} selectedMemberId - ID выбранного члена секты
 * @param {number} currentUserId - ID текущего пользователя
 */
function MembersList({ members, onSelectMember, selectedMemberId, currentUserId }) {
  // Если список членов пуст
  if (!members || members.length === 0) {
    return (
      <Container>
        <Header>
          <Title>Члены секты</Title>
          <Count>0 человек</Count>
        </Header>
        
        <NoMembersMessage>
          В секте пока нет участников
        </NoMembersMessage>
      </Container>
    );
  }

  // Ранжирование приоритета ролей для сортировки
  const rankPriority = {
    'глава': 1,
    'старейшина': 2,
    'внутренний ученик': 3,
    'внешний ученик': 4,
  };
  
  // Сортировка членов по рангу и имени
  const sortedMembers = [...members].sort((a, b) => {
    // Сначала сортируем по рангу
    const rankA = rankPriority[a.role?.toLowerCase()] || 99;
    const rankB = rankPriority[b.role?.toLowerCase()] || 99;
    
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    
    // Если ранги одинаковые, сортируем по имени
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <Container>
      <Header>
        <Title>Члены секты</Title>
        <Count>{members.length} человек</Count>
      </Header>
      
      <MembersGrid>
        {sortedMembers.map(member => (
          <MemberListItem 
            key={member.id}
            member={member}
            isSelected={member.id === selectedMemberId}
            isCurrentUser={member.id === currentUserId}
            onClick={() => onSelectMember(member)}
          />
        ))}
      </MembersGrid>
    </Container>
  );
}

export default MembersList;