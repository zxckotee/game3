import React, { useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import SectMainView from './sect/SectMainView';
import SectJoinCreate from './sect/SectJoinCreate';
import useSectData from '../../hooks/useSectData';

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
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

// Стили
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 150px);
  padding: 20px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out;
  
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

const LoadingMessage = styled.div`
  text-align: center;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.3rem;
  font-weight: 600;
  animation: ${pulse} 2s infinite;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 24px;
  background: linear-gradient(145deg, rgba(183, 28, 28, 0.2) 0%, rgba(244, 67, 54, 0.2) 100%);
  border: 2px solid rgba(244, 67, 54, 0.4);
  border-radius: 12px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  
  color: #f44336;
  font-weight: 600;
  font-size: 16px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f44336, #ef5350);
    border-radius: 12px 12px 0 0;
  }
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
  margin: 0 auto;
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
 * Компонент вкладки Секты
 * Демонстрирует информацию о секте пользователя или опции создания/вступления в секту
 * Использует кеширование данных для уменьшения количества запросов к API
 */
function SectTab() {
  // Получаем контекст игры
  const { state, actions } = useGame();
  
  // Получаем данные о текущем пользователе
  const user = state.player || { id: 1 };
  
  // Используем кастомный хук для загрузки и кеширования данных секты
  const { sect, loading, error, refreshSectData } = useSectData(user.id);

  // Функция для отображения уведомлений (мемоизированная)
  const showNotification = useCallback((message, type = 'info') => {
    if (actions.addNotification) {
      actions.addNotification({
        message,
        type
      });
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }, [actions]);

  // Отображение загрузки
  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingMessage>Загрузка данных секты...</LoadingMessage>
        </LoadingContainer>
      </Container>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <Container>
        <ErrorMessage>Ошибка: {error}</ErrorMessage>
        <RetryButton onClick={() => refreshSectData(true)}>
          Повторить попытку
        </RetryButton>
      </Container>
    );
  }

  // Основной рендер компонента
  return (
    <Container>
      {sect ? (
        // Если пользователь в секте, показываем информацию о ней
        <SectMainView
          sect={sect}
          user={user}
          onRefresh={refreshSectData}
          showNotification={showNotification}
        />
      ) : (
        // Если пользователь не в секте, показываем опции создания/вступления
        <SectJoinCreate
          user={user}
          onJoinCreate={refreshSectData}
          showNotification={showNotification}
        />
      )}
    </Container>
  );
}

// Используем React.memo для предотвращения лишних ререндеров
export default React.memo(SectTab);
