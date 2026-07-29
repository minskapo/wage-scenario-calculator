import { wageTable } from './data/wage-table.js';
import { taxRules } from './data/tax-rules.js';
import { referenceData } from './data/reference-data.js';
import { renderStatusTab } from './ui/status-tab.js';
import { renderScenarioTab } from './ui/scenario-tab.js';
import { renderTrendTab } from './ui/trend-tab.js';
import { renderReferenceTab } from './ui/reference-tab.js';
import { attachExportButton } from './export/image-export.js';

const statusApi = renderStatusTab(document.getElementById('tab-status'), { wageTable, taxRules });
const scenarioApi = renderScenarioTab(document.getElementById('tab-scenario'), {
  wageTable,
  taxRules,
  getSelectedGrade: statusApi.getSelectedGrade,
});
renderTrendTab(document.getElementById('tab-trend'), { referenceData });
renderReferenceTab(document.getElementById('tab-reference'), { referenceData });

const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === button));
    tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));
    if (target === 'scenario') {
      scenarioApi.refreshComparison();
    }
  });
});

attachExportButton(
  document.getElementById('status-export-btn'),
  document.getElementById('status-table-wrapper'),
  '현행임금현황.png'
);
attachExportButton(
  document.getElementById('scenario-export-btn'),
  document.getElementById('scenario-export-target'),
  '임금인상시나리오비교.png'
);
