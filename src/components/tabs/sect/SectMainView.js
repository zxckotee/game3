import React, { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import styled from 'styled-components';
import { SECT_RANKS } from '../../../utils/sectRanks';
import SectHeader from './SectHeader';
import SectStats from './SectStats';
import SectBenefits from './SectBenefits';
import MembersList from './MembersList';
import MemberDetail from './MemberDetail';
import ActionPanel from './ActionPanel';

// Стили
const Container = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: auto 1fr;
  gap: 20px;
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  color: #aaa;
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