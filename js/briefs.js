/* AgenticCore Pakistan — what we need from the client, per service (build brief B3).
   Shared by the dashboard order form and the service detail view.
   Services not listed get a free-text brief. */
const PK_BRIEF_FIELDS = {
  4: [['project', 'Project name'], ['plot_sizes', 'Plot / unit sizes'], ['down_payment', 'Down payment'], ['instalments', 'Instalments (number and amount)'], ['balloon', 'Balloon / possession payments']],
  5: [['project', 'Society / project name'], ['plots', 'Approximate number of plots']],
  6: [['project', 'Project name'], ['pages', 'Number of pages']],
  8: [['project', 'Project name'], ['approvals', 'Authorities and approval numbers (only approvals you can show us)']],
  11: [['rates', 'Current rates / offer']],
  13: [['project', 'Project name'], ['audience', 'Investor audience (overseas, institutional…)']],
  14: [['business', 'Business name'], ['pages', 'Pages you need'], ['domain', 'Domain (if you have one)']],
  15: [['project', 'Property / project name'], ['domain', 'Domain (if you have one)']],
  21: [['language', 'Language (English, Urdu or both)'], ['script', 'Key points or script']],
  22: [['language', 'Language (English or Urdu)'], ['message', 'Update or campaign message']],
  23: [['message', 'Message and offer'], ['music', 'Music style']],
  36: [['platforms', 'Platform(s): Meta, Google, TikTok'], ['budget', 'Monthly ad budget you will pay the platform']],
  37: [['project', 'Project facts to use']],
  56: [['agreement_type', 'Sale, purchase or rental'], ['parties', 'Party names (as on CNIC)'], ['property', 'Property details'], ['amount', 'Amount and payment terms']]
};
