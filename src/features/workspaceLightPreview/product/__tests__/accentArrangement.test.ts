import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  arrangeAccents,
  findAccentClashes,
} from '../workspaceAccentArrangement';

describe('arrangeAccents', () => {
  for (let count = 1; count <= 12; count += 1) {
    for (let columns = 1; columns <= 4; columns += 1) {
      it(`avoids left, above, and parent clashes for count=${count} columns=${columns}`, () => {
        const accents = arrangeAccents(count, { columns, parent: 'violet' });
        const problems = findAccentClashes(accents, { columns, parent: 'violet' });
        assert.deepEqual(problems, []);
      });
    }
  }

  it('findAccentClashes catches a deliberately bad horizontal sequence', () => {
    const problems = findAccentClashes(['emerald', 'emerald'], { columns: 2 });
    assert.ok(problems.some((problem) => problem.includes('left')));
  });

  it('findAccentClashes catches a deliberately bad parent match', () => {
    const problems = findAccentClashes(['violet'], { parent: 'violet' });
    assert.ok(problems.some((problem) => problem.includes('parent')));
  });
});
