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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
`;

const StatLabel = styled.span`
  color: #aaa;
  font-size: 0.9rem;
`;

const StatValue = styled.span`
  color: #f0f0f0;
  font-weight: ${props => props.highlight ? 'bold' : 'normal'};
  color: ${props => props.highlight ? '#ffcc00' : '#f0f0f0'};
`;

const ProgressBar = styled.div`
  height: 5px;
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  margin-top: 5px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.percent}%;
  background: linear-gradient(90deg, #d4af37, #ffcc00);
  border-radius: 3px;
`;

const ExperienceSection = styled.div`
  margin-top: 15px;
  grid-column: 1 / span 2;
`;

const ExperienceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const ExperienceLabel = styled.span`
  color: #aaa;
  font-size: 0.9rem;
`;

const ExperienceValues = styled.span`
  color: #f0f0f0;
  font-size: 0.9rem;
`;

/**
 * Компонент для отображения статистики секты
 * @param {Object} sect - Данные о секте
 */
function SectStats({ sect }) {
  // Расчет процента опыта для прогресс-бара
  const calculateExperiencePercent = () => {
    const experience = sect.experience || 0;
    const requiredExperience = sect.requiredExperience || 100;
    
    if (requiredExperience <= 0) return 0;
    
    const percent = (experience / requiredExperience) * 100;
    return Math.min(100, Math.max(0, percent)); // Ограничиваем от 0% до 100%
  };

  return (
    <Container>
      <Title>Статистика секты</Title>
      
      <StatsGrid>
        <StatItem>
          <StatLabel>Уровень</StatLabel>
          <StatValue highlight>{sect.level || 1}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Влияние</StatLabel>
          <StatValue>{sect.influence || 0}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Ресурсы</StatLabel>
          <StatValue>{sect.resources || 0}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Территории</StatLabel>
          <StatValue>{sect.territories || 1}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Члены</StatLabel>
          <StatValue>{(sect.members || []).length}</StatValue>
        </StatItem>
        
        <ExperienceSection>
          <ExperienceHeader>
            <ExperienceLabel>Опыт секты</ExperienceLabel>
            <ExperienceValues>
              {sect.experience || 0}/{sect.requiredExperience || 100}
            </ExperienceValues>
          </ExperienceHeader>
          
          <ProgressBar>
            <ProgressFill percent={calculateExperiencePercent()} />
          </ProgressBar>
        </ExperienceSection>
      </StatsGrid>
    </Container>
  );
}

export default SectStats;