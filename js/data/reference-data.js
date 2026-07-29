export const referenceData = {
  // 출처: 고용노동부 최저임금 고시 (moel.go.kr), 2026년 최저임금 10,320원(전년 대비 +2.9%) 확정.
  minimumWage: [
    { year: 2017, hourlyWage: 6470, increaseRate: null },
    { year: 2018, hourlyWage: 7530, increaseRate: 16.4 },
    { year: 2019, hourlyWage: 8350, increaseRate: 10.9 },
    { year: 2020, hourlyWage: 8590, increaseRate: 2.9 },
    { year: 2021, hourlyWage: 8720, increaseRate: 1.5 },
    { year: 2022, hourlyWage: 9160, increaseRate: 5.05 },
    { year: 2023, hourlyWage: 9620, increaseRate: 5.0 },
    { year: 2024, hourlyWage: 9860, increaseRate: 2.5 },
    { year: 2025, hourlyWage: 10030, increaseRate: 1.7 },
    { year: 2026, hourlyWage: 10320, increaseRate: 2.9 },
  ],

  // 출처: 통계청 소비자물가동향(kostat.go.kr), 전년 대비 연간 상승률.
  cpi: [
    { year: 2017, increaseRate: 1.9 },
    { year: 2018, increaseRate: 1.5 },
    { year: 2019, increaseRate: 0.4 },
    { year: 2020, increaseRate: 0.5 },
    { year: 2021, increaseRate: 2.5 },
    { year: 2022, increaseRate: 5.1 },
    { year: 2023, increaseRate: 3.6 },
    { year: 2024, increaseRate: 2.3 },
    { year: 2025, increaseRate: 2.1 },
  ],

  // 출처: 고용노동부 임금결정현황조사 - 상용근로자 100인 이상 사업장 협약임금인상률(전산업, 임금총액 기준).
  // 2025년 확정치는 발표 후 업데이트가 필요합니다.
  industryAverageIncrease: [
    { year: 2021, rate: 3.6 },
    { year: 2022, rate: 4.7 },
    { year: 2023, rate: 4.2 },
    { year: 2024, rate: 3.6 },
  ],

  // 사용자가 직접 입력해 관리하는 항목입니다. 예시로 비워둡니다.
  companyFinancials: [],

  // 예시(샘플) 데이터입니다. 실제 조합 임금협약 이력으로 교체해야 합니다.
  unionWageHistory: [
    { year: 2023, type: '정률', rate: 4.5, note: '' },
    { year: 2024, type: '정률+정액', rate: 3.8, note: '기본급 3.0% + 일괄 5만원' },
    { year: 2025, type: '정률', rate: 2.9, note: '' },
  ],
};
