// Starts the API (server/) and the website (client/) together: `npm run dev`
// No extra packages needed. Press Ctrl+C to stop both.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

for (const dir of ['server', 'client']) {
  if (!existsSync(`${dir}/node_modules`)) {
    console.error(`Dependencies missing in ${dir}/. Run: npm run install:all`);
    process.exit(1);
  }
}
if (!existsSync('server/.env')) {
  console.error('server/.env not found. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

const procs = [
  ['api', 'server', '\x1b[36m'],
  ['web', 'client', '\x1b[35m'],
].map(([name, dir, colour]) => {
  const child = spawn(npm, ['run', 'dev', '--prefix', dir], { shell: process.platform === 'win32' });
  const tag = `${colour}[${name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on('data', (buf) => buf.toString().split(/\r?\n/).filter(Boolean).forEach((l) => out.write(tag + l + '\n')));
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${tag}stopped (code ${code})`);
    procs.forEach((p) => p.kill());
    process.exit(code ?? 0);
  });
  return child;
});

process.on('SIGINT', () => procs.forEach((p) => p.kill()));
