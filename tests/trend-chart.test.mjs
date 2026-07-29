import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDomain, scalePoint, computeYTicks } from '../js/charts/trend-chart.js';

test('computeDomain: y축 최소값은 0 이하로, 최대값은 10% 여유를 둔다', () => {
  const series = [{ data: [{ x: 2020, y: 2 }, { x: 2021, y: 8 }] }];
  const domain = computeDomain(series);
  assert.equal(domain.xMin, 2020);
  assert.equal(domain.xMax, 2021);
  assert.equal(domain.yMin, 0);
  assert.equal(domain.yMax, 8.8);
});

test('scalePoint: 도메인 좌표를 픽셀 좌표로 변환한다', () => {
  const domain = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
  const range = { left: 0, right: 100, top: 0, bottom: 100 };
  const result = scalePoint({ x: 5, y: 5 }, domain, range);
  assert.equal(result.px, 50);
  assert.equal(result.py, 50);
});

test('computeYTicks: y축 최소/최대 사이를 균등한 개수로 나눈다', () => {
  assert.deepEqual(computeYTicks(0, 10, 5), [0, 2.5, 5, 7.5, 10]);
  assert.deepEqual(computeYTicks(0, 8.8, 3), [0, 4.4, 8.8]);
});
