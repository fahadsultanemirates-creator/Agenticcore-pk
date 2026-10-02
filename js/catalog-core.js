/* ============================================
   AgenticCore Pakistan — catalogue maths
   Pure functions over data/services.json. Loaded by the browser
   (window.PkCatalogCore) and by scripts/validate-data.mjs
   (module.exports), so the numbers the site shows are the numbers
   the validator checks. Catalogue V2 packages are sold on monthly
   output, so there is no "bought separately" savings maths here.
   ============================================ */
(function (root) {
  function indexLines(services) {
    const byId = {};
    services.forEach(function (s) {
      s.lines.forEach(function (l) { byId[l.id] = { line: l, service: s }; });
    });
    return byId;
  }

  // Lowest orderable price for a service (for "from Rs X" labels).
  function fromPrice(service) {
    const prices = service.lines.filter(function (l) { return !l.addon; }).map(function (l) { return l.price; });
    return Math.min.apply(null, prices);
  }

  function formatRs(n) {
    return 'Rs ' + Number(n).toLocaleString('en-PK');
  }

  const api = { indexLines: indexLines, fromPrice: fromPrice, formatRs: formatRs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PkCatalogCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
