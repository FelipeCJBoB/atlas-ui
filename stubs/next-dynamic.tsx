import * as React from 'react';
export default function dynamic(loader: any, opts: any = {}) {
  const L = React.lazy(async () => { const m = await loader(); return { default: m.default || m }; });
  return (props: any) => <React.Suspense fallback={opts.loading ? React.createElement(opts.loading) : null}><L {...props} /></React.Suspense>;
}
