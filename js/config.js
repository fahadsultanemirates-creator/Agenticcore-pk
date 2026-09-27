/* ============================================
   AgenticCore Pakistan — site settings
   Things Fahad still has to confirm live here, so filling them in
   is a one-line change, not a hunt through the pages.
   ============================================ */
const PK_CONFIG = {
  // PK WhatsApp number in international format, digits only, e.g. '923001234567'.
  // While empty, every "WhatsApp us" button falls back to the online order
  // route instead of opening a chat with nobody on the other end.
  whatsappNumber: '',

  // Phone number shown on the "Call" button of the mobile bar (same format).
  phoneNumber: '',

  // Contact email shown in the footer. Empty = hidden.
  email: '',

  // Working hours line for the footer.
  hours: 'Mon–Sat, 10am–7pm PKT',

  // "Try us free" section (build brief A7) — a suggestion awaiting a yes/no.
  // Set to true once the free items and any monthly cap are confirmed.
  leadMagnets: false,

  // Sister site.
  estateUrl: 'https://agenticcore.estate',
  logoUrl: 'https://agenticcore.estate/images/agenticcore-icon.png'
};
