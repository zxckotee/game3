// Заглушка для react-redux
export const useSelector = (selector) => {
  // Возвращаем пустой объект по умолчанию
  return {};
};

export const useDispatch = () => {
  // Возвращаем функцию, которая ничего не делает
  return () => {};
};

export const Provider = ({ children }) => {
  // Просто возвращаем дочерние компоненты
  return children;
};