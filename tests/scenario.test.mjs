import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAdjustments,
  addItem,
  applyScenarioToGrade,
  applyScenarioToWageTable,
} from '../js/calc/scenario.js';

const baseItems = [
  { name: '기본급', amount: 2500000, taxable: true },
  { name: '직책수당', amount: 200000, taxable: true },
  { name: '식대', amount: 200000, taxable: false },
];

test('applyAdjustments: 정률과 정액을 항목별로 다르게 적용', () => {
  const result = applyAdjustments(baseItems, [
    { itemName: '기본급', type: 'percent', value: 5 },
    { itemName: '직책수당', type: 'fixed', value: 10000 },
  ]);
  assert.equal(result.find((i) => i.name === '기본급').amount, 2625000);
  assert.equal(result.find((i) => i.name === '직책수당').amount, 210000);
  assert.equal(result.find((i) => i.name === '식대').amount, 200000);
  assert.equal(baseItems.find((i) => i.name === '기본급').amount, 2500000, '원본 배열은 변경되지 않아야 함');
});

test('addItem: 새 항목을 추가하고, 중복 이름은 에러를 던진다', () => {
  const result = addItem(baseItems, { name: '명절수당', amount: 100000, taxable: true });
  assert.equal(result.length, 4);
  assert.equal(result.find((i) => i.name === '명절수당').amount, 100000);
  assert.throws(() => addItem(baseItems, { name: '기본급', amount: 1, taxable: true }));
});

test('applyScenarioToGrade: 신설 항목 추가 후 인상 적용까지 한 번에 처리', () => {
  const scenario = {
    name: '조합안',
    adjustments: [{ itemName: '기본급', type: 'percent', value: 5 }],
    newItems: [{ name: '명절수당', amount: 100000, taxable: true }],
  };
  const result = applyScenarioToGrade(baseItems, scenario);
  assert.equal(result.length, 4);
  assert.equal(result.find((i) => i.name === '기본급').amount, 2625000);
  assert.equal(result.find((i) => i.name === '명절수당').amount, 100000);
});

test('applyScenarioToWageTable: 전체 직급표에 동일 시나리오를 일괄 적용', () => {
  const wageTable = [
    { grade: '1급', items: baseItems },
    { grade: '2급', items: [{ name: '기본급', amount: 3000000, taxable: true }] },
  ];
  const scenario = { name: '조합안', adjustments: [{ itemName: '기본급', type: 'percent', value: 10 }], newItems: [] };
  const result = applyScenarioToWageTable(wageTable, scenario);
  assert.equal(result[0].items.find((i) => i.name === '기본급').amount, 2750000);
  assert.equal(result[1].items.find((i) => i.name === '기본급').amount, 3300000);
});
