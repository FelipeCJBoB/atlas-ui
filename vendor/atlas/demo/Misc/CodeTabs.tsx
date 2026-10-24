// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import CodeTabs from '../../componentes/code-tabs/CodeTabs';

// Conteúdo de exemplo da demo.
const CONFIG = `{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "shadcn@canary", "registry:mcp"],
      "env": {
        "REGISTRY_URL": "@animate-ui/registry.json"
      }
    }
  }
}`;

const CODES = {
  Cursor: `// Copy and paste the code into .cursor/mcp.json\n${CONFIG}`,
  Windsurf: `// Copy and paste the code into .codeium/windsurf/mcp_config.json\n${CONFIG}`,
};

export default function CodeTabsDemo() {
  return (
    <div className="relative w-full h-full min-h-[360px] flex items-center justify-center p-4">
      <div style={{ width: '100%', maxWidth: 560 }}>
        <CodeTabs codes={CODES} lang="json" />
      </div>
    </div>
  );
}
