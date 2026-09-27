/* ============================================
   AgenticCore Pakistan — one-click English / اردو toggle
   Same mechanism as agenticcore.estate's i18n.js:
   elements opt in with data-i18n="key" (textContent),
   data-i18n-ph="key" (placeholder) or data-i18n-aria="key".
   Script-rendered content calls pkT(key) and re-renders on
   language change via pkOnLanguageChange(fn).

   Urdu here is a first pass and should be reviewed by a native
   speaker before launch (build brief, A13). Service descriptions
   and price lines stay in English; names, headings and buttons
   switch.
   ============================================ */

const PK_I18N = {
  en: {
    nav_services: 'Services', nav_packages: 'Packages', nav_how: 'How it works', nav_referral: 'Referrals',
    nav_login: 'Log in', nav_signup: 'Create free account', nav_dashboard: 'Dashboard', nav_logout: 'Log out', nav_admin: 'Admin',
    nav_menu: 'Menu', wa_us: 'WhatsApp us', call: 'Call', order_online: 'Order online',

    hero_title_1: 'Property marketing done for you, ',
    hero_title_2: 'delivered the same day.',
    hero_sub: "Posts, flyers, videos, websites and WhatsApp lead systems for Pakistan's property dealers, agents, agencies and developers. Order on WhatsApp or online, track every task by its ID, and get most work back the same day.",
    hero_cta_packages: 'See packages from Rs 6,499/month',
    hero_trust_1: 'Orders by 6pm PKT delivered the same day',
    hero_trust_2: 'Prices published in PKR',
    hero_trust_3: 'Pages, domains and accounts stay in your name',
    hero_roman: 'WhatsApp karein, kaam aaj hi shuru.',
    phone_title: 'My tasks', phone_caption: 'The real dashboard: every order gets a task ID and a live status.',
    chip_active: 'Active', chip_waiting: 'Waiting on you', chip_delivered: 'Delivered', chip_all: 'All',

    proof_eyebrow: 'Proof over claims',
    proof_title: 'Honest, fast and affordable. Here is what that means.',
    proof_sub: "In Pakistan's property market the problem is trust: buyers check everything, and they're right to. So we show real work, publish every price, and put our promises in writing.",
    proof_samples_title: 'Sample work',
    proof_sample_label: 'Sample concept',
    proof_promises_title: 'Our promises',
    promise_1: 'We only advertise approvals you can show us.',
    promise_2: 'We never promise a set number of leads or sales. We agree clear targets and report honestly.',
    promise_3: 'Ad accounts, pages, domains, WhatsApp numbers and automations are set up in your name, so you keep them.',

    prob_eyebrow: 'Sound familiar?', prob_title: 'Sound familiar?',
    prob_tab_dealers: 'Dealers and agents', prob_tab_agencies: 'Agencies', prob_tab_developers: 'Developers',
    prob_d1_q: "My Facebook page hasn't had a post in weeks.", prob_d1_a: 'Dealer Starter posts for you every week.',
    prob_d2_q: 'Rates change and my flyers are always out of date.', prob_d2_a: 'New rate sheets the same day.',
    prob_d3_q: 'A lead messaged at midnight and I replied at noon.', prob_d3_a: 'A WhatsApp qualification bot answers instantly.',
    prob_a1_q: 'Listings are out of date on Zameen, Graana and OLX.', prob_a1_a: 'One master sheet keeps them current.',
    prob_a2_q: 'Agents take leads with them when they leave.', prob_a2_a: 'CRM set-up with controls.',
    prob_v1_q: 'Overseas buyers want proof before they pay.', prob_v1_a: 'NOC and approval kits, dated progress reels, virtual tours.',
    prob_v2_q: 'Instalments slip and staff chase by phone.', prob_v2_a: 'Automatic reminders with a record of every notice.',
    wa_about_this: 'WhatsApp us about this',

    svc_eyebrow: 'All 56 services', svc_title: 'Everything you need to sell property, in one place.',
    svc_sub: 'Grouped by what you need, not by what we call it. Every price is published; every service shows its delivery time.',
    svc_see_all: 'See all', svc_services: 'services', svc_from: 'from', svc_new: 'new',
    svc_english_note: '',
    svc_page_link: 'Open the full price list',

    pkg_eyebrow: 'Packages', pkg_title: 'Save more with a package.',
    pkg_a_month: 'a month', pkg_one_off: 'one-off', pkg_setup: 'set-up', pkg_setup_free: 'Set-up included free',
    pkg_min: 'minimum', pkg_months: 'months', pkg_bought_sep: 'Bought separately', pkg_you_save: 'You save',
    pkg_on_setup: 'on set-up', pkg_delivery: 'Delivery', pkg_see_everything: 'See everything included',
    pkg_every_month: 'Every month', pkg_one_off_setup: 'One-off set-up', pkg_what_you_get: 'What you get',
    pkg_paid_sep: 'Paid separately', pkg_start_wa: 'WhatsApp to start', pkg_order: 'Order online',
    pkg_included: 'included', pkg_at_least: 'at least', pkg_no_monthly: 'No monthly commitment.',
    pkg_just_one: 'Need just one thing? See all 56 services and prices.',

    how_eyebrow: 'How it works', how_title: 'Order in minutes. Most work back the same day.',
    how_1_t: 'Order', how_1_d: 'Message us on WhatsApp or order online. Pick a service or package.',
    how_2_t: 'Get your task ID', how_2_d: "Every order gets an ID, e.g. ACPK-0142, and a delivery time. You'll get it on WhatsApp and in your dashboard.",
    how_3_t: 'Send details and pay', how_3_d: 'Share your logo, photos and text, and pay. The clock starts once all three are in.',
    how_4_t: 'Track it', how_4_d: 'See the status of every task live: received, in progress, ready for review, delivered.',
    how_5_t: 'Receive and approve', how_5_d: 'Download the files from your dashboard or get them on WhatsApp. Two rounds of changes are included.',
    how_foot: 'Same day applies to orders confirmed by 6pm PKT. Frameworks and heavy campaigns take 2–3 days; Project Partner is delivered within 1 week.',

    free_eyebrow: 'Try us free', free_title: 'Try us free.',

    ref_eyebrow: 'One login across AgenticCore', ref_title: 'One login. One points balance across AgenticCore.',
    ref_sub: 'Your AgenticCore account works on agenticcore.estate and agenticcorepk.com. Share your referral link: when someone you referred directly spends on any AgenticCore site, you earn 10% of that spend as AgenticCore Points.',
    ref_rule_1: '10%', ref_rule_1_d: 'of what your direct referrals spend, credited as points',
    ref_rule_2: '1 point = Rs 1', ref_rule_2_d: 'one balance, visible on both sites',
    ref_rule_3: 'No tiers, no cards', ref_rule_3_d: 'just one referral link per account',
    ref_join: 'Join free', ref_terms: 'Read the referral terms',

    estate_eyebrow: 'Sister site', estate_title: 'List and find property on AgenticCore Estate.',
    estate_sub: 'Our sister site, agenticcore.estate, is a property portal for Pakistan. Use the same login to list properties, promote your agency or project, and track your referral points.',
    estate_visit: 'Visit agenticcore.estate', estate_my_listings: 'My listings',

    faq_eyebrow: 'Questions', faq_title: 'Frequently asked questions',
    faq_q1: 'Do you guarantee leads or sales?', faq_a1: 'No. We agree clear targets and report honestly.',
    faq_q2: 'How fast is delivery?', faq_a2: 'Most work the same day for orders confirmed by 6pm PKT. Frameworks and heavy campaigns take 2–3 days. Project Partner is delivered within 1 week. The clock starts once we have your details, content and payment.',
    faq_q3: 'How do I pay?', faq_a3: 'Monthly fees are paid in advance. One-off work is usually paid half at the start and half on delivery. Every order gets an invoice in your dashboard.',
    faq_q4: 'Is ad spend included?', faq_a4: 'No. You pay Meta, Google or TikTok directly, never us.',
    faq_q5: 'Who owns the pages, domains and designs?', faq_a5: 'You. We set them up in your name.',
    faq_q6: 'Do you work with projects without an NOC?', faq_a6: 'We only advertise approvals you can show us.',
    faq_q7: 'Can you work in Urdu and Roman Urdu?', faq_a7: 'Yes. Ad copy, captions, voiceovers and agreement drafts are available in Urdu.',
    faq_q8: 'Is the Urdu agreement legal advice?', faq_a8: 'No. The Urdu draft is for a clear, shared understanding between the parties only. It is not for final signing until your own legal adviser has checked it, and it is not legal advice.',
    faq_q9: 'Does my estate portal login work here?', faq_a9: 'Yes, it is the same account. Log in with the same phone number or email and password.',
    faq_q10: 'What if I need changes?', faq_a10: 'Two rounds of changes are included on each design. Further changes are quoted separately.',

    final_title: "Tell us what you're selling. We'll reply with a plan.",
    final_roman: 'Apna kaam batayein, hum aaj hi shuru karein ge.',
    cb_name: 'Your name', cb_phone: 'Phone', cb_city: 'City', cb_submit: 'Call me back',
    cb_thanks: 'Thank you. We will call you back soon. Create a free account to track your order.',
    cb_error: 'Could not send. Please try again or message us on WhatsApp.',

    footer_tagline: 'Marketing and technology for Pakistan\'s real estate community. Sister site to agenticcore.estate.',
    footer_services: 'Services', footer_company: 'Company', footer_contact: 'Contact',
    footer_terms: 'Terms', footer_privacy: 'Privacy', footer_refunds: 'Refund policy', footer_ref_terms: 'Referral terms',
    footer_small: 'AgenticCore Pakistan is a marketing and technology provider, not a property broker. Ad wording checks and Urdu agreement drafts are not legal advice.',
    footer_rights: 'All rights reserved.',

    auth_login_title: 'Log in', auth_login_sub: 'Welcome back.',
    auth_shared_note: 'Same account as agenticcore.estate. Already have an estate login? Use it here.',
    auth_identifier: 'Phone number or email', field_password: 'Password',
    auth_login_btn: 'Log in', auth_no_account: "Don't have an account?", auth_create_one: 'Create one free',
    auth_signup_title: 'Create your free account', auth_signup_sub: 'Order services, track every task and download your files.',
    field_account_type: 'I am a', role_buyer: 'Dealer / agent', role_agency: 'Agency', role_developer: 'Developer / project', role_builder: 'Builder',
    field_full_name: 'Full name', field_phone: 'Phone number', field_email: 'Email', field_referral: 'Referral code (optional)',
    auth_signup_btn: 'Create account', auth_has_account: 'Already have an account?', auth_login_link: 'Log in',
    auth_wait: 'Please wait…',

    st_received: 'Received', st_waiting_on_you: 'Waiting on you', st_confirmed: 'Confirmed', st_in_progress: 'In progress',
    st_ready_for_review: 'Ready for review', st_changes_requested: 'Changes requested', st_delivered: 'Delivered', st_cancelled: 'Cancelled',

    d_home: 'Home', d_order: 'New order', d_tasks: 'My tasks', d_deliveries: 'Deliveries', d_invoices: 'Invoices',
    d_usage: 'Package usage', d_points: 'Points & referrals', d_listings: 'Estate listings', d_profile: 'Profile & brand kit',
    d_support: 'Support', d_notifications: 'Notifications'
  },

  ur: {
    nav_services: 'سروسز', nav_packages: 'پیکجز', nav_how: 'طریقہ کار', nav_referral: 'ریفرلز',
    nav_login: 'لاگ اِن', nav_signup: 'مفت اکاؤنٹ بنائیں', nav_dashboard: 'ڈیش بورڈ', nav_logout: 'لاگ آؤٹ', nav_admin: 'ایڈمن',
    nav_menu: 'مینو', wa_us: 'واٹس ایپ کریں', call: 'کال کریں', order_online: 'آن لائن آرڈر',

    hero_title_1: 'پراپرٹی مارکیٹنگ آپ کے لیے، ',
    hero_title_2: 'اسی دن ڈیلیور۔',
    hero_sub: 'پاکستان کے پراپرٹی ڈیلرز، ایجنٹس، ایجنسیوں اور ڈویلپرز کے لیے پوسٹس، فلائرز، ویڈیوز، ویب سائٹس اور واٹس ایپ لیڈ سسٹمز۔ واٹس ایپ یا آن لائن آرڈر کریں، ہر کام کو اس کی آئی ڈی سے ٹریک کریں، اور زیادہ تر کام اسی دن واپس پائیں۔',
    hero_cta_packages: 'پیکجز دیکھیں، صرف 6,499 روپے ماہانہ سے',
    hero_trust_1: 'شام 6 بجے تک کے آرڈر اسی دن ڈیلیور',
    hero_trust_2: 'تمام قیمتیں روپوں میں شائع شدہ',
    hero_trust_3: 'پیجز، ڈومین اور اکاؤنٹس آپ کے نام پر',
    hero_roman: 'واٹس ایپ کریں، کام آج ہی شروع۔',
    phone_title: 'میرے کام', phone_caption: 'اصل ڈیش بورڈ: ہر آرڈر کو ٹاسک آئی ڈی اور لائیو اسٹیٹس ملتا ہے۔',
    chip_active: 'جاری', chip_waiting: 'آپ کا انتظار', chip_delivered: 'ڈیلیور شدہ', chip_all: 'سب',

    proof_eyebrow: 'دعوے نہیں، ثبوت',
    proof_title: 'ایماندار، تیز اور سستی۔ اس کا مطلب یہ ہے۔',
    proof_sub: 'پاکستان کی پراپرٹی مارکیٹ میں اصل مسئلہ بھروسہ ہے: خریدار ہر چیز جانچتے ہیں، اور ٹھیک کرتے ہیں۔ اس لیے ہم اصل کام دکھاتے ہیں، ہر قیمت شائع کرتے ہیں اور اپنے وعدے لکھ کر دیتے ہیں۔',
    proof_samples_title: 'نمونہ کام',
    proof_sample_label: 'نمونہ تصور',
    proof_promises_title: 'ہمارے وعدے',
    promise_1: 'ہم صرف وہی منظوریاں مشتہر کرتے ہیں جو آپ ہمیں دکھا سکیں۔',
    promise_2: 'ہم لیڈز یا سیلز کی کوئی مقررہ تعداد کا وعدہ نہیں کرتے۔ ہم واضح اہداف طے کرتے ہیں اور ایمانداری سے رپورٹ کرتے ہیں۔',
    promise_3: 'اشتہاری اکاؤنٹس، پیجز، ڈومینز، واٹس ایپ نمبرز اور آٹومیشنز آپ کے نام پر بنتے ہیں، اس لیے وہ آپ کے ہی رہتے ہیں۔',

    prob_eyebrow: 'کیا یہ جانا پہچانا لگتا ہے؟', prob_title: 'کیا یہ جانا پہچانا لگتا ہے؟',
    prob_tab_dealers: 'ڈیلرز اور ایجنٹس', prob_tab_agencies: 'ایجنسیاں', prob_tab_developers: 'ڈویلپرز',
    prob_d1_q: 'میرے فیس بک پیج پر ہفتوں سے کوئی پوسٹ نہیں ہوئی۔', prob_d1_a: 'ڈیلر اسٹارٹر ہر ہفتے آپ کے لیے پوسٹ کرتا ہے۔',
    prob_d2_q: 'ریٹ بدلتے رہتے ہیں اور میرے فلائرز ہمیشہ پرانے ہوتے ہیں۔', prob_d2_a: 'نئی ریٹ شیٹس اسی دن۔',
    prob_d3_q: 'لیڈ نے آدھی رات کو میسج کیا اور میں نے دوپہر کو جواب دیا۔', prob_d3_a: 'واٹس ایپ کوالیفیکیشن بوٹ فوراً جواب دیتا ہے۔',
    prob_a1_q: 'زمین، گرانہ اور او ایل ایکس پر لسٹنگز پرانی ہیں۔', prob_a1_a: 'ایک ماسٹر شیٹ سب کو تازہ رکھتی ہے۔',
    prob_a2_q: 'ایجنٹس جاتے ہوئے لیڈز ساتھ لے جاتے ہیں۔', prob_a2_a: 'کنٹرولز کے ساتھ سی آر ایم سیٹ اپ۔',
    prob_v1_q: 'اوورسیز خریدار ادائیگی سے پہلے ثبوت چاہتے ہیں۔', prob_v1_a: 'این او سی کٹس، تاریخ والی پروگریس ریلز، ورچوئل ٹورز۔',
    prob_v2_q: 'قسطیں رہ جاتی ہیں اور عملہ فون پر پیچھا کرتا ہے۔', prob_v2_a: 'ہر نوٹس کے ریکارڈ کے ساتھ خودکار یاددہانیاں۔',
    wa_about_this: 'اس بارے میں واٹس ایپ کریں',

    svc_eyebrow: 'تمام 56 سروسز', svc_title: 'پراپرٹی بیچنے کے لیے سب کچھ، ایک جگہ۔',
    svc_sub: 'آپ کی ضرورت کے مطابق ترتیب۔ ہر قیمت شائع شدہ؛ ہر سروس کے ساتھ ڈیلیوری کا وقت۔',
    svc_see_all: 'سب دیکھیں', svc_services: 'سروسز', svc_from: 'سے شروع', svc_new: 'نیا',
    svc_english_note: 'تفصیلات اور قیمتوں کی شرائط انگریزی میں ہیں۔',
    svc_page_link: 'مکمل قیمتوں کی فہرست کھولیں',

    pkg_eyebrow: 'پیکجز', pkg_title: 'پیکج کے ساتھ زیادہ بچت کریں۔',
    pkg_a_month: 'ماہانہ', pkg_one_off: 'ایک بار', pkg_setup: 'سیٹ اپ', pkg_setup_free: 'سیٹ اپ مفت شامل',
    pkg_min: 'کم از کم', pkg_months: 'ماہ', pkg_bought_sep: 'الگ الگ خریدنے پر', pkg_you_save: 'آپ کی بچت',
    pkg_on_setup: 'سیٹ اپ پر', pkg_delivery: 'ڈیلیوری', pkg_see_everything: 'شامل ہر چیز دیکھیں',
    pkg_every_month: 'ہر مہینے', pkg_one_off_setup: 'ایک بار کا سیٹ اپ', pkg_what_you_get: 'آپ کو کیا ملے گا',
    pkg_paid_sep: 'الگ سے ادائیگی', pkg_start_wa: 'واٹس ایپ پر شروع کریں', pkg_order: 'آن لائن آرڈر',
    pkg_included: 'شامل', pkg_at_least: 'کم از کم', pkg_no_monthly: 'کوئی ماہانہ پابندی نہیں۔',
    pkg_just_one: 'صرف ایک چیز چاہیے؟ تمام 56 سروسز اور قیمتیں دیکھیں۔',

    how_eyebrow: 'طریقہ کار', how_title: 'منٹوں میں آرڈر۔ زیادہ تر کام اسی دن واپس۔',
    how_1_t: 'آرڈر کریں', how_1_d: 'واٹس ایپ پر میسج کریں یا آن لائن آرڈر کریں۔ سروس یا پیکج چنیں۔',
    how_2_t: 'ٹاسک آئی ڈی پائیں', how_2_d: 'ہر آرڈر کو ایک آئی ڈی ملتی ہے، مثلاً ACPK-0142، اور ڈیلیوری کا وقت۔ یہ آپ کو واٹس ایپ اور ڈیش بورڈ پر ملے گی۔',
    how_3_t: 'تفصیلات بھیجیں اور ادائیگی کریں', how_3_d: 'اپنا لوگو، تصاویر اور متن بھیجیں اور ادائیگی کریں۔ تینوں ملتے ہی وقت شروع ہو جاتا ہے۔',
    how_4_t: 'ٹریک کریں', how_4_d: 'ہر کام کا اسٹیٹس لائیو دیکھیں: موصول، جاری، جائزے کے لیے تیار، ڈیلیور شدہ۔',
    how_5_t: 'وصول کریں اور منظور کریں', how_5_d: 'فائلیں ڈیش بورڈ سے ڈاؤن لوڈ کریں یا واٹس ایپ پر پائیں۔ دو بار تبدیلیاں شامل ہیں۔',
    how_foot: 'اسی دن ڈیلیوری شام 6 بجے (پاکستانی وقت) تک کنفرم آرڈرز پر لاگو ہے۔ فریم ورکس اور بڑی مہمات میں 2 سے 3 دن؛ پراجیکٹ پارٹنر ایک ہفتے میں۔',

    free_eyebrow: 'مفت آزمائیں', free_title: 'مفت آزمائیں۔',

    ref_eyebrow: 'پورے AgenticCore پر ایک لاگ اِن', ref_title: 'ایک لاگ اِن۔ پورے AgenticCore پر ایک پوائنٹس بیلنس۔',
    ref_sub: 'آپ کا AgenticCore اکاؤنٹ agenticcore.estate اور agenticcorepk.com دونوں پر چلتا ہے۔ اپنا ریفرل لنک شیئر کریں: جسے آپ نے براہِ راست ریفر کیا وہ کسی بھی AgenticCore سائٹ پر خرچ کرے تو آپ کو اس کا 10 فیصد AgenticCore Points میں ملتا ہے۔',
    ref_rule_1: '10٪', ref_rule_1_d: 'براہِ راست ریفرلز کے خرچ کا، پوائنٹس کی صورت میں',
    ref_rule_2: '1 پوائنٹ = 1 روپیہ', ref_rule_2_d: 'ایک بیلنس، دونوں سائٹس پر نظر آتا ہے',
    ref_rule_3: 'نہ درجے، نہ کارڈز', ref_rule_3_d: 'ہر اکاؤنٹ کا صرف ایک ریفرل لنک',
    ref_join: 'مفت شامل ہوں', ref_terms: 'ریفرل شرائط پڑھیں',

    estate_eyebrow: 'بہن سائٹ', estate_title: 'AgenticCore Estate پر پراپرٹی لسٹ کریں اور تلاش کریں۔',
    estate_sub: 'ہماری بہن سائٹ agenticcore.estate پاکستان کا پراپرٹی پورٹل ہے۔ اسی لاگ اِن سے پراپرٹیز لسٹ کریں، اپنی ایجنسی یا پراجیکٹ کی تشہیر کریں اور ریفرل پوائنٹس دیکھیں۔',
    estate_visit: 'agenticcore.estate دیکھیں', estate_my_listings: 'میری لسٹنگز',

    faq_eyebrow: 'سوالات', faq_title: 'اکثر پوچھے جانے والے سوالات',
    faq_q1: 'کیا آپ لیڈز یا سیلز کی ضمانت دیتے ہیں؟', faq_a1: 'نہیں۔ ہم واضح اہداف طے کرتے ہیں اور ایمانداری سے رپورٹ کرتے ہیں۔',
    faq_q2: 'ڈیلیوری کتنی تیز ہے؟', faq_a2: 'شام 6 بجے تک کنفرم ہونے والے زیادہ تر آرڈر اسی دن۔ فریم ورکس اور بڑی مہمات میں 2 سے 3 دن۔ پراجیکٹ پارٹنر ایک ہفتے میں۔ وقت تب شروع ہوتا ہے جب ہمیں آپ کی تفصیلات، مواد اور ادائیگی مل جائے۔',
    faq_q3: 'ادائیگی کیسے کروں؟', faq_a3: 'ماہانہ فیس پیشگی ادا کی جاتی ہے۔ ایک بار کے کام کی عموماً آدھی ادائیگی شروع میں اور آدھی ڈیلیوری پر۔ ہر آرڈر کی انوائس آپ کے ڈیش بورڈ میں ملتی ہے۔',
    faq_q4: 'کیا اشتہاری خرچ شامل ہے؟', faq_a4: 'نہیں۔ آپ براہِ راست میٹا، گوگل یا ٹک ٹاک کو ادا کرتے ہیں، ہمیں نہیں۔',
    faq_q5: 'پیجز، ڈومینز اور ڈیزائنز کا مالک کون ہے؟', faq_a5: 'آپ۔ ہم انہیں آپ کے نام پر بناتے ہیں۔',
    faq_q6: 'کیا آپ بغیر این او سی والے پراجیکٹس پر کام کرتے ہیں؟', faq_a6: 'ہم صرف وہی منظوریاں مشتہر کرتے ہیں جو آپ ہمیں دکھا سکیں۔',
    faq_q7: 'کیا آپ اردو اور رومن اردو میں کام کرتے ہیں؟', faq_a7: 'جی ہاں۔ اشتہاری تحریر، کیپشنز، وائس اوورز اور اقرار نامے کے مسودے اردو میں دستیاب ہیں۔',
    faq_q8: 'کیا اردو اقرار نامہ قانونی مشورہ ہے؟', faq_a8: 'نہیں۔ اردو مسودہ صرف فریقین کے درمیان واضح اور مشترکہ سمجھ کے لیے ہے۔ جب تک آپ کا اپنا قانونی مشیر اسے نہ دیکھ لے، یہ حتمی دستخط کے لیے نہیں ہے، اور یہ قانونی مشورہ نہیں ہے۔',
    faq_q9: 'کیا میرا اسٹیٹ پورٹل لاگ اِن یہاں چلے گا؟', faq_a9: 'جی ہاں، یہ ایک ہی اکاؤنٹ ہے۔ اسی فون نمبر یا ای میل اور پاس ورڈ سے لاگ اِن کریں۔',
    faq_q10: 'اگر مجھے تبدیلیاں چاہییں تو؟', faq_a10: 'ہر ڈیزائن پر دو بار تبدیلیاں شامل ہیں۔ مزید تبدیلیوں کا الگ سے کوٹ دیا جاتا ہے۔',

    final_title: 'بتائیں آپ کیا بیچ رہے ہیں۔ ہم ایک پلان کے ساتھ جواب دیں گے۔',
    final_roman: 'اپنا کام بتائیں، ہم آج ہی شروع کریں گے۔',
    cb_name: 'آپ کا نام', cb_phone: 'فون', cb_city: 'شہر', cb_submit: 'مجھے کال کریں',
    cb_thanks: 'شکریہ۔ ہم جلد آپ کو کال کریں گے۔ اپنا آرڈر ٹریک کرنے کے لیے مفت اکاؤنٹ بنائیں۔',
    cb_error: 'بھیجا نہیں جا سکا۔ دوبارہ کوشش کریں یا واٹس ایپ پر میسج کریں۔',

    footer_tagline: 'پاکستان کی رئیل اسٹیٹ کمیونٹی کے لیے مارکیٹنگ اور ٹیکنالوجی۔ agenticcore.estate کی بہن سائٹ۔',
    footer_services: 'سروسز', footer_company: 'کمپنی', footer_contact: 'رابطہ',
    footer_terms: 'شرائط', footer_privacy: 'رازداری', footer_refunds: 'ریفنڈ پالیسی', footer_ref_terms: 'ریفرل شرائط',
    footer_small: 'AgenticCore Pakistan مارکیٹنگ اور ٹیکنالوجی فراہم کنندہ ہے، پراپرٹی بروکر نہیں۔ اشتہاری الفاظ کی جانچ اور اردو اقرار نامے کے مسودے قانونی مشورہ نہیں ہیں۔',
    footer_rights: 'جملہ حقوق محفوظ ہیں۔',

    auth_login_title: 'لاگ اِن', auth_login_sub: 'خوش آمدید۔',
    auth_shared_note: 'وہی اکاؤنٹ جو agenticcore.estate پر ہے۔ اسٹیٹ لاگ اِن ہے؟ یہاں بھی وہی استعمال کریں۔',
    auth_identifier: 'فون نمبر یا ای میل', field_password: 'پاس ورڈ',
    auth_login_btn: 'لاگ اِن', auth_no_account: 'اکاؤنٹ نہیں ہے؟', auth_create_one: 'مفت بنائیں',
    auth_signup_title: 'اپنا مفت اکاؤنٹ بنائیں', auth_signup_sub: 'سروسز آرڈر کریں، ہر کام ٹریک کریں اور فائلیں ڈاؤن لوڈ کریں۔',
    field_account_type: 'میں ہوں', role_buyer: 'ڈیلر / ایجنٹ', role_agency: 'ایجنسی', role_developer: 'ڈویلپر / پراجیکٹ', role_builder: 'بلڈر',
    field_full_name: 'پورا نام', field_phone: 'فون نمبر', field_email: 'ای میل', field_referral: 'ریفرل کوڈ (اختیاری)',
    auth_signup_btn: 'اکاؤنٹ بنائیں', auth_has_account: 'پہلے سے اکاؤنٹ ہے؟', auth_login_link: 'لاگ اِن',
    auth_wait: 'براہِ کرم انتظار کریں…',

    st_received: 'موصول', st_waiting_on_you: 'آپ کا انتظار', st_confirmed: 'کنفرم', st_in_progress: 'جاری',
    st_ready_for_review: 'جائزے کے لیے تیار', st_changes_requested: 'تبدیلیاں مطلوب', st_delivered: 'ڈیلیور شدہ', st_cancelled: 'منسوخ',

    d_home: 'ہوم', d_order: 'نیا آرڈر', d_tasks: 'میرے کام', d_deliveries: 'ڈیلیوریز', d_invoices: 'انوائسز',
    d_usage: 'پیکج استعمال', d_points: 'پوائنٹس اور ریفرلز', d_listings: 'اسٹیٹ لسٹنگز', d_profile: 'پروفائل اور برانڈ کٹ',
    d_support: 'سپورٹ', d_notifications: 'اطلاعات'
  }
};

let pkLang = 'en';
const pkLangListeners = [];

function pkGetSavedLang() {
  try { return localStorage.getItem('acLang') === 'ur' ? 'ur' : 'en'; } catch (e) { return 'en'; }
}

function pkT(key) {
  const dict = PK_I18N[pkLang] || PK_I18N.en;
  return (dict[key] !== undefined) ? dict[key] : (PK_I18N.en[key] !== undefined ? PK_I18N.en[key] : key);
}

// Pick the Urdu field of a data object when the page is in Urdu and one exists.
function pkPick(obj, field) {
  if (pkLang === 'ur' && obj[field + '_ur']) return obj[field + '_ur'];
  return obj[field];
}

// Nastaliq is heavy, so it only loads once someone switches to Urdu.
function pkLoadUrduFont() {
  if (document.getElementById('pkUrduFont')) return;
  const link = document.createElement('link');
  link.id = 'pkUrduFont';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap';
  document.head.appendChild(link);
}

function pkApplyLanguage(lang) {
  pkLang = (lang === 'ur') ? 'ur' : 'en';
  document.documentElement.setAttribute('lang', pkLang);
  document.documentElement.setAttribute('dir', pkLang === 'ur' ? 'rtl' : 'ltr');
  try { localStorage.setItem('acLang', pkLang); } catch (e) { /* private mode: language just won't persist */ }
  if (pkLang === 'ur') pkLoadUrduFont();

  pkTranslate(document);
  document.querySelectorAll('.lang-toggle').forEach(function (el) {
    el.innerHTML = '<span class="' + (pkLang === 'en' ? 'on' : '') + '">English</span><span class="sep">|</span><span class="' + (pkLang === 'ur' ? 'on' : '') + '">اردو</span>';
    el.setAttribute('aria-label', pkLang === 'en' ? 'اردو میں دیکھیں' : 'View in English');
  });
  pkLangListeners.forEach(function (fn) { try { fn(pkLang); } catch (e) { console.error(e); } });
}

// Fill data-i18n* attributes inside a subtree (call after rendering HTML).
function pkTranslate(scope) {
  scope.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = pkT(el.getAttribute('data-i18n')); });
  scope.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', pkT(el.getAttribute('data-i18n-ph'))); });
  scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', pkT(el.getAttribute('data-i18n-aria'))); });
}

function pkToggleLanguage() { pkApplyLanguage(pkLang === 'ur' ? 'en' : 'ur'); }
function pkOnLanguageChange(fn) { pkLangListeners.push(fn); }
function pkInitLanguage() { pkApplyLanguage(pkGetSavedLang()); }
