import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import techniqueAdapter from '../../services/technique-adapter';

// Импортируем API для взаимодействия с сервером
import TechniqueAPI from '../../services/technique-api';

// Получаем константы и методы из адаптера
const {
  elementColors,
} = techniqueAdapter;

// Получаем категории техник из адаптера (fallback на пустой массив для безопасности)
const techniqueCategories = techniqueAdapter.techniqueCategories || [];

const Container = styled.div`
  display: flex;
  gap: 20px;
  height: 100%;
`;

const TechniquesList = styled.div`
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

const TechniqueCard = styled.div`
  background: rgba(30, 30, 30, 0.95);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
  
  ${props => props.element && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, ${props.elementColor}20 0%, transparent 100%);
      border-radius: 6px;
      pointer-events: none;
    }
  `}
  
  &:hover {
    border-color: #d4af37;
    transform: translateX(5px);
  }
  
  ${props => props.selected && `
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
  `}
  
  ${props => !props.available && `
    opacity: 0.7;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
    }
  `}
`;

const TechniqueHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const TechniqueIcon = styled.span`
  font-size: 1.5rem;
`;

const TechniqueTitle = styled.h3`
  color: #d4af37;
  margin: 0;
  font-size: 1.1rem;
`;

const TechniqueDescription = styled.p`
  color: #aaa;
  margin: 0 0 10px 0;
  font-size: 0.9rem;
`;

const TechniqueStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  font-size: 0.8rem;
  color: #aaa;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
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

const EffectsList = styled.div`
  margin-bottom: 20px;
`;

const EffectRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.disabled ? 'rgba(0, 0, 0, 0.3)' : 'rgba(212, 175, 55, 0.2)'};
  color: ${props => props.disabled ? '#666' : '#d4af37'};
  border: 1px solid ${props => props.disabled ? 'transparent' : '#d4af37'};
  padding: 12px 24px;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  margin-bottom: 20px;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.3);
  }
`;

// Функция для проверки достаточности валюты
// Функция для преобразования snake_case в camelCase
const snakeToCamel = (str) => {
  if (!str) return str;
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

const hasSufficientResources = (state, cost) => {
  //if (!state || !cost) return false;
  
  // Проверка опыта
  if (cost.experience && state.player.cultivation.experience < cost.experience) {
    console.error(`Недостаточно опыта: требуется ${cost.experience}, имеется ${state.player.cultivation.experience}`);
    return false;
  }
  
  // Проверка валюты
  if (cost.currency) {
    for (const [type, amount] of Object.entries(cost.currency)) {
      // Преобразуем ключ из snake_case в camelCase для корректного сопоставления
      const camelCaseType = snakeToCamel(type);
      
      if ((state.player.inventory.currency[camelCaseType] || 0) < amount) {
        console.error(`Недостаточно валюты: ${camelCaseType}, требуется ${amount}, имеется ${state.player.inventory.currency[camelCaseType] || 0}`);
        return false;
      }
    }
  }
  
  // Проверка духовных камней - они могут быть в разных форматах (spiritStones или spirit_stones)
  if (cost.spiritStones) {
    const spiritStones = state.player.inventory.currency.spiritStones || 0;
    
    if (spiritStones < cost.spiritStones) {
      console.error(`Недостаточно духовных камней: требуется ${cost.spiritStones}, имеется ${spiritStones}`);
      return false;
    }
  }
  
  return true;
};

// Функция для отображения эффектов техники
const renderEffects = (effects) => {
  if (!effects || !Array.isArray(effects) || effects.length === 0) {
    return (
      <EffectRow>
        <span>Нет эффектов</span>
        <span>-</span>
      </EffectRow>
    );
  }

  return effects.map((effect, index) => {
    if (!effect) return null;
    
    return (
      <EffectRow key={`effect-${index}`}>
        <span>{effect?.name || 'Неизвестный эффект'}:</span>
        <span>
          {effect?.duration ? `${effect.duration} сек.` : ''}
          {effect?.damage ? ` ${effect.damage} урона` : ''}
          {effect?.healing ? ` ${effect.healing} исцеления` : ''}
          {effect?.stats ? 
            Object.entries(effect.stats || {})
              .map(([stat, value]) => ` ${stat}: ${value > 0 ? '+' : ''}${value}`)
              .join(', ') 
          : ''}
        </span>
      </EffectRow>
    );
  });
};

function SkillsTab() {
  const { state, actions } = useGame();
  const [selectedCategory, setSelectedCategory] = useState('все');
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Извлекаем идентификаторы техник и их уровней для стабильного сравнения
  const techniqueIdentifiers = useMemo(() => {
    if (!state.player?.techniques) return '';
    return state.player.techniques
      .map(t => `${t.id}:${t.level || 1}`)
      .sort()
      .join(',');
  }, [state.player?.techniques]);
  
  // Получаем уровень культивации как примитивное значение
  const cultivationLevel = useMemo(() =>
    state.player?.cultivation?.level || 0
  , [state.player?.cultivation?.level]);


  useEffect(() => {
    // Загружаем данные инвентаря (включая валюту) при монтировании,
    // если они нужны и еще не загружены.
    const userId = state.player?.id;
    if (userId && actions.loadInventoryData) {
      // Простая проверка: если currency пустой или отсутствует, загружаем.
      // В более сложном сценарии можно добавить флаг isCurrencyLoaded в state.
      if (!state.player.inventory?.currency || Object.keys(state.player.inventory.currency).length === 0) {
        console.log('[SkillsTab] Валюта не загружена, загрузка данных инвентаря...');
        actions.loadInventoryData(userId);
      }
    }
  }, [state.player?.id, actions, state.player.inventory?.currency]);

  // Загружаем техники только при реальном изменении данных
  useEffect(() => {
    const fetchTechniques = async () => {
      try {
        setLoading(true);
        
        // Сначала пробуем получить техники через адаптер
        let allTechniquesData;
        try {
          // Получаем все техники через API
          allTechniquesData = await TechniqueAPI.getAllTechniques();
        } catch (apiError) {
          console.error('Ошибка при загрузке техник через API:', apiError);
          
          // В случае ошибки API, пробуем получить техники через адаптер
          allTechniquesData = await techniqueAdapter.getAllTechniques();
        }
        
        // Проверяем, что мы действительно получили массив техник
        if (!Array.isArray(allTechniquesData) || allTechniquesData.length === 0) {
          console.warn('Не удалось получить список техник, использую пустой массив');
          allTechniquesData = [];
        }
        
        // Обогащаем данные техник информацией о том, изучены ли они пользователем
        const enrichedTechniques = allTechniquesData.map(technique => ({
          ...technique,
          learned: state.player?.techniques ? state.player.techniques.find(t => t.id === technique.id) : null,
          available: state.player?.cultivation?.level >= technique.requiredLevel || false
        }));
        
        setTechniques(enrichedTechniques);
      } catch (error) {
        console.error('Ошибка при загрузке техник:', error);
        // Устанавливаем пустой массив в случае ошибки
        setTechniques([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTechniques();
  }, [techniqueIdentifiers, cultivationLevel]); // Используем стабильные зависимости
  
  // Используем загруженные техники или пустой массив, если загрузка еще идет
  const allTechniques = techniques.length > 0 ? techniques : [];
  
  const filteredTechniques = allTechniques.filter(technique =>
    selectedCategory === 'все' || technique.type === selectedCategory
  );
  
  const handleTechniqueSelect = (technique) => {
    setSelectedTechnique(technique);
  };
  
  const handleLearnTechnique = async () => {
    if (!selectedTechnique || !selectedTechnique.available || selectedTechnique.learned) return;
    
    const cost = selectedTechnique?.upgradeCost ? selectedTechnique.upgradeCost(1) : { experience: 0, currency: {}, spiritStones: 0 };
    
    if (!hasSufficientResources(state, cost)) {
      actions.addNotification({
        message: 'Недостаточно ресурсов для изучения техники',
        type: 'error'
      });
      return;
    }
    
    try {
      // Вызываем адаптер для изучения техники
      await techniqueAdapter.learnTechnique(state.player.id, selectedTechnique.id, {
        cost: cost
      });

      // Обновляем данные инвентаря (валюты) после успешного изучения
      if (state.player.id && actions.loadInventoryData) {
        await actions.loadInventoryData(state.player.id);
      }
      
      // Вызываем действие для изучения техники в Redux
      // Убедимся, что это действие не пытается снова списать ресурсы из локального стейта
      actions.learnTechnique({
        ...selectedTechnique,
        // cost: cost // Передачу cost можно убрать, если learnTechnique action не отвечает за списание
      });
      
      // Создаем новый объект техники с измененными данными для локального обновления
      // без вызова повторной загрузки
      const updatedTechnique = {
        ...selectedTechnique,
        learned: {
          id: selectedTechnique.id,
          name: selectedTechnique.name,
          level: 1,
          experience: 0,
          learnedAt: new Date().toISOString()
        }
      };
      
      // Обновляем выбранную технику
      setSelectedTechnique(updatedTechnique);
      
      // Обновляем и список техник, чтобы не дожидаться ререндера от useEffect
      setTechniques(prevTechniques =>
        prevTechniques.map(t =>
          t.id === updatedTechnique.id ? updatedTechnique : t
        )
      );
      
      actions.addNotification({
        message: `Вы изучили технику "${selectedTechnique.name}"!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Ошибка при изучении техники:', error);
      actions.addNotification({
        message: `Ошибка при изучении техники: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  const handleUpgradeTechnique = async () => {
    if (!selectedTechnique || !selectedTechnique.learned) return;
    
    const currentLevel = selectedTechnique?.learned?.level || 1;
    if (currentLevel >= (selectedTechnique?.maxLevel || 10)) {
      actions.addNotification({
        message: 'Техника уже достигла максимального уровня',
        type: 'info'
      });
      return;
    }
    
    const cost = selectedTechnique?.upgradeCost ? selectedTechnique.upgradeCost(currentLevel + 1) : { experience: 0, currency: {}, spiritStones: 0 };
    
    if (!hasSufficientResources(state, cost)) {
      actions.addNotification({
        message: 'Недостаточно ресурсов для улучшения техники',
        type: 'error'
      });
      return;
    }
    
    try {
      // Вызываем адаптер для улучшения техники
      await techniqueAdapter.upgradeTechnique(state.player.id, selectedTechnique.id, currentLevel + 1, {
        cost: cost
      });

      // Обновляем данные инвентаря (валюты) после успешного улучшения
      if (state.player.id && actions.loadInventoryData) {
        await actions.loadInventoryData(state.player.id);
      }
      
      // Вызываем действие для улучшения техники с параметрами: ID техники и стоимость
      // Убедимся, что это действие не пытается снова списать ресурсы из локального стейта
      actions.upgradeTechnique({
        techniqueId: selectedTechnique.id,
        // cost: cost // Передачу cost можно убрать, если upgradeTechnique action не отвечает за списание
      });
      
      // Создаем новый объект техники с обновленным уровнем
      const updatedTechnique = {
        ...selectedTechnique,
        learned: {
          ...selectedTechnique.learned,
          level: currentLevel + 1,
        }
      };
      
      // Обновляем выбранную технику
      setSelectedTechnique(updatedTechnique);
      
      // Обновляем и список техник, чтобы не дожидаться ререндера от useEffect
      setTechniques(prevTechniques =>
        prevTechniques.map(t =>
          t.id === updatedTechnique.id ? updatedTechnique : t
        )
      );
      
      actions.addNotification({
        message: `Техника "${selectedTechnique.name}" улучшена до уровня ${currentLevel + 1}!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Ошибка при улучшении техники:', error);
      actions.addNotification({
        message: `Ошибка при улучшении техники: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  // Рендеринг кнопки "Изучить"
  const renderLearnButton = () => {
    if (!selectedTechnique) return null;
    
    const cost = selectedTechnique?.upgradeCost ? selectedTechnique.upgradeCost(1) : { experience: 0, currency: {}, spiritStones: 0 };
    
    // Отладочная информация
    console.log('Cost for learning technique:', cost);
    
    // Фильтруем валюту, чтобы не показывать, если значение равно 0
    const currencyText = cost?.currency ? Object.entries(cost.currency)
      .filter(([_, amount]) => amount > 0) // Отфильтровываем валюту с нулевым значением
      .map(([type, amount]) => {
        // Преобразуем из snake_case в camelCase, если нужно
        const camelType = snakeToCamel(type);
        const currencyName = camelType === 'gold' ? 'золота' : camelType === 'silver' ? 'серебра' : 'меди';
        return `${amount} ${currencyName}`;
      })
      .join(', ') : '';
      
    // Формируем текст стоимости
    const costText = [];
    if (cost?.experience > 0) costText.push(`${cost.experience} опыта`);
    if (currencyText) costText.push(currencyText);
    if (cost?.spiritStones > 0) costText.push(`${cost.spiritStones} духовных камней`);
    
    return (
      <ActionButton
        disabled={!selectedTechnique?.available}
        onClick={handleLearnTechnique}
      >
        {!selectedTechnique?.available
          ? `Требуется ${selectedTechnique?.requiredLevel || 1} уровень`
          : `Изучить (${costText.join(', ')})`
        }
      </ActionButton>
    );
  };
  
  // Рендеринг кнопки "Улучшить"
  const renderUpgradeButton = () => {
    if (!selectedTechnique || !selectedTechnique.learned) return null;
    
    const currentLevel = selectedTechnique?.learned?.level || 1;
    const cost = selectedTechnique?.upgradeCost ? selectedTechnique.upgradeCost(currentLevel + 1) : { experience: 0, currency: {}, spiritStones: 0 };
    
    // Отладочная информация
    console.log('Cost for upgrading technique to level', currentLevel + 1, ':', cost);
    console.log('Player resources:', {
      experience: state.player.cultivation.experience,
      currency: state.player.inventory.currency,
      spiritStones: state.player.inventory.currency.spiritStones
    });
    
    // Фильтруем валюту, чтобы не показывать, если значение равно 0
    const currencyText = cost?.currency ? Object.entries(cost.currency)
      .filter(([_, amount]) => amount > 0) // Отфильтровываем валюту с нулевым значением
      .map(([type, amount]) => {
        // Преобразуем из snake_case в camelCase, если нужно
        const camelType = snakeToCamel(type);
        const currencyName = camelType === 'gold' ? 'золота' : camelType === 'silver' ? 'серебра' : 'меди';
        return `${amount} ${currencyName}`;
      })
      .join(', ') : '';
    
    // Формируем текст стоимости
    const costText = [];
    if (cost?.experience > 0) costText.push(`${cost.experience} опыта`);
    if (currencyText) costText.push(currencyText);
    if (cost?.spiritStones > 0) costText.push(`${cost.spiritStones} духовных камней`);
    
    return (
      <ActionButton
        disabled={currentLevel >= (selectedTechnique?.maxLevel || 10)}
        onClick={handleUpgradeTechnique}
      >
        {currentLevel >= (selectedTechnique?.maxLevel || 10)
          ? 'Максимальный уровень'
          : `Улучшить до ур. ${currentLevel + 1} (${costText.join(', ')})`
        }
      </ActionButton>
    );
  };
  
  return (
    <Container>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Загрузка техник...</p>
        </div>
      ) : (
        <>
          <TechniquesList>
            <Categories>
              {techniqueCategories.map(category => {
                // Проверка на null/undefined и наличие свойства name
                if (!category || !category.name) return null;
                
                return (
                  <CategoryButton
                    key={category.id || `category-${Math.random()}`}
                    active={selectedCategory === category.name}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                  </CategoryButton>
                );
              })}
            </Categories>
            
            {filteredTechniques.map(technique => {
              // Проверка на null и undefined
              if (!technique) return null;
              
              // Безопасный доступ к свойствам
              const techniqueName = technique.name || 'Безымянная техника';
              const techniqueIcon = technique.icon || '?';
              
              return (
                <TechniqueCard
                  key={technique.id || `technique-${Math.random()}`}
                  selected={selectedTechnique?.id === technique.id}
                  available={technique.available}
                  element={technique.element}
                  elementColor={technique.element ? elementColors[technique.element] : null}
                  onClick={() => handleTechniqueSelect(technique)}
                >
                  <TechniqueHeader>
                    <TechniqueIcon>{techniqueIcon}</TechniqueIcon>
                    <TechniqueTitle>
                      {techniqueName}
                      {technique.learned && ` (Ур. ${technique.learned.level || 1})`}
                    </TechniqueTitle>
                  </TechniqueHeader>
                  
                  <TechniqueDescription>
                    {technique.description || 'Нет описания'}
                  </TechniqueDescription>
                  
                  <TechniqueStats>
                    <StatRow>
                      <span>Тип:</span>
                      <span>{technique.type || 'Неизвестно'}</span>
                    </StatRow>
                    <StatRow>
                      <span>Энергия:</span>
                      <span>{typeof technique.energyCost !== 'undefined' ? technique.energyCost : 'Неизвестно'}</span>
                    </StatRow>
                    {technique.cooldown > 0 && (
                      <StatRow>
                        <span>Перезарядка:</span>
                        <span>{technique.cooldown}с</span>
                      </StatRow>
                    )}
                    <StatRow>
                      <span>Требуемый уровень:</span>
                      <span>{technique.requiredLevel || 'Неизвестно'}</span>
                    </StatRow>
                  </TechniqueStats>
                </TechniqueCard>
              );
            })}
          </TechniquesList>
          
          {selectedTechnique && (
            <Details>
              <DetailHeader>
                <DetailTitle>
                  <TechniqueIcon>{selectedTechnique?.icon || '?'}</TechniqueIcon>
                  {selectedTechnique?.name || 'Безымянная техника'}
                  {selectedTechnique?.learned && ` (Ур. ${selectedTechnique.learned.level || 1})`}
                </DetailTitle>
                <DetailDescription>
                  {selectedTechnique?.description || 'Нет описания'}
                </DetailDescription>
              </DetailHeader>
              
              {/* Добавляем детальное отображение характеристик техники */}
              <TechniqueStats style={{ marginBottom: '20px' }}>
                <StatRow>
                  <span>Тип:</span>
                  <span>
                    {(() => {
                      const type = selectedTechnique?.type || 'unknown';
                      // Перевод типов техник на русский
                      const typeTranslations = {
                        'attack': 'атака',
                        'defense': 'защита',
                        'support': 'поддержка',
                        'cultivation': 'культивация',
                        'unknown': 'неизвестно'
                      };
                      return typeTranslations[type] || type;
                    })()}
                  </span>
                </StatRow>
                <StatRow>
                  <span>Энергия:</span>
                  <span>{typeof selectedTechnique?.energy_cost !== 'undefined' ? selectedTechnique.energy_cost :
                         typeof selectedTechnique?.energyCost !== 'undefined' ? selectedTechnique.energyCost : 'Неизвестно'}</span>
                </StatRow>
                {(selectedTechnique?.cooldown > 0 || selectedTechnique?.cooldown === 0) && (
                  <StatRow>
                    <span>Перезарядка:</span>
                    <span>{selectedTechnique.cooldown}с</span>
                  </StatRow>
                )}
                <StatRow>
                  <span>Урон:</span>
                  <span>
                    {selectedTechnique?.damage ?
                      (() => {
                        const damageType = selectedTechnique?.damage_type || selectedTechnique?.damageType || 'physical';
                        // Перевод типов урона на русский
                        const damageTypeTranslations = {
                          'physical': 'физический',
                          'spiritual': 'духовный',
                          'fire': 'огненный',
                          'water': 'водяной',
                          'earth': 'земляной',
                          'air': 'воздушный',
                          'lightning': 'молниевый',
                          'ice': 'ледяной',
                          'light': 'светлый',
                          'dark': 'тёмный'
                        };
                        return `${selectedTechnique.damage} (${damageTypeTranslations[damageType] || damageType})`;
                      })() :
                      'Нет урона'}
                  </span>
                </StatRow>
                {selectedTechnique?.healing > 0 && (
                  <StatRow>
                    <span>Исцеление:</span>
                    <span>{selectedTechnique.healing}</span>
                  </StatRow>
                )}
                <StatRow>
                  <span>Требуемый уровень:</span>
                  <span>{selectedTechnique?.required_level || selectedTechnique?.requiredLevel || 1}</span>
                </StatRow>
                <StatRow>
                  <span>Макс. уровень:</span>
                  <span>{selectedTechnique?.max_level || selectedTechnique?.maxLevel || 5}</span>
                </StatRow>
              </TechniqueStats>
              
              {/* Отображаем кнопку в зависимости от того, изучена ли техника */}
              {selectedTechnique?.learned ? renderUpgradeButton() : renderLearnButton()}
              
              <EffectsList>
                <h3>Эффекты:</h3>
                {renderEffects(selectedTechnique?.effects)}
              </EffectsList>
            </Details>
          )}
        </>
      )}
    </Container>
  );
}

export default SkillsTab;
