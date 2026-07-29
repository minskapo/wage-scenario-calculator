import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wageTable, previousBaseWageByGrade } from '../js/data/wage-table.js';
import { referenceData } from '../js/data/reference-data.js';

test('wageTable has 8 grades, each with taxable/non-taxable items', () => {
  assert.equal(wageTable.length, 8);
  wageTable.forEach((grade) => {
    assert.ok(typeof grade.grade === 'string' && grade.grade.length > 0);
    assert.ok(Array.isArray(grade.items) && grade.items.length > 0);
    grade.items.forEach((item) => {
      assert.ok(typeof item.name === 'string');
      assert.ok(typeof item.amount === 'number');
      assert.ok(typeof item.annualAmount === 'number');
      assert.ok(typeof item.taxable === 'boolean');
    });
  });
});

test('previousBaseWageByGrade covers the 5 official grades with previous/current annual base pay', () => {
  assert.equal(previousBaseWageByGrade.length, 5);
  previousBaseWageByGrade.forEach((row) => {
    assert.ok(typeof row.grade === 'string' && row.grade.length > 0);
    assert.ok(typeof row.previousAnnualBase === 'number');
    assert.ok(typeof row.currentAnnualBase === 'number');
    assert.ok(row.currentAnnualBase > row.previousAnnualBase);
  });
});

test('every grade shares the same item names (needed for table columns)', () => {
  const firstNames = wageTable[0].items.map((i) => i.name).sort();
  wageTable.forEach((grade) => {
    assert.deepEqual(grade.items.map((i) => i.name).sort(), firstNames);
  });
});

test('referenceData has the reference datasets populated', () => {
  assert.ok(referenceData.minimumWage.length >= 5);
  assert.ok(referenceData.cpi.length >= 5);
  assert.ok(referenceData.industryAverageIncrease.length >= 3);
  assert.ok(referenceData.unionWageHistory.length >= 1);
});
