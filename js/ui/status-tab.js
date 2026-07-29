import { calculateNetPay } from '../calc/net-pay.js';
import { formatWon } from './format.js';

export function renderStatusTab(container, { wageTable, taxRules }) {
  let selectedGrade = wageTable[0].grade;

  function computeRows() {
    return wageTable.map((grade) => ({
      grade: grade.grade,
      items: grade.items,
      netPayResult: calculateNetPay(grade.items, 1, taxRules),
    }));
  }

  function render() {
    const rows = computeRows();
    const selectedRow = rows.find((r) => r.grade === selectedGrade);
    const itemNames = wageTable[0].items.map((item) => item.name);

    container.innerHTML = `
      <div class="card summary-card">
        <h2>${selectedRow.grade} 기준 요약</h2>
        <div class="summary-grid">
          <div><span class="summary-label">임금 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalWage)}</span></div>
          <div><span class="summary-label">공제 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalDeduction)}</span></div>
          <div><span class="summary-label">실수령액</span><span class="summary-value accent">${formatWon(selectedRow.netPayResult.netPay)}</span></div>
        </div>
      </div>
      <div class="table-wrapper" id="status-table-wrapper">
        <table class="wage-table">
          <thead>
            <tr>
              <th>직급</th>
              ${itemNames.map((name) => `<th>${name}</th>`).join('')}
              <th>임금 총액</th>
              <th>공제 총액</th>
              <th>실수령액</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr data-grade="${row.grade}" class="${row.grade === selectedGrade ? 'row-selected' : ''}">
                <td>${row.grade}</td>
                ${row.items.map((item) => `<td>${formatWon(item.amount)}</td>`).join('')}
                <td>${formatWon(row.netPayResult.totalWage)}</td>
                <td>${formatWon(row.netPayResult.totalDeduction)}</td>
                <td class="accent">${formatWon(row.netPayResult.netPay)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <p class="export-disclaimer">* 실수령액은 간이 추정치이며 실제 급여명세서와 차이가 있을 수 있습니다.</p>
      </div>
      <button class="btn export-btn" id="status-export-btn" type="button">이미지로 저장</button>
    `;

    container.querySelectorAll('tbody tr').forEach((row) => {
      row.addEventListener('click', () => {
        selectedGrade = row.dataset.grade;
        render();
      });
    });
  }

  render();

  return {
    getSelectedGrade: () => selectedGrade,
  };
}
