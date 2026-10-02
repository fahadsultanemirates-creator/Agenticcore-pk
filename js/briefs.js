/* AgenticCore Pakistan — what we need from the client, per service (Catalogue V2 numbers).
   Shared by the dashboard order form and the service detail view.
   Services not listed get a free-text brief. */
const PK_PROPERTY_BRIEF = [['property', 'Property title and location'], ['price', 'Demand price or rent'], ['facts', 'Size, beds, baths and key facts'], ['contact', 'Contact name and number to show']];
const PK_BRIEF_FIELDS = {
  1: PK_PROPERTY_BRIEF,
  2: PK_PROPERTY_BRIEF,
  3: PK_PROPERTY_BRIEF,
  5: PK_PROPERTY_BRIEF,
  8: PK_PROPERTY_BRIEF.concat([['pages', 'Number of pages (up to 6)']]),
  9: PK_PROPERTY_BRIEF.concat([['qr_link', 'Where the QR code should point (listing, landing page or WhatsApp)']]),
  6: [['language', 'Language (English or Urdu)'], ['message', 'Key points for the voiceover']],
  7: [['message', 'Message and offer'], ['music', 'Music style']],
  12: [['property', 'Property title and location'], ['domain', 'Domain (if you have one)']],
  16: [['business', 'Business name'], ['pages', 'Pages you need'], ['domain', 'Domain (if you have one)']],
  17: [['business', 'Business name'], ['pages', 'Pages you need'], ['domain', 'Domain (if you have one)']],
  21: [['platform', 'Platform: Meta, Google or TikTok'], ['budget', 'Monthly ad budget you will pay the platform']],
  22: [['platforms', 'Platforms (two of Meta, Google, TikTok)'], ['budget', 'Monthly ad budget you will pay the platforms']],
  26: [['project', 'Project name'], ['plot_sizes', 'Plot / unit sizes'], ['down_payment', 'Down payment'], ['instalments', 'Instalments (number and amount)'], ['balloon', 'Balloon / possession payments']],
  27: [['project', 'Project name'], ['pages', 'Number of pages (up to 8)']],
  29: [['rates', 'Current rates / offer']],
  30: [['project', 'Project name'], ['approvals', 'Authorities and approval numbers you can show us (we present them; we do not verify them)']],
  31: [['project', 'Society / project name'], ['plots', 'Approximate number of plots']],
  32: [['project', 'Project name'], ['audience', 'Investor audience (overseas, institutional…)']],
  33: [['project', 'Project name'], ['domain', 'Domain (if you have one)']],
  34: [['project', 'Project or developer name'], ['pages', 'Pages you need'], ['domain', 'Domain (if you have one)']],
  35: [['message', 'Message and offer'], ['music', 'Music style']],
  36: [['language', 'Language (English, Urdu or both)'], ['script', 'Key points or script']],
  64: [['project', 'Property or project facts to use']],
  70: [['agreement_type', 'Sale, purchase or rental'], ['parties', 'Party names (as on CNIC)'], ['property', 'Property details'], ['amount', 'Amount and payment terms']]
};
