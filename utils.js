// Shared utility functions to eliminate duplicated code patterns.

/**
 * Normalize pointer position from mouse or touch events.
 */
function getPointerPosition(event) {
  if (event.touches && event.touches.length > 0) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

/**
 * Clamp (x, y) coordinates to keep an element within the viewport.
 */
function clampToViewport(x, y, elementWidth, elementHeight) {
  return {
    x: Math.max(0, Math.min(x, window.innerWidth - elementWidth)),
    y: Math.max(0, Math.min(y, window.innerHeight - elementHeight))
  };
}

/**
 * Scroll an element to its bottom.
 */
function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

/**
 * Create a chat bubble element and append it to a container.
 */
function createChatBubble(options) {
  var container = options.container;
  var text = options.text;
  var type = options.type;
  var bubble = document.createElement('div');
  if (type === 'sent') {
    bubble.style.cssText = 'margin:6px 0 6px auto;max-width:80%;background:#e1ffc7;padding:8px 12px;border-radius:10px 10px 2px 10px;font-size:15px;';
  } else {
    bubble.style.cssText = 'margin:6px auto 6px 0;max-width:80%;background:#f1f1f1;padding:8px 12px;border-radius:10px 10px 10px 2px;font-size:15px;color:#555;';
  }
  bubble.textContent = text;
  container.appendChild(bubble);
  scrollToBottom(container);
  return bubble;
}

/**
 * Copy text to clipboard with fallback for older browsers.
 */
async function copyToClipboard(text, label, onSuccess) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    var temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
  }
  if (onSuccess) {
    onSuccess(label ? label + ' copied' : 'Copied');
  }
}

/**
 * Batch-retrieve DOM elements by their IDs. Returns an object keyed by camelCase names.
 */
function getElementsByIds(idMap) {
  var result = {};
  var keys = Object.keys(idMap);
  for (var i = 0; i < keys.length; i++) {
    result[keys[i]] = document.getElementById(idMap[keys[i]]);
  }
  return result;
}

/**
 * Render a product card article element from product data.
 */
function renderProductCard(product) {
  var article = document.createElement('article');
  article.className = 'product-card panel';
  article.style.setProperty('--product-accent', product.accent);
  var featuresHtml = product.features.map(function(f) { return '<li>' + f + '</li>'; }).join('');
  article.innerHTML =
    '<span class="badge">' + product.badge + '</span>' +
    '<h3 class="product-title">' + product.name + '</h3>' +
    '<p style="color:var(--muted);line-height:1.7;">' + product.description + '</p>' +
    '<div class="price-row">' +
      '<div><div class="price">' + product.price + '</div><div class="price-note">' + product.priceNote + '</div></div>' +
      '<div class="status" style="background: rgba(255,255,255,0.04); color: #dbeafe;">Ready</div>' +
    '</div>' +
    '<ul class="bullet-list">' + featuresHtml + '</ul>' +
    '<div class="card-actions">' +
      '<button class="btn btn-primary js-buy" data-product="' + product.id + '">Buy now</button>' +
      '<a class="btn btn-secondary" href="#checkout">Checkout info</a>' +
    '</div>';
  return article;
}

/**
 * Render all product cards into a container element.
 */
function renderProductGrid(container, products) {
  container.innerHTML = '';
  products.forEach(function(product) {
    container.appendChild(renderProductCard(product));
  });
}

/**
 * Render a payment method card element.
 */
function renderPaymentCard(method) {
  var div = document.createElement('div');
  div.className = 'payment-card panel';
  div.innerHTML =
    '<div class="badge" style="color: ' + method.color + ';">' + method.badge + '</div>' +
    '<strong>' + method.name + '</strong>' +
    '<span>' + method.description + '</span>';
  return div;
}

/**
 * Render all payment method cards into a container.
 */
function renderPaymentRail(container, methods) {
  container.innerHTML = '';
  methods.forEach(function(method) {
    container.appendChild(renderPaymentCard(method));
  });
}

/**
 * Render a wallet row element with a copy button.
 */
function renderWalletRow(wallet, onCopy) {
  var row = document.createElement('div');
  row.className = 'wallet-row';
  row.innerHTML =
    '<div>' +
      '<div style="font-size:13px;color:var(--muted);font-weight:700;">' + wallet.label + '</div>' +
      '<code>' + wallet.value + '</code>' +
    '</div>' +
    '<button class="copy-btn" type="button" data-copy="' + wallet.value + '" data-label="' + wallet.label + '">Copy</button>';
  var btn = row.querySelector('[data-copy]');
  btn.addEventListener('click', function() {
    onCopy(wallet.value, wallet.label);
  });
  return row;
}

/**
 * Render all wallet rows into a container.
 */
function renderWalletList(container, wallets, onCopy) {
  container.innerHTML = '';
  wallets.forEach(function(wallet) {
    container.appendChild(renderWalletRow(wallet, onCopy));
  });
}

/**
 * Attach click-to-copy handlers to all elements matching a selector.
 */
function attachCopyHandlers(selector, onCopy) {
  document.querySelectorAll(selector).forEach(function(button) {
    button.addEventListener('click', function() {
      onCopy(button.dataset.copy || '', button.dataset.label || '');
    });
  });
}
