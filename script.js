// Main application logic — uses shared utilities from utils.js and config from config.js.

// --- WhatsApp Chat Widget ---
const waBtn = document.getElementById('wa-float-btn');
const waBox = document.getElementById('wa-chat-box');
const waClose = document.getElementById('wa-chat-close');
const waForm = document.getElementById('wa-chat-form');
const waInput = document.getElementById('wa-chat-input');
const waMessages = document.getElementById('wa-chat-messages');
const waHide = document.getElementById('wa-float-hide');
const waNumber = 'YOUR_NUMBER'; // Replace with your WhatsApp number

if (waBtn && waHide) {
  waHide.addEventListener('click', function(e) {
    e.stopPropagation();
    waBtn.style.display = 'none';
  });
}

// Draggable WhatsApp button and chat box
if (waBtn && waBox) {
  var isDragging = false;
  var dragOffsetX = 0;
  var dragOffsetY = 0;

  function onDragStart(e) {
    isDragging = true;
    waBtn.style.transition = 'none';
    waBox.style.transition = 'none';
    var pos = getPointerPosition(e);
    var rect = waBtn.getBoundingClientRect();
    dragOffsetX = pos.x - rect.left;
    dragOffsetY = pos.y - rect.top;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, {passive: false});
    document.addEventListener('touchend', onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging) return;
    var pos = getPointerPosition(e);
    var clamped = clampToViewport(
      pos.x - dragOffsetX,
      pos.y - dragOffsetY,
      waBtn.offsetWidth,
      waBtn.offsetHeight
    );
    waBtn.style.left = clamped.x + 'px';
    waBtn.style.top = clamped.y + 'px';
    waBtn.style.right = 'auto';
    waBtn.style.bottom = 'auto';
    waBox.style.right = 'auto';
    waBox.style.bottom = 'auto';
    waBox.style.left = clamped.x + 'px';
    waBox.style.top = (clamped.y - waBox.offsetHeight - 10) + 'px';
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
  waBtn.addEventListener('touchstart', onDragStart, {passive: false});

  function updateChatBoxPosition() {
    if (waBtn.style.left && waBtn.style.top) {
      var btnTop = parseInt(waBtn.style.top);
      var btnHeight = waBtn.offsetHeight;
      var boxHeight = waBox.offsetHeight;
      var openBelow = btnTop < 100;
      waBox.style.left = waBtn.style.left;
      waBox.style.right = 'auto';
      waBox.style.bottom = 'auto';
      waBox.style.top = openBelow
        ? (btnTop + btnHeight + 10) + 'px'
        : (btnTop - boxHeight - 10) + 'px';
    } else {
      waBox.style.left = '';
      waBox.style.top = '';
      waBox.style.right = '32px';
      waBox.style.bottom = '90px';
    }
  }

  var observer = new MutationObserver(function() {
    if (waBox.style.display === 'flex') {
      updateChatBoxPosition();
    }
  });
  observer.observe(waBox, {attributes: true, attributeFilter: ['style']});
}

if (waBtn && waBox && waClose && waForm && waInput && waMessages) {
  waBtn.addEventListener('click', function(e) {
    if (e.target === waHide) return;
    waBox.style.display = waBox.style.display === 'flex' ? 'none' : 'flex';
    if (waBox.style.display === 'flex') waInput.focus();
  });
  waClose.addEventListener('click', function() {
    waBox.style.display = 'none';
  });
  waForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var msg = waInput.value.trim();
    if (!msg) return;
    createChatBubble({container: waMessages, text: msg, type: 'sent'});
    waInput.value = '';
    var encoded = encodeURIComponent(msg);
    window.open('https://wa.me/' + waNumber + '?text=' + encoded, '_blank');
    setTimeout(function() {
      createChatBubble({container: waMessages, text: 'Opening WhatsApp...', type: 'received'});
    }, 400);
  });
}

// --- Theme Toggle ---
const themeToggle = document.getElementById('theme-toggle');
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (theme === 'light') {
    themeToggle.textContent = '\u2600\uFE0F';
    themeToggle.title = 'Switch to dark mode';
    themeToggle.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    themeToggle.textContent = '\uD83C\uDF19';
    themeToggle.title = 'Switch to light mode';
    themeToggle.setAttribute('aria-label', 'Switch to light mode');
  }
}
function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}
themeToggle.addEventListener('click', toggleTheme);
(function() {
  var saved = localStorage.getItem('theme');
  if (saved) {
    setTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  } else {
    setTheme('dark');
  }
})();

// --- Checkout Modal ---
var els = getElementsByIds({
  modal: 'checkout-modal',
  modalClose: 'modal-close',
  modalProduct: 'modal-product',
  modalSummary: 'modal-summary',
  modalOrderId: 'modal-order-id',
  modalPrice: 'modal-price',
  modalExpires: 'modal-expires',
  modalStatus: 'modal-status',
  modalWallets: 'modal-wallets',
  modalDownload: 'modal-download',
  modalOpenDownload: 'modal-open-download',
  modalCopyOrder: 'modal-copy-order',
  previewOrderId: 'preview-order-id',
  previewStatus: 'preview-status',
  qrGrid: 'qr-grid',
  copyToast: 'copy-toast',
  copyToastText: 'copy-toast-text'
});

var activeDownloadUrl = '';
var activeOrderId = '';
var toastTimer = null;

function openModal() {
  els.modal.classList.add('open');
  els.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  els.modal.classList.remove('open');
  els.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function formatExpiry(timestamp) {
  var date = new Date(timestamp * 1000);
  return date.toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'});
}

function showToast(message) {
  els.copyToastText.textContent = message;
  els.copyToast.classList.add('open');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    els.copyToast.classList.remove('open');
  }, 1800);
}

function handleCopy(text, label) {
  copyToClipboard(text, label, showToast);
}

function fillModalWallets() {
  renderWalletList(els.modalWallets, WALLET_ADDRESSES, handleCopy);
}

function createQrPattern() {
  var cells = 144;
  var html = '';
  for (var i = 0; i < cells; i++) {
    var isDark = ((i + 3) % 5 === 0 || i % 11 === 0 || i % 13 === 0);
    html += '<span class="' + (isDark ? '' : 'light') + '"></span>';
  }
  els.qrGrid.innerHTML = html;
}

function createCheckout(productId) {
  var product = PRODUCT_CATALOG.find(function(p) { return p.id === productId; }) || {
    name: 'Selected product',
    priceLabel: '-',
    download: 'downloads/studio-suite-pro.zip'
  };
  var orderId = 'AV-' + Math.random().toString(16).slice(2, 8).toUpperCase();
  var expiresAt = Math.floor(Date.now() / 1000) + 3600;
  activeOrderId = orderId;
  activeDownloadUrl = product.download;
  els.modalProduct.textContent = product.name;
  els.modalSummary.textContent = 'Pay the exact amount, then wait for the gateway or webhook to approve the order.';
  els.modalOrderId.textContent = orderId;
  els.modalPrice.textContent = product.priceLabel;
  els.modalExpires.textContent = formatExpiry(expiresAt);
  els.modalStatus.textContent = 'Awaiting payment confirmation';
  els.modalDownload.textContent = 'Unlocks after payment confirmation';
  els.modalOpenDownload.disabled = false;
  els.modalOpenDownload.textContent = 'Open download';
  els.previewOrderId.textContent = orderId;
  els.previewStatus.textContent = 'checkout-created';
  fillModalWallets();
  openModal();
}

// --- Dynamic Rendering from Config ---
(function() {
  // Render product cards
  var productGrid = document.getElementById('product-grid');
  if (productGrid) {
    renderProductGrid(productGrid, PRODUCT_CATALOG);
  }

  // Render payment rails (main section)
  var paymentRail = document.getElementById('payment-rail');
  if (paymentRail) {
    renderPaymentRail(paymentRail, PAYMENT_METHODS);
  }

  // Render payment rail in modal
  var modalPaymentRail = document.getElementById('modal-payment-rail');
  if (modalPaymentRail) {
    renderPaymentRail(modalPaymentRail, PAYMENT_METHODS);
  }

  // Render wallet list in checkout section
  var checkoutWallets = document.getElementById('checkout-wallets');
  if (checkoutWallets) {
    renderWalletList(checkoutWallets, WALLET_ADDRESSES, handleCopy);
  }
})();

// --- Event Delegation ---
attachCopyHandlers('.js-copy', handleCopy);

document.querySelectorAll('.js-buy').forEach(function(button) {
  button.addEventListener('click', function(event) {
    event.preventDefault();
    createCheckout(button.dataset.product || 'se2-ultra-sender');
  });
});

els.modalClose.addEventListener('click', closeModal);
els.modal.addEventListener('click', function(event) {
  if (event.target === els.modal) closeModal();
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') closeModal();
});
els.modalCopyOrder.addEventListener('click', function() {
  if (!activeOrderId) return;
  handleCopy(activeOrderId, 'Order ID');
});
els.modalOpenDownload.addEventListener('click', function() {
  if (activeDownloadUrl) window.location.href = activeDownloadUrl;
});

createQrPattern();
fillModalWallets();
