// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useId, useRef, type CSSProperties } from 'react';
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger, useStageDark } from '../../componentes/tabs/AnimatedTabs';

type Field = { label: string; type?: string; defaultValue?: string };

function Panel({ title, description, fields, action, dark }: { title: string; description: string; fields: Field[]; action: string; dark: boolean }) {
  const uid = useId();
  const muted = dark ? '#a1a1a1' : '#737373';
  const inputStyle: CSSProperties = {
    height: 40, borderRadius: 10, padding: '0 12px', fontSize: 14, boxSizing: 'border-box', width: '100%',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : '#e5e5e5'}`,
    background: dark ? 'rgba(255,255,255,0.045)' : 'transparent',
    color: dark ? '#fafafa' : '#0a0a0a',
  };
  const btnVars = { '--btn-bg': dark ? '#fafafa' : '#0a0a0a' } as CSSProperties;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px' }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1 }}>{title}</div>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: muted }}>{description}</p>
      </div>
      {fields.map((f, i) => (
        <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label htmlFor={`${uid}-${i}`} style={{ fontSize: 14, fontWeight: 500, lineHeight: 1 }}>{f.label}</label>
          <input
            id={`${uid}-${i}`}
            type={f.type ?? 'text'}
            defaultValue={f.defaultValue}
            className="outline-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-visible:ring-[3px] focus-visible:ring-[#a1a1a1]/50"
            style={inputStyle}
          />
        </div>
      ))}
      <div>
        <button
          type="button"
          className="bg-(--btn-bg) hover:bg-(--btn-bg)/90 outline-none focus-visible:ring-[3px] focus-visible:ring-[#a1a1a1]/50"
          style={{ ...btnVars, height: 40, padding: '0 16px', borderRadius: 10, border: 0, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: dark ? '#0a0a0a' : '#fafafa' }}
        >
          {action}
        </button>
      </div>
    </div>
  );
}

export default function AnimatedTabsDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const dark = useStageDark(ref);

  return (
    <div ref={ref} className="relative w-full h-full min-h-[360px] flex items-center justify-center px-4 py-6">
      <Tabs defaultValue="account" style={{ width: '100%', maxWidth: 384, color: dark ? '#fafafa' : '#0a0a0a' }}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <div
          style={{
            background: dark ? '#171717' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : '#e5e5e5'}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <TabsContents style={{ padding: '24px 0' }}>
            <TabsContent value="account">
              <Panel
                dark={dark}
                title="Account"
                description="Make changes to your account here. Click save when you're done."
                fields={[{ label: 'Name', defaultValue: 'Pedro Duarte' }]}
                action="Save changes"
              />
            </TabsContent>
            <TabsContent value="password">
              <Panel
                dark={dark}
                title="Password"
                description="Change your password here. After saving, you'll be logged out."
                fields={[
                  { label: 'Current password', type: 'password' },
                  { label: 'New password', type: 'password' },
                ]}
                action="Save password"
              />
            </TabsContent>
          </TabsContents>
        </div>
      </Tabs>
    </div>
  );
}
