/* ============================================
   AgenticCore Pakistan — catalogue maths
   Pure functions over data/services.json and data/packages.json.
   Loaded by the browser (window.PkCatalogCore) and by
   scripts/validate-data.mjs (module.exports), so the numbers
   the site shows are the numbers the validator checks.
   ============================================ */
(function (root) {
  function indexLines(services) {
    const byId = {};
    services.forEach(function (s) {
      s.lines.forEach(function (l) { byId[l.id] = { line: l, service: s }; });
    });
    return byId;
  }

  function itemValue(item, linesById) {
    if (item.included) return 0;
    if (typeof item.value === 'number') return item.value;
    const hit = linesById[item.line];
    if (!hit) throw new Error('Unknown price line: ' + item.line);
    return hit.line.price * (item.qty || 1);
  }

  function sumItems(items, linesById) {
    return (items || []).reduce(function (t, it) { return t + itemValue(it, linesById); }, 0);
  }

  // Savings exactly as the pricing PDF computes them.
  function packageTotals(pkg, linesById) {
    const monthlySep = sumItems(pkg.monthly_items, linesById);
    const setupSep = sumItems(pkg.setup_items, linesById);
    const out = { monthlySeparately: monthlySep, setupSeparately: setupSep };
    if (typeof pkg.monthly === 'number') {
      out.monthlySaving = monthlySep - pkg.monthly;
      out.monthlySavingPct = Math.round(100 * out.monthlySaving / monthlySep);
      out.setupSaving = setupSep - (pkg.setup || 0);
    }
    if (typeof pkg.one_off === 'number') {
      out.setupSaving = setupSep - pkg.one_off;
      out.setupSavingPct = Math.round(100 * out.setupSaving / setupSep);
    }
    return out;
  }

  // Lowest orderable price for a service (for "from Rs X" labels).
  function fromPrice(service) {
    const prices = service.lines.filter(function (l) { return !l.addon; }).map(function (l) { return l.price; });
    return Math.min.apply(null, prices);
  }

  function formatRs(n) {
    return 'Rs ' + Number(n).toLocaleString('en-PK');
  }

  const api = { indexLines: indexLines, itemValue: itemValue, sumItems: sumItems, packageTotals: packageTotals, fromPrice: fromPrice, formatRs: formatRs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PkCatalogCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
