function floorTo(value, unit) {
  // Compensate for IEEE-754 floating-point imprecision, e.g. 3000000 * 0.009
  // evaluates to 26999.999999999996 in JS, which would incorrectly floor
  // down a full unit without this epsilon nudge.
  const epsilon = 1e-9;
  return Math.floor((value + epsilon * unit) / unit) * unit;
}

function findBracket(brackets, amount) {
  return brackets.find((b) => amount <= b.upTo);
}

export function sumTotalWage(items) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function sumTaxableGross(items) {
  return items.filter((item) => item.taxable).reduce((sum, item) => sum + item.amount, 0);
}

export function sumNonTaxable(items) {
  return items.filter((item) => !item.taxable).reduce((sum, item) => sum + item.amount, 0);
}

export function calcInsurance(monthlyTaxableGross, taxRules) {
  const { insurance } = taxRules;
  const pensionBase = Math.min(
    Math.max(monthlyTaxableGross, insurance.nationalPensionFloor),
    insurance.nationalPensionCap
  );
  const nationalPension = floorTo(pensionBase * insurance.nationalPensionRate, 10);
  const healthInsurance = floorTo(monthlyTaxableGross * insurance.healthInsuranceRate, 10);
  const longTermCare = floorTo(healthInsurance * insurance.longTermCareRateOfHealth, 10);
  const employmentInsurance = floorTo(monthlyTaxableGross * insurance.employmentInsuranceRate, 10);
  const total = nationalPension + healthInsurance + longTermCare + employmentInsurance;
  return { nationalPension, healthInsurance, longTermCare, employmentInsurance, total };
}

// 중소기업 취업 청년 소득세 감면(조세특례제한법 제30조): 취업일로부터 5년간 소득세의 90% 감면,
// 과세기간(연간)당 200만원 한도. 지방소득세는 감면된 소득세의 10%이므로 자동으로 함께 감면됩니다.
const YOUTH_TAX_REDUCTION_RATE = 0.9;
const YOUTH_TAX_REDUCTION_ANNUAL_CAP = 2000000;

export function calcIncomeTax(monthlyTaxableGross, dependents, taxRules, options = {}) {
  const { incomeTax } = taxRules;
  const annualGross = monthlyTaxableGross * 12;

  const deductionBracket = findBracket(incomeTax.earnedIncomeDeductionBrackets, annualGross);
  const earnedIncomeDeduction =
    deductionBracket.base + (annualGross - deductionBracket.from) * deductionBracket.rate;
  const earnedIncomeAmount = annualGross - earnedIncomeDeduction;

  const personalDeduction = dependents * incomeTax.personalDeductionPerPerson;
  const taxBase = Math.max(earnedIncomeAmount - personalDeduction, 0);

  const taxBracket = findBracket(incomeTax.taxBrackets, taxBase);
  const calculatedTax = taxBracket.base + (taxBase - taxBracket.from) * taxBracket.rate;

  const credit =
    calculatedTax <= incomeTax.earnedIncomeTaxCreditLowMax
      ? calculatedTax * incomeTax.earnedIncomeTaxCreditLowRate
      : incomeTax.earnedIncomeTaxCreditLowBase +
        (calculatedTax - incomeTax.earnedIncomeTaxCreditLowMax) * incomeTax.earnedIncomeTaxCreditHighRate;

  const limitCfg = incomeTax.earnedIncomeTaxCreditLimit;
  const creditLimit =
    annualGross <= limitCfg.tier1Max
      ? limitCfg.tier1Limit
      : annualGross <= limitCfg.tier2Max
      ? Math.max(limitCfg.tier2Base - (annualGross - limitCfg.tier1Max) * limitCfg.tier2Rate, limitCfg.tier2Min)
      : Math.max(limitCfg.tier3Base - (annualGross - limitCfg.tier2Max) * limitCfg.tier3Rate, limitCfg.tier3Min);

  const finalCredit = Math.min(credit, creditLimit);
  let annualFinalTax = Math.max(calculatedTax - finalCredit, 0);

  if (options.youthTaxReduction) {
    const reduction = Math.min(annualFinalTax * YOUTH_TAX_REDUCTION_RATE, YOUTH_TAX_REDUCTION_ANNUAL_CAP);
    annualFinalTax -= reduction;
  }

  const incomeTaxMonthly = floorTo(annualFinalTax / 12, 1000);
  const localIncomeTaxMonthly = floorTo(incomeTaxMonthly * taxRules.localIncomeTaxRate, 10);

  return {
    incomeTax: incomeTaxMonthly,
    localIncomeTax: localIncomeTaxMonthly,
    total: incomeTaxMonthly + localIncomeTaxMonthly,
  };
}

export function calculateNetPay(items, dependents, taxRules, options = {}) {
  const totalWage = sumTotalWage(items);
  const taxableGross = sumTaxableGross(items);
  const nonTaxable = sumNonTaxable(items);

  const insurance = calcInsurance(taxableGross, taxRules);
  const tax = calcIncomeTax(taxableGross, dependents, taxRules, options);

  const totalDeduction = insurance.total + tax.total;
  const netPay = totalWage - totalDeduction;

  return { totalWage, taxableGross, nonTaxable, insurance, tax, totalDeduction, netPay };
}
