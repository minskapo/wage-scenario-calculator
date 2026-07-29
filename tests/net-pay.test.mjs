import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateNetPay } from '../js/calc/net-pay.js';
import { taxRules } from '../js/data/tax-rules.js';

test('calculateNetPay: 월 300만원(과세), 부양가족 1인 기준', () => {
  const items = [{ name: '기본급', amount: 3000000, taxable: true }];
  const result = calculateNetPay(items, 1, taxRules);

  assert.equal(result.totalWage, 3000000);
  assert.equal(result.taxableGross, 3000000);
  assert.equal(result.nonTaxable, 0);
  assert.equal(result.insurance.nationalPension, 142500);
  assert.equal(result.insurance.healthInsurance, 107850);
  assert.equal(result.insurance.longTermCare, 13960);
  assert.equal(result.insurance.employmentInsurance, 27000);
  assert.equal(result.insurance.total, 291310);
  assert.equal(result.tax.incomeTax, 133000);
  assert.equal(result.tax.localIncomeTax, 13300);
  assert.equal(result.tax.total, 146300);
  assert.equal(result.totalDeduction, 437610);
  assert.equal(result.netPay, 2562390);
});

test('calculateNetPay: 청년 소득세 감면(소득세 90%, 연 200만원 한도) 적용 시 실수령액이 늘어난다', () => {
  const items = [{ name: '기본급', amount: 3000000, taxable: true }];
  const result = calculateNetPay(items, 1, taxRules, { youthTaxReduction: true });

  assert.equal(result.insurance.total, 291310, '4대보험은 청년 감면과 무관하게 동일해야 함');
  assert.equal(result.tax.incomeTax, 13000);
  assert.equal(result.tax.localIncomeTax, 1300);
  assert.equal(result.tax.total, 14300);
  assert.equal(result.totalDeduction, 305610);
  assert.equal(result.netPay, 2694390);
});

test('calculateNetPay: 비과세 항목은 소득세·보험료 산정에서 제외되지만 총 임금에는 포함된다', () => {
  const items = [
    { name: '기본급', amount: 2800000, taxable: true },
    { name: '식대', amount: 200000, taxable: false },
  ];
  const result = calculateNetPay(items, 1, taxRules);

  assert.equal(result.totalWage, 3000000);
  assert.equal(result.taxableGross, 2800000);
  assert.equal(result.nonTaxable, 200000);
  assert.equal(result.netPay, result.totalWage - result.totalDeduction);
});
