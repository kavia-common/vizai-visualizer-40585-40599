//
// PUBLIC_INTERFACE
// Utility helpers for chart data transformations and percentage formatting.
//
/**
 * PUBLIC_INTERFACE
 * Compute total value of a dataset represented as an object map or array of numbers.
 * @param {Object<string, number>|number[]} data - Map of label->value or array of values
 * @returns {number} total sum (0 if invalid/empty)
 */
export function computeTotal(data) {
  if (!data) return 0;
  if (Array.isArray(data)) {
    return data.reduce((s, v) => s + (Number(v) || 0), 0);
  }
  return Object.values(data).reduce((s, v) => s + (Number(v) || 0), 0);
}

/**
 * PUBLIC_INTERFACE
 * Compute percentage given a value and total, with a specific fixed precision.
 * @param {number} value - slice value
 * @param {number} total - total sum
 * @param {number} precision - decimals (default 1)
 * @returns {string} formatted percentage string without trailing zeros beyond precision if not needed
 */
export function computePercentage(value, total, precision = 1) {
  const pct = total > 0 ? (Number(value) || 0) / total * 100 : 0;
  const fixed = pct.toFixed(precision);
  // Remove unnecessary trailing zeros while keeping at least one decimal if precision > 0
  if (precision > 0) {
    const trimmed = fixed.replace(/\.?0+$/, '');
    // Ensure we keep 1 decimal if original requested precision was > 0 and integer
    const needsOneDecimal = precision > 0 && trimmed.indexOf('.') === -1;
    return needsOneDecimal ? `${Number(fixed).toFixed(1)}` : trimmed;
  }
  return `${Math.round(pct)}`;
}

/**
 * PUBLIC_INTERFACE
 * Build a conic-gradient CSS from keys and a data map of values.
 * @param {string[]} keys - labels in order
 * @param {Object<string, number>} dataMap - values map
 * @param {number} total - precomputed total (optional)
 * @param {(index:number)=>string} colorResolver - function mapping index to color
 * @returns {string} CSS conic-gradient()
 */
export function conicGradient(keys, dataMap, total = null, colorResolver = (i)=>'#10B981') {
  const sum = total == null ? computeTotal(keys.map(k => dataMap[k] || 0)) : total;
  if (!sum) return '#10B981';
  let acc = 0;
  const parts = [];
  keys.forEach((k, idx) => {
    const v = Number(dataMap[k] || 0);
    const frac = sum ? v / sum : 0;
    const start = acc * 100;
    const end = (acc + frac) * 100;
    const color = colorResolver(idx);
    parts.push(`${color} ${start}% ${end}%`);
    acc += frac;
  });
  return `conic-gradient(${parts.join(', ')})`;
}
