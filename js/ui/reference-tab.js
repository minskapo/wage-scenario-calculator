import { renderLineChart } from '../charts/trend-chart.js';

// 연도를 기준으로 여러 지표(최저임금·물가상승률·산업평균 등)를 한 행에서 볼 수 있도록 합칩니다.
// 나중에 다른 사업장 임금인상률 등을 추가할 때는 이 함수에 Map 하나와 반환 객체 필드 하나만 늘리면 됩니다.
function buildYearIndexRows(referenceData) {
  const years = new Set();
  referenceData.minimumWage.forEach((row) => years.add(row.year));
  referenceData.cpi.forEach((row) => years.add(row.year));
  referenceData.industryAverageIncrease.forEach((row) => years.add(row.year));
  referenceData.unionWageHistory.forEach((row) => years.add(row.year));
  referenceData.economicGrowthRate.forEach((row) => years.add(row.year));
  referenceData.standardMedianIncome.forEach((row) => years.add(row.year));
  referenceData.wageDemandRate.forEach((row) => years.add(row.year));

  const minimumWageByYear = new Map(referenceData.minimumWage.map((row) => [row.year, row.increaseRate]));
  const cpiByYear = new Map(referenceData.cpi.map((row) => [row.year, row.increaseRate]));
  const industryByYear = new Map(referenceData.industryAverageIncrease.map((row) => [row.year, row.rate]));
  const unionByYear = new Map(referenceData.unionWageHistory.map((row) => [row.year, row.rate]));
  const growthByYear = new Map(referenceData.economicGrowthRate.map((row) => [row.year, row.rate]));
  const medianIncomeByYear = new Map(referenceData.standardMedianIncome.map((row) => [row.year, row.increaseRate]));
  const fktuByYear = new Map(referenceData.wageDemandRate.map((row) => [row.year, row.fktuRate]));
  const kctuByYear = new Map(referenceData.wageDemandRate.map((row) => [row.year, row.kctuRate]));

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      unionRate: unionByYear.get(year) ?? null,
      minimumWageRate: minimumWageByYear.get(year) ?? null,
      cpiRate: cpiByYear.get(year) ?? null,
      growthRate: growthByYear.get(year) ?? null,
      industryRate: industryByYear.get(year) ?? null,
      medianIncomeRate: medianIncomeByYear.get(year) ?? null,
      fktuRate: fktuByYear.get(year) ?? null,
      kctuRate: kctuByYear.get(year) ?? null,
    }));
}

function formatRate(value) {
  return value == null ? '-' : `${value}%`;
}

export function renderReferenceTab(container, { referenceData }) {
  const yearRows = buildYearIndexRows(referenceData);

  container.innerHTML = `
    <div id="reference-export-target">
      <div class="card">
        <h2>인상률 비교 (조합 · 최저임금 · 물가상승률 · 산업평균)</h2>
        <div id="reference-overlay-chart"></div>
        <div class="chart-legend">
          <span class="legend-item"><i style="background: rgb(0,188,112)"></i>조합</span>
          <span class="legend-item"><i style="background: #111111"></i>최저임금</span>
          <span class="legend-item"><i style="background: #999999"></i>물가상승률</span>
          <span class="legend-item"><i style="background: #cccccc"></i>산업평균(협약임금)</span>
        </div>
      </div>
      <div class="card">
        <h2>연도별 인상률 지표</h2>
        <p class="chart-detail-message">향후 다른 사업장의 임금인상률 등 지표가 이 표에 추가될 예정입니다.</p>
        <div class="table-wrapper">
          <table class="wage-table">
            <thead>
              <tr>
                <th>연도</th>
                <th>조합 임금인상률</th>
                <th>최저임금 인상률</th>
                <th>물가상승률</th>
                <th>경제성장률</th>
                <th>산업평균 인상률(협약임금)</th>
                <th>한국노총 요구율</th>
                <th>민주노총 요구율</th>
                <th>최저생계비(기준중위소득) 인상률</th>
              </tr>
            </thead>
            <tbody>
              ${yearRows
                .map(
                  (row) => `
                <tr>
                  <td>${row.year}</td>
                  <td>${formatRate(row.unionRate)}</td>
                  <td>${formatRate(row.minimumWageRate)}</td>
                  <td>${formatRate(row.cpiRate)}</td>
                  <td>${formatRate(row.growthRate)}</td>
                  <td>${formatRate(row.industryRate)}</td>
                  <td>${formatRate(row.fktuRate)}</td>
                  <td>${formatRate(row.kctuRate)}</td>
                  <td>${formatRate(row.medianIncomeRate)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <button class="btn export-btn" id="reference-export-btn" type="button">이미지로 저장</button>
  `;

  const series = [
    {
      label: '조합',
      color: 'rgb(0, 188, 112)',
      data: referenceData.unionWageHistory.map((row) => ({ x: row.year, y: row.rate })),
    },
    {
      label: '최저임금',
      color: '#111111',
      data: referenceData.minimumWage
        .filter((row) => row.increaseRate != null)
        .map((row) => ({ x: row.year, y: row.increaseRate })),
    },
    {
      label: '물가상승률',
      color: '#999999',
      data: referenceData.cpi.map((row) => ({ x: row.year, y: row.increaseRate })),
    },
    {
      label: '산업평균',
      color: '#cccccc',
      data: referenceData.industryAverageIncrease.map((row) => ({ x: row.year, y: row.rate })),
    },
  ];

  renderLineChart(container.querySelector('#reference-overlay-chart'), series, { width: 640, height: 320 });
}
