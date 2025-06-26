import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import SectServiceAPI from '../../../services/sect-api';
import useAvailableSects from '../../../hooks/useAvailableSects';
import { clearCache, getSectCacheKey } from '../../../utils/cacheUtils';

// Стили
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
`;

const Title = styled.h3`
  color: #d4af37;
  margin: 0 0 15px;
`;

const Description = styled.p`
  color: #f0f0f0;
  line-height: 1.5;
  margin: 0 0 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #f0f0f0;
  margin-bottom: 15px;
  
  &:focus {
    outline: none;
    border-color: #ffcc00;
    box-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 10px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #d4af37;
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.3);
  }
  
  &:disabled {
    background: #333;
    border-color: #666;
    color: #666;
    cursor: not-allowed;
  }
`;

const SectsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const SectCard = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 5px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.1);
    border-color: rgba(212, 175, 55, 0.5);
  }
`;

const SectName = styled.h4`
  color: #d4af37;
  margin: 0 0 5px;
`;

const SectInfo = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #aaa;
`;

const NoSectsMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #aaa;
  border: 1px dashed rgba(212, 175, 55, 0.3);
  border-radius: 5px;
`;

const RetryButton = styled.button`
  padding: 10px 20px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #d4af37;
  font-size: 1rem;
  cursor: pointer;
  margin: 20px auto;
  display: block;
  
  &:hover {
    background: rgba(212, 175, 55, 0.3);
  }
`;

/**
 * Компонент для создания секты или присоединения к существующей
 * @param {Object} user - Данные о текущем пользователе
 * @param {Function} onJoinCreate - Функция обратного вызова при успешном создании/присоединении
 * @param {Function} showNotification - Функция для отображения уведомлений
 */
function SectJoinCreate({ user, onJoinCreate, showNotification }) {
  // Используем хук для загрузки и кеширования доступных сект
  const { sects: availableSects, loading, error, refreshSects } = useAvailableSects();
  
  const [sectName, setSectName] = useState('');
  const [creatingOrJoining, setCreatingOrJoining] = useState(false);
  
  // Отображаем ошибку, если не удалось загрузить секты
  React.useEffect(() => {
    if (error) {
      showNotification('Не удалось загрузить список доступных сект: ' + error, 'error');
    }
  }, [error, showNotification]);
  
  // Обработчик создания секты
  const handleCreateSect = async () => {
    if (!sectName.trim()) {
      showNotification('Введите название секты', 'error');
      return;
    }
    
    try {
      setCreatingOrJoining(true);
      
      // Вызов API для создания секты
      await SectServiceAPI.createSect(user.id, sectName.trim());
      
      // Очищаем кеш сект, так как у нас появилась новая
      clearCache(getSectCacheKey(user.id));
      
      showNotification(
        `Секта "${sectName}" успешно создана!`,
        'success'
      );
      
      // Вызов функции обратного вызова для обновления данных в родительском компоненте
      if (onJoinCreate) {
        onJoinCreate();
      }
      
    } catch (error) {
      console.error('Ошибка при создании секты:', error);
      showNotification(
        error.message || 'Не удалось создать секту',
        'error'
      );
      setCreatingOrJoining(false);
    }
  };
  
  // Обработчик присоединения к секте
  const handleJoinSect = async (sectId) => {
    try {
      setCreatingOrJoining(true);
      
      // Вызов API для присоединения к секте
      await SectServiceAPI.joinSect(user.id, sectId);
      
      // Очищаем кеш сект пользователя, так как теперь он в секте
      clearCache(getSectCacheKey(user.id));
      
      showNotification(
        'Вы успешно вступили в секту!',
        'success'
      );
      
      // Вызов функции обратного вызова для обновления данных в родительском компоненте
      if (onJoinCreate) {
        onJoinCreate();
      }
      
    } catch (error) {
      console.error('Ошибка при вступлении в секту:', error);
      showNotification(
        error.message || 'Не удалось вступить в секту',
        'error'
      );
      setCreatingOrJoining(false);
    }
  };

  return (
    <Container>
      {/* Секция создания секты */}
      <SectionContainer>
        <Title>Создать собственную секту</Title>
        <Description>
          Основав собственную секту, вы станете её главой и сможете принимать
          новых учеников, развивать секту и расширять её влияние в мире культивации.
        </Description>
        
        <Input
          type="text"
          placeholder="Введите название секты"
          value={sectName}
          onChange={(e) => setSectName(e.target.value)}
          maxLength={50}
          disabled={creatingOrJoining}
        />
        
        <ActionButton 
          onClick={handleCreateSect}
          disabled={creatingOrJoining || !sectName.trim()}
        >
          {creatingOrJoining ? 'Создание секты...' : 'Создать секту'}
        </ActionButton>
      </SectionContainer>
      
      {/* Секция присоединения к существующей секте */}
      <SectionContainer>
        <Title>Присоединиться к существующей секте</Title>
        <Description>
          Вступив в существующую секту, вы сможете тренироваться под руководством
          опытных культиваторов, получать бонусы и повышать свой уровень быстрее.
        </Description>
        
        {loading ? (
          <LoadingMessage>
            Загрузка доступных сект...
          </LoadingMessage>
        ) : error ? (
          <RetryButton onClick={() => refreshSects(true)}>
            Повторить загрузку сект
          </RetryButton>
        ) : availableSects.length === 0 ? (
          <NoSectsMessage>
            Нет доступных сект для вступления. Вы можете создать свою собственную секту.
          </NoSectsMessage>
        ) : (
          <SectsList>
            {availableSects.map(sect => (
              <SectCard 
                key={sect.id} 
                onClick={() => !creatingOrJoining && handleJoinSect(sect.id)}
                style={{ opacity: creatingOrJoining ? 0.6 : 1, cursor: creatingOrJoining ? 'not-allowed' : 'pointer' }}
              >
                <SectName>{sect.name}</SectName>
                <SectInfo>
                  <span>Ранг:</span>
                  <span>{sect.rank || 'Начальная'}</span>
                </SectInfo>
                <SectInfo>
                  <span>Уровень:</span>
                  <span>{sect.level || 1}</span>
                </SectInfo>
                <SectInfo>
                  <span>Участников:</span>
                  <span>{(sect.members || []).length}</span>
                </SectInfo>
              </SectCard>
            ))}
          </SectsList>
        )}
      </SectionContainer>
    </Container>
  );
}

export default SectJoinCreate;