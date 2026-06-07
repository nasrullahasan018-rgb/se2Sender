// Extracted from index.html <script> block

// ── Site Configuration ──────────────────────────────────────────────
// Replace these placeholder values with your real credentials before
// going live. NEVER commit real API keys or wallet addresses to a
// public repository — use environment-specific config injection or a
// build step that reads from secrets.
const SITE_CONFIG = Object.freeze({
  whatsappNumber: 'YOUR_NUMBER',          // e.g. 8801XXXXXXXXX
  binanceId:      'REPLACE_BINANCE_ID',   // e.g. 479800206
  usdtTrc20:      'REPLACE_TRC20_ADDR',
  usdtBep20:      'REPLACE_BEP20_ADDR',
  btcAddress:     'REPLACE_BTC_ADDR',
});

// WhatsApp Chat Widget Logic
const waBtn = document.getElementById('wa-float-btn');
const waBox = document.getElementById('wa-chat-box');
const waClose = document.getElementById('wa-chat-close');
const waForm = document.getElementById('wa-chat-form');
const waInput = document.getElementById('wa-chat-input');
const waMessages = document.getElementById('wa-chat-messages');
const waHide = document.getElementById('wa-float-hide');
const waNumber = SITE_CONFIG.whatsappNumber;


// Hide WhatsApp icon if user clicks hide, restore on refresh
if (waBtn && waHide) {
  waHide.addEventListener('click', (e) => {
    e.stopPropagation();
    waBtn.style.display = 'none';
    // Optionally, set a sessionStorage flag if you want to keep hidden until tab close
    // sessionStorage.setItem('wa-hide', '1');
  });
}

// Make WhatsApp button and chat box draggable
if (waBtn && waBox) {
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let lastX = 0;
  let lastY = 0;

  function onDragStart(e) {
    isDragging = true;
    waBtn.style.transition = 'none';
    waBox.style.transition = 'none';
    const rect = waBtn.getBoundingClientRect();
    if (e.type === 'touchstart') {
      dragOffsetX = e.touches[0].clientX - rect.left;
      dragOffsetY = e.touches[0].clientY - rect.top;
    } else {
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
    }
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, {passive:false});
    document.addEventListener('touchend', onDragEnd);
  }
  function onDragMove(e) {
    if (!isDragging) return;
    let clientX, clientY;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    let x = clientX - dragOffsetX;
    let y = clientY - dragOffsetY;
    // Clamp to viewport
    const minX = 0, minY = 0;
    const maxX = window.innerWidth - waBtn.offsetWidth;
    const maxY = window.innerHeight - waBtn.offsetHeight;
    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));
    waBtn.style.left = x + 'px';
    waBtn.style.top = y + 'px';
    waBtn.style.right = 'auto';
    waBtn.style.bottom = 'auto';
    // Move chat box as well
    waBox.style.right = 'auto';
    waBox.style.bottom = 'auto';
    waBox.style.left = x + 'px';
    waBox.style.top = (y - waBox.offsetHeight - 10) + 'px';
    lastX = x;
    lastY = y;
    e.preventDefault();
  }
  function onDragEnd() {
    isDragging = false;
    waBtn.style.transition = '';
    waBox.style.transition = '';
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
  }
  waBtn.addEventListener('mousedown', onDragStart);
  waBtn.addEventListener('touchstart', onDragStart, {passive:false});
  // When chat box is opened, move it above the button
  function updateChatBoxPosition() {
    if (waBtn.style.left && waBtn.style.top) {
      const btnTop = parseInt(waBtn.style.top);
      const btnHeight = waBtn.offsetHeight;
      const boxHeight = waBox.offsetHeight;
      let openBelow = false;
      // If button is near the top (less than 100px), open below
      if (btnTop < 100) openBelow = true;
      waBox.style.left = waBtn.style.left;
      waBox.style.right = 'auto';
      waBox.style.bottom = 'auto';
      if (openBelow) {
        waBox.style.top = (btnTop + btnHeight + 10) + 'px';
      } else {
        waBox.style.top = (btnTop - boxHeight - 10) + 'px';
      }
    } else {
      waBox.style.left = '';
      waBox.style.top = '';
      waBox.style.right = '32px';
      waBox.style.bottom = '90px';
    }
  }
  // When chat box is opened, update its position
  const origShow = waBox.style.display;
  const observer = new MutationObserver(() => {
    if (waBox.style.display === 'flex') {
      updateChatBoxPosition();
    }
  });
  observer.observe(waBox, {attributes:true, attributeFilter:['style']});
}

if (waBtn && waBox && waClose && waForm && waInput && waMessages) {
  waBtn.addEventListener('click', (e) => {
    // Only open chat if not clicking the hide button
    if (e.target === waHide) return;
    waBox.style.display = waBox.style.display === 'flex' ? 'none' : 'flex';
    if (waBox.style.display === 'flex') waInput.focus();
  });
  waClose.addEventListener('click', () => {
    waBox.style.display = 'none';
  });
  waForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = waInput.value.trim();
    if (!msg) return;
    // Show user message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'margin:6px 0 6px auto;max-width:80%;background:#e1ffc7;padding:8px 12px;border-radius:10px 10px 2px 10px;font-size:15px;';
    userMsg.textContent = msg;
    waMessages.appendChild(userMsg);
    waMessages.scrollTop = waMessages.scrollHeight;
    waInput.value = '';
    // Open WhatsApp chat in new tab
    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${waNumber}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    // Optionally, show a bot reply or status
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.style.cssText = 'margin:6px auto 6px 0;max-width:80%;background:#f1f1f1;padding:8px 12px;border-radius:10px 10px 10px 2px;font-size:15px;color:#555;';
      botMsg.textContent = 'Opening WhatsApp...';
      waMessages.appendChild(botMsg);
      waMessages.scrollTop = waMessages.scrollHeight;
    }, 400);
  });
}
const themeToggle = document.getElementById('theme-toggle');
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (theme === 'light') {
    themeToggle.textContent = '☀️';
    themeToggle.title = 'Switch to dark mode';
    themeToggle.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    themeToggle.textContent = '🌙';
    themeToggle.title = 'Switch to light mode';
    themeToggle.setAttribute('aria-label', 'Switch to light mode');
  }
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}
themeToggle.addEventListener('click', toggleTheme);
(function() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    setTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  } else {
    setTheme('dark');
  }
})();
const modal = document.getElementById('checkout-modal');
const modalClose = document.getElementById('modal-close');
const modalProduct = document.getElementById('modal-product');
const modalSummary = document.getElementById('modal-summary');
const modalOrderId = document.getElementById('modal-order-id');
const modalPrice = document.getElementById('modal-price');
const modalExpires = document.getElementById('modal-expires');
const modalStatus = document.getElementById('modal-status');
const modalWallets = document.getElementById('modal-wallets');
const modalDownload = document.getElementById('modal-download');
const modalOpenDownload = document.getElementById('modal-open-download');
const modalCopyOrder = document.getElementById('modal-copy-order');
const previewOrderId = document.getElementById('preview-order-id');
const previewStatus = document.getElementById('preview-status');
const qrGrid = document.getElementById('qr-grid');
const copyToast = document.getElementById('copy-toast');
const copyToastText = document.getElementById('copy-toast-text');
// WARNING: These download paths are publicly visible in client-side JS.
// Anyone can read the source and download files without paying.
// To properly gate downloads, serve files from a backend that checks
// payment status and returns signed, short-lived URLs.
const downloads = {
  'se2-ultra-sender': 'downloads/studio-suite-pro.zip',
  'user-create': 'downloads/vault-automation.zip',
  'two-fa-create': 'downloads/cipher-pack.zip',
  'remote-access-tool': 'downloads/studio-suite-pro.zip',
  'aol-yahoo-sender': 'downloads/vault-automation.zip',
  'micro-recoder': 'downloads/cipher-pack.zip'
};
let activeDownloadUrl = '';
let activeOrderId = '';
let toastTimer = null;
const productCatalog = {
  'se2-ultra-sender': {
    name: 'SE2 Ultra Sender',
    price: '$25 per day'
  },
  'user-create': {
    name: 'User Create',
    price: '$10 for 7 days'
  },
  'two-fa-create': {
    name: '2FA Create',
    price: '$10 for 7 days'
  },
  'remote-access-tool': {
    name: 'Remote Access Tool',
    price: '$200 per month'
  },
  'aol-yahoo-sender': {
    name: 'AOL and YAHOO Sender',
    price: '$5 per day'
  },
  'micro-recoder': {
    name: 'Micro Recoder',
    price: '$10 per month'
  }
};
function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function formatExpiry(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}
function fillWallets() {
  const wallets = [
    ['Binance ID', SITE_CONFIG.binanceId],
    ['USDT TRC20 Address', SITE_CONFIG.usdtTrc20],
    ['USDT BEP20 Address', SITE_CONFIG.usdtBep20],
    ['BTC Address', SITE_CONFIG.btcAddress]
  ];
  modalWallets.innerHTML = '';
  wallets.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'wallet-row';

    const info = document.createElement('div');
    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size:13px;color:var(--muted);font-weight:700;';
    labelEl.textContent = label;
    const code = document.createElement('code');
    code.textContent = value;
    info.appendChild(labelEl);
    info.appendChild(code);

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => copyToClipboard(value, label));

    row.appendChild(info);
    row.appendChild(btn);
    modalWallets.appendChild(row);
  });
}
function showToast(message) {
  copyToastText.textContent = message;
  copyToast.classList.add('open');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    copyToast.classList.remove('open');
  }, 1800);
}
async function copyToClipboard(text, label = '') {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
  }
  showToast(label ? `${label} copied` : 'Copied');
}
function createQrPattern() {
  const cells = 144;
  let html = '';
  for (let i = 0; i < cells; i++) {
    const isDark = ((i + 3) % 5 === 0 || i % 11 === 0 || i % 13 === 0);
    html += `<span class="${isDark ? '' : 'light'}"></span>`;
  }
  qrGrid.innerHTML = html;
}
function createCheckout(productId) {
  const orderId = 'AV-' + Math.random().toString(16).slice(2, 8).toUpperCase();
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const product = productCatalog[productId] || {
    name: 'Selected product',
    price: '-'
  };
  const fileUrl = downloads[productId] || 'downloads/studio-suite-pro.zip';
  activeOrderId = orderId;
  activeDownloadUrl = fileUrl;
  modalProduct.textContent = product.name;
  modalSummary.textContent = 'Pay the exact amount, then wait for the gateway or webhook to approve the order.';
  modalOrderId.textContent = orderId;
  modalPrice.textContent = product.price;
  modalExpires.textContent = formatExpiry(expiresAt);
  modalStatus.textContent = 'Awaiting payment confirmation';
  modalDownload.textContent = 'Unlocks after payment confirmation';
  modalOpenDownload.disabled = false;
  modalOpenDownload.textContent = 'Open download';
  previewOrderId.textContent = orderId;
  previewStatus.textContent = 'checkout-created';
  fillWallets();
  openModal();
}
document.querySelectorAll('.js-buy').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    createCheckout(button.dataset.product || 'se2-ultra-sender');
  });
});
document.querySelectorAll('.js-copy').forEach((button) => {
  button.addEventListener('click', () => copyToClipboard(button.dataset.copy || '', button.dataset.label || ''));
});
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});
modalCopyOrder.addEventListener('click', async () => {
  if (!activeOrderId) return;
  await copyToClipboard(activeOrderId, 'Order ID');
});
modalOpenDownload.addEventListener('click', () => {
  if (activeDownloadUrl) window.location.href = activeDownloadUrl;
});
createQrPattern();
fillWallets();

// Populate the static (in-page) wallet section from SITE_CONFIG
(function populateStaticWallets() {
  const container = document.getElementById('static-wallets');
  if (!container) return;
  const wallets = [
    ['Binance ID', SITE_CONFIG.binanceId],
    ['USDT TRC20 Address', SITE_CONFIG.usdtTrc20],
    ['USDT BEP20 Address', SITE_CONFIG.usdtBep20],
    ['BTC Address', SITE_CONFIG.btcAddress]
  ];
  wallets.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'wallet-row';

    const info = document.createElement('div');
    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size:13px;color:var(--muted);font-weight:700;';
    labelEl.textContent = label;
    const code = document.createElement('code');
    code.textContent = value;
    info.appendChild(labelEl);
    info.appendChild(code);

    const btn = document.createElement('button');
    btn.className = 'copy-btn js-copy';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => copyToClipboard(value, label));

    row.appendChild(info);
    row.appendChild(btn);
    container.appendChild(row);
  });
})();
