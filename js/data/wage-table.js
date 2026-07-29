// 출처: [노사합동] 2026년 임금협약 (2026-04-01 체결, 사단법인 녹색전환연구소 / 녹색전환연구소노동조합), 별표1·별표2. 전문은 참고정보 탭에서 확인할 수 있습니다.
// 이 사업장은 호봉제가 아니며 직급 단위로 임금이 결정됩니다. 정식 직급: 선임연구원(1급, 2급), 연구원(1급, 2급, 3급).
//
// 각 항목의 annualAmount는 협약 원문(별표1·별표2)에 적힌 연 지급액 그대로입니다. amount는 4대보험·소득세 계산에
// 쓰이는 월 환산액(annualAmount ÷ 12, 원 단위 반올림)으로, 12를 곱해도 annualAmount와 몇 원 차이가 날 수 있습니다
// (예: 54,800,000 ÷ 12 = 4,566,666.67원). 화면에 연 단위 금액을 표시할 때는 amount*12가 아니라 annualAmount를
// 그대로 사용해야 협약 원문 숫자와 정확히 일치합니다.
//
// 팀장·부소장은 직급이 아니라 보직이며, 실제로는 모두 선임연구원 1급이 겸직합니다. 편의상 이 표에서는
// 선임연구원 1급 기본급에 각 보직의 직책수당(협약 별표2, 2026년 동결)을 더해 별도 행으로 표시합니다.
// 소장은 별정직으로 임금을 운영단이 정하지만(협약 제4조③), 편의상 부소장과 동일한 금액으로 표시합니다.
//
// 명절휴가비(연 400,000원), 생일축하금(연 100,000원), 자기계발비(연 한도 500,000원, 실비) 등은
// 매월 지급되는 정기 임금이 아니라 이 계산기의 월 기준 실수령액 계산에는 포함하지 않았습니다.
export const wageTable = [
  {
    grade: '소장',
    items: [
      { name: '기본급', amount: 4566667, annualAmount: 54800000, taxable: true },
      { name: '직책수당', amount: 1083333, annualAmount: 13000000, taxable: true },
    ],
  },
  {
    grade: '부소장',
    items: [
      { name: '기본급', amount: 4566667, annualAmount: 54800000, taxable: true },
      { name: '직책수당', amount: 1083333, annualAmount: 13000000, taxable: true },
    ],
  },
  {
    grade: '팀장',
    items: [
      { name: '기본급', amount: 4566667, annualAmount: 54800000, taxable: true },
      { name: '직책수당', amount: 583333, annualAmount: 7000000, taxable: true },
    ],
  },
  {
    grade: '선임연구원 1급',
    items: [
      { name: '기본급', amount: 4566667, annualAmount: 54800000, taxable: true },
      { name: '직책수당', amount: 0, annualAmount: 0, taxable: true },
    ],
  },
  {
    grade: '선임연구원 2급',
    items: [
      { name: '기본급', amount: 4316667, annualAmount: 51800000, taxable: true },
      { name: '직책수당', amount: 0, annualAmount: 0, taxable: true },
    ],
  },
  {
    grade: '연구원 1급',
    items: [
      { name: '기본급', amount: 3860000, annualAmount: 46320000, taxable: true },
      { name: '직책수당', amount: 0, annualAmount: 0, taxable: true },
    ],
  },
  {
    grade: '연구원 2급',
    items: [
      { name: '기본급', amount: 3566667, annualAmount: 42800000, taxable: true },
      { name: '직책수당', amount: 0, annualAmount: 0, taxable: true },
    ],
  },
  {
    grade: '연구원 3급',
    items: [
      { name: '기본급', amount: 3316667, annualAmount: 39800000, taxable: true },
      { name: '직책수당', amount: 0, annualAmount: 0, taxable: true },
    ],
  },
];

// 협약 별표1의 '기존' 연 기본급 (2026년 인상 전, 5개 정식 직급만 — 팀장/부소장/소장은 보직 편의 표시이므로 제외).
// 추이 탭의 이전 vs 인상 후 비교 그래프에 사용됩니다.
export const previousBaseWageByGrade = [
  { grade: '연구원 3급', previousAnnualBase: 38000000, currentAnnualBase: 39800000 },
  { grade: '연구원 2급', previousAnnualBase: 41000000, currentAnnualBase: 42800000 },
  { grade: '연구원 1급', previousAnnualBase: 44520000, currentAnnualBase: 46320000 },
  { grade: '선임연구원 2급', previousAnnualBase: 50000000, currentAnnualBase: 51800000 },
  { grade: '선임연구원 1급', previousAnnualBase: 53000000, currentAnnualBase: 54800000 },
];
