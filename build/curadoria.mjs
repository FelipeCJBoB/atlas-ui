// Curadoria (scripts/curadoria.mjs + triagem): quais componentes ficam fora do Atlas.
// Decisão final por uid = curadoria/decisoes.json (manual) > curadoria/proposta.json (automática).
// Limítrofe ainda sem decisão manual fica DENTRO (conservador). Sem proposta.json, nada é filtrado.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './common.mjs';

const ler = (f) => { const p = join(ROOT, 'curadoria', f); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
const proposta = ler('proposta.json');
const decisoes = ler('decisoes.json') || {};
export const curadoriaAtiva = !!proposta && !process.argv.includes('--sem-curadoria');
export const decisao = (uid) => decisoes[uid] || (proposta?.[uid]?.d === 'drop' ? 'drop' : 'keep');
export const foraDaCuradoria = (uid) => curadoriaAtiva && proposta[uid] !== undefined && decisao(uid) === 'drop';
