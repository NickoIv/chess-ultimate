import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../review-core.js', import.meta.url), 'utf8');
const sandbox = { window: {} }; vm.createContext(sandbox); vm.runInContext(source, sandbox);
const R = sandbox.window.ReviewLogic;
const cases = [
  [8, { type: 'cp', value: 20 }, { type: 'cp', value: 12 }, 'BEST'],
  [58, { type: 'cp', value: 70 }, { type: 'cp', value: 12 }, 'GOOD'],
  [170, { type: 'cp', value: 90 }, { type: 'cp', value: -80 }, 'MISTAKE'],
  [450, { type: 'cp', value: 180 }, { type: 'cp', value: -270 }, 'BLUNDER'],
  [20, { type: 'mate', value: 3 }, { type: 'cp', value: 10 }, 'BLUNDER']
];
for (const [loss, best, played, expected] of cases) {
  const actual = R.label(loss, best, played);
  if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`);
}
console.log('PASS: review classifications and mate-loss protection are deterministic.');
