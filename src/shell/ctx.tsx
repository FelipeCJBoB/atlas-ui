import { createContext, useContext } from 'react';
export type StageTheme = 'dark' | 'light';
// Instância única: os bundles de cada biblioteca (carregados sob demanda) e o shell precisam enxergar o MESMO contexto.
const W = window as any;
export const StageThemeCtx = (W.__STC ||= createContext<StageTheme>('dark')) as React.Context<StageTheme>;
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const useStageTheme = () => useContext(StageThemeCtx);
