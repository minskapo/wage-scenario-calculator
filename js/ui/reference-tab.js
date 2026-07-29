import { renderLineChart } from '../charts/trend-chart.js';

export function renderReferenceTab(container, { referenceData }) {
  container.innerHTML = `
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
      <h2>역대 최저임금 인상률</h2>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>시급</th><th>인상률</th></tr></thead>
        <tbody>
          ${referenceData.minimumWage
            .map(
              (row) =>
                `<tr><td>${row.year}</td><td>${row.hourlyWage.toLocaleString('ko-KR')}원</td><td>${row.increaseRate ?? '-'}%</td></tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>소비자물가상승률</h2>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>물가상승률</th></tr></thead>
        <tbody>
          ${referenceData.cpi.map((row) => `<tr><td>${row.year}</td><td>${row.increaseRate}%</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>동종/전산업 평균 임금인상률 (협약임금인상률, 100인 이상 사업장)</h2>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>인상률</th></tr></thead>
        <tbody>
          ${referenceData.industryAverageIncrease.map((row) => `<tr><td>${row.year}</td><td>${row.rate}%</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>기업 경영지표</h2>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>영업이익</th><th>당기순이익</th></tr></thead>
        <tbody>
          ${
            referenceData.companyFinancials.length
              ? referenceData.companyFinancials
                  .map(
                    (row) =>
                      `<tr><td>${row.year}</td><td>${row.operatingProfit.toLocaleString('ko-KR')}원</td><td>${row.netProfit.toLocaleString('ko-KR')}원</td></tr>`
                  )
                  .join('')
              : '<tr><td colspan="3">등록된 경영지표가 없습니다. js/data/reference-data.js의 companyFinancials 배열에 값을 추가하세요.</td></tr>'
          }
        </tbody>
      </table>
    </div>
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
