import { wageTable } from './data/wage-table.js';
import { taxRules } from './data/tax-rules.js';
import { renderStatusTab } from './ui/status-tab.js';
import { referenceData } from './data/reference-data.js';
import { renderTrendTab } from './ui/trend-tab.js';

const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === button));
    tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));
  });
});

const statusApi = renderStatusTab(document.getElementById('tab-status'), { wageTable, taxRules });

renderTrendTab(document.getElementById('tab-trend'), { referenceData });
