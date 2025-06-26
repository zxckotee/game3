import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { achievementCategories } from '../../data/achievements';
/*import achievementAdapter from '../../services/achievement-adapter'; */ 
// Заменяем импорт адаптера на прямой импорт функций из API-сервиса, но название оставляем
import {
  getAllAchievements, getAchievementById,
  getAchievementsByCategory, getUserAchievements,
  updateAchievementProgress, claimAchievementReward,
  checkAchievements, createAchievement, 
  updateAchievement, deleteAchievement
} from '../../services/achievement-api';

const Container = styled.div`
  display: flex;
  gap: 20px;
  height: 100%;
`;

const AchievementsList = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
`;

const Categories = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const CategoryButton = styled.button`
  background: ${props => props.active ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.3)'};
  color: ${props => props.active ? '#d4af37' : '#f0f0f0'};
  border: 1px solid ${props => props.active ? '#d4af37' : 'transparent'};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.1);
    border-color: #d4af37;
  }
`;

const AchievementCard = styled.div`
  background: rgba(30, 30, 30, 0.95);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  
  &:hover {
    border-color: #d4af37;
    transform: translateX(5px);
  }
  
  ${props => props.selected && `
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
  `}
  
  ${props => props.completed && `
    border-color: #4caf50;
    &::after {
      content: '✓';
      color: #4caf50;
      position: absolute;
      right: 15px;
      top: 15px;
    }
  `}
`;

const AchievementHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const AchievementIcon = styled.span`
  font-size: 1.5rem;
`;

const AchievementTitle = styled.h3`
  color: #d4af37;
  margin: 0;
  font-size: 1.1rem;
`;

const AchievementDescription = styled.p`
  color: #aaa;
  margin: 0 0 10px 0;
  font-size: 0.9rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => (props.progress * 100)}%;
    height: 100%;
    background: ${props => props.completed ? '#4caf50' : '#d4af37'};
    transition: width 0.3s ease;
  }
`;

const ProgressText = styled.div`
  font-size: 0.8rem;
  color: #aaa;
  text-align: right;
  margin-top: 5px;
`;

const Details = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const DetailHeader = styled.div`
  margin-bottom: 20px;
`;

const DetailTitle = styled.h2`
  color: #d4af37;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DetailDescription = styled.p`
  color: #aaa;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const Rewards = styled.div`
  margin-top: auto;
`;

const RewardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
`;

const Stats = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

function AchievementsTab() {
  const { state } = useGame();
  const [selectedCategory, setSelectedCategory] = useState('все');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    points: 0
  });
  
  // Загружаем достижения при монтировании компонента
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем userId из стейта или локального хранилища
        const userId = state.player?.id || localStorage.getItem('userId');
        
        if (!userId) {
          throw new Error('Не удалось определить ID пользователя');
        }
        
        console.log('[AchievementsTab] Запрашиваем достижения для пользователя:', userId);
        
        // Получаем прогресс достижений пользователя через адаптер
        const userAchievements = await getUserAchievements(userId);
        
        console.log('[AchievementsTab] Полученные достижения:', userAchievements);
        
        // Обновляем состояние достижений
        setAchievements(userAchievements);
        
        // Обновляем статистику
        const completedAchievements = userAchievements.filter(a => a.isCompleted);
        
        setStats({
          total: userAchievements.length,
          completed: completedAchievements.length,
          points: completedAchievements.reduce((sum, ach) =>
            sum + (ach.rewards ? ach.rewards.reduce((total, reward) =>
              total + (reward.amount || 0), 0) : 0), 0)
        });
      } catch (error) {
        console.error('Ошибка при загрузке достижений:', error);
        setError('Не удалось загрузить достижения. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAchievements();
  }, [state.player?.id]);
  
  // Фильтруем достижения по категории
  const filteredAchievements = achievements.filter(achievement =>
    selectedCategory === 'все' || achievement.category === selectedCategory
  );
  
  const handleAchievementSelect = (achievement) => {
    setSelectedAchievement(achievement);
  };
  
  return (
    <Container>
      <AchievementsList>
        <Categories>
          {achievementCategories.map(category => (
            <CategoryButton
              key={category.id}
              active={selectedCategory === category.name}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
            </CategoryButton>
          ))}
        </Categories>
        
        <Stats>
          <StatRow>
            <span>Всего достижений:</span>
            <span>{stats.total}</span>
          </StatRow>
          <StatRow>
            <span>Выполнено:</span>
            <span>{stats.completed}</span>
          </StatRow>
          <StatRow>
            <span>Очки достижений:</span>
            <span>{stats.points}</span>
          </StatRow>
        </Stats>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Загрузка достижений...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#e74c3c' }}>
            <p>{error}</p>
          </div>
        ) : filteredAchievements.map(achievement => {
          // Используем данные прогресса из полученных с сервера
          const current = achievement.currentValue || 0;
          const required = achievement.requiredValue || 1;
          const completed = achievement.isCompleted || false;
          
          return (
            <AchievementCard
              key={achievement.id}
              selected={selectedAchievement?.id === achievement.id}
              completed={completed}
              onClick={() => handleAchievementSelect(achievement)}
            >
              <AchievementHeader>
                <AchievementIcon>{achievement.icon}</AchievementIcon>
                <AchievementTitle>{achievement.title}</AchievementTitle>
              </AchievementHeader>
              
              <AchievementDescription>
                {achievement.description}
              </AchievementDescription>
              
              <ProgressBar
                progress={Math.min(current / required, 1)}
                completed={completed}
              />
              <ProgressText>
                {current} / {required}
              </ProgressText>
            </AchievementCard>
          );
        })}
      </AchievementsList>
      
      {selectedAchievement && (
        <Details>
          <DetailHeader>
            <DetailTitle>
              <AchievementIcon>{selectedAchievement.icon}</AchievementIcon>
              {selectedAchievement.title}
            </DetailTitle>
            <DetailDescription>
              {selectedAchievement.description}
            </DetailDescription>
          </DetailHeader>
          
          <Stats>
            <StatRow>
              <span>Категория:</span>
              <span>{selectedAchievement.category}</span>
            </StatRow>
            <StatRow>
              <span>Статус:</span>
              <span style={{ color: selectedAchievement.isCompleted ? '#4caf50' : '#f0f0f0' }}>
                {selectedAchievement.isCompleted ? 'Выполнено' : 'В процессе'}
              </span>
            </StatRow>
            <StatRow>
              <span>Прогресс:</span>
              <span>
                {selectedAchievement.currentValue || 0} / {selectedAchievement.requiredValue || 1}
              </span>
            </StatRow>
          </Stats>
          
          <Rewards>
            <h3>Награды:</h3>
            {selectedAchievement.rewards.map((reward, index) => (
              <RewardItem key={index}>
                <span>{reward.icon}</span>
                {reward.type === 'currency' && `${reward.amount} монет`}
                {reward.type === 'experience' && `${reward.amount} опыта`}
                {reward.type === 'item' && reward.name}
                {reward.type === 'reputation' && `${reward.amount} очков репутации`}
              </RewardItem>
            ))}
          </Rewards>
        </Details>
      )}
    </Container>
  );
}

export default AchievementsTab;