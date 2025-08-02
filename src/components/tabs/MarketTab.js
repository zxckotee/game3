import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import styled, { keyframes, css } from 'styled-components';
import ACTION_TYPES from '../../context/actions/actionTypes';
import { getAllMerchants } from '../../data/merchants-adapter';
import { getEquipmentItemById } from '../../data/equipment-items-adapter';
import BonusService from '../../services/bonus-service';
import { ensureItemHasCalculatedBonuses } from '../../utils/equipmentBonusHelper';
import { calculateMerchantDiscount, applyLoyaltyDiscount } from '../../utils/sectRelationshipSyncer';
import CharacterProfileService from '../../services/character-profile-service-api';
import {
  updateMerchantItemQuantity,
  buyItemFromMerchant,
  sellItemToMerchant
} from '../../services/merchant-api';
import InventoryServiceAPI from '../../services/inventory-api.js';
import {
  translateRarity,
  translateItemType,
  getRarityColor,
  getCurrencyTypeByRarity
} from '../../utils/itemTranslations';

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
const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  color: #f0f0f0;
  animation: ${fadeIn} 0.6s ease-out;
`;

const TabHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const TabTitle = styled.h2`
  font-size: 24px;
  margin: 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const TabContent = styled.div`
  display: flex;
  flex: 1;
  gap: 20px;
`;

const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
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

const RightPanel = styled(LeftPanel)``;

const TabMenu = styled.div`
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #444;
`;

const TabButton = styled.button`
  background: ${props => props.active
    ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))'
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'};
  color: ${props => props.active ? '#d4af37' : '#aaa'};
  border: 1px solid ${props => props.active ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 8px 8px 0 0;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
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
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.1), rgba(244, 208, 63, 0.1));
    color: #d4af37;
    transform: translateY(-1px);
    
    &::before {
      left: 100%;
    }
  }
  
  ${props => props.active && css`
    border-bottom: 2px solid #d4af37;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(45deg, #d4af37, #f4d03f);
    }
  `}
`;

const ItemList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ItemCard = styled.div`
  display: flex;
  background: ${props => props.selected
    ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.05) 100%)'
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'};
  border: 1px solid ${props => props.selected ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
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
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.05) 0%, rgba(244, 208, 63, 0.02) 100%);
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
    
    &::before {
      left: 100%;
    }
  }
`;

const ItemIcon = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: bold;
  color: ${props => getRarityColor(props.rarity)};
`;

const ItemPrice = styled.div`
  color: ${props => {
    switch(props.currencyType) {
      case 'copper': return '#b87333';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'spiritStones': return '#7cb9e8';
      default: return '#ffd700';
    }
  }};
`;

const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const OriginalPrice = styled.div`
  color: #888;
  font-size: 12px;
  text-decoration: line-through;
  margin-bottom: 2px;
`;

const DiscountedPrice = styled.div`
  color: ${props => {
    switch(props.currencyType) {
      case 'copper': return '#b87333';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'spiritStones': return '#7cb9e8';
      default: return '#ffd700';
    }
  }};
  font-weight: bold;
`;

const DiscountBadge = styled.div`
  background: #e74c3c;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-top: 2px;
  font-weight: bold;
`;

const ItemDescription = styled.div`
  font-size: 14px;
  color: #aaa;
  margin-top: 5px;
`;

const ItemDetails = styled.div`
  padding: 20px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  margin-top: 20px;
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

const DetailTitle = styled.h3`
  margin: 0 0 16px 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.2rem;
  font-weight: bold;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  padding-bottom: 8px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
  }
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const DetailLabel = styled.div`
  color: #aaa;
`;

const DetailValue = styled.div`
  color: #fff;
`;

const ActionButton = styled.button`
  background: ${props => props.primary
    ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))'
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'};
  color: ${props => props.primary ? '#d4af37' : '#aaa'};
  border: 1px solid ${props => props.primary ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 8px;
  padding: 12px 20px;
  margin-top: 16px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
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
  
  &:hover:not(:disabled) {
    background: ${props => props.primary
      ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.3), rgba(244, 208, 63, 0.3))'
      : 'linear-gradient(145deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.05) 100%)'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    background: rgba(60, 60, 60, 0.3);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  margin-top: 15px;
`;

const QuantityButton = styled.button`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  color: #aaa;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
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
  
  &:hover:not(:disabled) {
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.05) 100%);
    border-color: rgba(212, 175, 55, 0.4);
    color: #d4af37;
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    background: rgba(60, 60, 60, 0.3);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
  }
`;

const QuantityInput = styled.input`
  background: rgba(30, 30, 30, 0.7);
  color: #fff;
  border: 1px solid #444;
  border-radius: 5px;
  width: 60px;
  height: 30px;
  margin: 0 10px;
  text-align: center;
  font-size: 16px;
`;

const SearchBar = styled.input`
  background: rgba(30, 30, 30, 0.7);
  color: #fff;
  border: 1px solid #444;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 16px;
  
  &::placeholder {
    color: #777;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const FilterSelect = styled.select`
  background: rgba(30, 30, 30, 0.7);
  color: #fff;
  border: 1px solid #444;
  border-radius: 5px;
  padding: 8px;
  font-size: 14px;
`;

const NoItemsMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #777;
  font-style: italic;
`;

/**
 * Компонент вкладки "Рынок"
 */
const MarketTab = () => {
  const { state, actions } = useGame();
  const { player, market, world } = state;
  
  // Состояние компонента
  const [activeTab, setActiveTab] = useState('market'); // market, sell, merchants
  // Отдельные состояния для каждой вкладки вместо одного общего selectedItem
  const [selectedMarketItem, setSelectedMarketItem] = useState(null);
  const [selectedSellItem, setSelectedSellItem] = useState(null);
  const [selectedMerchantItem, setSelectedMerchantItem] = useState(null);
  
  // Добавляем состояния для хранения ID выбранных товаров
  const [selectedMarketItemId, setSelectedMarketItemId] = useState(null);
  const [selectedSellItemId, setSelectedSellItemId] = useState(null);
  const [selectedMerchantItemId, setSelectedMerchantItemId] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  
  const formatEffectValue = (value) => {
    if (typeof value === 'number') {
      return Number(value.toFixed(2)).toString();
    }
    if (typeof value === 'object' && value !== null) {
      if (value.hasOwnProperty('value') && (typeof value.value === 'string' || typeof value.value === 'number')) {
        return value.value.toString();
      }
      console.warn('[MarketTab] formatEffectValue получил неожиданный объект:', value);
      return '[Объект]';
    }
    return value;
  };

  // Вспомогательная функция для получения текущего выбранного товара в зависимости от активной вкладки
  const getCurrentSelectedItem = () => {
    switch (activeTab) {
      case 'market':
        return selectedMarketItem;
      case 'sell':
        return selectedSellItem;
      case 'merchants':
        return selectedMerchantItem;
      default:
        return null;
    }
  };
  
  // Вспомогательная функция для обновления выбранного товара в активной вкладке
  const updateSelectedItemForCurrentTab = (item) => {
    switch (activeTab) {
      case 'market':
        setSelectedMarketItem(item);
        break;
      case 'sell':
        setSelectedSellItem(item);
        break;
      case 'merchants':
        setSelectedMerchantItem(item);
        break;
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [activeSellerFilter, setActiveSellerFilter] = useState('all'); // Фильтр по ID продавца (торговца)
  const [isLoading, setIsLoading] = useState(false); // Состояние загрузки данных
  const [loadError, setLoadError] = useState(null); // Ошибка загрузки
  
  // Создаем функцию для получения правильного ID пользователя
  const getUserId = () => {
    // Приоритет 1: ID из объекта player
    if (player?.id && player.id !== 1) {
      console.log(`Используем ID из player: ${player.id}`);
      return player.id;
    }
    
    // Приоритет 2: ID из объекта auth.user
    if (state?.auth?.user?.id && state.auth.user.id !== 1) {
      console.log(`Используем ID из auth.user: ${state.auth.user.id}`);
      return state.auth.user.id;
    }
    
    // Приоритет 3: ID из localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && storedUserId !== '1') {
      console.log(`Используем ID из localStorage: ${storedUserId}`);
      return storedUserId;
    }
    
    // Приоритет 4: ID из window.currentUser
    if (window.currentUser?.id && window.currentUser.id !== 1) {
      console.log(`Используем ID из window.currentUser: ${window.currentUser.id}`);
      return window.currentUser.id;
    }
    
    // Если ничего не найдено, используем дефолтное значение с предупреждением
    console.warn('Не удалось определить ID пользователя, используем дефолтный ID=1');
    return 1;
  };

  // Функция для получения уровня отношений с торговцем
  const getRelationshipLevel = (merchant) => {
    if (!merchant || merchant.reputation === null || merchant.reputation === undefined) {
      return 'neutral';
    }
    const reputationValue = merchant.reputation;
    if (reputationValue >= 80) return 'friendly';
    if (reputationValue <= 20) return 'hostile';
    return 'neutral';
  };

  const getRelationshipText = (merchant) => {
    const level = getRelationshipLevel(merchant);
    switch (level) {
      case 'friendly': return 'Дружелюбный';
      case 'hostile': return 'Враждебный';
      default: return 'Нейтральный';
    }
  };

  // Функция для получения изображения торговца из relationships
  const getMerchantImage = (merchantId) => {
    // Получаем relationships из состояния игрока
    const relationships = player?.social?.relationships || player?.relationships || [];
    
    // Ищем торговца по ID
    const relationship = Array.isArray(relationships)
      ? relationships.find(rel => rel.id === merchantId)
      : null;
    
    // Возвращаем изображение или fallback
    return relationship?.image || '/assets/images/npc/default_merchant.png';
  };

  const calculateReputationDiscount = (reputation) => {
    // Новая логика: скидка только при level >= 50, размер = level / 10 / 100
    if (reputation >= 50) {
      return Math.floor(reputation / 10) / 100; // level / 10, преобразованное в десятичную дробь
    }
    return 0;
  };

  // Создаем выделенную функцию обновления, которую можно вызывать из любого места
  const refreshMarketData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const userId = getUserId();
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      console.log(`Обновление данных о торговцах для пользователя ID: ${userId}`);
      
      const merchants = await getAllMerchants(userId);
      console.log('Получено торговцев:', merchants);
      
      const marketItems = [];
      
      merchants.forEach(merchant => {
        const reputationValue = (merchant.reputation !== null && merchant.reputation !== undefined) ? merchant.reputation : 0;
        const discount = merchant.discount || calculateReputationDiscount(reputationValue);

        if (merchant.items && merchant.items.length > 0) {
          merchant.items.forEach(item => {
            if (item.itemType === 'currency' || item.quantity === 0) {
              return;
            }
            
            const basePrice = item.basePrice || item.price || 100;
            const finalPrice = Math.round(basePrice * (1 - discount));
            
            const marketItem = {
              ...item,
              id: marketItems.length + 1,
              price: finalPrice,
              originalPrice: basePrice,
              discount: discount,
              sellerId: merchant.id,
              sellerName: merchant.name,
              reputation: reputationValue
            };
            
            if (item.itemType === 'pet_food') {
              if (item.nutritionValue !== undefined) {
                marketItem.nutritionValue = item.nutritionValue;
              }
              if (item.loyaltyBonus !== undefined) {
                marketItem.loyaltyBonus = item.loyaltyBonus;
              }
            }
            
            marketItems.push(marketItem);
          });
        }
      });
  
      actions.dispatch({
        type: ACTION_TYPES.UPDATE_MARKET_STATE,
        payload: {
          marketItems,
          merchants,
          lastUpdated: Date.now()
        }
      });

      // Загружаем и обновляем валюту
      if (CharacterProfileService && actions.dispatch) {
        try {
          const profile = await CharacterProfileService.getCharacterProfile(userId);
          if (profile && profile.currency) {
            actions.dispatch({
              type: ACTION_TYPES.UPDATE_CURRENCY,
              payload: profile.currency
            });
          }
        } catch (profileError) {
          console.error('[MarketTab] Ошибка при получении профиля для обновления валюты:', profileError);
        }
      }
      
    } catch (error) {
      console.error('Ошибка при обновлении данных о торговцах:', error);
      setLoadError(error);
      actions.dispatch({
        type: ACTION_TYPES.MARKET_DATA_FETCH_FAILED,
        payload: { error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const items = await InventoryServiceAPI.getInventoryItems(userId);
      if (actions.updateInventoryItems) {
        actions.updateInventoryItems(items);
      }

      const profile = await CharacterProfileService.getCharacterProfile(userId);
      if (profile && profile.currency) {
        actions.dispatch({
          type: ACTION_TYPES.UPDATE_CURRENCY,
          payload: profile.currency
        });
      }
    } catch (error) {
      console.error('Ошибка при обновлении инвентаря:', error);
    }
  }, [actions, getUserId]);

  useEffect(() => {
    refreshInventory();
  }, [state.auth?.user?.id]);
  
  // Эффект для первоначальной загрузки и при смене локации
  useEffect(() => {
    refreshMarketData();
  }, [refreshMarketData, state.world.currentLocation?.id]);
  
  // Обработчик выбора предмета
  const handleSelectItem = (item) => {
    if (selectedMarketItem?.id !== item.id) {
      setSelectedMarketItemId(item.id);
    }
    
    updateSelectedItemForCurrentTab(item);
    setQuantity(1);
    
    if (activeTab === 'sell') {
      const suitableMerchant = findSuitableMerchant(item);
      if (suitableMerchant) {
        setSelectedMerchant({
          id: suitableMerchant.id,
          name: suitableMerchant.name
        });
      } else {
        setSelectedMerchant(null);
      }
    }
  };
  
  // Функция для определения типа валюты по редкости (используем импортированную)
  // const getCurrencyTypeByRarity уже импортирована из utils/itemTranslations
  
  // Функция для форматирования цены
  const formatPrice = (price, rarity) => {
    const currencyType = getCurrencyTypeByRarity(rarity);
    switch(currencyType) {
      case 'spiritStones': return `${price} Камней духа`;
      case 'gold': return `${price} золота`;
      case 'silver': return `${price} серебра`;
      default: return `${price} меди`;
    }
  };

  // Функция для рендеринга цены со скидкой
  const renderPriceWithDiscount = (item) => {
    const currencyType = getCurrencyTypeByRarity(item.rarity);
    const hasDiscount = item.originalPrice && item.discount > 0 && item.price < item.originalPrice;
    
    return (
      <PriceContainer>
        {hasDiscount && (
          <OriginalPrice>{formatPrice(item.originalPrice, item.rarity)}</OriginalPrice>
        )}
        <DiscountedPrice currencyType={currencyType}>
          {formatPrice(item.price, item.rarity)}
        </DiscountedPrice>
        {hasDiscount && (
          <DiscountBadge>-{Math.round(item.discount * 100)}%</DiscountBadge>
        )}
      </PriceContainer>
    );
  };
  
  // Функция для получения цены предмета (для продажи)
  const getItemPrice = (item) => {
    const marketItem = market.marketItems.find(mi => mi.itemId === item.itemId);
    return marketItem ? marketItem.originalPrice : item.price;
  };
  
  // Функция для проверки, достаточно ли у игрока валюты
  const hasSufficientCurrency = (price, rarity) => {
    const currencyType = getCurrencyTypeByRarity(rarity);
    const currency = player.inventory.currency || {};
    
    switch(currencyType) {
      case 'spiritStones': return (currency.spiritStones || 0) >= price;
      case 'gold': return (currency.gold || 0) >= price;
      case 'silver': return (currency.silver || 0) >= price;
      default: return (currency.copper || 0) >= price;
    }
  };
  
  // Обработчик покупки предмета
  const handleBuyItem = async () => {
    const selectedItem = getCurrentSelectedItem();
    if (!selectedItem) return;
    
    if (!hasSufficientCurrency(selectedItem.price * quantity, selectedItem.rarity)) {
      actions.addNotification({ message: 'Недостаточно средств!', type: 'error' });
      return;
    }
    
    if (quantity > selectedItem.quantity) {
      actions.addNotification({ message: 'Нельзя купить больше, чем есть в наличии!', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userId = getUserId();
      
      const result = await buyItemFromMerchant(selectedItem.sellerId, selectedItem.itemId, userId, quantity);
      
      if (result.success) {
        actions.addNotification({ message: `Вы купили ${selectedItem.name} x${quantity}`, type: 'success' });
        
        const currencyType = getCurrencyTypeByRarity(selectedItem.rarity);
        const price = selectedItem.price * quantity;
        
        // Используем addCurrency для добавления отрицательного значения (списание)
        actions.addCurrency({ [currencyType]: -price });
        
        // Обновляем инвентарь с сервера, как это делает InventoryTab
        try {
          const updatedInventory = await InventoryServiceAPI.getInventoryItems(userId);
          if (updatedInventory && Array.isArray(updatedInventory)) {
            const finalItems = updatedInventory.map(item => ({
              ...item,
              enriched: true,
              enrichedFailed: false
            }));
            
            if (actions.updateInventoryItems) {
              actions.updateInventoryItems(finalItems);
              console.log('[MarketTab] Инвентарь обновлен после покупки:', finalItems.length, 'предметов');
            }
          }
        } catch (inventoryError) {
          console.error('[MarketTab] Ошибка при обновлении инвентаря после покупки:', inventoryError);
          // Fallback к старому методу, если обновление с сервера не удалось
          const itemToAdd = {
            ...selectedItem,
            id: result.inventoryItemId,
            quantity: quantity
          };
          
          actions.dispatch({
            type: ACTION_TYPES.ADD_ITEM_TO_INVENTORY,
            payload: itemToAdd
          });
        }
        
        refreshMarketData();
        updateSelectedItemForCurrentTab(null);
        
      } else {
        actions.addNotification({ message: result.message || 'Ошибка при покупке', type: 'error' });
      }
      
    } catch (error) {
      console.error('Ошибка при покупке предмета:', error);
      actions.addNotification({ message: 'Произошла ошибка на сервере', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик продажи предмета
  const handleSellItem = async () => {
    if (!selectedSellItem || !selectedMerchant) {
      actions.addNotification({ message: 'Выберите предмет и торговца для продажи', type: 'warning' });
      return;
    }
    
    const price = getItemPrice(selectedSellItem);
    if (!price) {
      actions.addNotification({ message: 'Этот предмет нельзя продать', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userId = getUserId();
      const sellPrice = Math.floor(price * 0.7) * quantity;
      
      const result = await sellItemToMerchant(selectedMerchant.id, selectedSellItem, userId, quantity);
      
      if (result.success) {
        actions.addNotification({ message: `Вы продали ${selectedSellItem.name} x${quantity}`, type: 'success' });
        
        const currencyType = getCurrencyTypeByRarity(selectedSellItem.rarity);
        
        // Используем addCurrency для добавления положительного значения (получение денег)
        actions.addCurrency({ [currencyType]: sellPrice });
        
        actions.dispatch({
          type: ACTION_TYPES.REMOVE_ITEM_FROM_INVENTORY,
          payload: { itemId: selectedSellItem.itemId, quantity: quantity }
        });
        
        refreshMarketData();
        refreshInventory();
        setSelectedSellItem(null);
        
      } else {
        actions.addNotification({ message: result.message || 'Ошибка при продаже', type: 'error' });
      }
      
    } catch (error) {
      console.error('Ошибка при продаже предмета:', error);
      actions.addNotification({ message: 'Произошла ошибка на сервере', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Функция для поиска подходящего торговца
  const findSuitableMerchant = (item) => {
    return market.merchants && market.merchants.length > 0 ? market.merchants[0] : null;
  };
  
  // Функция для получения эмодзи предмета
  const getItemEmoji = (item) => {
    switch(item.itemType) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'accessory': return '💍';
      case 'consumable': return '🧪';
      case 'pet_food': return '🍖';
      default: return '📦';
    }
  };
  
  // Фильтрация и поиск
  const filteredMarketItems = market.marketItems
    .filter(item => {
      const sellerMatch = activeSellerFilter === 'all' || item.sellerId == activeSellerFilter;
      const searchMatch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = itemTypeFilter === 'all' || item.itemType === itemTypeFilter;
      const rarityMatch = rarityFilter === 'all' || item.rarity === rarityFilter;
      return sellerMatch && searchMatch && typeMatch && rarityMatch;
    });
    
  const filteredSellItems = player.inventory.items
    .filter(item => item.itemType !== 'currency');
    
  const selectedItem = getCurrentSelectedItem();

  return (
    <TabContainer>
      <TabHeader>
        <TabTitle>Рынок</TabTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {player.inventory.currency && Object.entries(player.inventory.currency).map(([type, value]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                marginRight: '5px',
                background: {
                  'copper': '#b87333',
                  'silver': '#c0c0c0',
                  'gold': '#ffd700',
                  'spiritStones': '#7cb9e8'
                }[type] || '#ccc'
              }} />
              <span style={{ color: '#fff' }}>{value}</span>
            </div>
          ))}
        </div>
      </TabHeader>
      
      <TabMenu>
        <TabButton active={activeTab === 'market'} onClick={() => setActiveTab('market')}>Товары</TabButton>
        <TabButton active={activeTab === 'sell'} onClick={() => setActiveTab('sell')}>Продать</TabButton>
        <TabButton active={activeTab === 'merchants'} onClick={() => setActiveTab('merchants')}>Торговцы</TabButton>
      </TabMenu>

      <TabContent>
        {activeTab === 'market' && (
          <>
            <LeftPanel>
              <SearchBar 
                placeholder="Поиск предметов..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FilterContainer>
                <FilterSelect value={itemTypeFilter} onChange={(e) => setItemTypeFilter(e.target.value)}>
                  <option value="all">Все типы</option>
                  <option value="weapon">Оружие</option>
                  <option value="armor">Броня</option>
                  <option value="accessory">Аксессуары</option>
                  <option value="talisman">Талисманы</option>
                  <option value="consumable">Расходники</option>
                  <option value="resource">Ресурсы</option>
                  <option value="book">Книги</option>
                  <option value="pet_food">Еда для питомцев</option>
                </FilterSelect>
                <FilterSelect value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
                  <option value="all">Вся редкость</option>
                  <option value="common">Обычная</option>
                  <option value="uncommon">Необычная</option>
                  <option value="rare">Редкая</option>
                  <option value="epic">Эпическая</option>
                  <option value="legendary">Легендарная</option>
                </FilterSelect>
                <FilterSelect value={activeSellerFilter} onChange={(e) => setActiveSellerFilter(e.target.value)}>
                  <option value="all">Все торговцы</option>
                  {market.merchants && market.merchants.map(merchant => (
                    <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
                  ))}
                </FilterSelect>
              </FilterContainer>
              
              <ItemList>
                {isLoading ? (
                  <NoItemsMessage>Загрузка...</NoItemsMessage>
                ) : filteredMarketItems.length > 0 ? (
                  filteredMarketItems.map(item => (
                    <ItemCard
                      key={item.id}
                      selected={selectedMarketItem && selectedMarketItem.id === item.id}
                      onClick={() => handleSelectItem(item)}
                    >
                      <ItemIcon>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} />
                        ) : (
                          getItemEmoji(item)
                        )}
                      </ItemIcon>
                      <ItemInfo>
                        <ItemName rarity={item.rarity}>{item.name}</ItemName>
                        {renderPriceWithDiscount(item)}
                      </ItemInfo>
                    </ItemCard>
                  ))
                ) : (
                  <NoItemsMessage>Ничего не найдено</NoItemsMessage>
                )}
              </ItemList>
            </LeftPanel>
            
            <RightPanel>
              {selectedMarketItem ? (
                <>
                  <DetailTitle>{selectedMarketItem.name}</DetailTitle>
                  <ItemDescription>{selectedMarketItem.description}</ItemDescription>
                  
                  <DetailRow>
                    <DetailLabel>Редкость:</DetailLabel>
                    <DetailValue>{translateRarity(selectedMarketItem.rarity)}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Цена:</DetailLabel>
                    <DetailValue>{formatPrice(selectedMarketItem.price, selectedMarketItem.rarity)}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Продавец:</DetailLabel>
                    <DetailValue>{selectedMarketItem.sellerName}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>В наличии:</DetailLabel>
                    <DetailValue>{selectedMarketItem.quantity}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Репутация:</DetailLabel>
                    <DetailValue>{selectedMarketItem.reputation}</DetailValue>
                  </DetailRow>
                   <DetailRow>
                    <DetailLabel>Скидка:</DetailLabel>
                    <DetailValue>{Math.round(selectedMarketItem.discount * 100)}%</DetailValue>
                  </DetailRow>
                  
                  <QuantityControl>
                    <QuantityButton 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                    >-</QuantityButton>
                    <QuantityInput 
                      type="number"
                      min="1"
                      max={selectedMarketItem.quantity}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0 && val <= selectedMarketItem.quantity) {
                          setQuantity(val);
                        }
                      }}
                    />
                    <QuantityButton 
                      onClick={() => setQuantity(prev => Math.min(selectedMarketItem.quantity, prev + 1))}
                      disabled={quantity >= selectedMarketItem.quantity}
                    >+</QuantityButton>
                  </QuantityControl>
                  
                  <ActionButton
                    primary
                    onClick={handleBuyItem}
                    disabled={!hasSufficientCurrency(selectedMarketItem.price * quantity, selectedMarketItem.rarity)}
                  >
                    Купить за {formatPrice(selectedMarketItem.price * quantity, selectedMarketItem.rarity)}
                  </ActionButton>
                </>
              ) : (
                <NoItemsMessage>Выберите товар для просмотра деталей</NoItemsMessage>
              )}
            </RightPanel>
          </>
        )}
        
        {activeTab === 'sell' && (
          <>
            <LeftPanel>
              <ItemList>
                {filteredSellItems.length > 0 ? (
                  filteredSellItems.map(item => (
                    <ItemCard
                      key={item.id}
                      selected={selectedSellItem && selectedSellItem.id === item.id}
                      onClick={() => handleSelectItem(item)}
                    >
                      <ItemIcon>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} />
                        ) : (
                          getItemEmoji(item)
                        )}
                      </ItemIcon>
                      <ItemInfo>
                        <ItemName rarity={item.rarity}>{item.name}</ItemName>
                        <div>x{item.quantity || 1}</div>
                      </ItemInfo>
                    </ItemCard>
                  ))
                ) : (
                  <NoItemsMessage>В инвентаре ничего нет</NoItemsMessage>
                )}
              </ItemList>
            </LeftPanel>
            
            <RightPanel>
              {selectedSellItem ? (
                <>
                  <DetailTitle>{selectedSellItem.name}</DetailTitle>
                  <ItemDescription>{selectedSellItem.description}</ItemDescription>
                  
                  <ItemDetails>
                    <DetailRow>
                      <DetailLabel>Тип:</DetailLabel>
                      <DetailValue>{translateItemType(selectedSellItem.type)}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Редкость:</DetailLabel>
                      <DetailValue>{translateRarity(selectedSellItem.rarity)}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Цена продажи:</DetailLabel>
                      <DetailValue>
                        {getItemPrice(selectedSellItem)
                          ? formatPrice(Math.floor(getItemPrice(selectedSellItem) * 0.7), selectedSellItem.rarity)
                          : "Нельзя продать"}
                      </DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Количество:</DetailLabel>
                      <DetailValue>{selectedSellItem.quantity || 1}</DetailValue>
                    </DetailRow>
                  </ItemDetails>
                  
                  <QuantityControl>
                    <QuantityButton 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                    >-</QuantityButton>
                    <QuantityInput 
                      type="number"
                      min="1"
                      max={selectedSellItem.quantity || 1}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0 && val <= (selectedSellItem.quantity || 1)) {
                          setQuantity(val);
                        }
                      }}
                    />
                    <QuantityButton 
                      onClick={() => setQuantity(prev => Math.min(selectedSellItem.quantity || 1, prev + 1))}
                      disabled={quantity >= (selectedSellItem.quantity || 1)}
                    >+</QuantityButton>
                  </QuantityControl>
                  
                  <ActionButton
                    primary
                    onClick={handleSellItem}
                    disabled={!getItemPrice(selectedSellItem) || !selectedMerchant}
                  >
                    {getItemPrice(selectedSellItem) && selectedMerchant ?
                      `Продать за ${formatPrice(Math.floor(getItemPrice(selectedSellItem) * 0.7) * quantity, selectedSellItem.rarity)}` :
                      "Нельзя продать"}
                  </ActionButton>
                </>
              ) : (
                <NoItemsMessage>Выберите предмет для продажи</NoItemsMessage>
              )}
            </RightPanel>
          </>
        )}
        
        {activeTab === 'merchants' && (
          <>
            <LeftPanel>
              <SearchBar 
                placeholder="Поиск торговцев..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <ItemList>
                {market?.merchants && market.merchants
                  .filter(merchant => searchQuery ? merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                  .map(merchant => (
                    <ItemCard 
                      key={merchant.id}
                      selected={selectedMerchantItem && selectedMerchantItem.id === merchant.id}
                      onClick={() => {
                        setSelectedMerchantItem(merchant);
                        setSelectedMerchantItemId(merchant.id);
                      }}
                    >
                      <ItemIcon>
                        {getMerchantImage(merchant.id) ? (
                          <img src={getMerchantImage(merchant.id)} alt={merchant.name} />
                        ) : (
                          '🧙'
                        )}
                      </ItemIcon>
                      <ItemInfo>
                        <ItemName>{merchant.name}</ItemName>
                        <div>Отношения: {getRelationshipText(merchant)}</div>
                      </ItemInfo>
                    </ItemCard>
                  ))}
              </ItemList>
            </LeftPanel>
            
            <RightPanel>
              {selectedMerchantItem ? (
                <>
                  <DetailTitle>{selectedMerchantItem.name}</DetailTitle>
                  <ItemDescription>{selectedMerchantItem.description}</ItemDescription>
                  <ItemDetails>
                    <DetailRow>
                      <DetailLabel>Репутация:</DetailLabel>
                      <DetailValue>{selectedMerchantItem.reputation !== null && selectedMerchantItem.reputation !== undefined ? selectedMerchantItem.reputation : 'N/A'}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Скидка:</DetailLabel>
                      <DetailValue>{selectedMerchantItem.discount !== null && selectedMerchantItem.discount !== undefined ? `${(selectedMerchantItem.discount * 100).toFixed(1)}%` : 'N/A'}</DetailValue>
                    </DetailRow>
                     <DetailRow>
                      <DetailLabel>Специализация:</DetailLabel>
                      <DetailValue>{selectedMerchantItem.specialization}</DetailValue>
                    </DetailRow>
                     <DetailRow>
                      <DetailLabel>Локация:</DetailLabel>
                      <DetailValue>{selectedMerchantItem.location}</DetailValue>
                    </DetailRow>
                  </ItemDetails>
                  <ActionButton
                    primary
                    onClick={() => {
                      setActiveSellerFilter(selectedMerchantItem.id);
                      setActiveTab('market');
                    }}
                  >
                    Показать товары
                  </ActionButton>
                </>
              ) : (
                <NoItemsMessage>Выберите торговца</NoItemsMessage>
              )}
            </RightPanel>
          </>
        )}
      </TabContent>
    </TabContainer>
  );
};

export default MarketTab;
