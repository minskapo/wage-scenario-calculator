import { wageTable, previousBaseWageByGrade } from './data/wage-table.js';
import { taxRules } from './data/tax-rules.js';
import { referenceData } from './data/reference-data.js';
import { wageAgreementMeta, wageAgreementChapters, wageAgreementTable1, wageAgreementTable2 } from './data/wage-agreement-2026.js';
import { renderStatusTab } from './ui/status-tab.js';
import { renderScenarioTab } from './ui/scenario-tab.js';
import { renderTrendTab } from './ui/trend-tab.js';
import { renderReferenceTab } from './ui/reference-tab.js';
import { renderAgreementTab } from './ui/agreement-tab.js';
import { attachExportButton } from './export/image-export.js';

const statusApi = renderStatusTab(document.getElementById('tab-status'), { wageTable, taxRules });
const scenarioApi = renderScenarioTab(document.getElementById('tab-scenario'), {
  wageTable,
  taxRules,
  getDependents: statusApi.getDependents,
  getYouthTaxReduction: statusApi.getYouthTaxReduction,
});
renderTrendTab(document.getElementById('tab-trend'), { referenceData, previousBaseWageByGrade });
renderReferenceTab(document.getElementById('tab-reference'), { referenceData });
renderAgreementTab(document.getElementById('tab-agreement'), {
  wageAgreementMeta,
  wageAgreementChapters,
  wageAgreementTable1,
  wageAgreementTable2,
});

const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === button));
    tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));
    if (target === 'scenario') {
      scenarioApi.refresh();
    }
  });
});

attachExportButton('status-export-btn', 'status-table-wrapper', '현행임금현황.png');
attachExportButton('scenario-export-btn', 'scenario-export-target', '임금인상시나리오비교.png');
attachExportButton('trend-export-btn', 'trend-export-target', '임금인상률추이.png');
attachExportButton('reference-export-btn', 'reference-export-target', '교섭참고정보.png');
attachExportButton('agreement-export-btn', 'agreement-export-target', '2026년임금협약.png');
