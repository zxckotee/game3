import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
// import { ensureItemHasCalculatedBonuses } from '../../utils/equipmentBonusHelper'; // Больше не используется напрямую здесь
import { useNavigate } from 'react-router-dom';
// import apiService from '../../services/api'; // Больше не используется напрямую здесь
import InventoryAuthManager from '../../utils/InventoryAuthManager';
import InventoryServiceAPI from '../../services/inventory-api.js'; // Прямой импорт API сервиса
import CharacterProfileServiceAPI from '../../services/character-profile-service-api';
import AlchemyServiceAPI from '../../services/alchemy-service-api'; // Импорт для использования предметов
import {
  translateRarity,
  translateItemType,
  getRarityBorderColor,
  getRarityBorderColorHover,
  getRarityShadowColor,
  getRarityGradientColor
} from '../../utils/itemTranslations';

// Анимации
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

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

const SpinnerContainer = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid rgba(212, 175, 55, 0.2);
  border-top: 5px solid #d4af37;
  border-radius: 50%;
  margin: 0 auto;
  animation: ${spin} 1s linear infinite;
`;

const LoadingSpinner = () => {
  return <SpinnerContainer />;
};

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  padding: 24px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
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

const ItemSlot = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid ${props => getRarityBorderColor(props.quality)};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, ${props => getRarityGradientColor(props.quality)}, transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.05);
    border-color: ${props => getRarityBorderColorHover(props.quality)};
    box-shadow: 0 8px 25px ${props => getRarityShadowColor(props.quality)};
    animation: ${pulse} 2s infinite;
    
    &::before {
      left: 100%;
    }
  }
`;

const ItemIcon = styled.img`
  width: 80%;
  height: 80%;
  object-fit: contain;
  border-radius: 4px;
`;

const ItemQuantity = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 0.8rem;
  color: #fff;
`;

const ItemDetails = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
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

const ItemName = styled.h3`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
  font-size: 1.5rem;
  font-weight: bold;
`;

const SectionTitle = styled.h4`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 16px 0 8px;
  font-size: 1.1rem;
  font-weight: bold;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  padding-bottom: 4px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 40px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
  }
`;

const ItemType = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 15px;
`;

const ItemDescription = styled.p`
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 20px;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2));
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  color: #d4af37;
  font-size: 0.9rem;
  font-weight: bold;
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
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.3), rgba(244, 208, 63, 0.3));
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

const CurrencyInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid rgba(212, 175, 55, 0.3);
`;

const CurrencyCard = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
  }
`;

const CurrencyLabel = styled.span`
  color: #aaa;
  font-size: 0.9rem;
`;

const CurrencyValue = styled.span`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  font-size: 1rem;
`;

function InventoryTab() {
  const { state, actions } = useGame();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // const [inventoryItems, setInventoryItems] = useState([]); // Будем использовать state.player.inventory.items
  const navigate = useNavigate();
 
  const formatEffectValue = (value) => {
    if (typeof value === 'number') {
      return Number(value.toFixed(2)).toString();
    }
    if (typeof value === 'object' && value !== null) {
      // Если объект имеет свойство 'value' (строку или число), используем его
      if (value.hasOwnProperty('value') && (typeof value.value === 'string' || typeof value.value === 'number')) {
        return value.value.toString();
      }
      // Если это объект, но не с ожидаемой структурой, для отладки можно вывести JSON
      // или вернуть плейсхолдер, чтобы избежать ошибки рендеринга.
      // В данном случае, ошибка упоминала ключи {id, type, value}, так что выше проверка на value.value.
      console.warn('[InventoryTab] formatEffectValue получил неожиданный объект:', value);
      return '[Объект]'; // Или JSON.stringify(value) для детальной отладки в UI
    }
    return value;
  };

  const fetchAndEnrichInventory = async () => {
    console.log('[InventoryTab] Запрос и обогащение инвентаря...');
    setIsLoading(true);
    setSelectedItem(null); 
    try {
      const userId = await InventoryAuthManager.ensureUserAuthorized(state, actions, navigate);
      if (!userId) {
        setIsLoading(false);
        if (actions.updateInventoryItems) actions.updateInventoryItems([]);
        else console.warn('[InventoryTab] actions.updateInventoryItems не найден при userId=null');
        return;
      }
      // Используем apiService, как указано в импортах
      const rawItems = await InventoryServiceAPI.getInventoryItems(userId);

      if (rawItems && Array.isArray(rawItems)) {
        // Предполагаем, что rawItems уже содержат все необходимые данные, включая image_url.
        // Убираем избыточное "обогащение".
        const finalItems = rawItems.map(item => ({
          ...item,
          enriched: true, // Помечаем как "обогащенные", так как мы ожидаем полные данные от API
          enrichedFailed: false
        }));

        // Обновляем глобальное состояние предметов
        if (actions.updateInventoryItems) actions.updateInventoryItems(finalItems);
        else console.warn('[InventoryTab] actions.updateInventoryItems не найден');
        
        console.log('[InventoryTab] Предметы инвентаря обновлены в глобальном состоянии (без доп. обогащения):', finalItems.length, 'предметов');

        // Загружаем и обновляем валюту
        if (CharacterProfileServiceAPI && actions.updateInventoryCurrency) {
          try {
            const profile = await CharacterProfileServiceAPI.getCharacterProfile(userId);
            if (profile && profile.currency) {
              actions.updateInventoryCurrency(profile.currency);
              console.log('[InventoryTab] Валюта обновлена в глобальном состоянии.');
            } else {
              console.warn('[InventoryTab] Не удалось получить профиль или валюту для обновления глоб. состояния.');
            }
          } catch (profileError) {
            console.error('[InventoryTab] Ошибка при получении профиля для обновления валюты:', profileError);
          }
        }
      } else {
        if (actions.updateInventoryItems) actions.updateInventoryItems([]);
        else console.warn('[InventoryTab] actions.updateInventoryItems не найден при пустом инвентаре');
        console.log('[InventoryTab] Получен пустой или некорректный инвентарь.');
      }
    } catch (error) {
      console.error("[InventoryTab] Ошибка при загрузке или обогащении инвентаря:", error);
      actions.addNotification({ message: `Ошибка загрузки инвентаря: ${error.message || 'Неизвестная ошибка'}`, type: 'error' });
      if (actions.updateInventoryItems) actions.updateInventoryItems([]);
      else console.warn('[InventoryTab] actions.updateInventoryItems не найден в catch');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const performInitialAuthAndLoad = async () => {
      setIsAuthChecking(true); 
      try {
        // Принудительная проверка при первой загрузке вкладки, если пользователь уже в state.auth.user
        // или если нужно обновить данные пользователя.
        const userId = await InventoryAuthManager.ensureUserAuthorized(state, actions, navigate, !state.auth?.user?.id); 
        if (userId) {
          console.log('[InventoryTab] Авторизация подтверждена, загружаем инвентарь.');
          await fetchAndEnrichInventory();
        } else {
          console.log('[InventoryTab] Авторизация не пройдена, инвентарь не будет загружен.');
          if (actions.updateInventoryItems) actions.updateInventoryItems([]);
          else console.warn('[InventoryTab] actions.updateInventoryItems не найден при ошибке авторизации');
        }
      } catch (error) {
        console.error('[InventoryTab] Ошибка во время начальной проверки авторизации:', error);
        if (actions.updateInventoryItems) actions.updateInventoryItems([]);
        else console.warn('[InventoryTab] actions.updateInventoryItems не найден в catch начальной проверки');
      } finally {
        setIsAuthChecking(false);
      }
    };

    performInitialAuthAndLoad();
  }, [state.auth?.user?.id]); // Перезагрузка при смене пользователя


  const handleItemClick = (item) => {
    console.log(`[InventoryTab] Клик по предмету:`, {
      id: item?.id,
      name: item?.name,
      type: item?.type,
      enriched: item?.enriched,
      enrichedFailed: item?.enrichedFailed
    });
    setSelectedItem(item);
  };

  const handleEquipItem = async () => {
    if (!selectedItem || !selectedItem.id) {
      actions.addNotification({ message: 'Предмет не выбран.', type: 'warning' });
      return;
    }

    const equipableTypes = ['weapon', 'armor', 'accessory', 'talisman'];
    if (!equipableTypes.includes(selectedItem.type)) {
      actions.addNotification({ message: `Предмет типа '${selectedItem.type}' нельзя экипировать.`, type: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      const userId = await InventoryAuthManager.ensureUserAuthorized(state, actions, navigate, false);
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const newEquippedState = !selectedItem.equipped;
      await InventoryServiceAPI.toggleEquipItem(userId, selectedItem.id, newEquippedState);

      actions.addNotification({
        message: `${selectedItem.name} ${newEquippedState ? 'экипирован' : 'снят'}.`,
        type: 'success'
      });
     await fetchAndEnrichInventory();
   } catch (error) {
     console.error('[InventoryTab] Ошибка при экипировке/снятии предмета:', error);
      actions.addNotification({ message: `Ошибка экипировки: ${error.message || 'Неизвестная ошибка'}`, type: 'error' });
      // InventoryAuthManager.handleInventoryError(error, actions, navigate); // Может быть избыточным, если addNotification уже есть
      setIsLoading(false); 
      // Попытка перезагрузить инвентарь даже после ошибки действия не всегда хорошая идея,
      // лучше дать пользователю понять, что действие не удалось.
      // await fetchAndEnrichInventory(); 
    } finally {
       // setIsLoading(false); // fetchAndEnrichInventory сделает это
    }
  };

  const handleConsumeItem = async () => {
    if (!selectedItem || !selectedItem.id) {
      actions.addNotification({ message: 'Предмет не выбран.', type: 'warning' });
      return;
    }

    const consumableTypes = ['consumable', 'elixir'];
    if (!consumableTypes.includes(selectedItem.type)) {
      actions.addNotification({ message: `Предмет типа '${selectedItem.type}' нельзя использовать.`, type: 'warning' });
      return;
    }
    
    if (selectedItem.type === 'pill' && !consumableTypes.includes('pill')) {
        actions.addNotification({ message: `Предметы типа 'pill' не обрабатываются как consumable/elixir.`, type: 'warning' });
        return;
    }

    setIsLoading(true);
    try {
      const userId = await InventoryAuthManager.ensureUserAuthorized(state, actions, navigate, false);
      if (!userId) {
        setIsLoading(false);
        return;
      }

      let result;
      // Сначала пробуем использовать actions.useItem, если она доступна
      if (typeof actions.useItem === 'function') {
        result = await actions.useItem(selectedItem);
      } else {
        // Если actions.useItem не доступна, используем AlchemyServiceAPI напрямую
        console.log('[InventoryTab] actions.useItem не является функцией, используем AlchemyServiceAPI напрямую.');
        result = await AlchemyServiceAPI.useAlchemyItem(userId, selectedItem.item_id || selectedItem.id, 1);
      }

      if (result && result.success === false) {
        actions.addNotification({ message: result.message || `Не удалось использовать ${selectedItem.name}.`, type: 'error' });
      } else {
        actions.addNotification({ message: result.message || `Вы использовали ${selectedItem.name}.`, type: 'success' });
      }
      
      await fetchAndEnrichInventory();
    } catch (error) {
      console.error('[InventoryTab] Ошибка при использовании предмета:', error);
      actions.addNotification({ message: `Ошибка использования: ${error.message || 'Неизвестная ошибка'}`, type: 'error' });
      // InventoryAuthManager.handleInventoryError(error, actions, navigate);
      setIsLoading(false);
    } finally {
      // setIsLoading(false); // fetchAndEnrichInventory сделает это
    }
  };

  // Старая функция handleUseItem и const canUseItem удалены.

  if (isAuthChecking || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#d4af37' }}>
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {isAuthChecking ? 'Проверка авторизации...' : 'Загрузка инвентаря...'}
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  const itemsToDisplay = state.player.inventory?.items || [];

  const equipableTypes = ['weapon', 'armor', 'accessory', 'talisman'];
  const consumableTypes = ['consumable', 'elixir'];

  return (
    <Container>
      {itemsToDisplay.length > 0 ? (
        <>
          <InventoryGrid>
            {(itemsToDisplay).map((item, index) => (
              <ItemSlot
                key={item.id ? `${item.id}_${index}` : `item_${index}`}
                quality={item.quality || 'common'}
                onClick={() => handleItemClick(item)}
                style={selectedItem && selectedItem.id === item.id ? {
                  borderColor: '#fff',
                  boxShadow: `0 0 15px ${
                    item.quality === 'common' ? '#fff' :
                    item.quality === 'uncommon' ? '#2196f3' :
                    item.quality === 'rare' ? '#9c27b0' :
                    item.quality === 'epic' ? '#ff9800' : '#d4af37'
                  }`
                } : {}}
              >
                {item.image_url ? (
                  <ItemIcon src={item.image_url} alt={item.name} />
                ) : (
                  <div style={{width: '80%', height: '80%', backgroundColor: '#222', borderRadius: '4px'}} />
                )}
                {item.quantity > 1 && <ItemQuantity>{item.quantity}</ItemQuantity>}
                {item.enrichedFailed && <div title="Не удалось загрузить полные детали предмета" style={{ position: 'absolute', top: '2px', left: '2px', color: 'red', fontSize: '1.2rem', fontWeight: 'bold', lineHeight: '1' }}>!</div>}
              </ItemSlot>
            ))}
          </InventoryGrid>
          
          <ItemDetails>
            {selectedItem ? (
              <>
                <ItemName quality={selectedItem.quality || 'common'}>{selectedItem.name || 'Неизвестный предмет'}</ItemName>
                <ItemType>Тип: {translateItemType(selectedItem.type)} | Качество: {translateRarity(selectedItem.quality || 'common')}</ItemType>
                {selectedItem.enrichedFailed && <p style={{color: 'red', fontSize: '0.9rem', marginBottom: '10px'}}>Не удалось загрузить полные детали этого предмета.</p>}
                <ItemDescription>{selectedItem.description || 'Описание отсутствует.'}</ItemDescription>
                
                {selectedItem.stats && Object.entries(selectedItem.stats).map(([key, value]) => {
                  if (['name', 'description', 'type', 'quality', 'rarity', 'itemId', 'icon', 'slot', 'effects', 'requirements', 'value', 'item_id', 'item_type', 'equipped', 'quantity', 'enriched', 'enrichedFailed', 'id'].includes(key.toLowerCase())) return null;
                  if (value === null || value === undefined || value === '') return null;
                  return <div key={key} style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '3px' }}>{key.charAt(0).toUpperCase() + key.slice(1)}: {formatEffectValue(value)}</div>;
                })}

                {selectedItem.effects && selectedItem.effects.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <SectionTitle>Эффекты:</SectionTitle>
                    {selectedItem.effects.map((effect, index) => (
                      <div key={index} style={{ fontSize: '0.85rem', color: '#ccc', marginLeft: '10px', marginBottom: '5px' }}>
                        - {effect.description || `${effect.target || 'Неизвестная характеристика'} ${effect.modifier === 'add' ? '+' : '*'}${formatEffectValue(effect.value)}`}
                        {effect.duration && ` (длительность: ${effect.duration} ходов)`}
                      </div>
                    ))}
                  </div>
                )}

                {selectedItem.requirements && Object.keys(selectedItem.requirements).length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <SectionTitle>Требования:</SectionTitle>
                    {Array.isArray(selectedItem.requirements) ? (
                      selectedItem.requirements.map((req, index) => (
                        <div key={index} style={{ fontSize: '0.85rem', color: '#ccc', marginLeft: '10px', marginBottom: '5px' }}>
                          - {(req.type ? req.type.charAt(0).toUpperCase() + req.type.slice(1) : `Требование ${index + 1}`)}: {formatEffectValue(req.value)}
                        </div>
                      ))
                    ) : (
                      Object.entries(selectedItem.requirements).map(([key, value]) => (
                        <div key={key} style={{ fontSize: '0.85rem', color: '#ccc', marginLeft: '10px', marginBottom: '5px' }}>
                          - {key.charAt(0).toUpperCase() + key.slice(1)}: {formatEffectValue(value)}
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                <div style={{marginTop: '20px'}}>
                  {equipableTypes.includes(selectedItem.type) && (
                    <ActionButton
                      onClick={handleEquipItem}
                      disabled={isLoading}
                    >
                      {selectedItem.equipped ? 'Снять' : 'Экипировать'}
                    </ActionButton>
                  )}

                  {consumableTypes.includes(selectedItem.type) &&
                   !(selectedItem.type === 'pill' && !consumableTypes.includes('pill')) && (
                    <ActionButton
                      onClick={handleConsumeItem}
                      disabled={isLoading}
                    >
                      Использовать
                    </ActionButton>
                   )
                  }
                </div>
              </>
            ) : (
              (itemsToDisplay.length > 0) && !isLoading && !isAuthChecking && (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: '#aaa', textAlign: 'center'}}>
                  Выберите предмет для просмотра деталей.
                </div>
              )
            )}
          </ItemDetails>
        </>
      ) : (
        <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#aaa' }}>
          Инвентарь пуст.
        </div>
      )}
      <CurrencyInfo>
        <CurrencyCard>
          <CurrencyLabel>Духовные камни:</CurrencyLabel>
          <CurrencyValue>{state.player.inventory.currency?.spiritStones || 0}</CurrencyValue>
        </CurrencyCard>
        <CurrencyCard>
          <CurrencyLabel>Медь:</CurrencyLabel>
          <CurrencyValue>{state.player.inventory.currency?.copper || 0}</CurrencyValue>
        </CurrencyCard>
        <CurrencyCard>
          <CurrencyLabel>Серебро:</CurrencyLabel>
          <CurrencyValue>{state.player.inventory.currency?.silver || 0}</CurrencyValue>
        </CurrencyCard>
        <CurrencyCard>
          <CurrencyLabel>Золото:</CurrencyLabel>
          <CurrencyValue>{state.player.inventory.currency?.gold || 0}</CurrencyValue>
        </CurrencyCard>
      </CurrencyInfo>
    </Container>
  );
}

export default InventoryTab;
