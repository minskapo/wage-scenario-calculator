import { calculateNetPay } from '../calc/net-pay.js';
import { formatWon } from './format.js';

export function renderStatusTab(container, { wageTable, taxRules }) {
  const defaultGrade = wageTable.find((g) => g.grade === '연구원 2급')?.grade ?? wageTable[0].grade;
  let selectedGrade = defaultGrade;
  let dependents = 1;
  let youthTaxReduction = false;
  let breakdownOpen = false;
  let highlightedCell = null; // { grade, colIndex } — last clicked cell in the wage table

  function cellClass(row, colIndex, extraClasses = []) {
    const classes = [...extraClasses];
    if (highlightedCell) {
      if (highlightedCell.grade === row.grade) classes.push('row-highlight');
      if (highlightedCell.colIndex === colIndex) classes.push('col-highlight');
      if (highlightedCell.grade === row.grade && highlightedCell.colIndex === colIndex) classes.push('cell-highlight');
    }
    return classes.length ? ` class="${classes.join(' ')}"` : '';
  }

  function annualWageOf(items) {
    return items.reduce((sum, item) => sum + item.annualAmount, 0);
  }

  function computeRows() {
    return wageTable.map((grade) => ({
      grade: grade.grade,
      items: grade.items,
      annualWage: annualWageOf(grade.items),
      netPayResult: calculateNetPay(grade.items, dependents, taxRules, { youthTaxReduction }),
    }));
  }

  function render() {
    const rows = computeRows();
    const selectedRow = rows.find((r) => r.grade === selectedGrade);
    const itemNames = wageTable[0].items.map((item) => item.name);
    const { insurance, tax } = selectedRow.netPayResult;
    const annualWage = selectedRow.annualWage;

    container.innerHTML = `
      <div class="card summary-card">
        <h2>${selectedRow.grade} 기준 요약</h2>
        <label class="dependents-label">
          부양가족 수(본인 포함)
          <input type="number" id="dependents-input" min="1" step="1" value="${dependents}" />
        </label>
        <label class="youth-tax-label">
          <input type="checkbox" id="youth-tax-input" ${youthTaxReduction ? 'checked' : ''} />
          청년 소득세 감면 적용 (중소기업 취업 청년, 소득세 90%·연 200만원 한도, 취업일로부터 5년)
        </label>
        <div class="summary-grid">
          <div><span class="summary-label">연 임금</span><span class="summary-value">${formatWon(annualWage)}</span></div>
          <div><span class="summary-label">월 임금총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalWage)}</span></div>
          <div><span class="summary-label">공제 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalDeduction)}</span></div>
          <div><span class="summary-label">실수령액</span><span class="summary-value accent">${formatWon(selectedRow.netPayResult.netPay)}</span></div>
        </div>
        <details class="deduction-breakdown" ${breakdownOpen ? 'open' : ''}>
          <summary>공제 내역 보기</summary>
          <ul>
            <li>국민연금: ${formatWon(insurance.nationalPension)}</li>
            <li>건강보험: ${formatWon(insurance.healthInsurance)}</li>
            <li>장기요양보험: ${formatWon(insurance.longTermCare)}</li>
            <li>고용보험: ${formatWon(insurance.employmentInsurance)}</li>
            <li>소득세: ${formatWon(tax.incomeTax)}</li>
            <li>지방소득세: ${formatWon(tax.localIncomeTax)}</li>
          </ul>
        </details>
      </div>
      <div class="table-wrapper" id="status-table-wrapper">
        <table class="wage-table">
          <thead>
            <tr>
              <th>직급</th>
              <th>연 임금</th>
              ${itemNames.map((name) => `<th>${name}(연)</th>`).join('')}
              <th>월 임금총액</th>
              <th>공제 총액</th>
              <th>실수령액</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => {
                const cellValues = [
                  row.grade,
                  formatWon(row.annualWage),
                  ...row.items.map((item) => formatWon(item.annualAmount)),
                  formatWon(row.netPayResult.totalWage),
                  formatWon(row.netPayResult.totalDeduction),
                  formatWon(row.netPayResult.netPay),
                ];
                const lastIndex = cellValues.length - 1;
                return `
              <tr data-grade="${row.grade}" class="${row.grade === selectedGrade ? 'row-selected' : ''}">
                ${cellValues
                  .map(
                    (value, colIndex) =>
                      `<td${cellClass(row, colIndex, colIndex === lastIndex ? ['accent'] : [])}>${value}</td>`
                  )
                  .join('')}
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>
        <p class="export-disclaimer">* 부양가족 ${dependents}인(본인 포함) 기준, 실수령액은 간이 추정치이며 실제 급여명세서와 차이가 있을 수 있습니다.</p>
      </div>
      <button class="btn export-btn" id="status-export-btn" type="button">이미지로 저장</button>
    `;

    container.querySelectorAll('tbody tr').forEach((row) => {
      row.addEventListener('click', (e) => {
        selectedGrade = row.dataset.grade;
        const cell = e.target.closest('td');
        if (cell) highlightedCell = { grade: row.dataset.grade, colIndex: cell.cellIndex };
        render();
      });
    });

    const detailsEl = container.querySelector('.deduction-breakdown');
    if (detailsEl) {
      detailsEl.addEventListener('toggle', () => {
        breakdownOpen = detailsEl.open;
      });
    }

    container.querySelector('#dependents-input').addEventListener('change', (e) => {
      const value = Math.max(1, Math.floor(Number(e.target.value) || 1));
      dependents = value;
      render();
      const refreshedInput = container.querySelector('#dependents-input');
      if (refreshedInput) refreshedInput.focus();
    });

    container.querySelector('#youth-tax-input').addEventListener('change', (e) => {
      youthTaxReduction = e.target.checked;
      render();
    });
  }

  render();

  return {
    getSelectedGrade: () => selectedGrade,
    getDependents: () => dependents,
    getYouthTaxReduction: () => youthTaxReduction,
  };
}
