import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Use the project-local Node version; do not change the user's system runtime.
const runtime = fileURLToPath(new URL('../node_modules/node/bin/node', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
const child = spawn(runtime, [cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
