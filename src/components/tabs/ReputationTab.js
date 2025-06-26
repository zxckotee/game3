/**
 * Компонент вкладки "Репутация" для отображения и управления репутацией игрока
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import reputationService from '../../services/reputation-service';
import ReputationBadge from '../ui/ReputationBadge';
import ReputationHistoryList from '../ui/ReputationHistoryList';

// Стили компонента
const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 15px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #f0c674;
  margin: 0;
`;

const FilterContainer = styled.div`
  display: flex;
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

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #3d5174;
  margin-bottom: 15px;
`;

const TabButton = styled.button`
  background-color: ${props => props.active ? '#3d5174' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : '#b8c5d9'};
  border: none;
  border-radius: 4px 4px 0 0;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${props => props.active ? '#3d5174' : '#2d3b55'};
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: #8899ab;
`;

const EntityContainer = styled.div`
  background-color: #1f293d;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
`;

const EntityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2b3952;
  padding: 12px 15px;
  cursor: pointer;
`;

const EntityName = styled.h3`
  margin: 0;
  color: #e8e8e8;
  font-size: 1.2rem;
`;

const EntityContent = styled.div`
  padding: ${props => props.expanded ? '15px' : '0'};
  max-height: ${props => props.expanded ? '500px' : '0'};
  overflow: hidden;
  transition: all 0.3s;
`;

const SpheresList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const SphereItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #2a3549;
  border-radius: 4px;
`;

const SphereName = styled.div`
  color: #c5c5c5;
  flex: 1;
`;

const ReputationProgressContainer = styled.div`
  flex: 2;
  height: 10px;
  background-color: #1a2335;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
`;

const ReputationProgress = styled.div`
  height: 100%;
  width: ${props => {
    // Значение от -100 до 100 преобразуем в 0-100%
    const percent = ((props.value + 100) / 200) * 100;
    return `${percent}%`;
  }};
  background-color: ${props => {
    // Цвет в зависимости от значения репутации
    if (props.value < -50) return '#c94c4c'; // Красный для враждебной
    if (props.value < 0) return '#d09f61';  // Оранжевый для негативной
    if (props.value < 50) return '#65a880';  // Зеленый для нейтральной/положительной
    return '#4b9cd6';                       // Синий для высокой
  }};
  transition: width 0.3s;
`;

const ReputationValue = styled.div`
  flex: 1;
  text-align: right;
  color: ${props => {
    if (props.value < -50) return '#c94c4c';
    if (props.value < 0) return '#d09f61';
    if (props.value < 50) return '#65a880';
    return '#4b9cd6';
  }};
  font-weight: bold;
`;

const FeaturesContainer = styled.div`
  margin-top: 15px;
  border-top: 1px solid #2d3b55;
  padding-top: 15px;
`;

const FeatureTitle = styled.h4`
  color: #b8c5d9;
  margin: 0 0 10px 0;
`;

const FeaturesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FeatureItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: ${props => props.unlocked ? '#2f4a45' : '#3a3a4e'};
  border-radius: 4px;
  opacity: ${props => props.unlocked ? '1' : '0.7'};
`;

const FeatureName = styled.div`
  color: ${props => props.unlocked ? '#7fc7a7' : '#a5a5c9'};
`;

const FeatureRequirement = styled.div`
  color: #8d8daa;
  font-size: 0.9rem;
`;

/**
 * Основной компонент вкладки репутации
 */
const ReputationTab = () => {
  const { gameState } = useGame();
  const [activeTab, setActiveTab] = useState('cities');
  const [activeFilter, setActiveFilter] = useState('all');
  const [reputationData, setReputationData] = useState({
    cities: [],
    factions: [],
    global: null
  });
  const [expandedEntities, setExpandedEntities] = useState({});
  const [features, setFeatures] = useState([]);
  const [historyFilter, setHistoryFilter] = useState(null);
  const [history, setHistory] = useState([]);

  // Загрузка данных о репутации
  useEffect(() => {
    const loadReputationData = async () => {
      if (gameState && gameState.player && gameState.player.id) {
        // Здесь должна быть реальная загрузка данных с сервера
        // Для примера используем заглушку
        
        // Города
        const cities = [
          {
            id: 1,
            name: 'Небесный Город',
            description: 'Столица империи',
            spheres: [
              { name: 'general', displayName: 'Общая', value: 60, level: 'уважаемый' },
              { name: 'combat', displayName: 'Боевая слава', value: 45, level: 'дружелюбный' },
              { name: 'political', displayName: 'Политический вес', value: 30, level: 'дружелюбный' }
            ]
          },
          {
            id: 2,
            name: 'Туманная Долина',
            description: 'Центр алхимиков',
            spheres: [
              { name: 'general', displayName: 'Общая', value: 40, level: 'дружелюбный' },
              { name: 'alchemy', displayName: 'Алхимическая', value: 70, level: 'уважаемый' }
            ]
          },
          {
            id: 3,
            name: 'Огненная Гора',
            description: 'Город кузнецов',
            spheres: [
              { name: 'general', displayName: 'Общая', value: 20, level: 'нейтральный' },
              { name: 'trade', displayName: 'Торговая', value: 50, level: 'уважаемый' }
            ]
          }
        ];
        
        // Фракции
        const factions = [
          {
            id: 1,
            name: 'Секта Небесного Лотоса',
            description: 'Древняя секта культиваторов',
            spheres: [
              { name: 'general', displayName: 'Общая', value: 80, level: 'почитаемый' },
              { name: 'spiritual', displayName: 'Духовная', value: 65, level: 'уважаемый' }
            ]
          },
          {
            id: 2,
            name: 'Торговая гильдия',
            description: 'Союз торговцев империи',
            spheres: [
              { name: 'general', displayName: 'Общая', value: 30, level: 'дружелюбный' },
              { name: 'trade', displayName: 'Торговая', value: 55, level: 'уважаемый' }
            ]
          }
        ];
        
        // Глобальная репутация
        const global = {
          id: 0,
          name: 'Глобальная репутация',
          description: 'Ваша репутация в мире',
          spheres: [
            { name: 'general', displayName: 'Общая', value: 45, level: 'дружелюбный' }
          ]
        };
        
        setReputationData({
          cities,
          factions,
          global
        });
        
        // Загрузка доступных возможностей
        // В реальности это будет вызов сервиса
        const availableFeatures = [
          {
            id: 1,
            name: 'Доступ к тренировкам с элитными инструкторами',
            description: '+10% к эффективности изучения боевых техник',
            entityType: 'city',
            entityId: 1, // Небесный Город
            sphere: 'combat',
            requiredLevel: 'уважаемый',
            featureType: 'training',
            unlocked: false // Не разблокировано, т.к. уровень "дружелюбный"
          },
          {
            id: 2,
            name: 'Скидка у торговцев',
            description: '10% скидка на все товары в городе',
            entityType: 'city',
            entityId: 1, // Небесный Город
            sphere: 'general',
            requiredLevel: 'дружелюбный',
            featureType: 'discount',
            unlocked: true
          },
          {
            id: 3,
            name: 'Возможность арендовать усовершенствованную алхимическую печь',
            description: '+15% к качеству пилюль',
            entityType: 'city',
            entityId: 2, // Туманная Долина
            sphere: 'alchemy',
            requiredLevel: 'уважаемый',
            featureType: 'access',
            unlocked: true
          }
        ];
        
        setFeatures(availableFeatures);
        
        // Загрузка истории репутации
        const reputationHistory = [
          {
            date: '2025-03-24T10:23:45',
            entityType: 'city',
            entityId: 1,
            entityName: 'Небесный Город',
            sphere: 'general',
            oldValue: 55,
            newValue: 60,
            change: 5,
            reason: 'Защита города от нападения монстров'
          },
          {
            date: '2025-03-23T15:17:22',
            entityType: 'city',
            entityId: 2,
            entityName: 'Туманная Долина',
            sphere: 'alchemy',
            oldValue: 65,
            newValue: 70,
            change: 5,
            reason: 'Создание лекарств во время эпидемии'
          },
          {
            date: '2025-03-22T09:45:11',
            entityType: 'faction',
            entityId: 1,
            entityName: 'Секта Небесного Лотоса',
            sphere: 'general',
            oldValue: 75,
            newValue: 80,
            change: 5,
            reason: 'Выполнение особого задания для секты'
          }
        ];
        
        setHistory(reputationHistory);
      }
    };
    
    loadReputationData();
  }, [gameState]);

  // Обработчик для переключения расширенного вида сущности
  const toggleEntityExpanded = (entityType, entityId) => {
    const key = `${entityType}-${entityId}`;
    setExpandedEntities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Проверка, развернута ли сущность
  const isEntityExpanded = (entityType, entityId) => {
    const key = `${entityType}-${entityId}`;
    return !!expandedEntities[key];
  };

  // Фильтрация данных по типу сферы
  const getFilteredData = (data) => {
    if (activeFilter === 'all') return data;
    
    return data.filter(entity => 
      entity.spheres.some(sphere => sphere.name === activeFilter || 
        (activeFilter === 'positive' && sphere.value >= 25) ||
        (activeFilter === 'negative' && sphere.value < 0))
    );
  };

  // Получение возможностей для определенной сущности
  const getEntityFeatures = (entityType, entityId, sphere = null) => {
    return features.filter(feature => 
      feature.entityType === entityType && 
      feature.entityId === entityId &&
      (sphere === null || feature.sphere === sphere || feature.sphere === 'general')
    );
  };

  // Получение отображаемых данных в зависимости от активной вкладки
  const getActiveTabData = () => {
    switch (activeTab) {
      case 'cities':
        return getFilteredData(reputationData.cities);
      case 'factions':
        return getFilteredData(reputationData.factions);
      case 'global':
        return reputationData.global ? [reputationData.global] : [];
      case 'history':
        return [];
      default:
        return [];
    }
  };

  // Отображение контента активной вкладки
  const renderTabContent = () => {
    const data = getActiveTabData();
    
    if (activeTab === 'history') {
      return (
        <ReputationHistoryList 
          history={history} 
          filter={historyFilter} 
          onFilterChange={setHistoryFilter} 
        />
      );
    }
    
    if (data.length === 0) {
      return (
        <NoDataMessage>
          Нет данных о репутации
        </NoDataMessage>
      );
    }
    
    return (
      <>
        {data.map(entity => (
          <EntityContainer key={`${entity.id}`}>
            <EntityHeader onClick={() => toggleEntityExpanded(activeTab, entity.id)}>
              <EntityName>{entity.name}</EntityName>
              <ReputationBadge level={entity.spheres.find(s => s.name === 'general')?.level || 'нейтральный'} />
            </EntityHeader>
            <EntityContent expanded={isEntityExpanded(activeTab, entity.id)}>
              <SpheresList>
                {entity.spheres.map(sphere => (
                  <SphereItem key={`${entity.id}-${sphere.name}`}>
                    <SphereName>{sphere.displayName}</SphereName>
                    <ReputationProgressContainer>
                      <ReputationProgress value={sphere.value} />
                    </ReputationProgressContainer>
                    <ReputationValue value={sphere.value}>
                      {sphere.value} ({sphere.level})
                    </ReputationValue>
                  </SphereItem>
                ))}
              </SpheresList>
              
              {/* Отображение доступных возможностей */}
              {getEntityFeatures(activeTab === 'global' ? 'global' : activeTab.slice(0, -1), entity.id).length > 0 && (
                <FeaturesContainer>
                  <FeatureTitle>Доступные возможности</FeatureTitle>
                  <FeaturesList>
                    {getEntityFeatures(activeTab === 'global' ? 'global' : activeTab.slice(0, -1), entity.id).map(feature => (
                      <FeatureItem key={feature.id} unlocked={feature.unlocked}>
                        <FeatureName unlocked={feature.unlocked}>{feature.name}</FeatureName>
                        <FeatureRequirement>
                          {feature.unlocked ? 'Доступно' : `Требуется: ${feature.requiredLevel}`}
                        </FeatureRequirement>
                      </FeatureItem>
                    ))}
                  </FeaturesList>
                </FeaturesContainer>
              )}
            </EntityContent>
          </EntityContainer>
        ))}
      </>
    );
  };

  return (
    <TabContainer>
      <Header>
        <Title>Репутация</Title>
        <FilterContainer>
          <FilterButton 
            active={activeFilter === 'all'} 
            onClick={() => setActiveFilter('all')}
          >
            Все
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'positive'} 
            onClick={() => setActiveFilter('positive')}
          >
            Положительная
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'negative'} 
            onClick={() => setActiveFilter('negative')}
          >
            Отрицательная
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'combat'} 
            onClick={() => setActiveFilter('combat')}
          >
            Боевая
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'trade'} 
            onClick={() => setActiveFilter('trade')}
          >
            Торговая
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'spiritual'} 
            onClick={() => setActiveFilter('spiritual')}
          >
            Духовная
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'alchemy'} 
            onClick={() => setActiveFilter('alchemy')}
          >
            Алхимическая
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'political'} 
            onClick={() => setActiveFilter('political')}
          >
            Политическая
          </FilterButton>
        </FilterContainer>
      </Header>
      
      <TabsContainer>
        <TabButton 
          active={activeTab === 'cities'} 
          onClick={() => setActiveTab('cities')}
        >
          Города
        </TabButton>
        <TabButton 
          active={activeTab === 'factions'} 
          onClick={() => setActiveTab('factions')}
        >
          Фракции
        </TabButton>
        <TabButton 
          active={activeTab === 'global'} 
          onClick={() => setActiveTab('global')}
        >
          Глобальная
        </TabButton>
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
        >
          История
        </TabButton>
      </TabsContainer>
      
      <ContentContainer>
        {renderTabContent()}
      </ContentContainer>
    </TabContainer>
  );
};

export default ReputationTab;
