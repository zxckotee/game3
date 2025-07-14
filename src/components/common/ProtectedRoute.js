import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';

/**
 * Компонент для защиты маршрутов от неавторизованного доступа
 * При обновлении страницы всегда перенаправляет на LoginPage
 */
const ProtectedRoute = ({ children }) => {
  const { state } = useGame();
  
  useEffect(() => {
    // При монтировании компонента проверяем, инициализирован ли контекст
    // Если контекст не инициализирован (что происходит при обновлении страницы),
    // очищаем localStorage для предотвращения конфликтов состояния
    if (!state.isInitialized) {
      console.log('ProtectedRoute: Контекст не инициализирован, очищаем localStorage');
      
      // Очищаем данные авторизации
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userId');
      localStorage.removeItem('gameState');
      
      // Дополнительно очищаем другие игровые данные
      localStorage.removeItem('last_auth_page_visit');
    }
  }, [state.isInitialized]);
  
  // Если контекст не инициализирован или пользователь не авторизован,
  // перенаправляем на страницу входа
  if (!state.isInitialized || !state.auth?.isAuthenticated) {
    console.log('ProtectedRoute: Перенаправление на LoginPage', {
      isInitialized: state.isInitialized,
      isAuthenticated: state.auth?.isAuthenticated
    });
    
    return <Navigate to="/" replace />;
  }
  
  // Если все проверки пройдены, показываем защищенный контент
  return children;
};

export default ProtectedRoute;