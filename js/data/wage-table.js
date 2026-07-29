// 출처: [노사합동] 2026년 임금협약 (2026-04-01 체결, 사단법인 녹색전환연구소 / 녹색전환연구소노동조합), 별표1·별표2.
// 이 사업장은 호봉제가 아니며 직급 단위로 임금이 결정됩니다. 정식 직급: 선임연구원(1급, 2급), 연구원(1급, 2급, 3급).
// 기본급은 협약 별표1의 '연 기본급 지급액'을 12로 나눈 월 환산액입니다(원 단위 반올림, 나머지는 매월 균등 분배 가정).
//
// 팀장·부소장은 직급이 아니라 보직이며, 실제로는 모두 선임연구원 1급이 겸직합니다. 편의상 이 표에서는
// 선임연구원 1급 기본급(월 4,566,667원)에 각 보직의 직책수당(팀장 월 583,333원, 부소장 월 1,083,333원 —
// 협약 별표2, 2026년 동결)을 더해 별도 행으로 표시합니다.
// 소장은 별정직으로 임금을 운영단이 정하지만(협약 제4조③), 편의상 부소장과 동일한 금액으로 표시합니다.
//
// 명절휴가비(연 400,000원), 생일축하금(연 100,000원), 자기계발비(연 한도 500,000원, 실비) 등은
// 매월 지급되는 정기 임금이 아니라 이 계산기의 월 기준 실수령액 계산에는 포함하지 않았습니다.
export const wageTable = [
  {
    grade: '연구원 3급',
    items: [
      { name: '기본급', amount: 3316667, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
    ],
  },
  {
    grade: '연구원 2급',
    items: [
      { name: '기본급', amount: 3566667, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
    ],
  },
  {
    grade: '연구원 1급',
    items: [
      { name: '기본급', amount: 3860000, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
    ],
  },
  {
    grade: '선임연구원 2급',
    items: [
      { name: '기본급', amount: 4316667, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
    ],
  },
  {
    grade: '선임연구원 1급',
    items: [
      { name: '기본급', amount: 4566667, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
    ],
  },
  {
    grade: '팀장',
    items: [
      { name: '기본급', amount: 4566667, taxable: true },
      { name: '직책수당', amount: 583333, taxable: true },
    ],
  },
  {
    grade: '부소장',
    items: [
      { name: '기본급', amount: 4566667, taxable: true },
      { name: '직책수당', amount: 1083333, taxable: true },
    ],
  },
  {
    grade: '소장',
    items: [
      { name: '기본급', amount: 4566667, taxable: true },
      { name: '직책수당', amount: 1083333, taxable: true },
    ],
  },
];
