import { renderLineChart } from '../charts/trend-chart.js';

export function renderTrendTab(container, { referenceData }) {
  container.innerHTML = `
    <div class="card">
      <h2>조합 자체 임금인상률 추이</h2>
      <div id="union-trend-chart"></div>
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
  `;

  renderLineChart(
    container.querySelector('#union-trend-chart'),
    [
      {
        label: '조합 임금인상률',
        color: 'rgb(0, 188, 112)',
        data: referenceData.unionWageHistory.map((row) => ({ x: row.year, y: row.rate })),
      },
    ],
    { width: 640, height: 320 }
  );
}
