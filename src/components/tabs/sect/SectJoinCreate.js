import React, { useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import SectServiceAPI from '../../../services/sect-api';
import useAvailableSects from '../../../hooks/useAvailableSects';
import { clearCache, getSectCacheKey } from '../../../utils/cacheUtils';

// Анимации
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.9;
  }
`;

// Стили
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const SectionContainer = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #d4af37, #f4d03f, #b7950b);
    border-radius: 12px 12px 0 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.05), transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 4s infinite;
    pointer-events: none;
  }
`;

const Title = styled.h3`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 50px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    border-radius: 1px;
  }
`;

const Description = styled.p`
  color: #f0f0f0;
  line-height: 1.6;
  margin: 0 0 24px;
  font-size: 15px;
  opacity: 0.9;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: #f0f0f0;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(212, 175, 55, 0.8);
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
    background: linear-gradient(145deg, rgba(0, 0, 0, 0.5) 0%, rgba(40, 40, 40, 0.7) 100%);
  }
  
  &:hover {
    border-color: rgba(212, 175, 55, 0.5);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.1);
  }
  
  &::placeholder {
    color: rgba(212, 175, 55, 0.6);
    font-style: italic;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.2) 100%);
  border: 2px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  color: #d4af37;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 12px;
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
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.3) 100%);
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.2);
  }
  
  &:disabled {
    background: linear-gradient(145deg, rgba(60, 60, 60, 0.3) 0%, rgba(80, 80, 80, 0.3) 100%);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    
    &::before {
      display: none;
    }
  }
`;

const SectsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const SectCard = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  
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
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.1) 100%);
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
    animation: ${pulse} 2s infinite;
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.15);
  }
`;

const SectName = styled.h4`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
`;

const SectInfo = styled.div`
  color: rgba(212, 175, 55, 0.8);
  font-size: 14px;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  font-weight: 500;
  
  span:first-child {
    opacity: 0.8;
  }
  
  span:last-child {
    color: #fff;
    font-weight: 600;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 32px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  
  color: rgba(212, 175, 55, 0.9);
  font-size: 16px;
  font-weight: 500;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 2s infinite;
    pointer-events: none;
  }
`;

const NoSectsMessage = styled.div`
  text-align: center;
  padding: 32px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px dashed rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  color: rgba(212, 175, 55, 0.8);
  font-size: 16px;
  font-weight: 500;
  font-style: italic;
  animation: ${fadeIn} 0.4s ease-out;
`;

const RetryButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.2) 100%);
  border: 2px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  color: #d4af37;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin: 24px auto;
  display: block;
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
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.3) 100%);
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.2);
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