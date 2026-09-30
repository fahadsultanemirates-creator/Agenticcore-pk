/* ============================================
   AgenticCore Pakistan — property share card (canvas, in the browser)
   Draws a 1080×1350 WhatsApp/social card from what the user typed.
   Nothing is uploaded. Photos are read locally (FileReader) or, for the
   user's own Estate listing, from its public URL. The logo comes from the
   user's private Brand Kit through a short-lived signed URL, fetched as a
   blob so the canvas stays exportable.
   ============================================ */
const PkShareCard = (function () {
  const W = 1080, H = 1350;
  const GOLD = '#F0CE63', GOLD2 = '#D4AF37', BG = '#071F17', TEXT = '#F4EFE0', MUTED = '#9BB9A9';
  let qrPromise = null;

  function loadQr() {
    if (window.qrcode) return Promise.resolve();
    if (!qrPromise) qrPromise = new Promise(function (ok, fail) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
      s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    });
    return qrPromise;
  }

  async function bitmapFrom(src) {
    if (!src) return null;
    try {
      if (src instanceof Blob) return await createImageBitmap(src);
      const r = await fetch(src, { mode: 'cors' });
      if (!r.ok) return null;
      return await createImageBitmap(await r.blob());
    } catch (e) { return null; }
  }

  function cover(ctx, img, x, y, w, h) {
    const k = Math.max(w / img.width, h / img.height);
    const iw = img.width * k, ih = img.height * k;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); ctx.restore();
  }

  function wrap(ctx, text, max, lines) {
    const words = String(text || '').split(/\s+/); const out = []; let line = '';
    words.forEach(function (w) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; });
    if (line) out.push(line);
    if (out.length > lines) { out.length = lines; out[lines - 1] = out[lines - 1].replace(/\s*\S*$/, '') + '…'; }
    return out;
  }

  function drawQr(ctx, url, x, y, size) {
    if (!window.qrcode || !url) return false;
    const q = window.qrcode(0, 'M'); q.addData(url); q.make();
    const n = q.getModuleCount(), cell = size / (n + 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size); ctx.fillStyle = BG;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(x + (c + 2) * cell, y + (r + 2) * cell, Math.ceil(cell), Math.ceil(cell));
    return true;
  }

  // p: { purpose, title, place, priceText, facts[], name, phone, photo (Blob|url), logo (url), listingUrl }
  async function draw(canvas, p) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const [photo, logo] = await Promise.all([bitmapFrom(p.photo), bitmapFrom(p.logo)]);
    if (p.listingUrl) await loadQr().catch(function () {});
    const pad = 64, photoH = 700;

    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    if (photo) cover(ctx, photo, 0, 0, W, photoH);
    else { const g = ctx.createLinearGradient(0, 0, W, photoH); g.addColorStop(0, '#0C3324'); g.addColorStop(1, '#1D4835'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, photoH); }
    const fade = ctx.createLinearGradient(0, photoH - 180, 0, photoH);
    fade.addColorStop(0, 'rgba(7,31,23,0)'); fade.addColorStop(1, BG);
    ctx.fillStyle = fade; ctx.fillRect(0, photoH - 180, W, 180);

    ctx.fillStyle = GOLD2; ctx.fillRect(pad, pad, 270, 66);
    ctx.fillStyle = '#16250D'; ctx.font = '800 34px Inter, Arial, sans-serif';
    ctx.fillText(p.purpose === 'rent' ? 'FOR RENT' : 'FOR SALE', pad + 26, pad + 45);
    if (logo) {
      const lh = 110, lw = Math.min(260, logo.width * (lh / logo.height));
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillRect(W - pad - lw - 24, pad - 12, lw + 24, lh + 24);
      ctx.drawImage(logo, W - pad - lw - 12, pad, lw, lh);
    }

    let y = photoH + 20;
    if (p.priceText) { ctx.fillStyle = GOLD; ctx.font = '700 76px "Space Grotesk", Inter, Arial, sans-serif'; ctx.fillText(p.priceText, pad, y + 62); y += 104; }
    ctx.fillStyle = TEXT; ctx.font = '700 50px "Space Grotesk", Inter, Arial, sans-serif';
    wrap(ctx, p.title, W - pad * 2, 2).forEach(function (l) { ctx.fillText(l, pad, y + 44); y += 62; });
    if (p.place) { ctx.fillStyle = MUTED; ctx.font = '400 38px Inter, Arial, sans-serif'; wrap(ctx, p.place, W - pad * 2, 1).forEach(function (l) { ctx.fillText(l, pad, y + 38); y += 56; }); }

    y += 14; let x = pad;
    ctx.font = '600 32px Inter, Arial, sans-serif';
    (p.facts || []).forEach(function (f) {
      const w = ctx.measureText(f).width + 44;
      if (x + w > W - pad) return;
      ctx.strokeStyle = '#1D4835'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, 62);
      ctx.fillStyle = TEXT; ctx.fillText(f, x + 22, y + 42); x += w + 14;
    });

    const qr = 190, fy = H - qr - pad;
    const hasQr = drawQr(ctx, p.listingUrl, W - pad - qr, fy, qr);
    ctx.textAlign = 'left';
    if (p.name) { ctx.fillStyle = TEXT; ctx.font = '700 40px Inter, Arial, sans-serif'; ctx.fillText(p.name, pad, fy + 70); }
    if (p.phone) { ctx.fillStyle = GOLD; ctx.font = '700 44px Inter, Arial, sans-serif'; ctx.fillText(p.phone, pad, fy + 128); }
    if (hasQr) { ctx.fillStyle = MUTED; ctx.font = '400 26px Inter, Arial, sans-serif'; ctx.fillText('Scan to view on AgenticCore Estate', pad, fy + qr - 8); }
    return canvas;
  }

  return { draw: draw, W: W, H: H };
})();
