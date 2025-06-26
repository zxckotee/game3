import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import SectMainView from './sect/SectMainView';
import SectJoinCreate from './sect/SectJoinCreate';
import useSectData from '../../hooks/useSectData';

// Стили
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 150px);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #d4af37;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #ff5555;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff5555;
  border-radius: 5px;
  margin-bottom: 20px;
`;

const RetryButton = styled.button`
  padding: 10px 20px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #d4af37;
  font-size: 1rem;
  cursor: pointer;
  margin: 0 auto;
  display: block;
  
  &:hover {
    background: rgba(212, 175, 55, 0.3);
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
