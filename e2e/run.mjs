import { run } from './harness.mjs'; import './specs.mjs'; import './specs2.mjs';
const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2] : undefined;
await run({ only });
