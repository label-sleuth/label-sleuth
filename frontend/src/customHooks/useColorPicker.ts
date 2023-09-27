import React from 'react';

export const useColorPicker = () => {
    const [colorPickerMenuOpenAnchorEl, setColorPickerMenuOpenAnchorEl] =
    React.useState<(EventTarget & globalThis.Element) | null>(null);

  const colorPickerMenuOpen = React.useMemo(
    () => Boolean(colorPickerMenuOpenAnchorEl),
    [colorPickerMenuOpenAnchorEl]
  );

    return {colorPickerMenuOpenAnchorEl, setColorPickerMenuOpenAnchorEl, colorPickerMenuOpen}
}

