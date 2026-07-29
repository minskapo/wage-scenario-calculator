import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wageTable } from '../js/data/wage-table.js';
import { referenceData } from '../js/data/reference-data.js';

test('wageTable has 5 grades, each with taxable/non-taxable items', () => {
  assert.equal(wageTable.length, 5);
  wageTable.forEach((grade) => {
    assert.ok(typeof grade.grade === 'string' && grade.grade.length > 0);
    assert.ok(Array.isArray(grade.items) && grade.items.length > 0);
    grade.items.forEach((item) => {
      assert.ok(typeof item.name === 'string');
      assert.ok(typeof item.amount === 'number');
      assert.ok(typeof item.taxable === 'boolean');
    });
  });
});

test('every grade shares the same item names (needed for table columns)', () => {
  const firstNames = wageTable[0].items.map((i) => i.name).sort();
  wageTable.forEach((grade) => {
    assert.deepEqual(grade.items.map((i) => i.name).sort(), firstNames);
  });
});

test('referenceData has all four reference datasets populated', () => {
  assert.ok(referenceData.minimumWage.length >= 5);
  assert.ok(referenceData.cpi.length >= 5);
  assert.ok(referenceData.industryAverageIncrease.length >= 3);
  assert.ok(referenceData.unionWageHistory.length >= 1);
  assert.ok(Array.isArray(referenceData.companyFinancials));
});
