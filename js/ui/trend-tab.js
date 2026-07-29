import { renderGroupedBarChart } from '../charts/trend-chart.js';

export function renderTrendTab(container, { referenceData, previousBaseWageByGrade }) {
  container.innerHTML = `
    <div id="trend-export-target">
      <div class="card">
        <h2>2026년 임금협약 — 직급별 연 기본급 변화</h2>
        <div id="wage-comparison-chart"></div>
        <div class="chart-legend">
          <span class="legend-item"><i style="background: #999999"></i>기존(2025년까지)</span>
          <span class="legend-item"><i style="background: rgb(0,188,112)"></i>인상 후(2026년)</span>
        </div>
        <div class="table-wrapper">
          <table class="wage-table">
            <thead>
              <tr>
                <th>직급</th>
                <th>기존 연 기본급</th>
                <th>인상 후 연 기본급</th>
                <th>인상액</th>
                <th>인상률</th>
              </tr>
            </thead>
            <tbody>
              ${previousBaseWageByGrade
                .map((row) => {
                  const diff = row.currentAnnualBase - row.previousAnnualBase;
                  const rate = ((diff / row.previousAnnualBase) * 100).toFixed(1);
                  return `
                <tr>
                  <td>${row.grade}</td>
                  <td>${row.previousAnnualBase.toLocaleString('ko-KR')}원</td>
                  <td>${row.currentAnnualBase.toLocaleString('ko-KR')}원</td>
                  <td>${diff.toLocaleString('ko-KR')}원</td>
                  <td>${rate}%</td>
                </tr>
              `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <h2>조합 자체 임금인상률 이력</h2>
        <div class="table-wrapper">
          <table class="wage-table">
            <thead><tr><th>연도</th><th>인상 방식</th><th>인상률</th><th>비고</th></tr></thead>
            <tbody>
              ${referenceData.unionWageHistory
                .map(
                  (row) => `
                <tr>
                  <td>${row.year}</td>
                  <td>${row.type}</td>
                  <td>${row.rate}%</td>
                  <td>${row.note || '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <button class="btn export-btn" id="trend-export-btn" type="button">이미지로 저장</button>
  `;

  renderGroupedBarChart(
    container.querySelector('#wage-comparison-chart'),
    previousBaseWageByGrade.map((row) => row.grade),
    [
      { label: '기존', color: '#999999', data: previousBaseWageByGrade.map((row) => row.previousAnnualBase) },
      { label: '인상 후', color: 'rgb(0, 188, 112)', data: previousBaseWageByGrade.map((row) => row.currentAnnualBase) },
    ],
    { width: 640, height: 320, yFormat: (v) => `${Math.round(v / 10000)}만원` }
  );
}
