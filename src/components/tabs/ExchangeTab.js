import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import ACTION_TYPES from '../../context/actions/actionTypes';
import CharacterProfileServiceAPI from '../../services/character-profile-service-api';

// Анимации
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;

// Стилизованные компоненты
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  color: #f0f0f0;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  margin: 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const Content = styled.div`
  display: flex;
  gap: 20px;
  flex: 1;
`;

const ExchangePanel = styled.div`
  flex: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
    border-radius: 16px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
`;

const CurrencyBalance = styled.div`
  background: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const BalanceTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #d4af37;
  font-size: 18px;
`;

const BalanceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CurrencyName = styled.span`
  color: #f0f0f0;
  font-weight: 500;
`;

const CurrencyAmount = styled.span`
  color: ${props => {
    switch(props.currency) {
      case 'spiritStones': return '#9d4edd';
      case 'gold': return '#ffd700';
      case 'silver': return '#c0c0c0';
      case 'copper': return '#cd7f32';
      default: return '#f0f0f0';
    }
  }};
  font-weight: bold;
`;

const ExchangeForm = styled.div`
  background: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  padding: 20px;
`;

const FormTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #d4af37;
  font-size: 18px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
`;

const FormLabel = styled.label`
  color: #f0f0f0;
  font-weight: 500;
  min-width: 60px;
`;

const Select = styled.select`
  background: rgba(40, 40, 40, 0.8);
  color: #f0f0f0;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  flex: 1;
  
  &:focus {
    outline: none;
    border-color: #d4af37;
  }
  
  option {
    background: #2a2a2a;
    color: #f0f0f0;
  }
`;

const Input = styled.input`
  background: rgba(40, 40, 40, 0.8);
  color: #f0f0f0;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  flex: 1;
  
  &:focus {
    outline: none;
    border-color: #d4af37;
  }
  
  &::placeholder {
    color: #888;
  }
`;

const ExchangeButton = styled.button`
  background: ${props => props.disabled 
    ? 'rgba(60, 60, 60, 0.3)' 
    : 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))'};
  color: ${props => props.disabled ? '#666' : '#d4af37'};
  border: 1px solid ${props => props.disabled ? 'rgba(100, 100, 100, 0.3)' : 'rgba(212, 175, 55, 0.4)'};
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  
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
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.3), rgba(244, 208, 63, 0.3));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
`;

const ExchangeInfo = styled.div`
  background: rgba(40, 40, 40, 0.6);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  border-left: 3px solid #d4af37;
`;

const InfoText = styled.div`
  color: #f0f0f0;
  font-size: 14px;
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RatesPanel = styled.div`
  flex: 0 0 300px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
    border-radius: 16px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
  }
`;

const RatesTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #d4af37;
  font-size: 18px;
`;

const RateItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const RateText = styled.span`
  color: #f0f0f0;
  font-size: 14px;
`;

// Курсы обмена
const EXCHANGE_RATES = {
  copper: 1,
  silver: 10,
  gold: 100,
  spiritStones: 1000
};

// Разрешенные направления обмена
const ALLOWED_EXCHANGES = {
  copper: ['silver'],
  silver: ['copper', 'gold'],
  gold: ['silver', 'copper'],
  spiritStones: ['gold', 'silver', 'copper']
};

// Названия валют
const CURRENCY_NAMES = {
  copper: 'Медь',
  silver: 'Серебро',
  gold: 'Золото',
  spiritStones: 'Духовные камни'
};

/**
 * Компонент вкладки "Обменник"
 */
const ExchangeTab = () => {
  const { state, actions } = useGame();
  const { player } = state;
  
  // Состояние формы обмена
  const [fromCurrency, setFromCurrency] = useState('silver');
  const [toCurrency, setToCurrency] = useState('copper');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Получаем ID пользователя
  const getUserId = () => {
    return player?.user?.id || localStorage.getItem('userId') || 1;
  };
  
  // Получаем текущий баланс валют
  const currency = player?.inventory?.currency || {
    gold: 0,
    silver: 0,
    copper: 0,
    spiritStones: 0
  };
  
  // Вычисляем количество получаемой валюты
  const calculateExchangeAmount = () => {
    if (!amount || amount <= 0) return 0;
    
    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];
    return Math.floor((amount * fromRate) / toRate);
  };
  
  // Вычисляем курс обмена
  const getExchangeRate = () => {
    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];
    return fromRate / toRate;
  };
  
  // Проверяем достаточность средств
  const hasSufficientFunds = () => {
    if (!amount || amount <= 0) return false;
    const currentAmount = currency[fromCurrency] || 0;
    return currentAmount >= amount;
  };
  
  // Проверяем допустимость обмена
  const isExchangeAllowed = () => {
    return ALLOWED_EXCHANGES[fromCurrency]?.includes(toCurrency);
  };
  
  // Обработчик изменения исходной валюты
  const handleFromCurrencyChange = (e) => {
    const newFromCurrency = e.target.value;
    setFromCurrency(newFromCurrency);
    
    // Если текущая целевая валюта недопустима, выбираем первую допустимую
    const allowedTargets = ALLOWED_EXCHANGES[newFromCurrency] || [];
    if (!allowedTargets.includes(toCurrency)) {
      setToCurrency(allowedTargets[0] || 'copper');
    }
  };
  
  // Обработчик обмена валют
  const handleExchange = async () => {
    if (!hasSufficientFunds() || !isExchangeAllowed() || !amount || amount <= 0) {
      actions.addNotification({ 
        message: 'Проверьте корректность данных для обмена', 
        type: 'error' 
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userId = getUserId();
      const result = await CharacterProfileServiceAPI.exchangeCurrency(
        userId, 
        fromCurrency, 
        toCurrency, 
        parseInt(amount)
      );
      
      if (result.success) {
        // Обновляем валюту в состоянии игры используя правильный метод
        // Используем updateCurrency с новыми значениями валют из ответа сервера
        actions.updateCurrency(result.newCurrency, false); // false = режим установки (не аддитивный)
        
        actions.addNotification({ 
          message: `Обмен выполнен успешно! Получено: ${result.exchangedAmount} ${CURRENCY_NAMES[toCurrency]}`, 
          type: 'success' 
        });
        
        // Очищаем форму
        setAmount('');
      } else {
        actions.addNotification({ 
          message: result.message || 'Ошибка при обмене валют', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Ошибка при обмене валют:', error);
      actions.addNotification({ 
        message: error.message || 'Произошла ошибка при обмене валют', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>💱 Обменник валют</Title>
      </Header>
      
      <Content>
        <ExchangePanel>
          <CurrencyBalance>
            <BalanceTitle>Ваш баланс</BalanceTitle>
            <BalanceItem>
              <CurrencyName>Духовные камни:</CurrencyName>
              <CurrencyAmount currency="spiritStones">{currency.spiritStones || 0}</CurrencyAmount>
            </BalanceItem>
            <BalanceItem>
              <CurrencyName>Золото:</CurrencyName>
              <CurrencyAmount currency="gold">{currency.gold || 0}</CurrencyAmount>
            </BalanceItem>
            <BalanceItem>
              <CurrencyName>Серебро:</CurrencyName>
              <CurrencyAmount currency="silver">{currency.silver || 0}</CurrencyAmount>
            </BalanceItem>
            <BalanceItem>
              <CurrencyName>Медь:</CurrencyName>
              <CurrencyAmount currency="copper">{currency.copper || 0}</CurrencyAmount>
            </BalanceItem>
          </CurrencyBalance>
          
          <ExchangeForm>
            <FormTitle>Обмен валют</FormTitle>
            
            <FormRow>
              <FormLabel>Из:</FormLabel>
              <Select value={fromCurrency} onChange={handleFromCurrencyChange}>
                {Object.keys(ALLOWED_EXCHANGES).map(curr => (
                  <option key={curr} value={curr}>
                    {CURRENCY_NAMES[curr]}
                  </option>
                ))}
              </Select>
            </FormRow>
            
            <FormRow>
              <FormLabel>В:</FormLabel>
              <Select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
                {(ALLOWED_EXCHANGES[fromCurrency] || []).map(curr => (
                  <option key={curr} value={curr}>
                    {CURRENCY_NAMES[curr]}
                  </option>
                ))}
              </Select>
            </FormRow>
            
            <FormRow>
              <FormLabel>Количество:</FormLabel>
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Введите количество"
              />
            </FormRow>
            
            {amount && amount > 0 && (
              <ExchangeInfo>
                <InfoText>
                  Курс обмена: 1 {CURRENCY_NAMES[fromCurrency]} = {getExchangeRate()} {CURRENCY_NAMES[toCurrency]}
                </InfoText>
                <InfoText>
                  Вы получите: {calculateExchangeAmount()} {CURRENCY_NAMES[toCurrency]}
                </InfoText>
                {!hasSufficientFunds() && (
                  <InfoText style={{ color: '#ff6b6b' }}>
                    Недостаточно средств! Доступно: {currency[fromCurrency] || 0}
                  </InfoText>
                )}
              </ExchangeInfo>
            )}
            
            <ExchangeButton
              onClick={handleExchange}
              disabled={isLoading || !hasSufficientFunds() || !isExchangeAllowed() || !amount || amount <= 0}
            >
              {isLoading ? 'Обмен...' : 'Обменять'}
            </ExchangeButton>
          </ExchangeForm>
        </ExchangePanel>
        
        <RatesPanel>
          <RatesTitle>Курсы обмена</RatesTitle>
          
          <RateItem>
            <RateText>1 Золото</RateText>
            <RateText>= 10 Серебра</RateText>
          </RateItem>
          
          <RateItem>
            <RateText>1 Серебро</RateText>
            <RateText>= 10 Меди</RateText>
          </RateItem>
          
          <RateItem>
            <RateText>1 Золото</RateText>
            <RateText>= 100 Меди</RateText>
          </RateItem>
          
          <RateItem>
            <RateText>1 Дух. камень</RateText>
            <RateText>= 10 Золота</RateText>
          </RateItem>
          
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(40, 40, 40, 0.6)', borderRadius: '6px' }}>
            <InfoText style={{ fontSize: '12px', color: '#888' }}>
              ⚠️ Духовные камни можно только тратить, конвертация в них невозможна
            </InfoText>
          </div>
        </RatesPanel>
      </Content>
    </Container>
  );
};

export default ExchangeTab;