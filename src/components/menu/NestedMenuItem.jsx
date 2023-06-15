import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowRight from '@mui/icons-material/ArrowRight';


const NestedMenuItem = React.forwardRef((props, ref) => {
  const {
    label,
    rightIcon = <ArrowRight style={{ fontSize: 16 }} />,
    children,
    className,
    tabIndex: tabIndexProp,
    ContainerProps: ContainerPropsProp = {},
    ...MenuItemProps
  } = props;

  const { ref: containerRefProp, ...ContainerProps } =
        ContainerPropsProp;

  const menuItemRef = React.useRef(null);
  React.useImperativeHandle(ref, () => menuItemRef.current);

  const containerRef = React.useRef(null);
  React.useImperativeHandle(
    containerRefProp,
    () => containerRef.current
  );

  const menuContainerRef = React.useRef(null);

  const [isSubMenuOpen, setIsSubMenuOpen] = React.useState(false);

  const handleMouseEnter = (event) => {
    setIsSubMenuOpen(true);

    if (ContainerProps?.onMouseEnter) {
      ContainerProps.onMouseEnter(event);
    }
  };

  const handleMouseLeave = (event) => {
    setIsSubMenuOpen(false);

    if (ContainerProps?.onMouseLeave) {
      ContainerProps.onMouseLeave(event);
    }
  };

  const handleFocus = (event) => {
    if (event.target === containerRef.current) {
      setIsSubMenuOpen(true);
    }

    if (ContainerProps?.onFocus) {
      ContainerProps.onFocus(event);
    }
  };

  let tabIndex;
  if (!props.disabled) {
    tabIndex = tabIndexProp !== undefined ? tabIndexProp : -1;
  }

  return (
    <div
      {...ContainerProps}
      ref={containerRef}
      onFocus={handleFocus}
      tabIndex={tabIndex}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <MenuItem
        {...MenuItemProps}
        data-open={!!isSubMenuOpen || undefined}
        className={className}
        ref={menuItemRef}
      >
        {label}
        <div style={{ flexGrow: 1 }} />
        {rightIcon}
      </MenuItem>
      <Menu
        hideBackdrop
        style={{ pointerEvents: 'none' }}
        anchorEl={menuItemRef.current}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        open={!!isSubMenuOpen}
        autoFocus={false}
        disableAutoFocus
        disableEnforceFocus
        onClose={() => {
          setIsSubMenuOpen(false);
        }}
      >
        <div ref={menuContainerRef} style={{ pointerEvents: 'auto' }}>
          {children}
        </div>
      </Menu>
    </div>
  );
});

export default NestedMenuItem;