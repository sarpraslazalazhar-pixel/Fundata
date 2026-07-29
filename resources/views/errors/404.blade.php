<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — FunData</title>
  <meta name="description" content="Halaman tidak ditemukan. Silakan muat ulang atau kembali ke beranda FunData.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  <style>
    /* ───────── Design Tokens ───────── */
    :root {
      --forest-deep: #0b3d2e;
      --forest: #12513d;
      --forest-mid: #1c6b4f;
      --forest-light: #e9f5ee;
      --gold: #d4af37;
      --gold-light: #f0d789;
      --gold-deep: #a5791f;
      --cream: #faf8f2;
    }

    /* ───────── Reset ───────── */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ───────── Base ───────── */
    html, body {
      height: 100%;
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(ellipse at 20% 10%, rgba(212, 175, 55, 0.12), transparent 50%),
        radial-gradient(ellipse at 80% 90%, rgba(212, 175, 55, 0.08), transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(28, 107, 79, 0.15), transparent 60%),
        linear-gradient(160deg, var(--forest-deep) 0%, var(--forest) 50%, var(--forest-mid) 100%);
      overflow-x: hidden;
      overflow-y: auto;
      position: relative;
    }

    /* Subtle dot texture */
    body::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(212, 175, 55, 0.12) 1px, transparent 1px);
      background-size: 28px 28px;
      opacity: 0.3;
      pointer-events: none;
    }

    /* ───────── Floating Particles ───────── */
    .particle {
      position: fixed;
      width: 4px;
      height: 4px;
      background: var(--gold-light);
      border-radius: 50%;
      opacity: 0;
      pointer-events: none;
      z-index: 0;
    }

    .p1 { top: 15%; left: 10%; animation: drift 8s ease-in-out infinite; }
    .p2 { top: 25%; right: 15%; animation: drift 10s ease-in-out infinite 1s; }
    .p3 { top: 70%; left: 20%; animation: drift 12s ease-in-out infinite 2s; }
    .p4 { top: 80%; right: 10%; animation: drift 9s ease-in-out infinite 3s; }
    .p5 { top: 45%; left: 5%; animation: drift 11s ease-in-out infinite 0.5s; }
    .p6 { top: 55%; right: 8%; animation: drift 7s ease-in-out infinite 2.5s; }
    .p7 { top: 10%; left: 50%; animation: drift 13s ease-in-out infinite 1.5s; }
    .p8 { top: 90%; left: 60%; animation: drift 9s ease-in-out infinite 4s; }

    @keyframes drift {
      0%, 100% { opacity: 0; transform: translateY(0) scale(1); }
      25% { opacity: 0.6; }
      50% { opacity: 0.8; transform: translateY(-30px) scale(1.5); }
      75% { opacity: 0.4; }
    }

    /* ───────── Main Wrapper ───────── */
    .wrap {
      position: relative;
      width: 100%;
      max-width: 600px;
      padding: 40px 24px;
      margin: auto;
      text-align: center;
      z-index: 2;
      animation: fadeInUp 0.8s ease-out both;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ───────── Brand Badge ───────── */
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 4px;
      color: var(--gold-light);
      text-transform: uppercase;
      padding: 8px 20px;
      border: 1px solid rgba(240, 215, 137, 0.2);
      border-radius: 999px;
      background: rgba(240, 215, 137, 0.06);
      backdrop-filter: blur(8px);
      margin-bottom: 12px;
      opacity: 0;
      animation: fadeInUp 0.6s ease-out 0.2s both;
    }

    .brand-dot {
      width: 6px;
      height: 6px;
      background: var(--gold);
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.6);
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 6px rgba(212, 175, 55, 0.4); }
      50% { box-shadow: 0 0 14px rgba(212, 175, 55, 0.8); }
    }

    /* ───────── Scene (Plug Illustration) ───────── */
    .scene {
      position: relative;
      width: 320px;
      height: 460px;
      margin: 0 auto 10px;
      opacity: 0;
      animation: fadeInUp 0.7s ease-out 0.3s both;
    }

    /* Sparkles */
    .spark {
      position: absolute;
      background: linear-gradient(135deg, var(--gold-light), var(--gold));
      border-radius: 6px;
      box-shadow: 0 0 12px rgba(212, 175, 55, 0.5);
    }

    .s1 { width: 48px; height: 7px; top: 175px; left: 8px;   transform: rotate(-30deg); animation: twinkle 2.4s ease-in-out infinite; }
    .s2 { width: 28px; height: 5px; top: 210px; left: 36px;  transform: rotate(-40deg); animation: twinkle 2.4s ease-in-out infinite 0.3s; }
    .s3 { width: 52px; height: 7px; top: 260px; left: 14px;  transform: rotate(30deg);  animation: twinkle 2.4s ease-in-out infinite 0.6s; }
    .s4 { width: 48px; height: 7px; top: 175px; right: 8px;  transform: rotate(30deg);  animation: twinkle 2.4s ease-in-out infinite 0.15s; }
    .s5 { width: 28px; height: 5px; top: 210px; right: 36px; transform: rotate(40deg);  animation: twinkle 2.4s ease-in-out infinite 0.45s; }
    .s6 { width: 52px; height: 7px; top: 260px; right: 14px; transform: rotate(-30deg); animation: twinkle 2.4s ease-in-out infinite 0.75s; }
    .s7 { width: 16px; height: 4px; top: 195px; left: 60px;  transform: rotate(-15deg); animation: twinkle 3s ease-in-out infinite 1s; }
    .s8 { width: 16px; height: 4px; top: 240px; right: 60px; transform: rotate(15deg);  animation: twinkle 3s ease-in-out infinite 1.2s; }

    @keyframes twinkle {
      0%, 100% { opacity: 0.4; transform: rotate(var(--r, 0deg)) scale(0.95); }
      50% { opacity: 1; transform: rotate(var(--r, 0deg)) scale(1.05); }
    }

    /* Plug positioning & animation */
    .plug-top {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      animation: floatUp 3.2s ease-in-out infinite;
      filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.25));
    }

    .plug-bottom {
      position: absolute;
      top: 310px;
      left: 50%;
      transform: translateX(-50%);
      animation: floatDown 3.2s ease-in-out infinite;
      filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.25));
    }

    @keyframes floatUp {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-10px); }
    }

    @keyframes floatDown {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(10px); }
    }

    /* 404 Code Text */
    .code {
      position: absolute;
      top: 180px;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      text-align: center;
      font-size: 72px;
      font-weight: 900;
      letter-spacing: 8px;
      background: linear-gradient(180deg, var(--gold-light), var(--gold) 50%, var(--gold-deep));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3));
      animation: glowPulse 3s ease-in-out infinite;
    }

    @keyframes glowPulse {
      0%, 100% { filter: drop-shadow(0 3px 8px rgba(212, 175, 55, 0.25)); }
      50% { filter: drop-shadow(0 3px 16px rgba(212, 175, 55, 0.5)); }
    }

    /* ───────── Glass Card (Text area) ───────── */
    .card {
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 28px 32px 36px;
      margin-top: 4px;
      opacity: 0;
      animation: fadeInUp 0.7s ease-out 0.5s both;
    }

    /* Divider */
    .divider {
      width: 42px;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
      margin: 0 auto 18px;
      border-radius: 3px;
    }

    /* Title */
    h1.title {
      font-size: 22px;
      font-weight: 700;
      color: var(--forest-light);
      margin-bottom: 10px;
      line-height: 1.3;
    }

    /* Description */
    p.desc {
      color: rgba(233, 245, 238, 0.6);
      font-size: 14px;
      line-height: 1.7;
      max-width: 380px;
      margin: 0 auto;
    }

    /* ───────── Button ───────── */
    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 24px;
      opacity: 0;
      animation: fadeInUp 0.6s ease-out 0.7s both;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 30px;
      border-radius: 14px;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.3px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      position: relative;
      overflow: hidden;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--gold-light), var(--gold) 60%, var(--gold-deep));
      color: var(--forest-deep);
      box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 32px rgba(212, 175, 55, 0.45);
    }

    /* Shimmer effect on primary button */
    .btn-primary::after {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: none;
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      50%, 100% { left: 150%; }
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: var(--forest-light);
      border: 1px solid rgba(233, 245, 238, 0.15);
      backdrop-filter: blur(8px);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    /* Button icons */
    .btn svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* ───────── Footer ───────── */
    .footer {
      margin-top: 28px;
      font-size: 11px;
      color: rgba(233, 245, 238, 0.3);
      letter-spacing: 0.5px;
      opacity: 0;
      animation: fadeInUp 0.5s ease-out 0.9s both;
    }

    /* ───────── Responsive ───────── */

    /* Very small phones (< 360px) */
    @media (max-width: 360px) {
      .wrap { padding: 20px 12px; }
      .scene { width: 220px; height: 360px; transform: scale(0.72); transform-origin: top center; margin-bottom: 0; }
      .code { font-size: 44px; letter-spacing: 4px; }
      h1.title { font-size: 17px; }
      p.desc { font-size: 12px; }
      .card { padding: 18px 16px 24px; border-radius: 18px; }
      .btn { padding: 11px 18px; font-size: 11px; border-radius: 12px; }
      .btn-group { gap: 8px; }
      .brand { font-size: 10px; padding: 6px 14px; letter-spacing: 3px; }
      .footer { font-size: 10px; }
    }

    /* Standard phones (360px – 480px) */
    @media (min-width: 361px) and (max-width: 480px) {
      .wrap { padding: 24px 16px; }
      .scene { width: 260px; height: 400px; transform: scale(0.82); transform-origin: top center; margin-bottom: 0; }
      .code { font-size: 52px; letter-spacing: 6px; }
      h1.title { font-size: 19px; }
      p.desc { font-size: 13px; }
      .card { padding: 22px 20px 28px; }
      .btn { padding: 12px 22px; font-size: 12px; }
      .btn-group { gap: 10px; }
    }

    /* Large phones / Small tablets (481px – 767px) */
    @media (min-width: 481px) and (max-width: 767px) {
      .wrap { max-width: 520px; padding: 32px 20px; }
      .scene { width: 280px; height: 420px; transform: scale(0.88); transform-origin: top center; margin-bottom: 4px; }
      .code { font-size: 60px; }
    }

    /* Tablets (768px – 1024px) */
    @media (min-width: 768px) and (max-width: 1024px) {
      .wrap { max-width: 540px; }
      .scene { transform: scale(0.92); transform-origin: top center; }
    }

    /* Short viewports (browser with many toolbars, landscape phones) */
    @media (max-height: 750px) {
      .wrap { padding: 16px 16px; }
      .scene { height: 340px; transform: scale(0.68); transform-origin: top center; margin-bottom: -20px; }
      .card { padding: 20px 24px 28px; }
      .brand { margin-bottom: 8px; }
      .footer { margin-top: 20px; }
    }

    @media (max-height: 600px) {
      .scene { height: 280px; transform: scale(0.55); transform-origin: top center; margin-bottom: -40px; }
      .card { padding: 16px 20px 22px; }
      h1.title { font-size: 18px; }
      .btn-group { margin-top: 16px; }
      .footer { margin-top: 14px; }
    }

    /* Landscape phones */
    @media (max-height: 480px) and (orientation: landscape) {
      .scene { height: 240px; transform: scale(0.45); transform-origin: top center; margin-bottom: -60px; }
      .wrap { padding: 10px 16px; }
      .brand { margin-bottom: 4px; }
      .card { padding: 14px 18px 18px; }
      h1.title { font-size: 16px; margin-bottom: 6px; }
      p.desc { font-size: 12px; }
      .btn-group { margin-top: 12px; }
      .footer { margin-top: 10px; }
    }
  </style>
</head>
<body>

  <!-- Floating particles -->
  <div class="particle p1"></div>
  <div class="particle p2"></div>
  <div class="particle p3"></div>
  <div class="particle p4"></div>
  <div class="particle p5"></div>
  <div class="particle p6"></div>
  <div class="particle p7"></div>
  <div class="particle p8"></div>

  <div class="wrap">

    <!-- Brand badge -->
    <div class="brand">
      <span class="brand-dot"></span>
      <span>fundata.id</span>
    </div>

    <!-- Plug illustration scene -->
    <div class="scene">

      <!-- Sparkles -->
      <div class="spark s1"></div>
      <div class="spark s2"></div>
      <div class="spark s3"></div>
      <div class="spark s4"></div>
      <div class="spark s5"></div>
      <div class="spark s6"></div>
      <div class="spark s7"></div>
      <div class="spark s8"></div>

      <!-- Top plug (male) -->
      <svg class="plug-top" width="120" height="180" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 0 V22" stroke="#0b3d2e" stroke-width="6" stroke-linecap="round"/>
        <circle cx="60" cy="6" r="3" fill="var(--gold-light)"/>
        <rect x="30" y="20" width="60" height="46" rx="18" fill="url(#g1)"/>
        <rect x="24" y="58" width="72" height="26" rx="8" fill="url(#g2)"/>
        <rect x="48" y="42" width="24" height="8" rx="4" fill="var(--forest-deep)" opacity="0.35"/>
        <rect x="42" y="80" width="9" height="46" rx="3" fill="url(#gold1)"/>
        <rect x="69" y="80" width="9" height="46" rx="3" fill="url(#gold1)"/>
        <defs>
          <linearGradient id="g1" x1="30" y1="20" x2="90" y2="66" gradientUnits="userSpaceOnUse">
            <stop stop-color="#e9f5ee"/>
            <stop offset="1" stop-color="#c9ded1"/>
          </linearGradient>
          <linearGradient id="g2" x1="24" y1="58" x2="96" y2="84" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1c6b4f"/>
            <stop offset="1" stop-color="#12513d"/>
          </linearGradient>
          <linearGradient id="gold1" x1="42" y1="80" x2="78" y2="126" gradientUnits="userSpaceOnUse">
            <stop stop-color="#f0d789"/>
            <stop offset="1" stop-color="#a5791f"/>
          </linearGradient>
        </defs>
      </svg>

      <!-- 404 code -->
      <div class="code">404</div>

      <!-- Bottom plug (female / socket) -->
      <svg class="plug-bottom" width="130" height="170" viewBox="0 0 130 170" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="24" y="46" width="82" height="52" rx="16" fill="url(#g4)"/>
        <rect x="32" y="90" width="66" height="58" rx="14" fill="url(#g3)"/>
        <rect x="48" y="108" width="30" height="9" rx="4" fill="var(--forest-deep)" opacity="0.3"/>
        <rect x="52" y="60" width="8" height="22" rx="3" fill="var(--forest-deep)" opacity="0.55"/>
        <rect x="70" y="60" width="8" height="22" rx="3" fill="var(--forest-deep)" opacity="0.55"/>
        <circle cx="65" cy="72" r="34" stroke="url(#gold2)" stroke-width="3" opacity="0.45"/>
        <path d="M65 170 V148" stroke="#0b3d2e" stroke-width="6" stroke-linecap="round"/>
        <circle cx="65" cy="164" r="3" fill="var(--gold-light)"/>
        <defs>
          <linearGradient id="g3" x1="32" y1="90" x2="98" y2="148" gradientUnits="userSpaceOnUse">
            <stop stop-color="#e9f5ee"/>
            <stop offset="1" stop-color="#c9ded1"/>
          </linearGradient>
          <linearGradient id="g4" x1="24" y1="46" x2="106" y2="98" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1c6b4f"/>
            <stop offset="1" stop-color="#0b3d2e"/>
          </linearGradient>
          <linearGradient id="gold2" x1="31" y1="38" x2="99" y2="106" gradientUnits="userSpaceOnUse">
            <stop stop-color="#f0d789"/>
            <stop offset="1" stop-color="#a5791f"/>
          </linearGradient>
        </defs>
      </svg>

    </div>

    <!-- Text content card -->
    <div class="card">
      <div class="divider"></div>
      <h1 class="title">Maaf atas ketidaknyamanannya</h1>
      <p class="desc">
        Halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.<br>
        Silakan muat ulang halaman ini atau kembali ke beranda.
      </p>
    </div>

    <!-- Action buttons -->
    <div class="btn-group">
      <a href="{{ url('/') }}" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Beranda
      </a>
      <a href="javascript:location.reload()" class="btn btn-secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Muat Ulang
      </a>
    </div>

    <!-- Footer -->
    <div class="footer">© 2026 FunData — Smart Data &amp; Analytics Platform</div>

  </div>

</body>
</html>
