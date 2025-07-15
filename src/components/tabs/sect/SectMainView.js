import React, { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import styled, { keyframes } from 'styled-components';
import { SECT_RANKS } from '../../../utils/sectRanks';
import SectHeader from './SectHeader';
import SectStats from './SectStats';
import SectBenefits from './SectBenefits';
import MembersList from './MembersList';
import MemberDetail from './MemberDetail';
import ActionPanel from './ActionPanel';

// Анимации
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

// Стили
const Container = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: auto 1fr;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const LeftColumn = styled.div`
  grid-column: 1;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightTopSection = styled.div`
  grid-column: 2;
  grid-row: 1;
`;

const RightBottomSection = styled.div`
  grid-column: 2;
  grid-row: 2;
`;

const EmptySelectedMemberMessage = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  color: rgba(212, 175, 55, 0.8);
  font-size: 16px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.05), transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
`;

/**
 * Основной компонент для отображения информации о секте
 * @param {Object} sect - Данные о секте
 * @param {Object} user - Данные о текущем пользователе
 * @param {Function} onRefresh - Функция для обновления данных
 * @param {Function} showNotification - Функция для отображения уведомлений
 */
function SectMainView({ sect, user, onRefresh, showNotification }) {
  const { actions } = useGame();
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {

  }, []);
  
  // Определяем, является ли пользователь лидером секты
  const isLeader = sect.members && sect.members.some(member =>
    member.userId === user.id && member.role && member.role.toLowerCase() === SECT_RANKS.LEADER
  );

  // Обработчик выбора члена секты
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
  };

  return (
    <Container>
      <LeftColumn>
        <SectHeader sect={sect} />
        <SectStats sect={sect} />
        <SectBenefits sect={sect} />
        <ActionPanel 
          sect={sect}
          user={user}
          isLeader={isLeader}
          selectedMember={selectedMember}
          onRefresh={onRefresh}
          showNotification={showNotification}
        />
      </LeftColumn>
      
      <RightTopSection>
        <MembersList 
          members={sect.members || []} 
          onSelectMember={handleMemberSelect}
          selectedMemberId={selectedMember?.id}
          currentUserId={user.id}
        />
      </RightTopSection>
      
      <RightBottomSection>
        {selectedMember ? (
          <MemberDetail 
            member={selectedMember}
            isCurrentUser={selectedMember.id === user.id}
            isLeader={isLeader}
            sect={sect}
            onRefresh={onRefresh}
          />
        ) : (
          <EmptySelectedMemberMessage>
            Выберите члена секты, чтобы просмотреть подробную информацию
          </EmptySelectedMemberMessage>
        )}
      </RightBottomSection>
    </Container>
  );
}

export default SectMainView;