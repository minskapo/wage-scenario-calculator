import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDomain, scalePoint } from '../js/charts/trend-chart.js';

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
