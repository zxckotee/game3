import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: ${props => props.size === 'small' ? '6px 12px' : props.size === 'large' ? '12px 20px' : '8px 16px'};
  background-color: ${props => 
    props.variant === 'primary' ? '#d4af37' : 
    props.variant === 'secondary' ? '#4a4a4a' : 
    props.variant === 'danger' ? '#c43b3b' : 
    props.variant === 'success' ? '#4a8f52' : 
    props.variant === 'warning' ? '#c49b3b' : 
    props.variant === 'info' ? '#3b7ac4' : 
    '#7e6839'
  };
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: ${props => props.size === 'small' ? '14px' : props.size === 'large' ? '18px' : '16px'};
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: background-color 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: ${props => 
      props.variant === 'primary' ? '#e8c347' : 
      props.variant === 'secondary' ? '#5a5a5a' : 
      props.variant === 'danger' ? '#d44c4c' : 
      props.variant === 'success' ? '#5aa062' : 
      props.variant === 'warning' ? '#d5ac4c' : 
      props.variant === 'info' ? '#4c8bd5' : 
      '#9a844f'
    };
    ${props => !props.disabled && 'transform: translateY(-1px);'}
  }

  &:active {
    ${props => !props.disabled && 'transform: translateY(1px);'}
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  ${props => props.fullWidth && 'width: 100%;'}
  ${props => props.className && props.className}
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Универсальный компонент кнопки
 */
const Button = ({ 
  children, 
  variant = 'default', 
  size = 'medium', 
  disabled = false, 
  fullWidth = false,
  icon,
  iconPosition = 'start',
  onClick,
  className,
  ...props 
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled}
      fullWidth={fullWidth}
      onClick={disabled ? undefined : onClick}
      className={className}
      {...props}
    >
      {icon && iconPosition === 'start' && <IconWrapper>{icon}</IconWrapper>}
      {children}
      {icon && iconPosition === 'end' && <IconWrapper>{icon}</IconWrapper>}
    </StyledButton>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'danger', 'success', 'warning', 'info']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['start', 'end']),
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default Button;
