import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taxRules } from '../js/data/tax-rules.js';

test('taxRules has required insurance rates', () => {
  assert.equal(taxRules.insurance.nationalPensionRate, 0.0475);
  assert.equal(taxRules.insurance.healthInsuranceRate, 0.03595);
  assert.equal(taxRules.insurance.longTermCareRateOfHealth, 0.1295);
  assert.equal(taxRules.insurance.employmentInsuranceRate, 0.009);
});

test('taxRules income tax brackets cover from 0 to Infinity without gaps', () => {
  const brackets = taxRules.incomeTax.taxBrackets;
  assert.equal(brackets[0].from, 0);
  assert.equal(brackets[brackets.length - 1].upTo, Infinity);
  for (let i = 1; i < brackets.length; i++) {
    assert.equal(brackets[i].from, brackets[i - 1].upTo, `gap between bracket ${i - 1} and ${i}`);
  }
});
