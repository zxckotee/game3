import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import apiService from '../../services/api';

const LoginContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
`;

const LoginPanel = styled.div`
  width: 400px;
  background: rgba(30, 30, 30, 0.9);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
  color: #f0f0f0;
`;

const Title = styled.h1`
  font-family: 'Ma Shan Zheng', cursive;
  text-align: center;
  color: #d4af37;
  margin-bottom: 30px;
  font-size: 2.5rem;
  text-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #d4af37;
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
  margin-top: 10px;
  
  &:hover {
    background: #f4cf47;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.7);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const SwitchMode = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #aaa;
  
  span {
    color: #d4af37;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 15px;
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
`;

const LoadingText = styled.p`
  color: #d4af37;
  font-size: 1.2rem;
  margin-top: 10px;
`;

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const navigate = useNavigate();
  const { state, actions } = useGame();
  
  useEffect(() => {
    // Сначала сбрасываем состояние Redux при посещении страницы логина
    // Это решит проблему с валютой, которая остается от предыдущего аккаунта
    console.log('LoginPage: Сбрасываем состояние Redux при посещении страницы логина');
    actions.resetState();
    
    // Сохраняем время посещения страницы авторизации для отслеживания сессий
    const currentTime = Date.now();
    localStorage.setItem('last_auth_page_visit', currentTime.toString());
    
    // Проверяем, авторизован ли пользователь
    const checkAuth = async () => {
      try {
        const isAuthenticated = await apiService.checkAuth();
        
        if (isAuthenticated) {
          // Если пользователь авторизован, загружаем его игровое состояние
          const gameState = await apiService.loadGameState();
          
          if (gameState) {
            // Загружаем сохраненное состояние
            actions.loadGame(gameState);
            
            // Проверяем, создан ли персонаж полностью
            if (gameState.player && gameState.player.name) {
              console.log('Персонаж найден, переход в игру:', gameState.player.name);
              navigate('/game');
            } else if (gameState.player && gameState.player.stats && Object.keys(gameState.player.stats).length > 0) {
              console.log('Найдены характеристики персонажа, но отсутствует профиль. Переход к завершению создания персонажа');
              // Добавляем параметр к URL, чтобы указать, что это продолжение создания
              navigate('/character-creation?continue=true');
            } else {
              console.log('Персонаж не найден, переход к созданию персонажа');
              navigate('/character-creation');
            }
          } else {
            // Если нет сохраненного состояния, переходим к созданию персонажа
            console.log('Нет сохраненного состояния, переход к созданию персонажа');
            navigate('/character-creation');
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
      } finally {
        setIsPageLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, actions]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Валидация
    if (!username || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    if (!isLogin && password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Вход в систему
        console.log('Выполняем вход в систему:', username);
        await apiService.login(username, password);
        
        // Загружаем игровое состояние
        console.log('Загружаем игровое состояние');
        const gameState = await apiService.loadGameState();
        
        if (gameState) {
          // Загружаем сохраненное состояние
          console.log('Загружаем сохраненное состояние в контекст');
          actions.loadGame(gameState);
          
          // Проверяем, создан ли персонаж полностью
          if (gameState.player && gameState.player.name) {
            console.log('Персонаж найден, переход в игру:', gameState.player.name);
            navigate('/game');
          } else if (gameState.player && gameState.player.stats && Object.keys(gameState.player.stats).length > 0) {
            console.log('Найдены характеристики персонажа, но отсутствует профиль. Переход к завершению создания персонажа');
            // Добавляем параметр к URL, чтобы указать, что это продолжение создания
            navigate('/character-creation?continue=true');
          } else {
            console.log('Персонаж не найден, переход к созданию персонажа');
            navigate('/character-creation');
          }
        } else {
          // Если нет сохраненного состояния, переходим к созданию персонажа
          console.log('Нет сохраненного состояния, переход к созданию персонажа');
          navigate('/character-creation');
        }
      } else {
        // Регистрация
        console.log('Выполняем регистрацию:', username);
        
        const userData = await apiService.register(username, password);
        
        // Важно: обновляем данные пользователя в Redux после регистрации
        if (userData && userData.user) {
          console.log('Обновляем пользователя в Redux с ID:', userData.user.id);
          
          // Сначала сбрасываем всё состояние Redux для новой регистрации
          // Это критически важно для предотвращения наследования валюты из предыдущего аккаунта
          console.log('Полный сброс состояния Redux перед регистрацией нового пользователя');
          actions.resetState();
          
          // Затем обновляем данные пользователя с новым ID
          actions.updatePlayer(userData.user);
          
          // Явно устанавливаем нулевую валюту для нового пользователя
          console.log('Устанавливаем начальную валюту для нового пользователя');
          actions.updateCurrency({
            copper: 0,
            silver: 0,
            gold: 0,
            spiritStones: 0
          }, false);
        }
        
        // Переходим к созданию персонажа
        console.log('Переход к созданию персонажа после регистрации');
        navigate('/character-creation');
      }
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isPageLoading) {
    return (
      <LoginContainer>
        <LoginPanel>
          <Title>Путь к Бессмертию</Title>
          <LoadingContainer>
            <LoadingText>Проверка авторизации...</LoadingText>
          </LoadingContainer>
        </LoginPanel>
      </LoginContainer>
    );
  }
  
  return (
    <LoginContainer>
      <LoginPanel>
        <Title>Путь к Бессмертию</Title>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Имя пользователя</Label>
            <Input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              disabled={isLoading}
            />
          </InputGroup>
          
          <InputGroup>
            <Label>Пароль</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              disabled={isLoading}
            />
          </InputGroup>
          
          {!isLogin && (
            <InputGroup>
              <Label>Подтвердите пароль</Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                disabled={isLoading}
              />
            </InputGroup>
          )}
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </Button>
        </Form>
        
        <SwitchMode>
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <span onClick={() => !isLoading && setIsLogin(!isLogin)}>
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </span>
        </SwitchMode>
      </LoginPanel>
    </LoginContainer>
  );
}

export default LoginPage;
