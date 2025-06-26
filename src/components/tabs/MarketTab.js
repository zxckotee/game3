import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import styled from 'styled-components';
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

// Стилизованные компоненты
const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  color: #f0f0f0;
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
  color: #ffd700;
`;

const TabContent = styled.div`
  display: flex;
  flex: 1;
  gap: 20px;
`;

const LeftPanel = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const TabMenu = styled.div`
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #444;
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'rgba(255, 215, 0, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#ffd700' : '#ccc'};
  border: none;
  padding: 10px 15px;
  font-size: 16px;
  cursor: pointer;
  border-bottom: ${props => props.active ? '2px solid #ffd700' : 'none'};
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
  }
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
  background: ${props => props.selected ? 'rgba(255, 215, 0, 0.1)' : 'rgba(30, 30, 30, 0.7)'};
  border: 1px solid ${props => props.selected ? '#ffd700' : '#444'};
  border-radius: 5px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 215, 0, 0.05);
    border-color: #ffd700;
  }
`;

const ItemIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #333;
  border-radius: 5px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: bold;
  color: ${props => {
    switch(props.rarity) {
      case 'common': return '#aaa';
      case 'uncommon': return '#1eff00';
      case 'rare': return '#0070dd';
      case 'epic': return '#a335ee';
      case 'legendary': return '#ff8000';
      default: return '#aaa';
    }
  }};
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

const ItemDescription = styled.div`
  font-size: 14px;
  color: #aaa;
  margin-top: 5px;
`;

const ItemDetails = styled.div`
  padding: 15px;
  background: rgba(30, 30, 30, 0.7);
  border-radius: 5px;
  margin-top: 15px;
`;

const DetailTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #ffd700;
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
  background: ${props => props.primary ? 'rgba(255, 215, 0, 0.2)' : 'rgba(80, 80, 80, 0.3)'};
  color: ${props => props.primary ? '#ffd700' : '#ccc'};
  border: 1px solid ${props => props.primary ? '#ffd700' : '#444'};
  border-radius: 5px;
  padding: 10px 15px;
  margin-top: 15px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: ${props => props.primary ? 'rgba(255, 215, 0, 0.3)' : 'rgba(80, 80, 80, 0.5)'};
  }
  
  &:disabled {
    background: rgba(50, 50, 50, 0.3);
    color: #666;
    border-color: #333;
    cursor: not-allowed;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  margin-top: 15px;
`;

const QuantityButton = styled.button`
  background: rgba(80, 80, 80, 0.3);
  color: #ccc;
  border: 1px solid #444;
  border-radius: 5px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  
  &:hover {
    background: rgba(80, 80, 80, 0.5);
  }
  
  &:disabled {
    background: rgba(50, 50, 50, 0.3);
    color: #666;
    border-color: #333;
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

const CurrencyDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-left: auto;
`;

const CurrencyItem = styled.div`
  display: flex;
  align-items: center;
`;

const CurrencyIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 5px;
  background: ${props => {
    switch(props.type) {
      case 'copper': return '#b87333';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'spiritStone': return '#7cb9e8';
      default: return '#ccc';
    }
  }};
`;

const CurrencyValue = styled.span`
  color: #fff;
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
  const [activeSellerFilter, setActiveSellerFilter] = useState(null); // Фильтр по ID продавца (торговца)
  const [isLoading, setIsLoading] = useState(false); // Состояние загрузки данных
  const [loadError, setLoadError] = useState(null); // Ошибка загрузки
  const [lastUpdateTime, setLastUpdateTime] = useState(0); // Время последнего обновления данных
  
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
  // Создаем выделенную функцию обновления, которую можно вызывать из любого места
  const refreshMarketData = useCallback(async (force = false) => {
    // Проверка, не было ли обновление данных слишком недавно (минимальный интервал 5 секунд)
    const now = Date.now();
    if (!force && now - lastUpdateTime < 5000) {
      console.log('Пропускаем обновление - прошло менее 5 секунд с последнего запроса');
      return;
    }
    
    // Обновляем время последнего запроса
    setLastUpdateTime(now);
    
    // Обновляем состояние загрузки
    setIsLoading(true);
    setLoadError(null);
    
    
    try {
      // Получаем ID текущего пользователя с помощью улучшенной функции
      const userId = getUserId();
      
      // Сохраняем ID для будущего использования, если он не дефолтный
      if (userId !== 1) {
        localStorage.setItem('userId', userId);
        
        // Обновляем window.currentUser для будущих запросов
        window.currentUser = window.currentUser || {};
        window.currentUser.id = userId;
      }
      
      console.log(`Обновление данных о торговцах для пользователя ID: ${userId}`);
      
      // Асинхронно получаем данные о торговцах, включая их инвентарь
      const merchants = await getAllMerchants(userId);
      console.log('Получено торговцев:', merchants);
      
      // Преобразуем данные о предметах торговцев в формат для отображения на рынке
      const marketItems = [];
      
      // Обрабатываем инвентарь каждого торговца
      merchants.forEach(merchant => {
        // Получаем уровень отношений с этим торговцем для скидок
        const relationshipLevel = getRelationshipLevel(merchant.id);
        
        // Проверяем наличие предметов у торговца
        if (merchant.items && merchant.items.length > 0) {
          merchant.items.forEach(item => {
            // Пропускаем предметы типа "currency"
            if (item.itemType === 'currency') {
              return;
            }
            
            // Применяем скидку на основе отношений
            const basePrice = item.basePrice || item.price || 100;
            const discount = calculateMerchantDiscount(relationshipLevel);
            const finalPrice = Math.round(applyLoyaltyDiscount(basePrice, relationshipLevel).finalPrice);
            
            // Создаем объект предмета для отображения
            const marketItem = {
              id: marketItems.length + 1,
              itemId: item.itemId,
              itemType: item.itemType,
              name: item.name || `Предмет ${item.itemId}`,
              description: item.description || `Описание предмета ${item.itemId}`,
              rarity: item.rarity || 'common',
              quantity: item.quantity < 0 ? 10 : item.quantity,
              price: finalPrice,
              originalPrice: basePrice,
              discount: discount,
              sellerId: merchant.id,
              sellerName: merchant.name,
              maxQuantity: item.maxQuantity || item.max_quantity || 10,
              restockRate: item.restockRate || item.restock_rate || 1,
              lastRestockTime: item.lastRestockTime || item.last_restock_time || 0
            };
            
            // Копируем специфические свойства предмета
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
  
      // Обновляем Redux состояние
      actions.dispatch({
        type: ACTION_TYPES.UPDATE_MARKET_STATE,
        payload: {
          marketItems,
          merchants,
          isLoading: false,
          lastUpdated: new Date().toISOString() // Добавляем timestamp обновления
        }
      });
    } catch (error) {
      console.error('Ошибка при загрузке данных о торговцах:', error);
      setLoadError('Не удалось загрузить данные рынка. Пожалуйста, попробуйте позже.');
      
      actions.dispatch({
        type: ACTION_TYPES.UPDATE_MARKET_STATE,
        payload: { error: 'Ошибка загрузки данных', isLoading: false }
      });
    } finally {
      setIsLoading(false);
    }
  }, [player?.id, state?.auth?.user?.id, actions, lastUpdateTime, setLastUpdateTime]);

  // Оптимизированная загрузка данных рынка - для вкладок "Товары" и "Продажа"
  
  useEffect(() => {
    if (activeTab === 'market' || activeTab === 'sell') {
      if (!market?.marketItems || market.marketItems.length === 0 || !market.lastUpdated) {
        console.log('Первичная загрузка данных рынка для вкладки:', activeTab);
        refreshMarketData(true);
      } else {
        const lastUpdate = new Date(market.lastUpdated);
        const now = new Date();
        const diffInMinutes = (now - lastUpdate) / (1000 * 60);
        
        if (diffInMinutes > 5) {
          console.log('Данные устарели, обновляем');
          refreshMarketData(true);
        } else {
          console.log('Используем кэшированные данные рынка');
        }
      }
    }
  }, [activeTab, market?.marketItems, market?.lastUpdated, refreshMarketData]);
  
  // Сброс выбранного предмета при изменении фильтров в вкладке "Товары"
  useEffect(() => {
    if (activeTab === 'market') {
      setSelectedMarketItem(null);
      setSelectedMarketItemId(null);
    }
  }, [itemTypeFilter, rarityFilter, activeSellerFilter, searchQuery, activeTab === 'market']);
  
  // Сброс выбранного предмета при изменении фильтров в вкладке "Продажа"
  useEffect(() => {
    if (activeTab === 'sell') {
      setSelectedSellItem(null);
      setSelectedSellItemId(null);
    }
  }, [itemTypeFilter, rarityFilter, searchQuery, activeTab === 'sell']);
  
  // Восстановление выбранного предмета вкладки "Товары" после обновления данных
  useEffect(() => {
    if (market?.marketItems && selectedMarketItemId) {
      const item = market.marketItems.find(item => item.id === selectedMarketItemId);
      if (item) {
        setSelectedMarketItem(item);
      }
    }
  }, [market?.marketItems, selectedMarketItemId]);
  
  // Восстановление выбранного предмета вкладки "Продать"
  useEffect(() => {
    if (player?.inventory?.items && selectedSellItemId) {
      const item = player.inventory.items.find(item => item.id === selectedSellItemId);
      if (item) {
        setSelectedSellItem(item);
      }
    }
  }, [player?.inventory?.items, selectedSellItemId]);
  
  // Восстановление выбранного торговца после обновления данных
  useEffect(() => {
    if (market?.merchants && selectedMerchantItemId) {
      const merchant = market.merchants.find(m => m.id === selectedMerchantItemId);
      if (merchant) {
        setSelectedMerchantItem({
          id: merchant.id,
          name: merchant.name
        });
      }
    }
  }, [market?.merchants, selectedMerchantItemId]);
  
  // Фильтрация предметов
  const filteredItems = React.useMemo(() => {
    if (!market || !market.marketItems) {
      return [];
    }
    
    const filtered = market.marketItems.filter(item => {
      // Фильтр по количеству - скрываем товары с количеством 0
      if (item.quantity <= 0) {
        return false;
      }
      
      // Фильтр по поисковому запросу
      const matchesSearch = searchQuery === '' || 
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Фильтр по типу предмета
      const matchesType = itemTypeFilter === 'all' || (item.itemType && item.itemType === itemTypeFilter);
      
      // Фильтр по редкости
      const matchesRarity = rarityFilter === 'all' || (item.rarity && item.rarity === rarityFilter);
      
      // Фильтр по продавцу (торговцу) - приводим к числовому типу для корректного сравнения
      const itemSellerId = Number(item.sellerId);
      const filterSellerId = Number(activeSellerFilter);
      const matchesSeller = activeSellerFilter === null || 
                           (item.sellerId !== undefined && itemSellerId === filterSellerId);
      
      return matchesSearch && matchesType && matchesRarity && matchesSeller;
    });
    
    return filtered;
  }, [market?.marketItems, searchQuery, itemTypeFilter, rarityFilter, activeSellerFilter]);
  
  // Получение уровня отношений с торговцем
  const getRelationshipLevel = (merchantId) => {
    // Извлекаем отношения из социальной структуры игрока
    let playerRelationships = state?.player?.social?.relationships || [];
    
    // Убедимся, что playerRelationships - это массив
    if (!Array.isArray(playerRelationships)) {
      console.warn('Отношения не являются массивом, преобразуем их:', playerRelationships);
      playerRelationships = typeof playerRelationships === 'object' && playerRelationships !== null
        ? Object.values(playerRelationships)
        : [];
    }
    
    // Ищем торговца в кэшированных данных
    const cachedMerchants = market?.merchants || [];
    const merchantData = cachedMerchants.find(m => m.id === merchantId);
    if (!merchantData) {
      return 0;
    }
    
    // Проверяем отношения в социальной структуре по имени торговца
    const socialRelation = playerRelationships.find(rel => rel.name === merchantData.name);
    if (socialRelation && socialRelation.level !== undefined) {
      return socialRelation.level;
    }
    
    // Проверяем через связь с сектой
    if (merchantData.sect && state?.sect?.sect) {
      const sectName = state.sect.sect.name;
      if (merchantData.sect === sectName) {
        // Сначала проверяем, является ли торговец членом секты
        if (state.sect.sect.members && Array.isArray(state.sect.sect.members)) {
          const sectMember = state.sect.sect.members.find(m => m.name === merchantData.name);
          if (sectMember && sectMember.loyalty !== undefined) {
            return sectMember.loyalty;
          }
        }
        
        // Если торговец не найден среди членов секты, но связан с ней
        const sectRelation = playerRelationships.find(rel => rel.name === sectName);
        if (sectRelation && sectRelation.level !== undefined) {
          return sectRelation.level;
        }
      }
    }
    
    return 0;
  };
  
  // Функция для определения типа валюты по редкости
  const getCurrencyTypeByRarity = (rarity) => {
    switch(rarity) {
      case 'common': return 'copper';
      case 'uncommon': return 'silver';
      case 'rare': return 'gold';
      case 'epic': return 'gold+spiritStones';
      case 'legendary': return 'spiritStones';
      default: return 'gold';
    }
  };
  
  // Форматирование отображения цены в зависимости от типа валюты
  const formatPrice = (price, rarity) => {
    const currencyType = getCurrencyTypeByRarity(rarity);
    
    switch(currencyType) {
      case 'copper':
        return `${price} меди`;
      case 'silver':
        return `${price} серебра`;
      case 'gold':
        return `${price} золота`;
      case 'gold+spiritStones':
        return `${Math.floor(price * 0.7)} золота + ${Math.ceil(price * 0.3 / 100)} дух. камней`;
      case 'spiritStones':
        return `${Math.ceil(price / 100)} дух. камней`;
      default:
        return `${price} золота`;
    }
  };
  
  // Функция для получения цены предмета из marketItems
  const getItemPrice = (item) => {
    if (!market?.marketItems || !item) return null;
    
    // Поиск по ID (приоритетный способ)
    const marketItem = market.marketItems.find(marketItem =>
      marketItem.itemId === item.id
    );
    
    if (marketItem) {
      return marketItem.price;
    }
    
    // Если не найдено по ID, ищем по имени, типу и редкости
    const fallbackItem = market.marketItems.find(marketItem =>
      marketItem.name === item.name &&
      marketItem.itemType === item.type &&
      marketItem.rarity === item.rarity
    );
    
    if (fallbackItem) {
      return fallbackItem.price;
    }
    
    return null;
  };
  
  // Проверка достаточности валюты для покупки
  const hasSufficientCurrency = (price, rarity) => {
    const currencyType = getCurrencyTypeByRarity(rarity);
    const totalPrice = price * quantity;
    
    switch(currencyType) {
      case 'copper':
        return (player.inventory.currency.copper || 0) >= totalPrice;
      case 'silver':
        return (player.inventory.currency.silver || 0) >= totalPrice;
      case 'gold':
        return (player.inventory.currency.gold || 0) >= totalPrice;
      case 'gold+spiritStones': {
        const goldCost = Math.floor(totalPrice * 0.7);
        const spiritStonesCost = Math.ceil(totalPrice * 0.3 / 100);
        return (player.inventory.currency.gold || 0) >= goldCost && 
               (player.inventory.currency.spiritStones || 0) >= spiritStonesCost;
      }
      case 'spiritStones':
        return (player.inventory.currency.spiritStones || 0) >= Math.ceil(totalPrice / 100);
      default:
        return (player.inventory.currency.gold || 0) >= totalPrice;
    }
  };
  
  // Обработчик покупки предмета
  const handleBuyItem = async () => {
    if (!selectedMarketItem) return;
    
    // Получаем тип валюты в зависимости от редкости
    const currencyType = getCurrencyTypeByRarity(selectedMarketItem.rarity);
    const totalPrice = selectedMarketItem.price * quantity;
    
    // Проверка наличия достаточного количества валюты
    if (!hasSufficientCurrency(selectedMarketItem.price, selectedMarketItem.rarity)) {
      alert(`Недостаточно ${
        currencyType === 'copper' ? 'меди' :
        currencyType === 'silver' ? 'серебра' :
        currencyType === 'gold' ? 'золота' :
        currencyType === 'gold+spiritStones' ? 'золота или духовных камней' :
        'духовных камней'
      } для покупки`);
      return;
    }
    
    // Проверяем, достаточно ли товаров у торговца
    if (selectedMarketItem.quantity < quantity) {
      alert(`У торговца недостаточно товаров. Доступно: ${selectedMarketItem.quantity}`);
      return;
    }
    
    // Отладочный вывод для отслеживания валюты до покупки
    console.log('Валюта до покупки:', player.inventory.currency);
    
    // Создаем объект для обновления валюты с отрицательными значениями
    // Эти значения будут добавлены к текущей валюте (вычтены, т.к. отрицательные)
    const currencyUpdate = {};
    
    // Вычисляем изменения валюты в зависимости от типа
    switch(currencyType) {
      case 'copper':
        currencyUpdate.copper = -totalPrice; // Просто отрицательное значение для вычитания
        break;
      case 'silver':
        currencyUpdate.silver = -totalPrice; // Просто отрицательное значение для вычитания
        break;
      case 'gold':
        currencyUpdate.gold = -totalPrice; // Просто отрицательное значение для вычитания
        break;
      case 'gold+spiritStones': {
        const goldCost = Math.floor(totalPrice * 0.7);
        const spiritStonesCost = Math.ceil(totalPrice * 0.3 / 100);
        currencyUpdate.gold = -goldCost; // Отрицательное значение для вычитания
        currencyUpdate.spiritStones = -spiritStonesCost; // Отрицательное значение для вычитания
        break;
      }
      case 'spiritStones':
        currencyUpdate.spiritStones = -Math.ceil(totalPrice / 100); // Отрицательное значение для вычитания
        break;
    }
    
    // Вывод сообщения о покупке
    alert(`Покупка ${quantity} шт. предмета "${selectedMarketItem.name}" за ${formatPrice(totalPrice, selectedMarketItem.rarity)}`);
    
    try {
      // Получаем корректный ID пользователя
      const userId = getUserId();
      
      // Сохраняем ID для будущего использования, если он не дефолтный
      if (userId !== 1) {
        localStorage.setItem('userId', userId);
        window.currentUser = window.currentUser || {};
        window.currentUser.id = userId;
      }
      
      // Используем строковый идентификатор предмета (item_id)
      const itemId = selectedMarketItem.item_id || selectedMarketItem.itemId || selectedMarketItem.id;
      const sellerId = selectedMarketItem.sellerId;
      
      console.log('Отправляем запрос на покупку товара с параметрами:', {
        sellerId,
        itemId,
        userId,
        quantity
      });
      
      if (!itemId || !sellerId) {
        console.error('Ошибка: отсутствует идентификатор предмета или sellerId в selectedItem:', selectedMarketItem);
        return;
      }
      
      // Вызываем новый API-метод для покупки товара с обновлением инвентаря в БД
      const result = await buyItemFromMerchant(
        sellerId,
        itemId,
        userId,
        quantity
      );
      
      if (result.success) {
        console.log('Покупка успешно завершена:', result);
        
        // Создаем объект для добавления в инвентарь Redux
        const itemToAdd = {
          id: selectedMarketItem.itemId, // itemId должен быть строковым идентификатором типа 'jade_pendant'
          type: selectedMarketItem.itemType,
          name: selectedMarketItem.name,
          description: selectedMarketItem.description,
          quality: selectedMarketItem.rarity, // Используем rarity из БД как quality в Redux
          price: selectedMarketItem.price,
          quantity: quantity // Указываем количество покупаемых предметов
        };
        
        // Для обратной совместимости с кодом, ожидающим поле rarity
        if (!itemToAdd.rarity) {
          itemToAdd.rarity = selectedMarketItem.rarity;
        }
        
        // Для товаров для питомцев, добавляем специфические свойства
        if (selectedMarketItem.itemType === 'pet_food') {
          // Копируем все свойства, которые могут быть полезны для кормления питомцев
          if (selectedMarketItem.nutritionValue !== undefined) {
            itemToAdd.nutritionValue = selectedMarketItem.nutritionValue;
          }
          if (selectedMarketItem.loyaltyBonus !== undefined) {
            itemToAdd.loyaltyBonus = selectedMarketItem.loyaltyBonus;
          }
          // Добавляем другие возможные свойства питомцев
          if (selectedMarketItem.statBonus) {
            itemToAdd.statBonus = selectedMarketItem.statBonus;
          }
          if (selectedMarketItem.preferredTypes) {
            itemToAdd.preferredTypes = selectedMarketItem.preferredTypes;
          }
        }
        // Обновляем Redux-состояние
        actions.addItem(itemToAdd);
        actions.updateCurrency(currencyUpdate, true);
        
        // Отправляем специальное действие для покупки на рынке через dispatch напрямую
        const action = {
          type: ACTION_TYPES.BUY_MARKET_ITEM,
          payload: {
            item: itemToAdd,
            quantity,
            merchant: selectedMerchant
          }
        };
        
        // Используем dispatchEvent для отправки действия через DOM-события
        // Это позволит middleware отловить и обработать действие
        const customEvent = new CustomEvent('redux-action', {
          detail: action,
          bubbles: true
        });
        document.dispatchEvent(customEvent);
        
        // Отправляем текущие отношения на сервер после покупки
        try {
          const relationships = state.player.social?.relationships || [];
          await CharacterProfileService.updateRelationships(userId, relationships);
          console.log('Отношения обновлены на сервере после покупки товара');
        } catch (error) {
          console.error('Ошибка при обновлении отношений после покупки:', error);
        }
        
        
        // Запрашиваем обновление данных рынка
        refreshMarketData(true);
        
        console.log('Локальное состояние обновлено, данные рынка обновлены');
      } else {
        console.error('Ошибка при покупке предмета:', result.message);
        alert(`Ошибка при покупке: ${result.message}`);
      }
    } catch (error) {
      console.error('Ошибка при покупке предмета:', error);
      alert('Произошла ошибка при покупке. Пожалуйста, попробуйте еще раз.');
    }
    
    setSelectedMarketItem(null);
    setSelectedMarketItemId(null);
    setQuantity(1);
  };
  
  // Обработчик продажи предмета
  const handleSellItem = async () => {
    if (!selectedSellItem) return;
    
    // Логирование для диагностики
    console.log('Продажа товара. Состояние:', {
      selectedItem: selectedSellItem,
      selectedMerchant,
      quantity,
      userId: getUserId()
    });
    
    // Дополнительная проверка: если торговец не выбран, но есть данные рынка, пробуем найти подходящего
    if (!selectedMerchant && market?.marketItems?.length > 0) {
      // Выводим информацию о предмете игрока для отладки
      console.log(`Попытка автоматического поиска торговца для товара:`, {
        id: selectedSellItem.id,
        name: selectedSellItem.name,
        type: selectedSellItem.type,
        quality: selectedSellItem.quality
      });
      
      // Используем гибкое сопоставление с учетом структуры данных
      const matchingMarketItem = market.marketItems.find(marketItem => {
        // Основное сопоставление: itemId торговца должен совпадать с id предмета инвентаря
        if (marketItem.itemId === selectedSellItem.id) return true;
        
        // Дополнительные проверки
        // Проверка по имени предмета как запасной вариант
        if (marketItem.name && selectedSellItem.name &&
            marketItem.name.toLowerCase() === selectedSellItem.name.toLowerCase()) {
          // Дополнительно проверяем совпадение типа и редкости
          if ((marketItem.itemType === selectedSellItem.type) &&
              (marketItem.rarity === selectedSellItem.quality)) {
            return true;
          }
        }
        
        return false;
      });
      
      // Выводим все доступные товары в консоль для отладки, если не найдено совпадение
      if (!matchingMarketItem) {
        console.log('Не найдено совпадение в handleSellItem. Доступные товары:',
          market.marketItems.map(item => ({
            id: item.id,
            itemId: item.itemId,
            name: item.name,
            itemType: item.itemType,
            rarity: item.rarity
          }))
        );
      }
      
      if (matchingMarketItem && matchingMarketItem.sellerId) {
        const merchant = market.merchants?.find(m => m.id === matchingMarketItem.sellerId);
        if (merchant) {
          setSelectedMerchant({
            id: merchant.id,
            name: merchant.name
          });
          console.log(`Автоматически выбран торговец: ${merchant.name} (ID: ${merchant.id})`);
          // Небольшая задержка для обновления состояния
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          // Если нашли товар, но не нашли торговца, ищем его в списке торговцев
          console.log(`Найден подходящий товар с sellerId=${matchingMarketItem.sellerId}, но торговец не найден в market.merchants`);
          
          if (market?.merchants) {
            console.log('Доступные торговцы:', market.merchants.map(m => ({
              id: m.id,
              name: m.name
            })));
          }
        }
      } else {
        // Если не удалось найти товар по нашей логике, выводим больше информации для отладки
        console.log('Не удалось найти подходящий товар. Предмет для продажи:', {
          id: selectedSellItem.id,
          name: selectedSellItem.name,
          type: selectedSellItem.type,
          quality: selectedSellItem.quality
        });
        
        // Пробуем найти торговца еще раз после обновления данных
        if (market?.marketItems) {
          // Используем id выбранного предмета вместо несуществующей переменной itemIdentifier
          const refreshedItem = market.marketItems.find(
            marketItem => marketItem.itemId === selectedSellItem.id
          );
          
          if (refreshedItem && refreshedItem.sellerId) {
            const refreshedMerchant = market.merchants?.find(m => m.id === refreshedItem.sellerId);
            if (refreshedMerchant) {
              setSelectedMerchant({
                id: refreshedMerchant.id,
                name: refreshedMerchant.name
              });
              console.log(`Торговец найден после обновления: ${refreshedMerchant.name}`);
              // Небольшая задержка для обновления состояния
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
      }
    }
    
    // Проверка наличия выбранного торговца
    if (!selectedMerchant || !selectedMerchant.id) {
      alert("Этот предмет нельзя продать - подходящий торговец не найден");
      return;
    }
    
    // Получаем корректный ID пользователя
    const userId = getUserId();
    
    // Сохраняем ID для будущего использования, если он не дефолтный
    if (userId !== 1) {
      localStorage.setItem('userId', userId);
      window.currentUser = window.currentUser || {};
      window.currentUser.id = userId;
    }
    
    // Получаем цену из marketItems
    const itemPrice = getItemPrice(selectedSellItem);
    
    // Проверка наличия цены предмета
    if (!itemPrice) {
      alert("Этот предмет нельзя продать");
      return;
    }
    
    // Проверка наличия достаточного количества предметов
    if (selectedSellItem.quantity < quantity) {
      alert("У вас недостаточно предметов для продажи");
      return;
    }
    
    // Определяем тип валюты в зависимости от редкости предмета
    const currencyType = getCurrencyTypeByRarity(selectedSellItem.rarity || 'common');
    
    // Вычисляем сумму валюты, которую нужно добавить (70% от базовой цены)
    const sellPrice = Math.floor(itemPrice * 0.7) * quantity;
    
    // Создаем объект с валютой в зависимости от типа
    const currencyToAdd = {};
    
    switch(currencyType) {
      case 'copper':
        currencyToAdd.copper = sellPrice;
        break;
      case 'silver':
        currencyToAdd.silver = sellPrice;
        break;
      case 'gold':
        currencyToAdd.gold = sellPrice;
        break;
      case 'gold+spiritStones': {
        const goldAmount = Math.floor(sellPrice * 0.7);
        const spiritStonesAmount = Math.ceil(sellPrice * 0.3 / 100);
        currencyToAdd.gold = goldAmount;
        currencyToAdd.spiritStones = spiritStonesAmount;
        break;
      }
      case 'spiritStones':
        currencyToAdd.spiritStones = Math.ceil(sellPrice / 100);
        break;
      default:
        currencyToAdd.gold = sellPrice;
    }
    
    // Вывод сообщения о продаже
    alert(`Продажа ${quantity} шт. предмета "${selectedSellItem.name}" за ${formatPrice(sellPrice, selectedSellItem.rarity)}`);
    
    try {
      console.log(`Отправка API-запроса продажи товара с ID пользователя: ${userId}`);
      
      // Подготавливаем данные о предмете для отправки на сервер
      const itemData = {
        item_id: selectedSellItem.id, // Используем item_id как основной идентификатор
        itemId: selectedSellItem.itemId || selectedSellItem.id, // Для совместимости
        id: selectedSellItem.id, // Для обратной совместимости
        type: selectedSellItem.type,
        name: selectedSellItem.name,
        description: selectedSellItem.description,
        rarity: selectedSellItem.rarity || selectedSellItem.quality,
        basePrice: selectedSellItem.price
      };
      
      // Вызываем новый API-метод для продажи товара с обновлением инвентаря в БД
      const result = await sellItemToMerchant(
        selectedMerchant.id,
        itemData,
        userId,
        quantity
      );
      
      if (result.success) {
        console.log('Продажа успешно завершена:', result);
        // Обновляем Redux-состояние
        actions.removeItem(selectedSellItem.id, quantity);
        actions.updateCurrency(currencyToAdd, true);
        
        // Отправляем специальное действие для продажи на рынке через dispatch напрямую
        const action = {
          type: ACTION_TYPES.SELL_MARKET_ITEM,
          payload: {
            itemId: selectedSellItem.id,
            quantity,
            merchant: selectedMerchant
          }
        };
        
        // Используем dispatchEvent для отправки действия через DOM-события
        // Это позволит middleware отловить и обработать действие
        const customEvent = new CustomEvent('redux-action', {
          detail: action,
          bubbles: true
        });
        document.dispatchEvent(customEvent);
        
        // Отправляем текущие отношения на сервер после продажи
        try {
          const relationships = state.player.social?.relationships || [];
          await CharacterProfileService.updateRelationships(userId, relationships);
          console.log('Отношения обновлены на сервере после продажи товара');
        } catch (error) {
          console.error('Ошибка при обновлении отношений после продажи:', error);
        }
        
        
        // Запрашиваем обновление данных рынка
        refreshMarketData(true);
        
        console.log('Локальное состояние обновлено, данные рынка обновлены');
      } else {
        console.error('Ошибка при продаже предмета:', result.message);
        alert(`Ошибка при продаже: ${result.message}`);
      }
    } catch (error) {
      console.error('Ошибка при продаже предмета:', error);
      alert('Произошла ошибка при продаже. Пожалуйста, попробуйте еще раз.');
    }
    
    // Сброс выбранного предмета и количества
    setSelectedSellItem(null);
    setSelectedSellItemId(null);
    setQuantity(1);
  };
  
  // Разметка компонента
  return (
    <TabContainer>
      <TabHeader>
        <TabTitle>Рынок</TabTitle>
        <CurrencyDisplay>
          <CurrencyItem>
            <CurrencyIcon type="copper" />
            <CurrencyValue>{player?.inventory?.currency?.copper || 0}</CurrencyValue>
          </CurrencyItem>
          <CurrencyItem>
            <CurrencyIcon type="silver" />
            <CurrencyValue>{player?.inventory?.currency?.silver || 0}</CurrencyValue>
          </CurrencyItem>
          <CurrencyItem>
            <CurrencyIcon type="gold" />
            <CurrencyValue>{player?.inventory?.currency?.gold || 0}</CurrencyValue>
          </CurrencyItem>
          <CurrencyItem>
            <CurrencyIcon type="spiritStone" />
            <CurrencyValue>{player?.inventory?.currency?.spiritStones || 0}</CurrencyValue>
          </CurrencyItem>
        </CurrencyDisplay>
      </TabHeader>
      
      <TabMenu>
        <TabButton 
          active={activeTab === 'market'} 
          onClick={() => setActiveTab('market')}
        >
          Товары
        </TabButton>
        <TabButton
          active={activeTab === 'sell'}
          onClick={() => {
            setActiveTab('sell');
            // При переключении на вкладку продажи, если нет выбранного торговца,
            // выбираем первого доступного из списка
            if (!selectedMerchant && market?.merchants && market.merchants.length > 0) {
              const firstMerchant = market.merchants[0];
              setSelectedMerchant({
                id: firstMerchant.id,
                name: firstMerchant.name
              });
              console.log(`Автоматически выбран торговец при переключении на вкладку продажи: ${firstMerchant.name}`);
            }
          }}
        >
          Продажа
        </TabButton>
        <TabButton 
          active={activeTab === 'merchants'} 
          onClick={() => setActiveTab('merchants')}
        >
          Торговцы
        </TabButton>
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
                <FilterSelect 
                  value={itemTypeFilter}
                  onChange={(e) => setItemTypeFilter(e.target.value)}
                >
                  <option value="all">Все типы</option>
                  <option value="weapon">Оружие</option>
                  <option value="armor">Броня</option>
                  <option value="accessory">Аксессуары</option>
                  <option value="consumable">Расходники</option>
                  <option value="pet_food">Еда для питомцев</option>
                  <option value="resource">Ресурсы</option>
                  <option value="talisman">Талисманы</option>
                  <option value="book">Книги</option>
                  <option value="artifact">Артефакты</option>
                  <option value="ingredient">Ингредиенты</option>
                </FilterSelect>
                
                <FilterSelect 
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                >
                  <option value="all">Любая редкость</option>
                  <option value="common">Обычный</option>
                  <option value="uncommon">Необычный</option>
                  <option value="rare">Редкий</option>
                  <option value="epic">Эпический</option>
                  <option value="legendary">Легендарный</option>
                </FilterSelect>
                
                <FilterSelect 
                  value={activeSellerFilter || ''}
                  onChange={(e) => setActiveSellerFilter(e.target.value === '' ? null : e.target.value)}
                >
                  <option value="">Все торговцы</option>
                  {market?.marketItems && [...new Set(market.marketItems.map(item => item.sellerId))].map(sellerId => {
                    const seller = market.marketItems.find(item => item.sellerId === sellerId);
                    return (
                      <option key={sellerId} value={sellerId}>
                        {seller?.sellerName || `Торговец #${sellerId}`}
                      </option>
                    );
                  })}
                </FilterSelect>
              </FilterContainer>
              
              <ItemList>
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <ItemCard 
                      key={item.id} 
                      selected={selectedMarketItem && selectedMarketItem.id === item.id}
                      onClick={() => {
                        setSelectedMarketItem(item);
                        setSelectedMarketItemId(item.id);
                      }}
                    >
                      <ItemIcon>{item.itemType === 'weapon' ? '⚔️' :
                        item.itemType === 'armor' ? '🛡️' :
                        item.itemType === 'accessory' ? '💍' :
                        item.itemType === 'consumable' ? '🧪' :
                        item.itemType === 'pet_food' ? '🍖' :
                        item.itemType === 'resource' ? '🌿' :
                        item.itemType === 'talisman' ? '🔮' :
                        item.itemType === 'book' ? '📚' :
                        item.itemType === 'artifact' ? '✨' :
                        item.itemType === 'ingredient' ? '🧪' : ''}
                      </ItemIcon>
                      <ItemInfo>
                        <ItemName rarity={item.rarity}>{item.name}</ItemName>
                        <ItemPrice currencyType={getCurrencyTypeByRarity(item.rarity)}>
                          {formatPrice(item.price, item.rarity)}
                          {item.discount > 0 && ` (-${item.discount}%)`}
                        </ItemPrice>
                      </ItemInfo>
                    </ItemCard>
                  ))
                ) : (
                  <NoItemsMessage>Предметы не найдены</NoItemsMessage>
                )}
              </ItemList>
            </LeftPanel>
            
            <RightPanel>
              {selectedMarketItem ? (
                <>
                  <DetailTitle>{selectedMarketItem.name}</DetailTitle>
                  <ItemDescription>{selectedMarketItem.description}</ItemDescription>
                  
                  <ItemDetails>
                    <DetailRow>
                      <DetailLabel>Тип:</DetailLabel>
                      <DetailValue>
                        {selectedMarketItem.itemType === 'weapon' ? 'Оружие' :
                         selectedMarketItem.itemType === 'armor' ? 'Броня' :
                         selectedMarketItem.itemType === 'accessory' ? 'Аксессуар' :
                         selectedMarketItem.itemType === 'consumable' ? 'Расходник' :
                         selectedMarketItem.itemType === 'pet_food' ? 'Еда для питомцев' :
                         'Предмет'}
                      </DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Редкость:</DetailLabel>
                      <DetailValue>
                        {selectedMarketItem.rarity === 'common' ? 'Обычный' :
                         selectedMarketItem.rarity === 'uncommon' ? 'Необычный' :
                         selectedMarketItem.rarity === 'rare' ? 'Редкий' :
                         selectedMarketItem.rarity === 'epic' ? 'Эпический' :
                         selectedMarketItem.rarity === 'legendary' ? 'Легендарный' :
                         'Неизвестно'}
                      </DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Цена:</DetailLabel>
                      <DetailValue>
                        {formatPrice(selectedMarketItem.price, selectedMarketItem.rarity)}
                        {selectedMarketItem.discount > 0 && (
                          <span style={{ color: '#8AFF8A', marginLeft: '8px' }}>
                            (-{selectedMarketItem.discount}%)
                          </span>
                        )}
                      </DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Продавец:</DetailLabel>
                      <DetailValue>{selectedMarketItem.sellerName}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>В наличии:</DetailLabel>
                      <DetailValue>{selectedMarketItem.quantity}</DetailValue>
                    </DetailRow>
                    
                    {/* Дополнительные свойства специфичные для типа предмета */}
                    {selectedMarketItem.itemType === 'pet_food' && (
                      <>
                        {selectedMarketItem.nutritionValue !== undefined && (
                          <DetailRow>
                            <DetailLabel>Питательность:</DetailLabel>
                            <DetailValue>{selectedMarketItem.nutritionValue}</DetailValue>
                          </DetailRow>
                        )}
                        {selectedMarketItem.loyaltyBonus !== undefined && (
                          <DetailRow>
                            <DetailLabel>Бонус лояльности:</DetailLabel>
                            <DetailValue>+{selectedMarketItem.loyaltyBonus}</DetailValue>
                          </DetailRow>
                        )}
                      </>
                    )}
                  </ItemDetails>
                  
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
                    disabled={!hasSufficientCurrency(selectedMarketItem.price, selectedMarketItem.rarity)}
                  >
                    Купить за {formatPrice(selectedMarketItem.price * quantity, selectedMarketItem.rarity)}
                  </ActionButton>
                </>
              ) : (
                <NoItemsMessage>Выберите предмет для просмотра деталей</NoItemsMessage>
              )}
            </RightPanel>
          </>
        )}
        
        {activeTab === 'sell' && (
          <>
            <LeftPanel>
              <SearchBar 
                placeholder="Поиск в инвентаре..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <FilterContainer>
                <FilterSelect 
                  value={itemTypeFilter}
                  onChange={(e) => setItemTypeFilter(e.target.value)}
                >
                  <option value="all">Все типы</option>
                  <option value="weapon">Оружие</option>
                  <option value="armor">Броня</option>
                  <option value="accessory">Аксессуары</option>
                  <option value="consumable">Расходники</option>
                </FilterSelect>
                
                <FilterSelect 
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                >
                  <option value="all">Любая редкость</option>
                  <option value="common">Обычный</option>
                  <option value="uncommon">Необычный</option>
                  <option value="rare">Редкий</option>
                  <option value="epic">Эпический</option>
                  <option value="legendary">Легендарный</option>
                </FilterSelect>
              </FilterContainer>
              
              <ItemList>
                {player?.inventory?.items && player.inventory.items.length > 0 ? (
                  player.inventory.items
                    .filter(item => 
                      // Фильтрация предметов
                      (itemTypeFilter === 'all' || item.type === itemTypeFilter) &&
                      (rarityFilter === 'all' || item.rarity === rarityFilter) &&
                      (searchQuery === '' || 
                        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())))
                    )
                    .map(item => (
                      <ItemCard 
                        key={item.id} 
                        selected={selectedSellItem && selectedSellItem.id === item.id}
                        onClick={() => {
                          // Устанавливаем выбранный предмет и сохраняем его ID
                          setSelectedSellItem(item);
                          setSelectedSellItemId(item.id);
                          
                          // Ищем соответствующий товар в marketItems, чтобы найти торговца
                          if (market?.marketItems && market.marketItems.length > 0) {
                            // Выводим информацию о предмете игрока для отладки
                            console.log(`Ищем торговца для товара из инвентаря:`, {
                              id: item.id,
                              name: item.name,
                              type: item.type,
                              quality: item.quality
                            });
                            
                            // Используем гибкое сопоставление с учетом структуры данных
                            const matchingMarketItem = market.marketItems.find(marketItem => {
                              // Основное сопоставление: itemId торговца должен совпадать с id предмета инвентаря
                              if (marketItem.itemId === item.id) return true;
                              
                              // Дополнительные проверки
                              // Проверка по имени предмета как запасной вариант
                              if (marketItem.name && item.name &&
                                  marketItem.name.toLowerCase() === item.name.toLowerCase()) {
                                // Дополнительно проверяем совпадение типа и редкости
                                if ((marketItem.itemType === item.type) &&
                                    (marketItem.rarity === item.quality)) {
                                  return true;
                                }
                              }
                              
                              return false;
                            });
                            
                            // Выводим все доступные товары в консоль для отладки, если не найдено совпадение
                            if (!matchingMarketItem) {
                              console.log('Не найдено совпадение. Доступные товары:',
                                market.marketItems.map(marketItem => ({
                                  id: marketItem.id,
                                  itemId: marketItem.itemId,
                                  name: marketItem.name,
                                  itemType: marketItem.itemType,
                                  rarity: marketItem.rarity
                                }))
                              );
                            }
                            
                            if (matchingMarketItem && matchingMarketItem.sellerId) {
                              // Если нашли совпадение, ищем торговца
                              const merchant = market.merchants?.find(m => m.id === matchingMarketItem.sellerId);
                              if (merchant) {
                                setSelectedMerchant({
                                  id: merchant.id,
                                  name: merchant.name
                                });
                                console.log(`Найден торговец для этого товара: ${merchant.name} (ID: ${merchant.id})`);
                              } else {
                                console.log(`Не найден торговец с ID: ${matchingMarketItem.sellerId}, проверяем дополнительные возможности поиска`);
                                
                                // Ищем торговца во всех доступных торговцах более гибким способом
                                if (market?.merchants) {
                                  console.log(`Доступные торговцы:`,
                                    market.merchants.map(m => ({id: m.id, name: m.name})));
                                    
                                  // Попытка поиска по строковому совпадению (на случай если типы разные)
                                  const merchantByStringId = market.merchants.find(m =>
                                    String(m.id) === String(matchingMarketItem.sellerId));
                                  
                                  if (merchantByStringId) {
                                    setSelectedMerchant({
                                      id: merchantByStringId.id,
                                      name: merchantByStringId.name
                                    });
                                    console.log(`Торговец найден при строковом сравнении ID: ${merchantByStringId.name}`);
                                  } else {
                                    console.log(`Не удалось найти торговца даже при строковом сравнении ID`);
                                    setSelectedMerchant(null);
                                  }
                                } else {
                                  setSelectedMerchant(null);
                                }
                              }
                            } else {
                              console.log(`Не найден подходящий товар для предмета:`, {
                                id: item.id,
                                name: item.name,
                                type: item.type,
                                quality: item.quality
                              });
                              setSelectedMerchant(null); // Товар нельзя продать, нет соответствующего торговца
                              
                              // Ищем торговца по имени предмета как запасной вариант
                              if (market?.merchants && market.merchants.length > 0) {
                                console.log('Попытка найти торговца на основе специализации:');
                                // Если предмет оружие, ищем торговца оружием и т.д.
                                const itemTypeMappings = {
                                  'weapon': ['оружейник', 'кузнец', 'оружие'],
                                  'armor': ['бронник', 'кузнец', 'доспех'],
                                  'consumable': ['алхимик', 'травник', 'зелье']
                                };
                                
                                const keywords = itemTypeMappings[item.type] || [];
                                let foundMerchant = null;
                                
                                if (keywords.length > 0) {
                                  foundMerchant = market.merchants.find(m =>
                                    keywords.some(keyword =>
                                      m.name && m.name.toLowerCase().includes(keyword.toLowerCase())
                                    )
                                  );
                                }
                                
                                if (foundMerchant) {
                                  setSelectedMerchant({
                                    id: foundMerchant.id,
                                    name: foundMerchant.name
                                  });
                                  console.log(`Нашли торговца по специализации: ${foundMerchant.name}`);
                                }
                              }
                            }
                          } else {
                            console.log('Нет доступных товаров на рынке для сопоставления');
                            setSelectedMerchant(null);
                            
                            // Ищем подходящего торговца на основе типа предмета
                            if (market?.merchants && market.merchants.length > 0) {
                              console.log('Попытка найти торговца на основе типа предмета без сопоставления товаров');
                              
                              // Если предмет оружие, ищем торговца оружием и т.д.
                              const itemTypeMappings = {
                                'weapon': ['оружейник', 'кузнец', 'оружие'],
                                'armor': ['бронник', 'кузнец', 'доспех'],
                                'consumable': ['алхимик', 'травник', 'зелье']
                              };
                              
                              const keywords = itemTypeMappings[item.type] || [];
                              
                              // Выводим доступных торговцев для отладки
                              console.log('Доступные торговцы:', market.merchants.map(m =>
                                ({id: m.id, name: m.name, specialization: m.specialization})
                              ));
                              
                              if (keywords.length > 0) {
                                const foundMerchant = market.merchants.find(m =>
                                  keywords.some(keyword =>
                                    (m.name && m.name.toLowerCase().includes(keyword.toLowerCase())) ||
                                    (m.specialization && m.specialization.toLowerCase().includes(keyword.toLowerCase()))
                                  )
                                );
                                
                                if (foundMerchant) {
                                  setSelectedMerchant({
                                    id: foundMerchant.id,
                                    name: foundMerchant.name
                                  });
                                  console.log(`Нашли торговца по типу предмета: ${foundMerchant.name}`);
                                } else {
                                  // Если не удалось найти по типу, берем первого торговца из списка
                                  const defaultMerchant = market.merchants[0];
                                  setSelectedMerchant({
                                    id: defaultMerchant.id,
                                    name: defaultMerchant.name
                                  });
                                  console.log(`Выбран первый доступный торговец: ${defaultMerchant.name}`);
                                }
                              }
                            }
                          }
                        }}
                      >
                        <ItemIcon>{item.type === 'weapon' ? '⚔️' : 
                          item.type === 'armor' ? '🛡️' : 
                          item.type === 'accessory' ? '💍' : 
                          item.type === 'consumable' ? '🧪' : '📦'}
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
                      <DetailValue>
                        {selectedSellItem.type === 'weapon' ? 'Оружие' :
                         selectedSellItem.type === 'armor' ? 'Броня' :
                         selectedSellItem.type === 'accessory' ? 'Аксессуар' :
                         selectedSellItem.type === 'consumable' ? 'Расходник' :
                         'Предмет'}
                      </DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Редкость:</DetailLabel>
                      <DetailValue>
                        {selectedSellItem.rarity === 'common' ? 'Обычный' :
                         selectedSellItem.rarity === 'uncommon' ? 'Необычный' :
                         selectedSellItem.rarity === 'rare' ? 'Редкий' :
                         selectedSellItem.rarity === 'epic' ? 'Эпический' :
                         selectedSellItem.rarity === 'legendary' ? 'Легендарный' :
                         'Неизвестно'} 
                      </DetailValue>
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
                {market?.marketItems && [...new Set(market.marketItems.map(item => item.sellerId))].map(sellerId => {
                  const merchant = market.marketItems.find(item => item.sellerId === sellerId);
                  
                  if (!merchant) return null;
                  
                  const merchantName = merchant.sellerName || `Торговец #${sellerId}`;
                  
                  // Фильтрация по поиску
                  if (searchQuery && !merchantName.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return null;
                  }
                  
                  return (
                    <ItemCard 
                      key={sellerId}
                      selected={selectedMerchantItem && selectedMerchantItem.id === sellerId}
                      onClick={() => {
                        setSelectedMerchantItem({
                          id: sellerId,
                          name: merchantName
                        });
                        setSelectedMerchantItemId(sellerId);
                        // Устанавливаем фильтр по торговцу для вкладки "Товары"
                        setActiveSellerFilter(sellerId);
                      }}
                    >
                      <ItemIcon>🧙</ItemIcon>
                      <ItemInfo>
                        <ItemName>{merchantName}</ItemName>
                        <div>Отношения: {getRelationshipLevel(sellerId)}</div>
                      </ItemInfo>
                    </ItemCard>
                  );
                })}
              </ItemList>
            </LeftPanel>
            
            <RightPanel>
              {selectedMerchantItem ? (
                <>
                  <DetailTitle>{selectedMerchantItem.name}</DetailTitle>
                  
                  <ItemDetails>
                    <DetailRow>
                      <DetailLabel>Отношения:</DetailLabel>
                      <DetailValue>{getRelationshipLevel(selectedMerchantItem.id)}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Скидка:</DetailLabel>
                      <DetailValue>{calculateMerchantDiscount(getRelationshipLevel(selectedMerchantItem.id))}%</DetailValue>
                    </DetailRow>
                  </ItemDetails>
                  
                  <ActionButton
                    onClick={() => {
                      setActiveTab('market');
                      setActiveSellerFilter(selectedMerchantItem.id);
                    }}
                  >
                    Показать товары
                  </ActionButton>
                </>
              ) : (
                <NoItemsMessage>Выберите торговца для просмотра информации</NoItemsMessage>
              )}
            </RightPanel>
          </>
        )}
      </TabContent>
    </TabContainer>
  );
};

export default MarketTab;
