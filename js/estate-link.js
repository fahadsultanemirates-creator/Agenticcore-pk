/* ============================================
   AgenticCore Pakistan ↔ AgenticCore Estate — cross-site context
   Mirrors Estate's ecosystem.js contract (docs/ECOSYSTEM_CONTRACT.md):
     Estate → PK: ?from=estate&intent=<intent>&entity_type=<type>&entity_id=<uuid>
                  (+ the original &listing=<uuid> for property promotion)
     PK → Estate: ?from=pk&intent=<intent>
   Only allow-listed values are read; ids only, never personal data.
   A URL never proves ownership: owner-specific context ("For: <your agency>")
   is shown only after the shared database confirms it through
   my_marketplace_entity() (Estate migration 0019), and orders that reference a
   listing are still checked by the pk_0003 trigger.
   ============================================ */

const PK_XSITE = {
  inIntents: ['promote', 'brand', 'social', 'project_marketing', 'website', 'creative', 'services'],
  outIntents: ['browse', 'list', 'profile', 'agency', 'builder', 'project', 'view'],
  entityTypes: ['property', 'project', 'professional', 'agency', 'builder']
};
const PK_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Public Estate page for each entity type.
const PK_ESTATE_PAGES = { property: 'listing.html', project: 'project.html', professional: 'professional.html', agency: 'agency.html', builder: 'builder.html' };

function pkEstateContext(search) {
  const q = new URLSearchParams(search == null ? location.search : search);
  if (q.get('from') !== 'estate') return null;
  const type = PK_XSITE.entityTypes.indexOf(q.get('entity_type')) >= 0 ? q.get('entity_type') : null;
  const id = PK_UUID_RE.test(q.get('entity_id') || '') ? q.get('entity_id').toLowerCase() : null;
  return {
    intent: PK_XSITE.inIntents.indexOf(q.get('intent')) >= 0 ? q.get('intent') : null,
    entityType: type && id ? type : null,
    entityId: type && id ? id : null
  };
}

// Link to Estate with an allow-listed intent (PK → Estate).
function pkEstateUrl(page, intent) {
  const base = (window.PK_CONFIG && PK_CONFIG.estateUrl) || 'https://agenticcore.estate';
  const q = PK_XSITE.outIntents.indexOf(intent) >= 0 ? '?from=pk&intent=' + intent : '?from=pk';
  return base + '/' + (page || '') + q;
}

// The public Estate page an Estate visitor came from (public pages only).
function pkEstateEntityUrl(ctx) {
  if (!ctx || !ctx.entityType) return null;
  const base = (window.PK_CONFIG && PK_CONFIG.estateUrl) || 'https://agenticcore.estate';
  return base + '/' + PK_ESTATE_PAGES[ctx.entityType] + '?id=' + encodeURIComponent(ctx.entityId);
}

// "From AgenticCore Estate" bar for pages reached from Estate.
async function pkRenderEstateContext(el) {
  const ctx = pkEstateContext();
  if (!el || !ctx) return;
  pkTrack('estate_context', 'estate', { intent: ctx.intent, entity_type: ctx.entityType });
  const back = pkEstateEntityUrl(ctx);
  el.hidden = false;
  el.innerHTML = '<p><strong>' + escapeHtml(pkT('ex_from_estate')) + '</strong> ' + escapeHtml(pkT('ex_from_estate_sub')) + '</p>' +
    '<p class="ex-for" id="exFor" hidden></p>' +
    (back ? '<a class="link" href="' + escapeHtml(back) + '" rel="noopener">' + escapeHtml(pkT('ex_back_' + ctx.entityType)) + ' →</a>' : '');
  if (!ctx.entityType) return;
  // Owner-only label, confirmed by the database for the signed-in account.
  try {
    const user = typeof PkDB !== 'undefined' ? await PkDB.currentUser() : null;
    if (!user) return;
    const { data } = await supabaseClient.rpc('my_marketplace_entity', { p_type: ctx.entityType, p_id: ctx.entityId });
    const row = (data || [])[0];
    if (row && row.title) {
      const f = document.getElementById('exFor');
      f.textContent = pkT('ex_for').replace('{name}', row.title);
      f.hidden = false;
    }
  } catch (e) { /* context is optional */ }
}
