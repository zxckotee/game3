import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { debugEquipment } from '../../utils/equipmentDebug';
import { ensureItemHasCalculatedBonuses } from '../../utils/equipmentBonusHelper';
import EquipmentService from '../../services/equipment-service-adapter';

const Container = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
`;

const EquipmentDisplay = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-rows: minmax(100px, auto);
  grid-gap: 20px;
  max-width: 100%;
`;

const EquipmentSlot = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #666;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 10px;
  cursor: pointer;
  height: 100px;
  
  &.head {
    grid-column: 1 / span 3;
    height: 80px;
  }
  
  &.body {
    grid-column: 2;
    grid-row: 2;
  }
  
  &.left {
    grid-column: 1;
    grid-row: 2;
  }
  
  &.right {
    grid-column: 3;
    grid-row: 2;
  }
  
  &.hands {
    grid-column: 1 / span 3;
    grid-row: 3;
    height: 80px;
  }
  
  &.legs {
    grid-column: 1 / span 3;
    grid-row: 4;
    height: 80px;
  }
  
  &.acc1 {
    grid-column: 1;
    grid-row: 5;
  }
  
  &.acc2 {
    grid-column: 3;
    grid-row: 5;
  }
  
  &.art1 {
    grid-column: 1;
    grid-row: 6;
  }
  
  &.art2 {
    grid-column: 3;
    grid-row: 6;
  }
  
  &.equipped {
    border-color: ${props => props.rarity === 'common' ? '#666' :
      props.rarity === 'uncommon' ? '#2196f3' :
      props.rarity === 'rare' ? '#9c27b0' :
      props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
    box-shadow: 0 0 5px ${props => props.rarity === 'common' ? '#666' :
      props.rarity === 'uncommon' ? '#2196f3' :
      props.rarity === 'rare' ? '#9c27b0' :
      props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
  }
`;

const SlotName = styled.div`
  color: #aaa;
  font-size: 0.8rem;
  margin-bottom: 5px;
`;

const ItemIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.type === 'weapon' ? '#f44336' :
    props.type === 'armor' ? '#2196f3' :
    props.type === 'accessory' ? '#9c27b0' :
    props.type === 'artifact' ? '#ff9800' :
    props.type === 'material' ? '#4caf50' :
    props.type === 'book' ? '#795548' : '#666'};
  border-radius: 4px;
`;

const ItemName = styled.div`
  color: ${props => props.rarity === 'common' ? '#fff' :
    props.rarity === 'uncommon' ? '#2196f3' :
    props.rarity === 'rare' ? '#9c27b0' :
    props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
  font-size: 0.9rem;
  margin-top: 5px;
  text-align: center;
`;

const StatsPanel = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const UnequipButton = styled.button`
  padding: 10px 15px;
  background: rgba(180, 30, 30, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(180, 30, 30, 0.5);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const DropButton = styled.button`
  padding: 10px 15px;
  background: rgba(180, 30, 30, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(180, 30, 30, 0.5);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const SectionTitle = styled.h3`
  color: #d4af37;
  font-size: 1.2rem;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
  padding-bottom: 5px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  span:first-child {
    color: #aaa;
  }
  
  span:last-child {
    color: ${props => props.value > 0 ? '#4caf50' : props.value < 0 ? '#f44336' : '#aaa'};
  }
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const FilterButton = styled.button`
  padding: 8px 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #666;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.5);
  }
  
  &.active {
    background: rgba(212, 175, 55, 0.2);
    border-color: #d4af37;
    color: #d4af37;
  }
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #666;
  border-radius: 8px;
`;

const ItemSlot = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.rarity === 'common' ? '#666' :
    props.rarity === 'uncommon' ? '#2196f3' :
    props.rarity === 'rare' ? '#9c27b0' :
    props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 10px ${props => props.rarity === 'common' ? '#666' :
      props.rarity === 'uncommon' ? '#2196f3' :
      props.rarity === 'rare' ? '#9c27b0' :
      props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
  }
  
  &.equipped {
    border-width: 2px;
    box-shadow: 0 0 5px ${props => props.rarity === 'common' ? '#666' :
      props.rarity === 'uncommon' ? '#2196f3' :
      props.rarity === 'rare' ? '#9c27b0' :
      props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
  }
`;

// Вспомогательная функция для определения типа брони на основе armorType и названия
const determineArmorType = (item) => {
  if (!item) return null;
  
  // Сначала проверяем явно указанный тип
  const armorType = item.properties?.armorType || item.armorType;
  if (armorType) return armorType;
  
  // Если тип не указан, определяем по названию
  const itemName = item.name.toLowerCase();
  
  if (itemName.includes('шлем') || itemName.includes('шапка') || itemName.includes('капюшон')) {
    return 'head';
  }
  
  if (itemName.includes('сапог') || itemName.includes('ботин') || itemName.includes('обувь')) {
    return 'legs';
  }
  
  if (itemName.includes('перчат') || itemName.includes('рукав')) {
    return 'hands';
  }
  
  // По умолчанию считаем броней для тела
  return 'body';
};

function EquipmentTab() {
  const { state, actions } = useGame();
  const [equipped, setEquipped] = useState({
    weapon: null,
    headArmor: null,
    bodyArmor: null,
    legArmor: null,
    handArmor: null,
    accessory1: null,
    accessory2: null,
    artifact1: null,
    artifact2: null
  });
  const [filter, setFilter] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEquippedItem, setSelectedEquippedItem] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Загружаем экипированные предметы один раз при монтировании компонента
  const isMounted = React.useRef(false);
  
  useEffect(() => {
      // Загружаем экипировку только при первом монтировании компонента
      if (isMounted.current) {
        return;
      }
      isMounted.current = true;
      console.log('[EquipmentTab] Инициализация вкладки Экипировка');

      const userId = state.player?.id;

      const initLogic = async () => {
        if (userId && actions.loadInventoryData) {
          console.log('[EquipmentTab] Загрузка данных инвентаря...');
          await actions.loadInventoryData(userId);
        }
        
        // Загружаем экипированные предметы уже из обновленного state
        const items = updateEquippedItems();
        
        // Явно применяем бонусы экипировки при первой загрузке компонента
        console.log('[EquipmentTab] Явное применение бонусов экипировки при первом монтировании');
        if (actions.applyEquipmentBonuses) { // Добавим проверку на существование action
            actions.applyEquipmentBonuses(items);
        }
        
        // Используем нашу отладочную утилиту для вывода информации
        setTimeout(() => {
          debugEquipment(state);
        }, 500); // Небольшая задержка, чтобы убедиться, что все бонусы успели применяться
      };

      initLogic();
  }, [state.player?.id, actions]); // Добавляем зависимости state.player?.id и actions
  
  // Логика обогащения предметов при первой загрузке удалена,
  // так как предметы теперь приходят с сервера уже обогащенными.
  
  // Обновляем отображение экипированных предметов при изменении инвентаря
  useEffect(() => {
    if (!isMounted.current) {
      return; // Пропускаем первую загрузку, она обрабатывается выше
    }
    
    // Обновляем отображение экипировки напрямую из состояния без обращения к API
    console.log('Обновление отображения экипированных предметов из state.player.inventory');
    updateEquippedItems();
    
  }, [state.player.inventory.items]);
  
  // Функция для обновления отображения экипированных предметов (без пересчета бонусов)
  // Возвращает объект с экипированными предметами
  const updateEquippedItems = () => {
    const equippedItems = {};
    
    // Получаем список экипированных предметов
    const equippedItemsList = state.player.inventory.items.filter(item => item.equipped);
    
    console.log('==== ОБНОВЛЕНИЕ ЭКИПИРОВАННЫХ ПРЕДМЕТОВ ====');
    console.log(`Найдено ${equippedItemsList.length} экипированных предметов`);
    
    // Находим экипированные предметы из инвентаря
    state.player.inventory.items.forEach(item => {
      if (item.equipped) {
        // Используем нашу утилиту для гарантии наличия предрассчитанных бонусов
        let itemWithBonuses = ensureItemHasCalculatedBonuses(item);
        if (itemWithBonuses.calculatedBonuses) {
          console.log(`✅ Предмет ${item.name} имеет предрассчитанные бонусы`);
        }
        
        switch(item.type) {
          case 'weapon':
            equippedItems.weapon = itemWithBonuses;
            console.log(`⚔️ Экипировано оружие: ${itemWithBonuses.name}`);
            break;
          case 'armor':
            // Получаем armorType из properties, если доступно
            const armorType = item.properties?.armorType || item.armorType;
            const itemName = item.name.toLowerCase();
            
            // Улучшенная логика определения типа брони
            if (armorType === 'head' || (!armorType && (itemName.includes('шлем') || itemName.includes('шапка') || itemName.includes('капюшон')))) {
              equippedItems.headArmor = itemWithBonuses;
              console.log(`🧢 Экипирована броня для головы: ${itemWithBonuses.name}`);
            }
            else if (armorType === 'legs' || (!armorType && (itemName.includes('сапог') || itemName.includes('ботин') || itemName.includes('обувь')))) {
              equippedItems.legArmor = itemWithBonuses;
              console.log(`👢 Экипирована броня для ног: ${itemWithBonuses.name}`);
            }
            else if (armorType === 'hands' || (!armorType && (itemName.includes('перчат') || itemName.includes('рукав')))) {
              equippedItems.handArmor = itemWithBonuses;
              console.log(`🧤 Экипирована броня для рук: ${itemWithBonuses.name}`);
            }
            else {
              // Если ничего не совпало, считаем бронёй для тела
              equippedItems.bodyArmor = itemWithBonuses;
              console.log(`🥋 Экипирована броня для тела: ${itemWithBonuses.name}`);
            }
            break;
          case 'accessory':
            if (!equippedItems.accessory1) {
              equippedItems.accessory1 = itemWithBonuses;
              console.log(`💍 Экипирован аксессуар 1: ${itemWithBonuses.name}`);
            } else if (!equippedItems.accessory2) {
              equippedItems.accessory2 = itemWithBonuses;
              console.log(`📿 Экипирован аксессуар 2: ${itemWithBonuses.name}`);
            }
            break;
          case 'artifact':
            if (!equippedItems.artifact1) {
              equippedItems.artifact1 = itemWithBonuses;
              console.log(`🔮 Экипирован артефакт 1: ${itemWithBonuses.name}`);
            } else if (!equippedItems.artifact2) {
              equippedItems.artifact2 = itemWithBonuses;
              console.log(`🧿 Экипирован артефакт 2: ${itemWithBonuses.name}`);
            }
            break;
        }
      }
    });
    
    setEquipped(equippedItems);
    
    // После обновления экипировки сразу же применяем бонусы
    console.log('Применение бонусов экипировки после обновления экипированных предметов');
    actions.applyEquipmentBonuses(equippedItems);
    
    return equippedItems;
  };
  
  const handleSlotClick = (slotType) => {
    // Работаем напрямую с данными из state без дополнительных API-запросов
    setSelectedSlot(slotType);
    
    // Сохраняем выбранный экипированный предмет, если он есть в слоте
    const itemInSlot = equipped[slotType];
    setSelectedEquippedItem(itemInSlot);
    
    // Автоматически меняем фильтр в зависимости от типа слота
    switch(slotType) {
      case 'weapon':
        setFilter('weapon');
        break;
      case 'headArmor':
      case 'bodyArmor':
      case 'legArmor':
      case 'handArmor':
        setFilter('armor');
        break;
      case 'accessory1':
      case 'accessory2':
        setFilter('accessory');
        break;
      case 'artifact1':
      case 'artifact2':
        setFilter('artifact');
        break;
      default:
        setFilter('all');
    }
  };
  
  // Функция для снятия экипировки
  const handleUnequipItem = async () => {
    if (!selectedEquippedItem || !selectedEquippedItem.item) { // Проверяем наличие item в selectedEquippedItem
      actions.addNotification({ message: 'Предмет для снятия не выбран или не содержит информации.', type: 'warning' });
      return;
    }

    const userId = state.player?.id;
    // Убедимся, что selectedEquippedItem.item существует перед доступом к id
    const itemId = selectedEquippedItem.item.id;

    if (!userId || !itemId) {
      actions.addNotification({ message: 'Ошибка: ID пользователя или предмета не найден для снятия.', type: 'error' });
      return;
    }

    try {
      console.log(`[EquipmentTab] Попытка снять предмет API: ${itemId} для пользователя ${userId}`);
      // Убедитесь, что EquipmentService.unequipItem определен и делает корректный API вызов.
      // Этот метод должен возвращать объект с полем success: true/false.
      const unequipResult = await EquipmentService.unequipItem(userId, itemId);

      if (unequipResult && unequipResult.success) {
        actions.addNotification({ message: `${selectedEquippedItem.item.name} успешно снят.`, type: 'success' });
        if (actions.loadInventoryData) {
          await actions.loadInventoryData(userId); // Перезагружаем инвентарь
        }
        // Сбрасываем состояния после успешной операции и обновления данных
        setSelectedEquippedItem(null);
        setSelectedSlot(null);
      } else {
        actions.addNotification({ message: `Не удалось снять ${selectedEquippedItem.item.name}. ${unequipResult?.message || 'Сервер не вернул причину.'}`, type: 'error' });
      }
    } catch (error) {
      console.error('[EquipmentTab] Ошибка при снятии предмета через API:', error);
      actions.addNotification({ message: `Ошибка снятия предмета: ${error.message}`, type: 'error' });
    }
  };
  
  // Функция для выбрасывания предмета
  const handleDropItem = () => {
    if (selectedInventoryItem) {
      console.log(`Выбрасывание предмета ${selectedInventoryItem.name}`);
      
      // Если предмет экипирован, сначала снимаем его
      if (selectedInventoryItem.equipped) {
        // Находим слот, в котором экипирован предмет
        for (const [slot, item] of Object.entries(equipped)) {
          if (item && item.id === selectedInventoryItem.id) {
            console.log(`Сначала снимаем экипировку ${selectedInventoryItem.name} из слота ${slot}`);
            actions.unequipItem(slot);
            break;
          }
        }
      }
      
      // Выбрасываем предмет - обратите внимание, что reducer ожидает объект с id в качестве payload
      const itemId = selectedInventoryItem.id || selectedInventoryItem.itemId;
      actions.removeItem({ id: itemId }); // Исправление: передаем объект с id вместо самого id
      
      // Обновляем отображение экипировки
      setTimeout(() => {
        updateEquippedItems();
        
        // Сбрасываем выбранный предмет
        setSelectedInventoryItem(null);
      }, 100);
    }
  };
  
  const handleItemClick = (item) => {
    // Сохраняем выбранный предмет инвентаря
    setSelectedInventoryItem(item);
    
    if (selectedSlot) {
      // Убедимся, что предмет имеет предрассчитанные бонусы
      item = ensureItemHasCalculatedBonuses(item);
      
      console.log(`Экипировка предмета ${item.name} (ID: ${item.id}) в слот ${selectedSlot}`);
      
      // Показываем индикатор загрузки
      actions.addNotification({
        message: 'Экипировка предмета...',
        type: 'info',
        duration: 1000
      });
      
      // Используем новый API-маршрут для проверки требований и экипировки предмета на сервере
      fetch('/api/equipment/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId: state.player.id,
          itemId: item.id // ID предмета в инвентаре
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Предмет успешно экипирован
          actions.addNotification({
            message: data.message || 'Предмет успешно экипирован',
            type: 'success'
          });
          
          // Обновляем инвентарь через loadInventoryData
          const userId = state.player?.id;
          if (userId && actions.loadInventoryData) {
            actions.loadInventoryData(userId);
          }
          // updateEquippedItems() будет вызван автоматически через useEffect после обновления глобального состояния
        } else {
          // Ошибка при экипировке
          actions.addNotification({
            message: data.message || 'Не удалось экипировать предмет',
            type: 'error'
          });
          
          // Показываем список невыполненных требований, если они есть
          if (data.failedRequirements && data.failedRequirements.length > 0) {
            actions.addNotification({
              message: `Не выполнены требования: ${data.failedRequirements.join(', ')}`,
              type: 'error'
            });
          }
        }
      })
      .catch(error => {
        console.error('Ошибка при экипировке предмета:', error);
        actions.addNotification({
          message: 'Произошла ошибка при экипировке предмета',
          type: 'error'
        });
      });
    }
  };
  
  // Рендеринг компонента
  return (
    <Container>
      <div>
        <EquipmentDisplay>
          <EquipmentSlot 
            className="head" 
            onClick={() => handleSlotClick('headArmor')}
            rarity={equipped.headArmor ? equipped.headArmor.rarity : 'common'}
          >
            <SlotName>Голова</SlotName>
            {equipped.headArmor ? (
              <>
                <ItemIcon type="armor" />
                <ItemName rarity={equipped.headArmor.rarity}>{equipped.headArmor.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="left" 
            onClick={() => handleSlotClick('weapon')}
            rarity={equipped.weapon ? equipped.weapon.rarity : 'common'}
          >
            <SlotName>Оружие</SlotName>
            {equipped.weapon ? (
              <>
                <ItemIcon type="weapon" />
                <ItemName rarity={equipped.weapon.rarity}>{equipped.weapon.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="body" 
            onClick={() => handleSlotClick('bodyArmor')}
            rarity={equipped.bodyArmor ? equipped.bodyArmor.rarity : 'common'}
          >
            <SlotName>Тело</SlotName>
            {equipped.bodyArmor ? (
              <>
                <ItemIcon type="armor" />
                <ItemName rarity={equipped.bodyArmor.rarity}>{equipped.bodyArmor.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="right" 
            onClick={() => handleSlotClick('shield')}
            rarity={'common'}
          >
            <SlotName>Щит</SlotName>
            <span>Не экипировано</span>
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="hands" 
            onClick={() => handleSlotClick('handArmor')}
            rarity={equipped.handArmor ? equipped.handArmor.rarity : 'common'}
          >
            <SlotName>Руки</SlotName>
            {equipped.handArmor ? (
              <>
                <ItemIcon type="armor" />
                <ItemName rarity={equipped.handArmor.rarity}>{equipped.handArmor.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="legs" 
            onClick={() => handleSlotClick('legArmor')}
            rarity={equipped.legArmor ? equipped.legArmor.rarity : 'common'}
          >
            <SlotName>Ноги</SlotName>
            {equipped.legArmor ? (
              <>
                <ItemIcon type="armor" />
                <ItemName rarity={equipped.legArmor.rarity}>{equipped.legArmor.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="acc1" 
            onClick={() => handleSlotClick('accessory1')}
            rarity={equipped.accessory1 ? equipped.accessory1.rarity : 'common'}
          >
            <SlotName>Аксессуар 1</SlotName>
            {equipped.accessory1 ? (
              <>
                <ItemIcon type="accessory" />
                <ItemName rarity={equipped.accessory1.rarity}>{equipped.accessory1.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="acc2" 
            onClick={() => handleSlotClick('accessory2')}
            rarity={equipped.accessory2 ? equipped.accessory2.rarity : 'common'}
          >
            <SlotName>Аксессуар 2</SlotName>
            {equipped.accessory2 ? (
              <>
                <ItemIcon type="accessory" />
                <ItemName rarity={equipped.accessory2.rarity}>{equipped.accessory2.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="art1" 
            onClick={() => handleSlotClick('artifact1')}
            rarity={equipped.artifact1 ? equipped.artifact1.rarity : 'common'}
          >
            <SlotName>Артефакт 1</SlotName>
            {equipped.artifact1 ? (
              <>
                <ItemIcon type="artifact" />
                <ItemName rarity={equipped.artifact1.rarity}>{equipped.artifact1.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="art2" 
            onClick={() => handleSlotClick('artifact2')}
            rarity={equipped.artifact2 ? equipped.artifact2.rarity : 'common'}
          >
            <SlotName>Артефакт 2</SlotName>
            {equipped.artifact2 ? (
              <>
                <ItemIcon type="artifact" />
                <ItemName rarity={equipped.artifact2.rarity}>{equipped.artifact2.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
        </EquipmentDisplay>
        
        {/* Секция инвентаря */}
        <div style={{ marginTop: '20px' }}>
          <SectionTitle>Инвентарь</SectionTitle>
          
          <FilterButtons>
            <FilterButton 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              Все
            </FilterButton>
            <FilterButton 
              className={filter === 'weapon' ? 'active' : ''} 
              onClick={() => setFilter('weapon')}
            >
              Оружие
            </FilterButton>
            <FilterButton 
              className={filter === 'armor' ? 'active' : ''} 
              onClick={() => setFilter('armor')}
            >
              Броня
            </FilterButton>
            <FilterButton 
              className={filter === 'accessory' ? 'active' : ''} 
              onClick={() => setFilter('accessory')}
            >
              Аксессуары
            </FilterButton>
            <FilterButton 
              className={filter === 'artifact' ? 'active' : ''} 
              onClick={() => setFilter('artifact')}
            >
              Артефакты
            </FilterButton>
          </FilterButtons>
          
          <InventoryGrid>
            {state.player.inventory.items
              .filter(item => {
                if (filter === 'all') return true;
                return item.type === filter;
              })
              .map((item, index) => (
                <ItemSlot 
                  key={`${item.id}-${index}`}
                  rarity={item.rarity || 'common'}
                  className={item.equipped ? 'equipped' : ''}
                  onClick={() => handleItemClick(item)}
                >
                  <ItemIcon type={item.type || 'material'} />
                  <ItemName rarity={item.rarity || 'common'}>{item.name}</ItemName>
                </ItemSlot>
              ))}
          </InventoryGrid>
        </div>
      </div>
      
      <StatsPanel>
        <SectionTitle>Бонусы экипировки</SectionTitle>
        
        {/* Панель управления выбранным предметом */}
        {selectedEquippedItem && (
          <div>
            <h4>Выбранный предмет: {selectedEquippedItem.name}</h4>
            <UnequipButton onClick={handleUnequipItem}>
              Снять предмет
            </UnequipButton>
            <div style={{ marginTop: '10px' }}>
              <DropButton onClick={handleDropItem}>
                Выбросить
              </DropButton>
            </div>
          </div>
        )}
        
        {/* Отображаем информацию о выбранном предмете из инвентаря */}
        {selectedInventoryItem && !selectedInventoryItem.equipped && (
          <div>
            <h4>Выбранный предмет: {selectedInventoryItem.name}</h4>
            <div style={{ marginTop: '10px' }}>
              <DropButton onClick={handleDropItem}>
                Выбросить
              </DropButton>
            </div>
          </div>
        )}
        
        {state.player.equipmentBonuses && (
          <>
            {/* Бонусы характеристик */}
            <div>
              <h4>Базовые характеристики</h4>
              <StatGrid>
                {Object.entries(state.player.equipmentBonuses.stats || {}).map(([stat, value]) => (
                  <StatItem key={stat} value={value}>
                    <span>
                      {stat === 'strength' ? 'Сила' :
                       stat === 'dexterity' ? 'Ловкость' :
                       stat === 'vitality' ? 'Выносливость' :
                       stat === 'intelligence' ? 'Интеллект' :
                       stat === 'perception' ? 'Восприятие' :
                       stat === 'luck' ? 'Удача' : stat}
                    </span>
                    <span>{value > 0 ? '+' : ''}{value}</span>
                  </StatItem>
                ))}
              </StatGrid>
            </div>
            
            {/* Боевые характеристики */}
            <div>
              <h4>Боевые характеристики</h4>
              <StatGrid>
                {Object.entries(state.player.equipmentBonuses.combat || {}).map(([stat, value]) => (
                  <StatItem key={stat} value={value}>
                    <span>
                      {stat === 'physicalDamage' ? 'Физический урон' :
                       stat === 'magicDamage' ? 'Магический урон' :
                       stat === 'physicalDefense' ? 'Физическая защита' :
                       stat === 'magicDefense' ? 'Магическая защита' :
                       stat === 'critChance' ? 'Шанс крит. удара' :
                       stat === 'critDamage' ? 'Урон от крит. удара' :
                       stat === 'dodgeChance' ? 'Шанс уклонения' : stat}
                    </span>
                    <span>
                      {value > 0 ? '+' : ''}{value}
                      {['critChance', 'critDamage', 'dodgeChance'].includes(stat) ? '%' : ''}
                    </span>
                  </StatItem>
                ))}
              </StatGrid>
            </div>
          </>
        )}
      </StatsPanel>
    </Container>
  );
}

export default EquipmentTab;
