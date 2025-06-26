import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGameContext } from '../../context/GameContextProvider';

const SelectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 15px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const Title = styled.h3`
  color: #ffcc00;
  margin: 0;
  font-family: 'Cinzel', serif;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 8px 15px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
`;

const CancelButton = styled(Button)`
  background: #555;
  color: #fff;
  border: none;
  
  &:hover {
    background: #777;
  }
`;

const StartButton = styled(Button)`
  background: linear-gradient(to bottom, #ffcc00, #cc9900);
  color: #333;
  border: none;
  
  &:hover {
    background: linear-gradient(to bottom, #ffdd33, #ddaa00);
    box-shadow: 0 2px 10px rgba(255, 204, 0, 0.5);
  }
  
  &:disabled {
    background: #888;
    color: #ddd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FilterLabel = styled.span`
  font-size: 0.9rem;
  color: #aaa;
`;

const Select = styled.select`
  padding: 8px;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #ffcc00;
  }
  
  option {
    background: #333;
  }
`;

const ActivitiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  max-height: 500px;
  padding-right: 5px;
`;

const ActivityCard = styled.div`
  background: ${props => props.selected ? 'rgba(70, 70, 70, 0.8)' : 'rgba(50, 50, 50, 0.7)'};
  border: 1px solid ${props => props.selected ? '#ffcc00' : '#555'};
  border-radius: 5px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ActivityName = styled.h4`
  color: #ffcc00;
  margin: 0;
`;

const DifficultyBadge = styled.span`
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 12px;
  background: ${props => {
    switch(props.difficulty) {
      case 'easy': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'hard': return '#e74c3c';
      case 'extreme': return '#8e44ad';
      case 'legendary': return '#c0392b';
      default: return '#7f8c8d';
    }
  }};
  color: #fff;
  font-weight: bold;
`;

const ActivityDescription = styled.p`
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  color: #ddd;
`;

const ActivityDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
`;

const Detail = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 100px;
`;

const DetailLabel = styled.span`
  font-size: 0.8rem;
  color: #aaa;
`;

const DetailValue = styled.span`
  font-size: 0.9rem;
`;

const RequirementsList = styled.ul`
  margin: 5px 0 0 0;
  padding-left: 20px;
  font-size: 0.9rem;
`;

const Requirement = styled.li`
  color: ${props => props.fulfilled ? '#2ecc71' : '#e74c3c'};
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
  padding: 10px;
  border: 1px solid #e74c3c;
  border-radius: 5px;
  background: rgba(231, 76, 60, 0.1);
`;

// Перевод типов активности на русский
const getActivityTypeText = (type) => {
  switch(type) {
    case 'raid': return 'Рейд';
    case 'hunt': return 'Охота';
    case 'expedition': return 'Экспедиция';
    case 'tournament': return 'Турнир';
    case 'caravan': return 'Караван';
    case 'tribulation': return 'Трибуляция';
    case 'craft': return 'Крафт';
    default: return type;
  }
};

// Перевод сложности на русский
const getDifficultyText = (difficulty) => {
  switch(difficulty) {
    case 'easy': return 'Лёгкая';
    case 'medium': return 'Средняя';
    case 'hard': return 'Сложная';
    case 'extreme': return 'Экстремальная';
    case 'legendary': return 'Легендарная';
    default: return difficulty;
  }
};

// Перевод специализаций на русский
const getSpecText = (spec) => {
  switch(spec) {
    case 'tank': return 'Защитник';
    case 'damage': return 'Атакующий';
    case 'support': return 'Поддержка';
    case 'healer': return 'Целитель';
    case 'scout': return 'Разведчик';
    case 'alchemist': return 'Алхимик';
    default: return spec;
  }
};

// Функция форматирования времени
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} мин.`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч. ${mins > 0 ? mins + ' мин.' : ''}`;
  }
};

const GroupActivitySelection = ({ group, onActivitySelected, onCancel }) => {
  const { state, actions } = useGameContext();
  const { availableActivities = [], isLoading: globalLoading, error: globalError } = state.group || {};
  
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    difficulty: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    // Упрощенный вариант для проверки корректности кода
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        // Создаем тестовые данные для примера (сокращено)
        const mockActivities = [
          {
            id: 'act_raid_1',
            name: 'Рейд на древнюю гробницу',
            description: 'Исследуйте древнюю гробницу могущественного культиватора',
            type: 'raid',
            difficulty: 'medium',
            minParticipants: 3,
            maxParticipants: 5,
            minCultivationLevel: 2,
            recommendedCultivationLevel: 4,
            duration: 120,
            location: 'Горы Пяти Элементов',
            requiredSpecializations: {},
            isActive: true
          },
          {
            id: 'act_hunt_1',
            name: 'Охота на Небесного Дракона',
            description: 'Отправьтесь на охоту за редким Небесным Драконом',
            type: 'hunt',
            difficulty: 'hard',
            minParticipants: 2,
            maxParticipants: 5,
            minCultivationLevel: 3,
            recommendedCultivationLevel: 5,
            duration: 90,
            location: 'Грозовые Пики',
            requiredSpecializations: {
              scout: 1,
              tank: 1
            },
            isActive: true
          }
        ];
        
        setActivities(mockActivities);
        setFilteredActivities(mockActivities);
      } catch (error) {
        setError('Не удалось загрузить активности');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadActivities();
  }, []);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };
  
  const handleActivitySelect = (activity) => {
    setSelectedActivity(activity);
  };
  
  const handleDifficultyChange = (e) => {
    setSelectedDifficulty(e.target.value);
  };
  
  const handleStartActivity = async () => {
    if (!selectedActivity || isCreating) return;
    
    setIsCreating(true);
    
    try {
      const options = {
        locationId: selectedActivity.location,
        duration: selectedActivity.duration
      };
      
      await onActivitySelected(selectedActivity, selectedDifficulty, options);
    } catch (error) {
      setError('Не удалось создать активность');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Упрощенная проверка для демонстрации
  const canDoSelectedDifficulty = (activity) => {
    return true; // Упрощенно для примера
  };
  
  const renderRequirementsList = (activity) => {
    if (!activity) return null;
    
    return (
      <RequirementsList>
        <Requirement fulfilled={true}>
          Минимум {activity.minParticipants} участников
        </Requirement>
        <Requirement fulfilled={true}>
          Уровень культивации не ниже {activity.minCultivationLevel}
        </Requirement>
      </RequirementsList>
    );
  };
  
  return (
    <SelectionContainer>
      <Header>
        <Title>Выбор активности для группы "{group.name}"</Title>
        <ButtonGroup>
          <CancelButton onClick={onCancel}>Отмена</CancelButton>
          <StartButton 
            onClick={handleStartActivity} 
            disabled={!selectedActivity || !canDoSelectedDifficulty(selectedActivity) || isCreating}
          >
            {isCreating ? 'Создание...' : 'Начать активность'}
          </StartButton>
        </ButtonGroup>
      </Header>
      
      <FilterContainer>
        <FilterGroup>
          <FilterLabel>Тип:</FilterLabel>
          <Select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="all">Все типы</option>
            <option value="raid">Рейды</option>
            <option value="hunt">Охота</option>
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Сложность:</FilterLabel>
          <Select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
            <option value="all">Любая</option>
            <option value="easy">Лёгкая</option>
            <option value="medium">Средняя</option>
            <option value="hard">Сложная</option>
          </Select>
        </FilterGroup>
      </FilterContainer>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка активностей...</div>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : filteredActivities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Нет доступных активностей с выбранными фильтрами</p>
        </div>
      ) : (
        <ActivitiesList>
          {filteredActivities.map(activity => (
            <ActivityCard 
              key={activity.id} 
              selected={selectedActivity && selectedActivity.id === activity.id}
              onClick={() => handleActivitySelect(activity)}
            >
              <ActivityHeader>
                <ActivityName>{activity.name}</ActivityName>
                <DifficultyBadge difficulty={activity.difficulty}>
                  {getDifficultyText(activity.difficulty)}
                </DifficultyBadge>
              </ActivityHeader>
              
              <ActivityDescription>{activity.description}</ActivityDescription>
              
              <ActivityDetails>
                <Detail>
                  <DetailLabel>Тип</DetailLabel>
                  <DetailValue>{getActivityTypeText(activity.type)}</DetailValue>
                </Detail>
                <Detail>
                  <DetailLabel>Участники</DetailLabel>
                  <DetailValue>{activity.minParticipants}-{activity.maxParticipants}</DetailValue>
                </Detail>
              </ActivityDetails>
              
              {selectedActivity && selectedActivity.id === activity.id && (
                <>
                  <hr style={{ border: '1px solid #555', margin: '15px 0' }} />
                  
                  <Detail>
                    <DetailLabel>Выберите сложность:</DetailLabel>
                    <Select 
                      value={selectedDifficulty} 
                      onChange={handleDifficultyChange}
                      style={{ marginTop: '5px' }}
                    >
                      <option value="easy">Лёгкая</option>
                      <option value="medium">Средняя</option>
                      <option value="hard">Сложная</option>
                    </Select>
                  </Detail>
                  
                  <Detail style={{ marginTop: '10px' }}>
                    <DetailLabel>Требования:</DetailLabel>
                    {renderRequirementsList(activity)}
                  </Detail>
                </>
              )}
            </ActivityCard>
          ))}
        </ActivitiesList>
      )}
    </SelectionContainer>
  );
};

export default GroupActivitySelection;
