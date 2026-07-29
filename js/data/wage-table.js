// 예시(샘플) 데이터입니다. 실제 조합 임금테이블/임금협약서 내용으로 반드시 교체해야 합니다.
// 이 사업장은 호봉제가 아니며 직급 단위로 임금이 결정됩니다.
export const wageTable = [
  {
    grade: '5급',
    items: [
      { name: '기본급', amount: 2200000, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
  {
    grade: '4급',
    items: [
      { name: '기본급', amount: 2500000, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
  {
    grade: '3급',
    items: [
      { name: '기본급', amount: 2900000, taxable: true },
      { name: '직책수당', amount: 100000, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
  {
    grade: '2급',
    items: [
      { name: '기본급', amount: 3400000, taxable: true },
      { name: '직책수당', amount: 200000, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
  {
    grade: '1급',
    items: [
      { name: '기본급', amount: 4000000, taxable: true },
      { name: '직책수당', amount: 300000, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
];
