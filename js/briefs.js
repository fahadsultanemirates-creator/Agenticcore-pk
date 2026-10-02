/* AgenticCore Pakistan — what we need from the client, per service (Catalogue V2 numbers).
   Shared by the dashboard order form and the service detail view.
   Services not listed get a free-text brief. Each field is [key, English label, Urdu label]. */
function pkBriefLabel(f) { return (typeof pkLang !== 'undefined' && pkLang === 'ur' && f[2]) || f[1]; }
const PK_PROPERTY_BRIEF = [['property', 'Property title and location', 'جائیداد کا عنوان اور مقام'], ['price', 'Demand price or rent', 'مطلوبہ قیمت یا کرایہ'], ['facts', 'Size, beds, baths and key facts', 'سائز، بیڈ، باتھ اور اہم حقائق'], ['contact', 'Contact name and number to show', 'دکھانے کے لیے رابطہ نام اور نمبر']];
const PK_BRIEF_FIELDS = {
  1: PK_PROPERTY_BRIEF,
  2: PK_PROPERTY_BRIEF,
  3: PK_PROPERTY_BRIEF,
  5: PK_PROPERTY_BRIEF,
  8: PK_PROPERTY_BRIEF.concat([['pages', 'Number of pages (up to 6)', 'صفحات کی تعداد (6 تک)']]),
  9: PK_PROPERTY_BRIEF.concat([['qr_link', 'Where the QR code should point (listing, landing page or WhatsApp)', 'QR کوڈ کہاں لے جائے (لسٹنگ، لینڈنگ پیج یا واٹس ایپ)']]),
  6: [['language', 'Language (English or Urdu)', 'زبان (انگریزی یا اردو)'], ['message', 'Key points for the voiceover', 'وائس اوور کے اہم نکات']],
  7: [['message', 'Message and offer', 'پیغام اور آفر'], ['music', 'Music style', 'موسیقی کا انداز']],
  12: [['property', 'Property title and location', 'جائیداد کا عنوان اور مقام'], ['domain', 'Domain (if you have one)', 'ڈومین (اگر ہو)']],
  16: [['business', 'Business name', 'کاروبار کا نام'], ['pages', 'Pages you need', 'مطلوبہ صفحات'], ['domain', 'Domain (if you have one)', 'ڈومین (اگر ہو)']],
  17: [['business', 'Business name', 'کاروبار کا نام'], ['pages', 'Pages you need', 'مطلوبہ صفحات'], ['domain', 'Domain (if you have one)', 'ڈومین (اگر ہو)']],
  21: [['platform', 'Platform: Meta, Google or TikTok', 'پلیٹ فارم: میٹا، گوگل یا ٹک ٹاک'], ['budget', 'Monthly ad budget you will pay the platform', 'ماہانہ اشتہاری بجٹ جو آپ پلیٹ فارم کو ادا کریں گے']],
  22: [['platforms', 'Platforms (two of Meta, Google, TikTok)', 'پلیٹ فارمز (میٹا، گوگل، ٹک ٹاک میں سے دو)'], ['budget', 'Monthly ad budget you will pay the platforms', 'ماہانہ اشتہاری بجٹ جو آپ پلیٹ فارمز کو ادا کریں گے']],
  26: [['project', 'Project name', 'پراجیکٹ کا نام'], ['plot_sizes', 'Plot / unit sizes', 'پلاٹ / یونٹ کے سائز'], ['down_payment', 'Down payment', 'ڈاؤن پیمنٹ'], ['instalments', 'Instalments (number and amount)', 'اقساط (تعداد اور رقم)'], ['balloon', 'Balloon / possession payments', 'بیلون / قبضے کی ادائیگیاں']],
  27: [['project', 'Project name', 'پراجیکٹ کا نام'], ['pages', 'Number of pages (up to 8)', 'صفحات کی تعداد (8 تک)']],
  29: [['rates', 'Current rates / offer', 'موجودہ ریٹس / آفر']],
  30: [['project', 'Project name', 'پراجیکٹ کا نام'], ['approvals', 'Authorities and approval numbers you can show us (we present them; we do not verify them)', 'ادارے اور منظوری نمبر جو آپ ہمیں دکھا سکیں (ہم انہیں پیش کرتے ہیں؛ تصدیق نہیں کرتے)']],
  31: [['project', 'Society / project name', 'سوسائٹی / پراجیکٹ کا نام'], ['plots', 'Approximate number of plots', 'پلاٹس کی اندازاً تعداد']],
  32: [['project', 'Project name', 'پراجیکٹ کا نام'], ['audience', 'Investor audience (overseas, institutional…)', 'سرمایہ کار ناظرین (اوورسیز، ادارہ جاتی…)']],
  33: [['project', 'Project name', 'پراجیکٹ کا نام'], ['domain', 'Domain (if you have one)', 'ڈومین (اگر ہو)']],
  34: [['project', 'Project or developer name', 'پراجیکٹ یا ڈویلپر کا نام'], ['pages', 'Pages you need', 'مطلوبہ صفحات'], ['domain', 'Domain (if you have one)', 'ڈومین (اگر ہو)']],
  35: [['message', 'Message and offer', 'پیغام اور آفر'], ['music', 'Music style', 'موسیقی کا انداز']],
  36: [['language', 'Language (English, Urdu or both)', 'زبان (انگریزی، اردو یا دونوں)'], ['script', 'Key points or script', 'اہم نکات یا اسکرپٹ']],
  64: [['project', 'Property or project facts to use', 'استعمال کے لیے جائیداد یا پراجیکٹ کے حقائق']],
  70: [['agreement_type', 'Sale, purchase or rental', 'فروخت، خرید یا کرایہ'], ['parties', 'Party names (as on CNIC)', 'فریقین کے نام (شناختی کارڈ کے مطابق)'], ['property', 'Property details', 'جائیداد کی تفصیل'], ['amount', 'Amount and payment terms', 'رقم اور ادائیگی کی شرائط']]
};
