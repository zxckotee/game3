import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchUserPets } from '../redux/actions/spiritPetsActions';

/**
 * Компонент, отвечающий за инициализацию данных игры
 * при загрузке приложения. Загружает необходимые данные из API
 * и диспетчеризирует их в Redux-хранилище.
 */
const GameInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Инициализируем данные игры при монтировании компонента
    const initializeGameData = async () => {
      try {
        // Загружаем питомцев пользователя
        await dispatch(fetchUserPets());
        
        // Здесь можно добавить другие действия инициализации
        // например, загрузку инвентаря, квестов, и т.д.
        
        console.log('Игровые данные успешно инициализированы');
      } catch (error) {
        console.error('Ошибка при инициализации игровых данных:', error);
      }
    };

    initializeGameData();
  }, [dispatch]);

  // Этот компонент не рендерит никакой UI
  return null;
};

export default GameInitializer;