import { renderLineChart } from '../charts/trend-chart.js';

export function renderTrendTab(container, { referenceData }) {
  container.innerHTML = `
    <div id="trend-export-target">
      <div class="card">
        <h2>조합 자체 임금인상률 추이</h2>
        <div id="union-trend-chart"></div>
        <p id="union-trend-detail" class="chart-detail-message">그래프의 점을 클릭하면 해당 연도의 인상 방식 설명을 볼 수 있습니다.</p>
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

  const detailEl = container.querySelector('#union-trend-detail');

  renderLineChart(
    container.querySelector('#union-trend-chart'),
    [
      {
        label: '조합 임금인상률',
        color: 'rgb(0, 188, 112)',
        data: referenceData.unionWageHistory.map((row) => ({ x: row.year, y: row.rate })),
      },
    ],
    {
      width: 640,
      height: 320,
      onPointClick: (series, point) => {
        const row = referenceData.unionWageHistory.find((r) => r.year === point.x);
        if (!row || !detailEl) return;
        detailEl.textContent = `${row.year}년: ${row.type} 방식, 인상률 ${row.rate}%${row.note ? ` — ${row.note}` : ''}`;
      },
    }
  );
}
