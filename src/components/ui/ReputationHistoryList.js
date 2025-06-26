/**
 * Компонент для отображения истории изменений репутации
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import ReputationBadge from './ReputationBadge';

// Стили компонента
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const FiltersContainer = styled.div`
  display: flex;
  margin-bottom: 15px;
  gap: 10px;
`;

const FilterButton = styled.button`
  background-color: ${props => props.active ? '#4b6b9c' : '#2d3b55'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.active ? '#4b6b9c' : '#394f71'};
  }
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const HistoryItem = styled.div`
  background-color: #1f293d;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const EntityName = styled.div`
  font-weight: 600;
  color: #e0e0e0;
  font-size: 1.1rem;
`;

const HistoryDate = styled.div`
  color: #8899ab;
  font-size: 0.9rem;
`;

const HistoryDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const HistoryReason = styled.div`
  color: #b8c5d9;
  margin-bottom: 10px;
`;

const SphereInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a5a5c9;
`;

const ChangeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ChangeValue = styled.div`
  color: ${props => props.positive ? '#65a880' : '#c94c4c'};
  font-weight: 600;
`;

const ChangeBadge = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: ${props => props.positive ? '#2f4a45' : '#4a2f2f'};
  color: ${props => props.positive ? '#7fc7a7' : '#c77f7f'};
`;

const NoHistoryMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: #8899ab;
`;

/**
 * Компонент для отображения истории изменений репутации
 * @param {Object} props - Свойства компонента
 * @param {Array} props.history - Массив записей истории
 * @param {string} props.filter - Текущий фильтр
 * @param {Function} props.onFilterChange - Функция изменения фильтра
 * @returns {JSX.Element} - Визуальный компонент
 */
const ReputationHistoryList = ({ history, filter, onFilterChange }) => {
  // Локальное состояние для пагинации
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Получение отображаемого имени сферы
  const getSphereDisplayName = (sphere) => {
    const sphereNames = {
      'general': 'Общая',
      'combat': 'Боевая слава',
      'trade': 'Торговая',
      'spiritual': 'Духовная',
      'alchemy': 'Алхимическая',
      'political': 'Политическая'
    };
    
    return sphereNames[sphere] || sphere;
  };

  // Получение отображаемого имени типа сущности
  const getEntityTypeDisplayName = (entityType) => {
    const typeNames = {
      'city': 'Город',
      'faction': 'Фракция',
      'global': 'Глобальная'
    };
    
    return typeNames[entityType] || entityType;
  };

  // Фильтрация истории
  const getFilteredHistory = () => {
    if (!filter) return history;
    
    if (filter === 'positive') {
      return history.filter(item => item.change > 0);
    }
    
    if (filter === 'negative') {
      return history.filter(item => item.change < 0);
    }
    
    return history.filter(item => 
      item.entityType === filter || 
      item.sphere === filter
    );
  };

  // Пагинация истории
  const paginatedHistory = () => {
    const filtered = getFilteredHistory();
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return filtered.slice(startIndex, endIndex);
  };

  return (
    <Container>
      <FiltersContainer>
        <FilterButton 
          active={!filter} 
          onClick={() => onFilterChange(null)}
        >
          Все
        </FilterButton>
        <FilterButton 
          active={filter === 'positive'} 
          onClick={() => onFilterChange('positive')}
        >
          Положительные
        </FilterButton>
        <FilterButton 
          active={filter === 'negative'} 
          onClick={() => onFilterChange('negative')}
        >
          Отрицательные
        </FilterButton>
        <FilterButton 
          active={filter === 'city'} 
          onClick={() => onFilterChange('city')}
        >
          Города
        </FilterButton>
        <FilterButton 
          active={filter === 'faction'} 
          onClick={() => onFilterChange('faction')}
        >
          Фракции
        </FilterButton>
      </FiltersContainer>
      
      {paginatedHistory().length === 0 ? (
        <NoHistoryMessage>
          Нет записей об изменении репутации
        </NoHistoryMessage>
      ) : (
        <HistoryList>
          {paginatedHistory().map((item, index) => (
            <HistoryItem key={index}>
              <HistoryHeader>
                <EntityName>
                  {getEntityTypeDisplayName(item.entityType)}: {item.entityName}
                </EntityName>
                <HistoryDate>
                  {formatDate(item.date)}
                </HistoryDate>
              </HistoryHeader>
              
              <HistoryReason>
                {item.reason}
              </HistoryReason>
              
              <HistoryDetails>
                <SphereInfo>
                  {getSphereDisplayName(item.sphere)}
                </SphereInfo>
                
                <ChangeInfo>
                  <ChangeValue positive={item.change > 0}>
                    {item.change > 0 ? `+${item.change}` : item.change}
                  </ChangeValue>
                  
                  <ChangeBadge positive={item.change > 0}>
                    {item.oldValue} → {item.newValue}
                  </ChangeBadge>
                </ChangeInfo>
              </HistoryDetails>
            </HistoryItem>
          ))}
        </HistoryList>
      )}
    </Container>
  );
};

export default ReputationHistoryList;
