# Исправление проблемы с обновлением relationships в SocialTab

## Проблема

При взаимодействии с NPC в социальной вкладке изменения отношений сохранялись на сервере, но не обновлялись в Redux состоянии. При переключении между вкладками локальное состояние `selectedCharacter` терялось, и пользователь видел старые данные до перезагрузки страницы.

## Корень проблемы

1. **Отсутствующее действие**: В `SocialTab.js` вызывалось `actions.updateSocialRelationships()`, но это действие не было определено в `GameContextProvider.js`
2. **Неправильная синхронизация**: Локальное состояние `selectedCharacter` не синхронизировалось с обновленными данными из Redux
3. **Недостаточное логирование**: Было сложно отследить, где именно происходила потеря данных

## Внесенные изменения

### 1. Добавлено действие `updateSocialRelationships` в GameContextProvider.js

```javascript
// Действие для обновления всех социальных отношений (используется в SocialTab)
updateSocialRelationships: (relationships) => {
  console.log('[GameContext] Обновление всех социальных отношений:', relationships);
  dispatch({ type: ACTION_TYPES.UPDATE_SOCIAL_RELATIONSHIPS, payload: relationships });
},
```

### 2. Улучшена логика обработки взаимодействий в SocialTab.js

- **Добавлено подробное логирование** для отслеживания процесса обновления
- **Улучшена синхронизация локального состояния** с Redux:
  ```javascript
  // Находим обновленного персонажа в новом массиве для синхронизации локального состояния
  const updatedCharacterFromArray = result.allRelationships.find(rel => rel.id === selectedCharacter.id);
  if (updatedCharacterFromArray) {
    console.log('[SocialTab] Синхронизируем локальное состояние с Redux:', updatedCharacterFromArray);
    setSelectedCharacter(updatedCharacterFromArray);
  }
  ```

### 3. Добавлен useEffect для автоматической синхронизации

```javascript
// Эффект для синхронизации selectedCharacter с обновленными данными из Redux
useEffect(() => {
  if (selectedCharacter && Array.isArray(relationships)) {
    const updatedCharacter = relationships.find(rel => rel.id === selectedCharacter.id);
    if (updatedCharacter && updatedCharacter !== selectedCharacter) {
      console.log('[SocialTab] Синхронизация selectedCharacter с Redux:', updatedCharacter);
      setSelectedCharacter(updatedCharacter);
    }
  }
}, [relationships, selectedCharacter]);
```

### 4. Улучшено логирование получения relationships

Добавлено подробное логирование процесса получения данных об отношениях из различных источников для лучшей отладки.

### 5. Добавлена прокрутка для истории взаимодействий

```javascript
const EventList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  padding-right: 8px;
  
  /* Стилизованный скроллбар в стиле игры */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    border-radius: 3px;
  }
`;
```

## Результат

Теперь при взаимодействии с NPC:

1. ✅ **Данные сохраняются на сервере** через API
2. ✅ **Redux состояние обновляется** через `updateSocialRelationships`
3. ✅ **Локальное состояние синхронизируется** с Redux автоматически
4. ✅ **Изменения сохраняются** при переключении между вкладками
5. ✅ **Подробное логирование** помогает отслеживать процесс обновления

## Файлы, которые были изменены

- `src/context/GameContextProvider.js` - добавлено действие `updateSocialRelationships`
- `src/components/tabs/SocialTab.js` - улучшена логика синхронизации и добавлено логирование

## Связанные компоненты

- `src/context/actions/actionTypes.js` - содержит `UPDATE_SOCIAL_RELATIONSHIPS` (уже существовал)
- `src/context/reducers/playerReducer.js` - обрабатывает `UPDATE_SOCIAL_RELATIONSHIPS` (уже работал корректно)
- `src/context/middleware/relationshipsMiddleware.js` - отслеживает изменения relationships для синхронизации с сервером