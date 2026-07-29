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

  // 출처: [노사합동] 2026년 임금협약 (2026-04-01 체결). 전 직급 기본급 월 150,000원(연 1,800,000원) 정액 인상.
  // 직급별 기존 기본급 대비 인상률은 3.4%(선임연구원 1급)~4.7%(연구원 3급)로 상이합니다(낮은 직급일수록 인상률이 높음).
  // 아래 rate는 5개 직급 단순평균입니다. 2022~2025년 실제 인상 이력은 자료 확보 후 추가해야 합니다.
  unionWageHistory: [
    {
      year: 2026,
      type: '정액',
      rate: 4.0,
      note: '전 직급 기본급 월 150,000원(연 1,800,000원) 정액 인상 (직급별 인상률 3.4~4.7%)',
    },
  ],
};
