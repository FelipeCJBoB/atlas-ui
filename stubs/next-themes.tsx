import * as React from 'react';
import { StageThemeCtx } from '../src/shell/ctx';
// Substituto de next-themes: o tema vem do palco (stage) em que o componente está montado
export const useTheme = () => {
  const t = React.useContext(StageThemeCtx);
  return { theme: t, resolvedTheme: t, systemTheme: t, themes: ['light', 'dark'], forcedTheme: undefined, setTheme: (_: any) => {} };
};
export const ThemeProvider = ({ children }: any) => <>{children}</>;
