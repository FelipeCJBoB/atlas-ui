import * as React from 'react';
import { StageThemeCtx } from '../../src/shell/ctx';
// Stubs dos wrappers do site do React Bits: só o preview real do componente é mantido
export const TabsLayout = ({ children }: any) => <>{children}</>;
export const PreviewTab = ({ children }: any) => <>{React.Children.toArray(children).filter((c: any) => !c?.type || (c.type !== Customize && c.type !== PropTable && c.type !== Dependencies))}</>;
export const CodeTab = () => null;
export const ComponentPropsProvider = ({ children }: any) => <>{children}</>;
export const Customize = () => null;
export const PropTable = () => null;
export const Dependencies = () => null;
export const CodeExample = () => null;
export const OpenInStudioButton = () => null;
export const RefreshButton = () => null;
export const BackgroundContent = () => null;
export const PreviewSlider = () => null;
export const PreviewSwitch = () => null;
export const PreviewSelect = () => null;
export const PreviewInput = () => null;
export const PreviewColorPickerCustom = () => null;
export function useForceRerender() { const [k, s] = React.useState(0); return [k, () => s((x) => x + 1)] as const; }
export const useComponentProps = (d: any) => ({ props: d, updateProp: () => {}, resetProps: () => {}, hasChanges: false });
export const useColorMode = () => { const t = React.useContext(StageThemeCtx); return { colorMode: t, setColorMode: () => {}, toggleColorMode: () => {} }; };
export const useColorModeValue = (light: any, dark: any) => (React.useContext(StageThemeCtx) === 'light' ? light : dark);
