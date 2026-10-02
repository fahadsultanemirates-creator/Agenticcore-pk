/* ============================================
   AgenticCore Pakistan — site settings
   Things Fahad still has to confirm live here, so filling them in
   is a one-line change, not a hunt through the pages.
   ============================================ */
const PK_CONFIG = {
  // PK WhatsApp number in international format, digits only, e.g. '923001234567'.
  // While empty, every "WhatsApp us" button falls back to the online order
  // route instead of opening a chat with nobody on the other end.
  whatsappNumber: '18089985226',
  whatsappDisplay: '+1 808 998 5226',

  // Phone number shown on the "Call" button of the mobile bar (same format).
  phoneNumber: '',

  // Contact email shown in the footer. Empty = hidden.
  email: 'hello@agenticcore.agency',

  // Working hours line for the footer.
  hours: 'Mon–Sat, 10am–7pm PKT',

  // "Try us free" section (build brief A7) — a suggestion awaiting a yes/no.
  // Set to true once the free items and any monthly cap are confirmed.
  leadMagnets: false,

  // Official AgenticCore channels — the same five links on agenticcore.estate.
  // WhatsApp CHANNEL = follow updates; the WhatsApp NUMBER above = chat with the team.
  social: [
    { key: 'whatsapp_channel', url: 'https://whatsapp.com/channel/0029Vb8on5ZGpLHWOTLXUT45' },
    { key: 'youtube', url: 'https://www.youtube.com/@AgenticcoreEstate' },
    { key: 'tiktok', url: 'https://www.tiktok.com/@agenticcore.estate' },
    { key: 'facebook', url: 'https://www.facebook.com/profile.php?id=61594880046065' },
    { key: 'instagram', url: 'https://www.instagram.com/agenticcore.estate' }
  ],

  // Sister site.
  estateUrl: 'https://agenticcore.estate',
  logoUrl: 'https://agenticcore.estate/images/agenticcore-icon.png'
};
