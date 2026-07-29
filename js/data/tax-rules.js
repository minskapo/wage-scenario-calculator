// 2026년 7월~2027년 6월 기준 4대보험 요율/국민연금 상하한액.
// 출처: 국민연금공단(nps.or.kr) 2026.7 기준소득월액 상하한 고시, 2026년 4대보험 요율 안내(고용노동부 발표 기준 정리자료).
// 근로소득세 계산은 국세청 근로소득 간이세액표 산출에 쓰이는 계산식(근로소득공제 → 인적공제 → 종합소득세율표 → 근로소득세액공제)을 재현한 것으로,
// 실제 간이세액표 조견표 값과 약간의 차이가 있을 수 있는 근사치입니다.
export const taxRules = {
  year: 2026,
  effectivePeriod: '2026-07 ~ 2027-06',
  insurance: {
    nationalPensionRate: 0.0475,
    nationalPensionFloor: 410000,
    nationalPensionCap: 6590000,
    healthInsuranceRate: 0.03595,
    longTermCareRateOfHealth: 0.1295,
    employmentInsuranceRate: 0.009,
  },
  incomeTax: {
    personalDeductionPerPerson: 1500000,
    earnedIncomeDeductionBrackets: [
      { from: 0, upTo: 5000000, base: 0, rate: 0.7 },
      { from: 5000000, upTo: 15000000, base: 3500000, rate: 0.4 },
      { from: 15000000, upTo: 45000000, base: 7500000, rate: 0.15 },
      { from: 45000000, upTo: 100000000, base: 12000000, rate: 0.05 },
      { from: 100000000, upTo: Infinity, base: 14750000, rate: 0.02 },
    ],
    taxBrackets: [
      { from: 0, upTo: 14000000, base: 0, rate: 0.06 },
      { from: 14000000, upTo: 50000000, base: 840000, rate: 0.15 },
      { from: 50000000, upTo: 88000000, base: 6240000, rate: 0.24 },
      { from: 88000000, upTo: 150000000, base: 15360000, rate: 0.35 },
      { from: 150000000, upTo: 300000000, base: 37060000, rate: 0.38 },
      { from: 300000000, upTo: 500000000, base: 94060000, rate: 0.4 },
      { from: 500000000, upTo: 1000000000, base: 174060000, rate: 0.42 },
      { from: 1000000000, upTo: Infinity, base: 384060000, rate: 0.45 },
    ],
    earnedIncomeTaxCreditLowMax: 1300000,
    earnedIncomeTaxCreditLowRate: 0.55,
    earnedIncomeTaxCreditHighRate: 0.3,
    earnedIncomeTaxCreditLowBase: 715000,
    earnedIncomeTaxCreditLimit: {
      tier1Max: 33000000,
      tier1Limit: 740000,
      tier2Max: 70000000,
      tier2Base: 740000,
      tier2Rate: 0.008,
      tier2Min: 660000,
      tier3Base: 660000,
      tier3Rate: 0.5,
      tier3Min: 500000,
    },
  },
  localIncomeTaxRate: 0.1,
};
