import { escapeHtml, formatWon } from './format.js';

function increaseCell(increase) {
  return typeof increase === 'number' ? formatWon(increase) : escapeHtml(increase);
}

export function renderAgreementTab(
  container,
  { wageAgreementMeta, wageAgreementChapters, wageAgreementTable1, wageAgreementTable2 }
) {
  container.innerHTML = `
    <div id="agreement-export-target">
      <div class="card">
        <h2>${escapeHtml(wageAgreementMeta.title)}</h2>
        <p class="agreement-preamble">${escapeHtml(wageAgreementMeta.preamble)}</p>
      </div>
      ${wageAgreementChapters
        .map(
          (chapter) => `
        <div class="card">
          <h3>${escapeHtml(chapter.title)}</h3>
          ${chapter.articles
            .map(
              (article) => `
            <h4>${escapeHtml(article.title)}</h4>
            ${article.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
          `
            )
            .join('')}
        </div>
      `
        )
        .join('')}
      <div class="card">
        <h3>${escapeHtml(wageAgreementTable1.title)}</h3>
        <p class="chart-detail-message">${escapeHtml(wageAgreementTable1.unit)}</p>
        <div class="table-wrapper">
          <table class="wage-table">
            <thead><tr><th>직급</th><th>기존</th><th>인상액</th><th>기본급 지급액</th><th>비고</th></tr></thead>
            <tbody>
              ${wageAgreementTable1.rows
                .map(
                  (row) => `
                <tr>
                  <td>${escapeHtml(row.grade)}</td>
                  <td>${formatWon(row.previous)}</td>
                  <td>${increaseCell(row.increase)}</td>
                  <td>${formatWon(row.current)}</td>
                  <td>${row.note || '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <h3>${escapeHtml(wageAgreementTable2.title)}</h3>
        <p class="chart-detail-message">${escapeHtml(wageAgreementTable2.unit)}</p>
        <div class="table-wrapper">
          <table class="wage-table">
            <thead><tr><th>직책</th><th>기존</th><th>인상액</th><th>수당 지급액</th><th>비고</th></tr></thead>
            <tbody>
              ${wageAgreementTable2.rows
                .map(
                  (row) => `
                <tr>
                  <td>${escapeHtml(row.position)}</td>
                  <td>${formatWon(row.previous)}</td>
                  <td>${increaseCell(row.increase)}</td>
                  <td>${formatWon(row.current)}</td>
                  <td>${row.note || '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <p class="agreement-signature">${escapeHtml(wageAgreementMeta.signedDate)}</p>
        <table class="wage-table agreement-signature-table">
          <tbody>
            <tr>
              ${wageAgreementMeta.parties
                .map((party) => `<td>${escapeHtml(party.org)}<br />${escapeHtml(party.role)} ${escapeHtml(party.name)} (인)</td>`)
                .join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <button class="btn export-btn" id="agreement-export-btn" type="button">이미지로 저장</button>
  `;
}
