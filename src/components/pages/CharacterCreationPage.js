import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import apiService from '../../services/api';

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
              url('/assets/images/character-creation-bg.jpg');
  background-size: cover;
  background-position: center;
`;

const CreationPanel = styled.div`
  width: 800px;
  min-height: 600px;
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
  color: #f0f0f0;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-family: 'Ma Shan Zheng', cursive;
  text-align: center;
  color: #d4af37;
  margin-bottom: 30px;
  font-size: 2rem;
  text-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Row = styled.div`
  display: flex;
  gap: 20px;
  justify-content: space-between;
`;

const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  color: #d4af37;
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #f0f0f0;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #f0f0f0;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
  }
  
  option {
    background: #1a1a1a;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

const StatRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatLabel = styled.span`
  width: 120px;
  color: #d4af37;
`;

const StatValue = styled.span`
  width: 40px;
  text-align: center;
`;

const StatButton = styled.button`
  width: 30px;
  height: 30px;
  background: #d4af37;
  border: none;
  border-radius: 4px;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    background: #f4cf47;
  }
`;

const Description = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #f0f0f0;
  font-size: 1rem;
  resize: none;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
  }
`;

const Button = styled.button`
  padding: 12px;
  background: #d4af37;
  color: #000;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  margin-top: 20px;
  
  &:hover {
    background: #f4cf47;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.7);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  text-align: center;
  margin-top: 10px;
`;

const PointsRemaining = styled.div`
  text-align: center;
  margin-top: 10px;
  color: #d4af37;
  font-size: 1.1rem;
`;

function CharacterCreationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, actions } = useGame();
  
  // Проверяем, это продолжение создания персонажа или новый персонаж
  const isContinue = new URLSearchParams(location.search).get('continue') === 'true';
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    region: 'central',
    background: 'commoner',
    description: '',
  });
  
  const [stats, setStats] = useState({
    strength: 10,
    intellect: 10,
    spirit: 10,
    agility: 10,
    health: 10,
  });
  
  const [error, setError] = useState('');
  const [pointsRemaining, setPointsRemaining] = useState(10);
  const [isLoading, setIsLoading] = useState(isContinue);
  
  const regions = {
    central: 'Центральные равнины',
    mountain: 'Горные хребты',
    coastal: 'Прибрежные земли',
    desert: 'Западная пустыня',
    forest: 'Древние леса',
  };
  
  const backgrounds = {
    commoner: 'Простолюдин',
    noble: 'Аристократ',
    merchant: 'Торговец',
    warrior: 'Воин',
    scholar: 'Учёный',
  };
  
  // Загружаем существующие характеристики, если это продолжение создания персонажа
  useEffect(() => {
    if (isContinue && state.player && state.player.stats) {
      // Загружаем характеристики из существующего состояния
      const existingStats = state.player.stats;
      
      // Обновляем состояние с характеристиками
      setStats({
        strength: existingStats.strength || 10,
        intellect: existingStats.intellect || 10,
        spirit: existingStats.spirit || 10,
        agility: existingStats.agility || 10,
        health: existingStats.health || 10,
      });
      
      // Убираем загрузку
      setIsLoading(false);
      
      // Вычисляем использованные очки
      const baseStats = 10 * 5; // 5 характеристик по 10 очков базовых
      const totalStats = Object.values(existingStats).reduce((sum, val) => sum + (val || 0), 0);
      const usedPoints = totalStats - baseStats;
      
      // Устанавливаем оставшиеся очки
      setPointsRemaining(Math.max(0, 10 - usedPoints));
    }
  }, [isContinue, state.player]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleStatChange = (stat, change) => {
    const newValue = stats[stat] + change;
    
    if (change > 0 && pointsRemaining <= 0) return;
    if (newValue < 10 || newValue > 20) return;
    
    setStats(prev => ({
      ...prev,
      [stat]: newValue
    }));
    
    setPointsRemaining(prev => prev - change);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Валидация
      if (!formData.name.trim()) {
        setError('Пожалуйста, введите имя персонажа');
        setIsLoading(false);
        return;
      }
      
      if (pointsRemaining > 0) {
        setError('Пожалуйста, распределите все очки характеристик');
        setIsLoading(false);
        return;
      }
      
      // Создаем персонажа
      console.log('Создание персонажа:', formData.name);
      
      // Обновляем данные в Redux
      actions.updatePlayer({
        name: formData.name,
        gender: formData.gender,
        region: formData.region,
        background: formData.background,
        description: formData.description,
      });
      
      actions.updatePlayerStats(stats);
      
      // Прямой вызов API для сохранения характеристик персонажа
      console.log('Прямое сохранение характеристик персонажа в БД...');
      try {
        const statsResponse = await fetch(`/api/users/${state.player.id}/stats`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(stats)
        });
        
        if (!statsResponse.ok) {
          console.error('Ошибка при сохранении характеристик персонажа:', await statsResponse.text());
        } else {
          console.log('Характеристики персонажа успешно сохранены в БД');
        }
      } catch (statsError) {
        console.error('Ошибка при отправке запроса на сохранение характеристик:', statsError);
      }
      
      // Прямой вызов API для сохранения профиля персонажа
      console.log('Прямое сохранение профиля персонажа в БД...');
      try {
        const profileData = {
          name: formData.name,
          gender: formData.gender,
          region: formData.region,
          background: formData.background,
          description: formData.description
        };
        
        const profileResponse = await fetch(`/api/users/${state.player.id}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(profileData)
        });
        
        if (!profileResponse.ok) {
          console.error('Ошибка при сохранении профиля персонажа:', await profileResponse.text());
        } else {
          console.log('Профиль персонажа успешно сохранен в БД');
        }
      } catch (profileError) {
        console.error('Ошибка при отправке запроса на сохранение профиля:', profileError);
      }
      
      // Добавляем стартовые предметы в зависимости от происхождения
      const startingItems = getStartingItems(formData.background);
      startingItems.forEach(item => actions.addItem(item));
      
      // Создаем собственное игровое состояние для сохранения, чтобы гарантировать наличие всех данных
      const gameStateToSave = {
        ...state,
        player: {
          ...state.player,
          name: formData.name,
          gender: formData.gender,
          region: formData.region,
          background: formData.background,
          description: formData.description,
          stats: stats,
          // Убедимся, что все необходимые свойства существуют
          inventory: state.player?.inventory || { items: startingItems, currency: { gold: 0, silver: 0, copper: 0, spiritStones: 0 } },
          social: state.player?.social || { reputation: {}, relationships: [] }
        }
      };
      
      // ВАЖНО: Сохраняем состояние игры в базу данных
      console.log('Сохранение профиля персонажа в базу данных...', gameStateToSave.player);
      await apiService.saveGameState(gameStateToSave);
      console.log('Профиль персонажа успешно сохранен');
      
      // После сохранения вызываем actions.saveGame для синхронизации с localStorage
      actions.saveGame({
        onSuccess: () => {
          console.log('Состояние игры сохранено в localStorage');
          // Переходим в игру
          navigate('/game');
        },
        onError: (error) => {
          console.error('Ошибка при сохранении состояния в localStorage:', error);
          // Всё равно переходим в игру, так как данные уже сохранены в БД
          navigate('/game');
        }
      });
    } catch (error) {
      console.error('Ошибка при создании персонажа:', error);
      setError('Произошла ошибка при создании персонажа. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStartingItems = (background) => {
    const items = [
      // Базовые предметы для всех
      {
        id: 'basic_cultivation_manual',
        name: 'Базовое руководство по культивации',
        type: 'book',
        quality: 'common',
        description: 'Простое руководство для начинающих культиваторов.'
      },
      {
        id: 'qi_gathering_pill',
        name: 'Пилюля сбора ци',
        type: 'consumable',
        quality: 'common',
        quantity: 3,
        description: 'Помогает в начальной культивации.'
      }
    ];
    
    // Дополнительные предметы в зависимости от происхождения
    switch (background) {
      case 'noble':
        items.push({
          id: 'jade_pendant',
          name: 'Нефритовый кулон',
          type: 'accessory',
          quality: 'uncommon',
          description: 'Фамильная реликвия, усиливающая духовную энергию.'
        });
        break;
        
      case 'warrior':
        items.push({
          id: 'training_sword',
          name: 'Тренировочный меч',
          type: 'weapon',
          quality: 'common',
          description: 'Простой, но надёжный меч для тренировок.'
        });
        break;
        
      case 'scholar':
        items.push({
          id: 'ancient_scroll',
          name: 'Древний свиток',
          type: 'book',
          quality: 'uncommon',
          description: 'Содержит забытые знания о культивации.'
        });
        break;
        
      case 'merchant':
        // Торговцам не добавляем духовные камни в инвентарь,
        // так как духовные камни являются валютой, а не предметом
        break;
    }
    
    return items;
  };
  
  return (
    <Container>
      <CreationPanel>
        <Title>{isContinue ? 'Завершение создания персонажа' : 'Создание персонажа'}</Title>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Column>
              <Label>Имя персонажа</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Введите имя"
              />
              
              <Label>Пол</Label>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </Select>
            </Column>
            
            <Column>
              <Label>Регион происхождения</Label>
              <Select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
              >
                {Object.entries(regions).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </Select>
              
              <Label>Происхождение</Label>
              <Select
                name="background"
                value={formData.background}
                onChange={handleInputChange}
              >
                {Object.entries(backgrounds).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </Select>
            </Column>
          </Row>
          
          <Label>Описание персонажа</Label>
          <Description
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Расскажите историю вашего персонажа..."
          />
          
          <StatsContainer>
            <PointsRemaining>
              {isContinue ?
                'Обнаружены существующие характеристики. Отредактируйте при необходимости.' :
                'Распределите очки характеристик:'}
              {' '}Очков осталось: {pointsRemaining}
            </PointsRemaining>
            
            {Object.entries(stats).map(([stat, value]) => (
              <StatRow key={stat}>
                <StatLabel>
                  {stat === 'strength' && 'Сила'}
                  {stat === 'intellect' && 'Интеллект'}
                  {stat === 'spirit' && 'Дух'}
                  {stat === 'agility' && 'Ловкость'}
                  {stat === 'health' && 'Здоровье'}
                </StatLabel>
                <StatButton
                  type="button"
                  onClick={() => handleStatChange(stat, -1)}
                  disabled={value <= 10}
                >
                  -
                </StatButton>
                <StatValue>{value}</StatValue>
                <StatButton
                  type="button"
                  onClick={() => handleStatChange(stat, 1)}
                  disabled={value >= 20 || pointsRemaining <= 0}
                >
                  +
                </StatButton>
              </StatRow>
            ))}
          </StatsContainer>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Button type="submit" disabled={isLoading}>
            {isContinue ? 'Продолжить путь к бессмертию' : 'Начать путь к бессмертию'}
          </Button>
        </Form>
      </CreationPanel>
    </Container>
  );
}

export default CharacterCreationPage; 