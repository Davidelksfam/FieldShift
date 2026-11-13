import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('published tokens match the canonical approved brand',()=>assert.equal(readFileSync(new URL('../src/app/tokens.css',import.meta.url),'utf8'),readFileSync(new URL('../../docs/brand/tokens.css',import.meta.url),'utf8')));
