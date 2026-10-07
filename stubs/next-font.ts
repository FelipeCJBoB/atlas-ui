// Substituto de next/font/google: as fontes reais são embutidas via @font-face no CSS final
const make = (family: string) => () => ({
  className: '',
  variable: '',
  style: { fontFamily: `'${family}', system-ui, sans-serif` },
});
export const Tourney = make('Tourney');
export const Inter = make('Inter Variable');
export const Space_Grotesk = make('Space Grotesk Variable');
export const JetBrains_Mono = make('JetBrains Mono Variable');
