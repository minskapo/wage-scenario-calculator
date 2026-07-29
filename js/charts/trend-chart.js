const SVG_NS = 'http://www.w3.org/2000/svg';

export function computeDomain(series) {
  const points = series.flatMap((s) => s.data);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    xMin: Math.min(...xs),
    xMax: Math.max(...xs),
    yMin: Math.min(0, ...ys),
    yMax: Math.max(...ys) * 1.1,
  };
}

export function scalePoint(point, domain, range) {
  const xRatio = domain.xMax === domain.xMin ? 0 : (point.x - domain.xMin) / (domain.xMax - domain.xMin);
  const yRatio = domain.yMax === domain.yMin ? 0 : (point.y - domain.yMin) / (domain.yMax - domain.yMin);
  const px = range.left + xRatio * (range.right - range.left);
  const py = range.bottom - yRatio * (range.bottom - range.top);
  return { px, py };
}

export function computeYTicks(yMin, yMax, count = 5) {
  if (count < 2) return [yMin];
  const ticks = [];
  for (let i = 0; i < count; i++) {
    ticks.push(yMin + ((yMax - yMin) * i) / (count - 1));
  }
  return ticks;
}

function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value);
  return e;
}

function svgTitle(text) {
  const title = svgEl('title', {});
  title.textContent = text;
  return title;
}

const defaultPercentFormat = (value) => `${value.toFixed(1)}%`;

export function buildLineChartSvg(series, options = {}) {
  const width = options.width ?? 640;
  const height = options.height ?? 320;
  const padding = { left: 56, right: 20, top: 20, bottom: 40 };
  const range = { left: padding.left, right: width - padding.right, top: padding.top, bottom: height - padding.bottom };
  const domain = computeDomain(series);
  const yFormat = options.yFormat ?? defaultPercentFormat;

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'trend-chart' });

  svg.appendChild(svgEl('line', { x1: range.left, y1: range.bottom, x2: range.right, y2: range.bottom, stroke: '#999999' }));
  svg.appendChild(svgEl('line', { x1: range.left, y1: range.top, x2: range.left, y2: range.bottom, stroke: '#999999' }));

  computeYTicks(domain.yMin, domain.yMax).forEach((tickValue) => {
    const { py } = scalePoint({ x: domain.xMin, y: tickValue }, domain, range);
    svg.appendChild(svgEl('line', { x1: range.left - 4, y1: py, x2: range.left, y2: py, stroke: '#999999' }));
    const label = svgEl('text', { x: range.left - 8, y: py + 4, 'text-anchor': 'end', class: 'chart-axis-label' });
    label.textContent = yFormat(tickValue);
    svg.appendChild(label);
  });

  const uniqueYears = [...new Set(series.flatMap((s) => s.data.map((p) => p.x)))].sort((a, b) => a - b);
  uniqueYears.forEach((year) => {
    const { px } = scalePoint({ x: year, y: domain.yMin }, domain, range);
    const label = svgEl('text', { x: px, y: range.bottom + 16, 'text-anchor': 'middle', class: 'chart-axis-label' });
    label.textContent = year;
    svg.appendChild(label);
  });

  series.forEach((s) => {
    const sortedData = [...s.data].sort((a, b) => a.x - b.x);
    const pathD = sortedData
      .map((p, i) => {
        const { px, py } = scalePoint(p, domain, range);
        return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
      })
      .join(' ');
    svg.appendChild(svgEl('path', { d: pathD, fill: 'none', stroke: s.color || '#111111', 'stroke-width': 2 }));
    sortedData.forEach((p) => {
      const { px, py } = scalePoint(p, domain, range);
      const circle = svgEl('circle', { cx: px, cy: py, r: 4, fill: s.color || '#111111' });
      circle.appendChild(svgTitle(`${s.label ? s.label + ' ' : ''}${p.x}: ${yFormat(p.y)}`));
      if (options.onPointClick) {
        circle.style.cursor = 'pointer';
        circle.addEventListener('click', () => options.onPointClick(s, p));
      }
      svg.appendChild(circle);
    });
  });

  return svg;
}

export function renderLineChart(container, series, options) {
  container.innerHTML = '';
  const hasData = series.length > 0 && series.some((s) => s.data && s.data.length > 0);
  if (!hasData) {
    container.innerHTML = '<p class="chart-empty-message">표시할 데이터가 없습니다.</p>';
    return null;
  }
  const svg = buildLineChartSvg(series, options);
  container.appendChild(svg);
  return svg;
}

export function buildGroupedBarChartSvg(categories, series, options = {}) {
  const width = options.width ?? 640;
  const height = options.height ?? 320;
  const padding = { left: 80, right: 20, top: 20, bottom: 50 };
  const range = { left: padding.left, right: width - padding.right, top: padding.top, bottom: height - padding.bottom };
  const yFormat = options.yFormat ?? ((v) => v.toLocaleString('ko-KR'));

  const allValues = series.flatMap((s) => s.data);
  const yMax = Math.max(0, ...allValues) * 1.1 || 1;
  const yMin = 0;

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'trend-chart' });

  svg.appendChild(svgEl('line', { x1: range.left, y1: range.bottom, x2: range.right, y2: range.bottom, stroke: '#999999' }));
  svg.appendChild(svgEl('line', { x1: range.left, y1: range.top, x2: range.left, y2: range.bottom, stroke: '#999999' }));

  computeYTicks(yMin, yMax).forEach((tickValue) => {
    const py = range.bottom - (tickValue / yMax) * (range.bottom - range.top);
    svg.appendChild(svgEl('line', { x1: range.left - 4, y1: py, x2: range.left, y2: py, stroke: '#999999' }));
    const label = svgEl('text', { x: range.left - 8, y: py + 4, 'text-anchor': 'end', class: 'chart-axis-label' });
    label.textContent = yFormat(tickValue);
    svg.appendChild(label);
  });

  const groupWidth = (range.right - range.left) / categories.length;
  const barGap = 6;
  const barWidth = (groupWidth - barGap * (series.length + 1)) / series.length;

  categories.forEach((category, categoryIndex) => {
    const groupLeft = range.left + groupWidth * categoryIndex;

    series.forEach((s, seriesIndex) => {
      const value = s.data[categoryIndex] ?? 0;
      const barHeight = (value / yMax) * (range.bottom - range.top);
      const x = groupLeft + barGap + seriesIndex * (barWidth + barGap);
      const y = range.bottom - barHeight;
      const rect = svgEl('rect', { x, y, width: Math.max(barWidth, 0), height: Math.max(barHeight, 0), fill: s.color || '#111111' });
      rect.appendChild(svgTitle(`${category} · ${s.label}: ${yFormat(value)}`));
      svg.appendChild(rect);
    });

    const label = svgEl('text', {
      x: groupLeft + groupWidth / 2,
      y: range.bottom + 16,
      'text-anchor': 'middle',
      class: 'chart-axis-label',
    });
    label.textContent = category;
    svg.appendChild(label);
  });

  return svg;
}

export function renderGroupedBarChart(container, categories, series, options) {
  container.innerHTML = '';
  const hasData = categories.length > 0 && series.length > 0 && series.some((s) => s.data && s.data.length > 0);
  if (!hasData) {
    container.innerHTML = '<p class="chart-empty-message">표시할 데이터가 없습니다.</p>';
    return null;
  }
  const svg = buildGroupedBarChartSvg(categories, series, options);
  container.appendChild(svg);
  return svg;
}
