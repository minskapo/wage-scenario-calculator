export function applyAdjustments(items, adjustments) {
  const adjustmentMap = new Map(adjustments.map((a) => [a.itemName, a]));
  return items.map((item) => {
    const adjustment = adjustmentMap.get(item.name);
    if (!adjustment) return { ...item };
    const newAmount =
      adjustment.type === 'percent'
        ? Math.round(item.amount * (1 + adjustment.value / 100))
        : item.amount + adjustment.value;
    return { ...item, amount: newAmount };
  });
}

export function addItem(items, newItem) {
  if (items.some((item) => item.name === newItem.name)) {
    throw new Error(`이미 존재하는 항목입니다: ${newItem.name}`);
  }
  return [...items, { ...newItem }];
}

export function applyScenarioToGrade(items, scenario) {
  const withNewItems = (scenario.newItems || []).reduce((acc, newItem) => addItem(acc, newItem), items);
  return applyAdjustments(withNewItems, scenario.adjustments || []);
}

export function applyScenarioToWageTable(wageTable, scenario) {
  return wageTable.map((grade) => ({
    ...grade,
    items: applyScenarioToGrade(grade.items, scenario),
  }));
}
