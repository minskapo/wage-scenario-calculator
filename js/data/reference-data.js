export const referenceData = {
  // 출처: 고용노동부 최저임금 고시 (moel.go.kr). 2026년 10,320원(+2.9%), 2027년 10,700원(+3.7%, 2026-07-14 최저임금위원회 의결) 확정.
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
    { year: 2027, hourlyWage: 10700, increaseRate: 3.7 },
  ],

  // 출처: 통계청 소비자물가동향(kostat.go.kr), 전년 대비 연간 상승률.
  // 2027년은 KDI "2026~2027년 경제전망"(2026-05-13 발표) 추정치입니다.
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
    { year: 2027, increaseRate: 2.2 },
  ],

  // 출처: 한국은행 경제통계(실질 GDP 성장률, 속보치 기준 - 추후 확정치로 개정될 수 있음).
  // 2027년은 KDI "2026~2027년 경제전망"(2026-05-13 발표) 추정치입니다. 2026년은 아직 연간 실적이 확정되지 않아 제외했습니다.
  economicGrowthRate: [
    { year: 2017, rate: 3.1 },
    { year: 2018, rate: 2.9 },
    { year: 2019, rate: 2.0 },
    { year: 2020, rate: -1.0 },
    { year: 2021, rate: 4.0 },
    { year: 2022, rate: 2.6 },
    { year: 2023, rate: 1.4 },
    { year: 2024, rate: 2.0 },
    { year: 2025, rate: 1.0 },
    { year: 2027, rate: 1.7 },
  ],

  // 출처: 보건복지부 기준 중위소득 고시(mohw.go.kr). 2015년 국민기초생활보장제도 개편으로 "최저생계비"는
  // "기준 중위소득"으로 대체되었으며, 현재 노동계에서 생계비 관련 지표로 참고하는 것은 기준 중위소득입니다(4인 가구 기준).
  standardMedianIncome: [
    { year: 2017, increaseRate: 1.73 },
    { year: 2018, increaseRate: 1.16 },
    { year: 2019, increaseRate: 2.09 },
    { year: 2020, increaseRate: 2.94 },
    { year: 2021, increaseRate: 2.68 },
    { year: 2022, increaseRate: 5.02 },
    { year: 2023, increaseRate: 5.47 },
    { year: 2024, increaseRate: 6.09 },
    { year: 2025, increaseRate: 6.42 },
    { year: 2026, increaseRate: 6.51 },
    { year: 2027, increaseRate: 6.7 },
  ],

  // 출처: 한국노총(inochong.org)·민주노총(nodong.org) 임금인상 요구안 보도자료.
  // 한국노총은 매년 임금인상요구율(%)을 발표하지만, 민주노총은 2015년부터 정액(원) 인상을 요구안으로 발표하여
  // 별도의 공식 요구율(%)을 발표하지 않습니다. kctuRate는 요구 정액을 기준 임금으로 나눈 참고용 환산치이며 공식 발표 수치가 아닙니다.
  // 자료가 확인되지 않은 연도는 비워두었습니다(2023년 등).
  wageDemandRate: [
    { year: 2018, fktuRate: 9.2, kctuRate: null },
    { year: 2021, fktuRate: 6.8, kctuRate: null },
    { year: 2022, fktuRate: 8.5, kctuRate: null },
    { year: 2024, fktuRate: 8.3, kctuRate: 6.6 },
    { year: 2025, fktuRate: 7.3, kctuRate: 6.2 },
    { year: 2026, fktuRate: 7.3, kctuRate: 8.0 },
  ],

  // 출처: 고용노동부 임금결정현황조사 - 상용근로자 100인 이상 사업장 협약임금인상률(전산업, 임금총액 기준).
  // 2025년 확정치는 발표 후 업데이트가 필요합니다.
  industryAverageIncrease: [
    { year: 2021, rate: 3.6 },
    { year: 2022, rate: 4.7 },
    { year: 2023, rate: 4.2 },
    { year: 2024, rate: 3.6 },
  ],

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
