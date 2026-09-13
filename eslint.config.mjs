import nextVitals from 'eslint-config-next/core-web-vitals'
// Browser URL and theme hydration intentionally synchronize state on mount.
const config = [...nextVitals, { rules: { 'react/no-unescaped-entities': 'off', 'react-hooks/set-state-in-effect': 'warn' } }, { ignores: ['.next/**', 'node_modules/**', 'out/**'] }]
export default config
