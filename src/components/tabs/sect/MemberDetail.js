import React from 'react';
import styled from 'styled-components';
import { RANK_DISPLAY_NAMES, SECT_RANKS } from '../../../utils/sectRanks';

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
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
`;

const MemberName = styled.h3`
  color: #d4af37;
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  
  ${props => props.isCurrentUser && `
    &::after {
      content: '(Вы)';
      font-size: 0.9rem;
      margin-left: 10px;
      color: #aaa;
    }
  `}
`;

const MemberRole = styled.div`
  color: #aaa;
  font-size: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 15px;
  border-radius: 5px;
`;

const StatLabel = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  color: #f0f0f0;
  font-size: 1rem;
  ${props => props.highlight && `
    color: #ffcc00;
    font-weight: bold;
  `}
`;

const ProgressSection = styled.div`
  margin-top: 5px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const ProgressTitle = styled.span`
  color: #aaa;
  font-size: 0.8rem;
`;

const ProgressValues = styled.span`
  color: #f0f0f0;
  font-size: 0.8rem;
`;

const ProgressBar = styled.div`
  height: 5px;
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.percent}%;
  background: linear-gradient(90deg, #d4af37, #ffcc00);
  border-radius: 3px;
`;

const FullWidthStat = styled(StatItem)`
  grid-column: 1 / span 2;
`;

const JoinInfo = styled.div`
  margin-top: 20px;
  color: #aaa;
  font-size: 0.9rem;
  font-style: italic;
`;

/**
 * Компонент для отображения детальной информации о члене секты
 * @param {Object} member - Данные о члене секты
 * @param {boolean} isCurrentUser - Флаг текущего пользователя
 * @param {boolean} isLeader - Флаг лидера секты
 * @param {Object} sect - Данные о секте
 */
function MemberDetail({ member, isCurrentUser, isLeader, sect }) {
  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      console.error('Ошибка форматирования даты:', e);
      return 'Неизвестно';
    }
  };
  
  // Расчет процента опыта для прогресс-бара
  const calculateExperiencePercent = () => {
    const experience = member.experience || 0;
    const requiredExperience = member.requiredExperience || 100;
    
    if (requiredExperience <= 0) return 0;
    
    const percent = (experience / requiredExperience) * 100;
    return Math.min(100, Math.max(0, percent)); // Ограничиваем от 0% до 100%
  };
  

  return (
    <Container>
      <Header>
        <MemberName isCurrentUser={isCurrentUser}>
          {member.name || 'Неизвестный'}
        </MemberName>
        
        <MemberRole>
          {RANK_DISPLAY_NAMES[member.role] || RANK_DISPLAY_NAMES[SECT_RANKS.DISCIPLE] || 'Ученик'}
        </MemberRole>
      </Header>
      
      <StatsGrid>
        <StatItem>
          <StatLabel>Уровень культивации</StatLabel>
          <StatValue highlight>{member.cultivationLevel || 1}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Ранг в секте</StatLabel>
          <StatValue>{RANK_DISPLAY_NAMES[member.role] || RANK_DISPLAY_NAMES[SECT_RANKS.DISCIPLE] || 'Ученик'}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Вклад</StatLabel>
          <StatValue>{member.contribution || 0}</StatValue>
        </StatItem>
        
        
        <FullWidthStat>
          <StatLabel>Опыт</StatLabel>
          <StatValue>{member.experience || 0} / {member.requiredExperience || 100}</StatValue>
          
          <ProgressSection>
            <ProgressBar>
              <ProgressFill percent={calculateExperiencePercent()} />
            </ProgressBar>
          </ProgressSection>
        </FullWidthStat>
        
      </StatsGrid>
      
      <JoinInfo>
        Дата вступления: {formatDate(member.joinedAt)}
      </JoinInfo>
    </Container>
  );
}

export default MemberDetail;