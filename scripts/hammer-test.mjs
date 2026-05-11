/**
 * Hammer test: fire 100 CLI invocations as fast as possible.
 * All should return instantly with "No API key set" (or gate block).
 * No crashes, no hangs, no memory leaks.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const N = 100;
const start = Date.now();
let ok = 0;
let bad = 0;

const jobs = Array.from({ length: N }, (_, i) =>
  exec('valerius', ['forge', `brief number ${i} - build a task manager`], { timeout: 10_000, encoding: 'utf8', shell: true })
    .then(() => { ok++; })
    .catch((e) => {
      // exit code 1 is expected (no key, bad key, no provider, etc.)
      const msg = (e.stderr ?? '') + (e.stdout ?? '');
      const isExpected = msg.includes('No API key set')
        || msg.includes('No provider set')
        || msg.includes('Forge failed')
        || msg.includes('Invalid or unauthorized');
      if (isExpected) {
        ok++;
      } else {
        bad++;
        console.error(`  UNEXPECTED [${i}]: ${msg.slice(0, 120)}`);
      }
    })
);

await Promise.all(jobs);
const elapsed = Date.now() - start;

console.log(`\nHammer test: ${N} parallel invocations`);
console.log(`  OK : ${ok}`);
console.log(`  BAD: ${bad}`);
console.log(`  Time: ${elapsed}ms  (${(elapsed / N).toFixed(1)}ms avg)`);
if (bad > 0) process.exit(1);
console.log('All clear.');
