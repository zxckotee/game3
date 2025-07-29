import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

// Импортируем компоненты UI
import ActiveEffectsPanel from '../ui/ActiveEffectsPanel';
import ActiveEffectsDisplay from '../effects/ActiveEffectsDisplay';

// Импортируем компоненты вкладок
import CultivationTab from '../tabs/CultivationTab';
import InventoryTab from '../tabs/InventoryTab';
import EquipmentTab from '../tabs/EquipmentTab';
import CharacterTab from '../tabs/CharacterTab';
import MapTab from '../tabs/MapTab';
import QuestsTab from '../tabs/QuestsTab';
import SectTab from '../tabs/SectTab';
import PvPTab from '../tabs/PvPTab'; // Заменили GroupsTab на PvPTab
import SkillsTab from '../tabs/SkillsTab';
import SocialTab from '../tabs/SocialTab';
import AchievementsTab from '../tabs/AchievementsTab';
import AlchemyTab from '../tabs/AlchemyTab';
import SpiritPetsTab from '../tabs/SpiritPetsTab';
import MarketTab from '../tabs/MarketTab';

// Анимации
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`;

// Компоненты интерфейса
const GameContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg,
    rgba(20, 20, 20, 0.98) 0%,
    rgba(40, 30, 20, 0.95) 25%,
    rgba(60, 45, 25, 0.92) 50%,
    rgba(80, 60, 30, 0.95) 75%,
    rgba(100, 75, 35, 0.98) 100%
  );
  color: #f0f0f0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      transparent 30%,
      rgba(212, 175, 55, 0.01) 50%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 1;
  }
`;

const TopBar = styled.div`
  background: linear-gradient(135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(40, 30, 20, 0.3) 100%
  );
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.6s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.05), transparent);
    transition: left 0.8s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  animation: ${fadeIn} 0.8s ease-out 0.2s both;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000;
  overflow: hidden;
  border: 3px solid rgba(212, 175, 55, 0.4);
  transition: all 0.4s ease;
  position: relative;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #f4d03f, #d4af37, #f4d03f);
    border-radius: 50%;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  
  &:hover {
    transform: scale(1.1) rotate(5deg);
    border-color: rgba(212, 175, 55, 0.8);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
    
    &::before {
      opacity: 1;
      animation: ${shimmer} 2s linear infinite;
    }
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const PlayerStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PlayerName = styled.div`
  font-size: 1.3rem;
  background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(2px);
    filter: brightness(1.1);
  }
`;

const CultivationInfo = styled.div`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: color 0.3s ease;
  
  &:hover {
    color: rgba(244, 208, 63, 0.9);
  }
`;

const ResourcesInfo = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  animation: ${fadeIn} 0.8s ease-out 0.4s both;
`;

const Resource = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  
  &:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%);
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
  }
  
  span {
    color: #f4d03f;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

const LogoutButton = styled.button`
  padding: 10px 18px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.1) 100%);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  color: #f4d03f;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.2) 100%);
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    
    &::before {
      display: none;
    }
  }
`;

const MainArea = styled.div`
  display: flex;
  flex: 1;
  gap: 2px;
  background: rgba(0, 0, 0, 0.1);
  min-height: 0;
  position: relative;
  z-index: 2;
`;

const Sidebar = styled.div`
  background: linear-gradient(145deg,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(40, 30, 20, 0.4) 100%
  );
  backdrop-filter: blur(15px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-right: 1px solid rgba(212, 175, 55, 0.15);
  position: relative;
  overflow-y: auto;
  width: 220px;
  min-width: 200px;
  flex-shrink: 0;
  animation: ${fadeIn} 0.8s ease-out 0.6s both;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg,
      rgba(212, 175, 55, 0.02) 0%,
      transparent 50%,
      rgba(244, 208, 63, 0.02) 100%
    );
    pointer-events: none;
    z-index: 1;
  }
`;

const MenuItem = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
    z-index: -1;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(244, 208, 63, 0.1) 100%);
    color: #f4d03f;
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  ${props => props.active && `
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(244, 208, 63, 0.15) 100%);
    color: #f4d03f;
    border: 1px solid rgba(212, 175, 55, 0.3);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
    font-weight: 600;
    
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: linear-gradient(180deg, #f4d03f 0%, #d4af37 100%);
      border-radius: 0 2px 2px 0;
    }
  `}
`;

const MainContent = styled.div`
  background: linear-gradient(145deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(40, 30, 20, 0.2) 100%
  );
  backdrop-filter: blur(10px);
  padding: 24px;
  overflow-y: auto;
  border-left: 1px solid rgba(212, 175, 55, 0.08);
  border-right: 1px solid rgba(212, 175, 55, 0.08);
  flex: 1;
  min-width: 0;
  animation: ${fadeIn} 0.8s ease-out 0.8s both;
`;

const RightPanel = styled.div`
  background: linear-gradient(145deg,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(40, 30, 20, 0.3) 100%
  );
  backdrop-filter: blur(15px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-left: 1px solid rgba(212, 175, 55, 0.15);
  position: relative;
  overflow-y: auto;
  width: 300px;
  flex-shrink: 0;
  animation: ${fadeIn} 0.8s ease-out 1s both;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg,
      rgba(212, 175, 55, 0.02) 0%,
      transparent 50%,
      rgba(244, 208, 63, 0.02) 100%
    );
    pointer-events: none;
    z-index: 1;
  }
  
  h3 {
    background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
    margin: 0 0 16px 0;
    position: relative;
    z-index: 2;
  }
`;

const StatusEffects = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  position: relative;
  z-index: 2;
`;

const Effect = styled.div`
  padding: 6px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(244, 208, 63, 0.1) 100%);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
  }
  
  ${props => props.type === 'buff' && `
    color: #90EE90;
    border-color: rgba(144, 238, 144, 0.3);
  `}
  
  ${props => props.type === 'debuff' && `
    color: #FFB6C1;
    border-color: rgba(255, 182, 193, 0.3);
  `}
`;

const Notifications = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 2;
`;

const Notification = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  backdrop-filter: blur(10px);
  border-left: 3px solid #f4d03f;
  border: 1px solid rgba(212, 175, 55, 0.2);
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
`;

function GamePage() {
  const { state, actions } = useGame();
  const [activeTab, setActiveTab] = useState('cultivation');
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  // Состояние для модальных окон

  // Проверка наличия данных авторизации и загрузка состояния при обновлении страницы
  useEffect(() => {
    const initializeGameState = async () => {
      try {
        // Проверяем наличие токена авторизации
        const authToken = localStorage.getItem('authToken');
        const currentUser = localStorage.getItem('currentUser');
        
        if (!authToken || !currentUser) {
          console.log('Не найдены данные авторизации в localStorage, перенаправление на страницу входа');
          navigate('/');
          return;
        }
        
        // Если токен есть, но состояние игры не инициализировано, загружаем его
        if (!state.isInitialized || !state.player?.id) {
          console.log('Токен найден, загружаем игровое состояние для:', currentUser);
          
          try {
            // Загружаем игровое состояние с сервера
            const gameState = await apiService.loadGameState();
            
            if (gameState) {
              // Загружаем состояние в контекст
              actions.loadGame(gameState);
              console.log('Игровое состояние успешно загружено при обновлении страницы');
            } else {
              console.log('Игровое состояние не найдено, перенаправление на создание персонажа');
              navigate('/character-creation');
            }
          } catch (error) {
            console.error('Ошибка при загрузке игрового состояния:', error);
            
            // Очищаем поврежденные данные авторизации
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userId');
            
            // Перенаправляем на страницу входа
            console.log('Перенаправление на LoginPage из-за ошибки загрузки состояния');
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Ошибка при инициализации игрового состояния:', error);
        navigate('/');
      }
    };
    
    initializeGameState();
  }, []); // Пустой массив зависимостей - срабатывает только при монтировании компонента
  
  // Имитация получения уведомлений
  useEffect(() => {
    const timer = setInterval(() => {
      const events = [
        'Вы чувствуете прилив духовной энергии...',
        'Поблизости появился редкий духовный зверь!',
        'Ваша техника культивации становится более совершенной.',
        'В округе замечены следы древнего артефакта...'
      ];
      
      actions.addNotification({
        message: events[Math.floor(Math.random() * events.length)],
        type: 'info'
      });
    }, process.env.NODE_ENV === 'production' ? 120000 : 30000); // 2 минуты в production, 30 секунд в development
    
    return () => clearInterval(timer);
  }, [actions]);
  
  // Имитация игрового времени
  useEffect(() => {
    const timer = setInterval(() => {
      // Получаем текущие значения с проверкой на существование объектов
      const worldTime = state?.world?.time || {};
      const currentHour = worldTime.hour || 12;
      const currentMinute = worldTime.minute || 0;
      const currentDay = worldTime.day || 1;
      const currentSeason = worldTime.season || 'spring';
      
      // Вычисляем новые значения
      const newMinute = (currentMinute + 10) % 60;
      const hourIncrement = currentMinute + 10 >= 60 ? 1 : 0;
      const newHour = (currentHour + hourIncrement) % 24;
      
      // ОЧЕНЬ ВАЖНО: проверяем переход через полночь
      // Если был переход с 23 часов на 0, увеличиваем день
      const dayIncrement = (currentHour === 23 && newHour === 0) ? 1 : 0;
      const newDay = currentDay + dayIncrement;
      
      /*console.log('⏱️ Обновление времени в таймере:', {
        текущее: `${currentHour}:${currentMinute} день ${currentDay}`,
        новое: `${newHour}:${newMinute} день ${newDay}`,
        переход_полночи: dayIncrement === 1
      });*/
      
      // Обновляем время с сохранением дня
      actions.updateTime({
        minute: newMinute,
        hour: newHour,
        day: newDay, // Явно задаем день
        // Сохраняем текущий сезон
        season: currentSeason
      });
    }, 1000); // Каждую секунду = 10 игровых минут
    
    return () => clearInterval(timer);
  }, [actions, state.world.time]);
  
  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };
  
  // Функция для выхода из игры
  const handleLogout = async () => {
    try {
      setIsSaving(true);
      
      // Показываем уведомление о сохранении
      actions.addNotification({
        message: 'Сохранение прогресса...',
        type: 'info'
      });
      
      // Сохраняем прогресс на сервере с флагом, что это выход из игры (для сохранения инвентаря)
      await apiService.saveGameState(state, true);
      
      // Показываем уведомление об успешном сохранении
      actions.addNotification({
        message: 'Прогресс сохранен. Выход из игры...',
        type: 'success'
      });
      
      // Выходим из системы
      await apiService.logout();
      
      // Небольшая задержка перед выходом
      setTimeout(() => {
        // Перенаправляем на страницу входа
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Ошибка при выходе из игры:', error);
      
      // Показываем уведомление об ошибке
      actions.addNotification({
        message: 'Ошибка при сохранении прогресса: ' + error.message,
        type: 'error'
      });
      
      setIsSaving(false);
    }
  };
  
  // Проверка авторизации перед сохранением
  const saveWithAuthCheck = async () => {
    try {
      // Проверяем авторизацию
      const isAuthenticated = await apiService.checkAuth();
      
      if (!isAuthenticated) {
        console.warn('Сохранение пропущено - пользователь не авторизован');
        return false;
      }
      
      // Сохраняем прогресс на сервере, пропуская обновление профиля при автосохранении
      await apiService.saveGameState(state, false, true);
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении прогресса:', error);
      return false;
    }
  };
  
  // Автоматическое сохранение каждые 5 минут и при каждом действии пользователя
  useEffect(() => {
    // Сохранение по таймеру
    const saveInterval = setInterval(async () => {
      try {
        const saved = await saveWithAuthCheck();
        
        if (saved) {
          // Показываем уведомление об успешном сохранении
          actions.addNotification({
            message: 'Прогресс автоматически сохранен',
            type: 'info'
          });
        }
      } catch (error) {
        console.error('Ошибка при автосохранении:', error);
      }
    }, process.env.NODE_ENV === 'production' ? 600000 : 300000); // 10 минут в production, 5 минут в development
    
    // Сохранение при изменении важных данных
    const saveData = async () => {
      const saved = await saveWithAuthCheck();
      if (saved) {
        //console.log('Прогресс сохранен после действия пользователя');
      }
    };
    
    // Сохраняем данные при изменении важных частей состояния
    if (state.isInitialized && !state.isLoading) {
      saveData();
    }
    
    return () => clearInterval(saveInterval);
  }, [
    state.player.stats, 
    state.player.cultivation, 
    state.player.inventory, 
    state.player.techniques, 
    state.player.progress.quests, 
    state.achievements,
    state.isInitialized,
    state.isLoading,
    actions
  ]);
  
  // Периодическое получение профиля персонажа вместо обновления
  useEffect(() => {
    // Функция для получения профиля
    const fetchCharacterProfile = async () => {
      try {
        const isAuthenticated = await apiService.checkAuth();
        
        if (!isAuthenticated) {
          console.warn('Получение профиля пропущено - пользователь не авторизован');
          return;
        }
        
        // Получаем текущий ID пользователя
        const userId = state?.player?.id;
        if (!userId) {
          console.warn('Получение профиля пропущено - ID пользователя не найден');
          return;
        }
        
        // Получаем профиль с сервера
        const profile = await apiService.getCharacterProfile(userId);
        
        // Обновляем состояние, если профиль получен
        if (profile) {
          // Проверяем, изменился ли профиль, прежде чем обновлять состояние
          if (JSON.stringify(state.player.name) !== JSON.stringify(profile.name) ||
              JSON.stringify(state.player.gender) !== JSON.stringify(profile.gender) ||
              JSON.stringify(state.player.level) !== JSON.stringify(profile.level) ||
              JSON.stringify(state.player.experience) !== JSON.stringify(profile.experience)) {
            console.log('Обновляем профиль персонажа в состоянии из GET-запроса');
            
            // Обновляем только данные профиля в состоянии
            actions.updatePlayer({
              name: profile.name,
              gender: profile.gender,
              region: profile.region,
              background: profile.background,
              description: profile.description,
              avatar: profile.avatar,
              level: profile.level,
              experience: profile.experience
            });
          }
        }
      } catch (error) {
        console.error('Ошибка при получении профиля персонажа:', error);
      }
    };
    
    // Интервальное обновление профиля удалено, так как данные теперь приходят с основной загрузкой или по другому механизму.
    // Выполняем первоначальное получение профиля
    // fetchCharacterProfile(); // Удалено
    
    // Очистка при размонтировании
    return () => {
      // clearInterval(profileInterval); // Удалено
    };
  }, [state?.auth?.user?.id, actions, state.player]);
  
  // Создаем Refs вне useEffect для хранения данных
  const lastCultivationDataRef = useRef(null);
  const userIdRef = useRef(null);
  const isLoadingRef = useRef(false);
  const blockResetsRef = useRef(false);
  
  // Периодический запрос данных культивации для обновления в Redux
  useEffect(() => {
    // Обновляем userIdRef, если userId стал доступен
    if (state?.player?.id && !userIdRef.current) {
      userIdRef.current = state.player.id;
      console.log('Установлен стабильный userId для запросов культивации:', userIdRef.current);
    }
    
    // Функция для получения данных о культивации
    const fetchCultivationData = async () => {
      try {
        // Проверяем, не происходит ли уже загрузка данных
        if (isLoadingRef.current) {
          console.log('Уже идет загрузка данных культивации, пропускаем запрос');
          return;
        }
        
        isLoadingRef.current = true;
        
        // Используем сохраненный userId или пытаемся получить из localStorage
        const userId = userIdRef.current || localStorage.getItem('userId');
        if (!userId) {
          console.warn('Получение данных о культивации пропущено - ID пользователя не найден');
          isLoadingRef.current = false;
          return;
        }
        
        // Получаем данные о культивации с сервера
        console.log('Запрашиваем данные о культивации для userId:', userId);
        const cultivationData = await apiService.getCultivationProgress(userId);
        
        // Проверяем, что получены валидные данные (не пустые и не нулевые)
        if (cultivationData &&
            cultivationData.stage &&
            cultivationData.level &&
            typeof cultivationData.energy === 'number') {
            
          console.log('Получены валидные данные культивации:', {
            stage: cultivationData.stage,
            level: cultivationData.level,
            energy: cultivationData.energy,
            exp: cultivationData.experience
          });
          
          // Проверяем, менялись ли данные
          const currentDataStr = JSON.stringify(cultivationData);
          const lastDataStr = lastCultivationDataRef.current
            ? JSON.stringify(lastCultivationDataRef.current)
            : null;
            
          if (lastDataStr !== currentDataStr) {
            console.log('Обнаружены изменения в данных культивации, обновляем Redux');
            
            // Устанавливаем флаг блокировки сбросов
            blockResetsRef.current = true;
            
            // Сохраняем полную копию данных
            lastCultivationDataRef.current = JSON.parse(JSON.stringify(cultivationData));
            
            // Обновляем Redux
            actions.updateCultivation(cultivationData);
            
            // Снимаем защиту через некоторое время
            setTimeout(() => {
              blockResetsRef.current = false;
              console.log('Защита от сброса данных культивации снята');
            }, 5000); // 5 секунд защиты
          } else {
            console.log('Данные культивации не изменились, пропускаем обновление Redux');
          }
        } else {
          // Если пришли невалидные данные, но у нас есть сохраненные - используем их
          if (lastCultivationDataRef.current && !blockResetsRef.current) {
            console.warn('Получены невалидные данные культивации, восстанавливаем из кэша');
            actions.updateCultivation(lastCultivationDataRef.current);
          } else {
            console.warn('Получены невалидные данные культивации:', cultivationData);
          }
        }
        
        // Отключаем флаг загрузки через небольшую задержку (чтобы избежать частых запросов)
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 1000);
      } catch (error) {
        console.error('Ошибка при получении данных о культивации:', error);
        
        // В случае ошибки используем кэшированные данные, если они есть
        if (lastCultivationDataRef.current && !blockResetsRef.current) {
          console.warn('Ошибка API, восстанавливаем кэшированные данные культивации');
          
          // Создаем глубокую копию кэшированных данных
          const cachedData = JSON.parse(JSON.stringify(lastCultivationDataRef.current));
          
          // Устанавливаем флаг блокировки сбросов
          blockResetsRef.current = true;
          
          // Применяем кэшированные данные
          actions.updateCultivation(cachedData);
          
          // Снимаем защиту через некоторое время
          setTimeout(() => {
            blockResetsRef.current = false;
            console.log('Защита от сброса данных культивации снята после восстановления из кэша');
          }, 5000); // 5 секунд защиты
        }
        
        // Отключаем флаг загрузки с задержкой
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 2000);
      }
    };
    
    // Интервальное обновление данных культивации удалено.
    // Выполняем запрос данных при первом рендере компонента
    // fetchCultivationData(); // Удалено
    
    // Устанавливаем интервал для периодического обновления (каждую минуту)
    // const cultivationInterval = setInterval(fetchCultivationData, 60000); // Удалено
    
    // Очистка при размонтировании компонента
    return () => {
      // clearInterval(cultivationInterval); // Удалено
    };
  }, [actions]); // Убрана зависимость от state для избегания циклических обновлений

  // Добавляем обработчик закрытия окна браузера для сохранения прогресса
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      // Показываем стандартное сообщение о несохраненных изменениях
      event.preventDefault();
      event.returnValue = 'Прогресс может быть потерян, если вы закроете игру. Вы уверены?';
      
      // Сохраняем состояние игры с флагом isExiting=true для сохранения инвентаря
      // При выходе из игры сохраняем все данные, включая профиль персонажа (skipProfileUpdate=false)
      try {
        await apiService.saveGameState(state, true, false);
      } catch (error) {
        console.error('Ошибка при сохранении перед закрытием:', error);
      }
      
      // Возвращаем стандартное сообщение для некоторых браузеров
      return 'Прогресс может быть потерян, если вы закроете игру. Вы уверены?';
    };
    
    // Добавляем слушатель события
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Удаляем слушатель при размонтировании компонента
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state]);
  
  // Функция для рендеринга активной вкладки
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'cultivation':
        return <CultivationTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'equipment':
        return <EquipmentTab />;
      case 'character':
        return <CharacterTab />;
      case 'map':
        return <MapTab />;
      case 'quests':
        return <QuestsTab />;
      case 'sect':
        return <SectTab />;
      case 'pvp': // Изменили вкладку 'groups' на 'pvp'
        return <PvPTab />;
      case 'skills':
        return <SkillsTab />;
      case 'alchemy':
        return <AlchemyTab />;
      case 'social':
        return <SocialTab />;
      case 'achievements':
        return <AchievementsTab />;
      case 'spiritPets':
        return <SpiritPetsTab />;
      case 'market':
        return <MarketTab />;
      default:
        return null;
    }
  };
  
  return (
    <GameContainer>
      <TopBar>
        <PlayerInfo>
          <Avatar>
            {state.player.avatar ? (
              <AvatarImage
                src={state.player.avatar}
                alt={state.player.name || 'Аватарка игрока'}
                onError={(e) => {
                  console.warn('Ошибка загрузки аватарки в шапке:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{
              display: state.player.avatar ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#000'
            }}>
              {(state.player.name || '?')[0].toUpperCase()}
            </div>
          </Avatar>
          <PlayerStats>
            <PlayerName>{state.player.name}</PlayerName>
            <CultivationInfo>
              {state.player.cultivation.stage} ({state.player.cultivation.level})
            </CultivationInfo>
          </PlayerStats>
        </PlayerInfo>
        
        <ResourcesInfo>
          <Resource>
            Духовная энергия: <span>{state.player.cultivation.energy || 0}/{state.player.cultivation.maxEnergy || 100}</span>
          </Resource>
          <Resource>
            Опыт: <span>{state.player.cultivation.experience || 0}/{state.player.cultivation.experienceToNextLevel || 100}</span>
          </Resource>
          <Resource>
            Золото: <span>{state.player.inventory.currency.gold || 0}</span>
          </Resource>
          <LogoutButton onClick={handleLogout} disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Выйти из игры'}
          </LogoutButton>
        </ResourcesInfo>
      </TopBar>
      
      <MainArea>
        <Sidebar>
          <MenuItem 
            active={activeTab === 'cultivation'}
            onClick={() => setActiveTab('cultivation')}
          >
            Культивация
          </MenuItem>
          <MenuItem 
            active={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
          >
            Инвентарь
          </MenuItem>
          <MenuItem 
            active={activeTab === 'equipment'}
            onClick={() => setActiveTab('equipment')}
          >
            Экипировка
          </MenuItem>
          <MenuItem 
            active={activeTab === 'character'}
            onClick={() => setActiveTab('character')}
          >
            Персонаж
          </MenuItem>
          <MenuItem 
            active={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
          >
            Карта
          </MenuItem>
          <MenuItem 
            active={activeTab === 'quests'}
            onClick={() => setActiveTab('quests')}
          >
            Задания
          </MenuItem>
          <MenuItem 
            active={activeTab === 'sect'}
            onClick={() => setActiveTab('sect')}
          >
            Секта
          </MenuItem>
          <MenuItem 
            active={activeTab === 'pvp'} 
            onClick={() => setActiveTab('pvp')}
          >
            PvP Арена
          </MenuItem>
          <MenuItem 
            active={activeTab === 'skills'}
            onClick={() => setActiveTab('skills')}
          >
            Техники
          </MenuItem>
          <MenuItem 
            active={activeTab === 'alchemy'}
            onClick={() => setActiveTab('alchemy')}
          >
            Алхимия
          </MenuItem>
          <MenuItem 
            active={activeTab === 'social'}
            onClick={() => setActiveTab('social')}
          >
            Социальное
          </MenuItem>
          <MenuItem 
            active={activeTab === 'achievements'}
            onClick={() => setActiveTab('achievements')}
          >
            Достижения
          </MenuItem>
          <MenuItem 
            active={activeTab === 'spiritPets'}
            onClick={() => setActiveTab('spiritPets')}
          >
            Питомцы
          </MenuItem>
          <MenuItem 
            active={activeTab === 'market'}
            onClick={() => setActiveTab('market')}
          >
            Рынок
          </MenuItem>
        </Sidebar>
        
        <MainContent>
          {renderActiveTab()}
        </MainContent>
        
        <RightPanel>
          {/* Панель активных эффектов */}
          <ActiveEffectsDisplay userId={state.player.id} />
          
          <div>
            <h3>Уведомления</h3>
            <Notifications>
              {state.ui.notifications.map(notification => (
                <Notification key={notification.id}>
                  {notification.message}
                </Notification>
              ))}
            </Notifications>
          </div>
        </RightPanel>
      </MainArea>
    </GameContainer>
  );
}

export default GamePage;
