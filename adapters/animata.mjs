// Animata: catálogo vem dos Storybook *.stories.tsx (Primary args/render/decorators).
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, vendorDir, walk, title } from '../build/common.mjs';
import { applyOverride } from './util.mjs';

export const id = 'animata';
const WIDE = /^(bento grid|hero|section|carousel)$/i;

export function generate() {
  const vd = vendorDir(id);
  const files = walk(join(vd, 'animata')).filter((f) => f.endsWith('.stories.tsx')).sort();
  const meta = [];
  const imports = [];
  files.forEach((f) => {
    const rel = relative(vd, f).replace(/\\/g, '/');                       // animata/text/typing-text.stories.tsx
    const eid = rel.replace(/^animata\//, '').replace(/\.stories\.tsx$/, ''); // text/typing-text
    const t = readFileSync(f, 'utf8');
    const storyTitle = (t.match(/title:\s*["'`]([^"'`]+)["'`]/) || [])[1] || title(eid);
    const [cat, ...rest] = storyTitle.split('/');
    const layout = (t.match(/layout:\s*["'`](\w+)["'`]/) || [])[1] || 'centered';
    const comp = rel.replace('.stories.tsx', '.tsx');
    const css = rel.replace('.stories.tsx', '.css');
    const srcFiles = [comp, css, rel].filter((p) => existsSync(join(vd, p)));
    let e = { uid: `${id}:${eid}`, lib: id, id: eid, category: title(eid.split('/')[0]), name: rest.join('/').trim() || title(eid.split('/').pop()), layout, kind: 'story', wide: WIDE.test(title(eid.split('/')[0])) || layout === 'fullscreen', files: srcFiles, flags: [] };
    meta.push(applyOverride(e));
    imports.push(rel.replace(/\.tsx$/, ''));
  });
  const kept = meta.filter((m) => !m.exclude);
  const idx = new Map(meta.map((m, i) => [m.uid, i]));
  const lines = [];
  const items = [];
  meta.forEach((m, i) => {
    if (m.exclude) return;
    lines.push(`import * as s${i} from '../../vendor/${id}/${imports[i]}';`);
    items.push(`  { ...M[${i}], mod: s${i} as any },`);
  });
  mkdirSync(join(ROOT, 'src/gen'), { recursive: true });
  writeFileSync(join(ROOT, 'src/gen/animata.gen.tsx'), `// @ts-nocheck — gerado por adapters/animata.mjs\nimport M from './animata.meta.json';\n${lines.join('\n')}\nexport const RAW = [\n${items.join('\n')}\n];\n`);
  writeFileSync(join(ROOT, 'src/gen/animata.meta.json'), JSON.stringify(meta));
  return kept.length;
}
