import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

// Импортируем компоненты UI
import ActiveEffectsPanel from '../ui/ActiveEffectsPanel';

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

// Компоненты интерфейса
const GameContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  background: #1a1a1a;
  color: #f0f0f0;
`;

const TopBar = styled.div`
  background: rgba(30, 30, 30, 0.95);
  border-bottom: 1px solid #d4af37;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #d4af37;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000;
`;

const PlayerStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const PlayerName = styled.div`
  font-size: 1.2rem;
  color: #d4af37;
`;

const CultivationInfo = styled.div`
  font-size: 0.9rem;
  color: #aaa;
`;

const ResourcesInfo = styled.div`
  display: flex;
  gap: 20px;
`;

const Resource = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  
  span {
    color: #d4af37;
  }
`;

const LogoutButton = styled.button`
  padding: 8px 15px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #d4af37;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.3);
  }
`;

const MainArea = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr 300px;
  gap: 1px;
  background: #111;
  height: 100%;
`;

const Sidebar = styled.div`
  background: rgba(30, 30, 30, 0.95);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MenuItem = styled.div`
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.1);
    color: #d4af37;
  }
  
  ${props => props.active && `
    background: rgba(212, 175, 55, 0.2);
    color: #d4af37;
  `}
`;

const MainContent = styled.div`
  background: rgba(30, 30, 30, 0.95);
  padding: 20px;
  overflow-y: auto;
`;

const RightPanel = styled.div`
  background: rgba(30, 30, 30, 0.95);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StatusEffects = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const Effect = styled.div`
  padding: 5px 10px;
  border-radius: 4px;
  background: rgba(212, 175, 55, 0.1);
  font-size: 0.9rem;
  
  ${props => props.type === 'buff' && `
    color: #4caf50;
  `}
  
  ${props => props.type === 'debuff' && `
    color: #f44336;
  `}
`;

const Notifications = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Notification = styled.div`
  padding: 10px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid #d4af37;
  font-size: 0.9rem;
`;

function GamePage() {
  const { state, actions } = useGame();
  const [activeTab, setActiveTab] = useState('cultivation');
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  // Состояние для модальных окон

  // Проверка наличия данных авторизации при загрузке страницы
  useEffect(() => {
    // Проверяем наличие всех необходимых данных авторизации
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    const userId = localStorage.getItem('userId');
    
    if (!authToken || !currentUser || !userId) {
      console.log('Не найдены данные авторизации в localStorage, перенаправление на страницу входа');
      // Используем window.location вместо navigate для перенаправления на абсолютный путь
      window.location.href = '/login';
      return; // Останавливаем выполнение useEffect после перенаправления
    }
  }, [navigate]);
  
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
    }, 30000); // Каждые 30 секунд
    
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
      
      console.log('⏱️ Обновление времени в таймере:', {
        текущее: `${currentHour}:${currentMinute} день ${currentDay}`,
        новое: `${newHour}:${newMinute} день ${newDay}`,
        переход_полночи: dayIncrement === 1
      });
      
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
    }, 5 * 60 * 1000); // Каждые 5 минут
    
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
            {state.player.name[0]}
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
          <ActiveEffectsPanel />
          
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
