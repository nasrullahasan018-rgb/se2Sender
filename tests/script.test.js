/**
 * @jest-environment jsdom
 */

function setupDOM() {
  document.body.innerHTML = `
    <button id="wa-float-btn"></button>
    <div id="wa-chat-box" style="display:none">
      <button id="wa-chat-close"></button>
      <form id="wa-chat-form">
        <input id="wa-chat-input" />
      </form>
      <div id="wa-chat-messages"></div>
    </div>
    <button id="wa-float-hide"></button>
    <button id="theme-toggle"></button>
    <div id="checkout-modal" aria-hidden="true">
      <button id="modal-close"></button>
      <span id="modal-product"></span>
      <span id="modal-summary"></span>
      <span id="modal-order-id"></span>
      <span id="modal-price"></span>
      <span id="modal-expires"></span>
      <span id="modal-status"></span>
      <div id="modal-wallets"></div>
      <span id="modal-download"></span>
      <button id="modal-open-download"></button>
      <button id="modal-copy-order"></button>
    </div>
    <span id="preview-order-id"></span>
    <span id="preview-status"></span>
    <div id="qr-grid"></div>
    <div id="copy-toast"><span id="copy-toast-text"></span></div>
    <button class="js-buy" data-product="se2-ultra-sender">Buy</button>
    <button class="js-buy" data-product="user-create">Buy</button>
    <button class="js-copy" data-copy="test-value" data-label="Test">Copy</button>
  `;
}

let mod;

let mutationObserverCallback;

beforeEach(() => {
  jest.useFakeTimers();
  // Mock MutationObserver, capturing the callback for manual invocation
  global.MutationObserver = jest.fn(function (cb) {
    mutationObserverCallback = cb;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    this.takeRecords = jest.fn().mockReturnValue([]);
  });
  setupDOM();
  // Mock window.open
  window.open = jest.fn();
  // Mock navigator.clipboard
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
  // Mock localStorage
  const store = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, val) => { store[key] = val; }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    },
    writable: true,
  });
  // Mock matchMedia
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  // Load the script via require (Jest instruments it for coverage)
  jest.resetModules();
  mod = require('../script');
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Theme Toggle', () => {
  test('setTheme sets data-theme attribute to dark', () => {
    mod.setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('setTheme sets data-theme attribute to light', () => {
    mod.setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('setTheme saves theme to localStorage', () => {
    mod.setTheme('light');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  test('setTheme updates toggle button text for light mode', () => {
    mod.setTheme('light');
    const toggle = document.getElementById('theme-toggle');
    expect(toggle.textContent).toBe('☀️');
    expect(toggle.title).toBe('Switch to dark mode');
  });

  test('setTheme updates toggle button text for dark mode', () => {
    mod.setTheme('dark');
    const toggle = document.getElementById('theme-toggle');
    expect(toggle.textContent).toBe('🌙');
    expect(toggle.title).toBe('Switch to light mode');
  });

  test('toggleTheme switches from dark to light', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    mod.toggleTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('toggleTheme switches from light to dark', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    mod.toggleTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('theme toggle button click triggers toggleTheme', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const toggle = document.getElementById('theme-toggle');
    toggle.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('Modal Functions', () => {
  test('openModal adds open class and sets aria-hidden to false', () => {
    const modal = document.getElementById('checkout-modal');
    mod.openModal();
    expect(modal.classList.contains('open')).toBe(true);
    expect(modal.getAttribute('aria-hidden')).toBe('false');
  });

  test('openModal sets body overflow to hidden', () => {
    mod.openModal();
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('closeModal removes open class and sets aria-hidden to true', () => {
    const modal = document.getElementById('checkout-modal');
    mod.openModal();
    mod.closeModal();
    expect(modal.classList.contains('open')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
  });

  test('closeModal restores body overflow', () => {
    mod.openModal();
    mod.closeModal();
    expect(document.body.style.overflow).toBe('');
  });

  test('modal close button triggers closeModal', () => {
    const modal = document.getElementById('checkout-modal');
    mod.openModal();
    document.getElementById('modal-close').click();
    expect(modal.classList.contains('open')).toBe(false);
  });

  test('clicking modal backdrop closes modal', () => {
    const modal = document.getElementById('checkout-modal');
    mod.openModal();
    modal.click();
    expect(modal.classList.contains('open')).toBe(false);
  });

  test('Escape key closes modal', () => {
    const modal = document.getElementById('checkout-modal');
    mod.openModal();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modal.classList.contains('open')).toBe(false);
  });
});

describe('formatExpiry', () => {
  test('converts unix timestamp to locale string', () => {
    const timestamp = 1700000000;
    const result = mod.formatExpiry(timestamp);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns different strings for different timestamps', () => {
    const result1 = mod.formatExpiry(1700000000);
    const result2 = mod.formatExpiry(1700100000);
    expect(result1).not.toBe(result2);
  });
});

describe('fillWallets', () => {
  test('populates wallet rows in the modal', () => {
    mod.fillWallets();
    const wallets = document.getElementById('modal-wallets');
    const rows = wallets.querySelectorAll('.wallet-row');
    expect(rows.length).toBe(4);
  });

  test('each wallet row has a copy button', () => {
    mod.fillWallets();
    const wallets = document.getElementById('modal-wallets');
    const buttons = wallets.querySelectorAll('[data-copy]');
    expect(buttons.length).toBe(4);
  });

  test('wallet rows contain expected labels', () => {
    mod.fillWallets();
    const wallets = document.getElementById('modal-wallets');
    expect(wallets.innerHTML).toContain('Binance ID');
    expect(wallets.innerHTML).toContain('USDT TRC20 Address');
    expect(wallets.innerHTML).toContain('USDT BEP20 Address');
    expect(wallets.innerHTML).toContain('BTC Address');
  });
});

describe('showToast', () => {
  test('sets toast text and adds open class', () => {
    mod.showToast('Test message');
    const toast = document.getElementById('copy-toast');
    const toastText = document.getElementById('copy-toast-text');
    expect(toastText.textContent).toBe('Test message');
    expect(toast.classList.contains('open')).toBe(true);
  });

  test('removes open class after timeout', () => {
    mod.showToast('Test message');
    const toast = document.getElementById('copy-toast');
    expect(toast.classList.contains('open')).toBe(true);
    jest.advanceTimersByTime(1800);
    expect(toast.classList.contains('open')).toBe(false);
  });

  test('resets timer on consecutive calls', () => {
    mod.showToast('First');
    jest.advanceTimersByTime(1000);
    mod.showToast('Second');
    const toastText = document.getElementById('copy-toast-text');
    expect(toastText.textContent).toBe('Second');
    jest.advanceTimersByTime(1000);
    const toast = document.getElementById('copy-toast');
    expect(toast.classList.contains('open')).toBe(true);
    jest.advanceTimersByTime(800);
    expect(toast.classList.contains('open')).toBe(false);
  });
});

describe('copyToClipboard', () => {
  test('copies text using navigator.clipboard', async () => {
    await mod.copyToClipboard('hello', 'Greeting');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  test('shows toast with label after copy', async () => {
    await mod.copyToClipboard('hello', 'Greeting');
    const toastText = document.getElementById('copy-toast-text');
    expect(toastText.textContent).toBe('Greeting copied');
  });

  test('shows generic toast when no label provided', async () => {
    await mod.copyToClipboard('hello');
    const toastText = document.getElementById('copy-toast-text');
    expect(toastText.textContent).toBe('Copied');
  });

  test('falls back to execCommand when clipboard API fails', async () => {
    navigator.clipboard.writeText.mockRejectedValueOnce(new Error('fail'));
    document.execCommand = jest.fn();
    await mod.copyToClipboard('fallback-text', 'Test');
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});

describe('createQrPattern', () => {
  test('generates 144 cells in qr-grid', () => {
    mod.createQrPattern();
    const grid = document.getElementById('qr-grid');
    const spans = grid.querySelectorAll('span');
    expect(spans.length).toBe(144);
  });

  test('some cells have light class and some do not', () => {
    mod.createQrPattern();
    const grid = document.getElementById('qr-grid');
    const lightCells = grid.querySelectorAll('span.light');
    const darkCells = grid.querySelectorAll('span:not(.light)');
    expect(lightCells.length).toBeGreaterThan(0);
    expect(darkCells.length).toBeGreaterThan(0);
  });
});

describe('createCheckout', () => {
  test('generates order ID with AV- prefix', () => {
    mod.createCheckout('se2-ultra-sender');
    const orderId = document.getElementById('modal-order-id').textContent;
    expect(orderId).toMatch(/^AV-[A-F0-9]{6}$/);
  });

  test('sets product name for known product', () => {
    mod.createCheckout('se2-ultra-sender');
    const product = document.getElementById('modal-product').textContent;
    expect(product).toBe('SE2 Ultra Sender');
  });

  test('sets product price for known product', () => {
    mod.createCheckout('se2-ultra-sender');
    const price = document.getElementById('modal-price').textContent;
    expect(price).toBe('$25 per day');
  });

  test('sets correct product info for user-create', () => {
    mod.createCheckout('user-create');
    expect(document.getElementById('modal-product').textContent).toBe('User Create');
    expect(document.getElementById('modal-price').textContent).toBe('$10 for 7 days');
  });

  test('sets correct product info for two-fa-create', () => {
    mod.createCheckout('two-fa-create');
    expect(document.getElementById('modal-product').textContent).toBe('2FA Create');
  });

  test('sets correct product info for remote-access-tool', () => {
    mod.createCheckout('remote-access-tool');
    expect(document.getElementById('modal-product').textContent).toBe('Remote Access Tool');
    expect(document.getElementById('modal-price').textContent).toBe('$200 per month');
  });

  test('falls back to default for unknown product', () => {
    mod.createCheckout('unknown-product');
    expect(document.getElementById('modal-product').textContent).toBe('Selected product');
    expect(document.getElementById('modal-price').textContent).toBe('-');
  });

  test('sets modal status to awaiting payment', () => {
    mod.createCheckout('se2-ultra-sender');
    const status = document.getElementById('modal-status').textContent;
    expect(status).toBe('Awaiting payment confirmation');
  });

  test('sets preview status to checkout-created', () => {
    mod.createCheckout('se2-ultra-sender');
    const status = document.getElementById('preview-status').textContent;
    expect(status).toBe('checkout-created');
  });

  test('opens the modal', () => {
    mod.createCheckout('se2-ultra-sender');
    const modal = document.getElementById('checkout-modal');
    expect(modal.classList.contains('open')).toBe(true);
  });

  test('sets expiry time in the future', () => {
    mod.createCheckout('se2-ultra-sender');
    const expiresText = document.getElementById('modal-expires').textContent;
    expect(expiresText.length).toBeGreaterThan(0);
  });
});

describe('WhatsApp Chat Widget', () => {
  test('clicking float button toggles chat box visibility', () => {
    const btn = document.getElementById('wa-float-btn');
    const box = document.getElementById('wa-chat-box');
    btn.click();
    expect(box.style.display).toBe('flex');
    btn.click();
    expect(box.style.display).toBe('none');
  });

  test('close button hides chat box', () => {
    const btn = document.getElementById('wa-float-btn');
    const box = document.getElementById('wa-chat-box');
    const close = document.getElementById('wa-chat-close');
    btn.click();
    expect(box.style.display).toBe('flex');
    close.click();
    expect(box.style.display).toBe('none');
  });

  test('submitting message opens WhatsApp URL', () => {
    const btn = document.getElementById('wa-float-btn');
    const form = document.getElementById('wa-chat-form');
    const input = document.getElementById('wa-chat-input');
    btn.click();
    input.value = 'Hello there';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/'),
      '_blank'
    );
  });

  test('submitting message adds user message to chat', () => {
    const btn = document.getElementById('wa-float-btn');
    const form = document.getElementById('wa-chat-form');
    const input = document.getElementById('wa-chat-input');
    const messages = document.getElementById('wa-chat-messages');
    btn.click();
    input.value = 'Test message';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(messages.children.length).toBe(1);
    expect(messages.children[0].textContent).toBe('Test message');
  });

  test('empty message is not submitted', () => {
    const btn = document.getElementById('wa-float-btn');
    const form = document.getElementById('wa-chat-form');
    const input = document.getElementById('wa-chat-input');
    const messages = document.getElementById('wa-chat-messages');
    btn.click();
    input.value = '   ';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(messages.children.length).toBe(0);
    expect(window.open).not.toHaveBeenCalled();
  });

  test('bot reply appears after timeout', () => {
    const btn = document.getElementById('wa-float-btn');
    const form = document.getElementById('wa-chat-form');
    const input = document.getElementById('wa-chat-input');
    const messages = document.getElementById('wa-chat-messages');
    btn.click();
    input.value = 'Hi';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(messages.children.length).toBe(1);
    jest.advanceTimersByTime(400);
    expect(messages.children.length).toBe(2);
    expect(messages.children[1].textContent).toBe('Opening WhatsApp...');
  });

  test('hide button hides the float button', () => {
    const btn = document.getElementById('wa-float-btn');
    const hide = document.getElementById('wa-float-hide');
    hide.click();
    expect(btn.style.display).toBe('none');
  });
});

describe('Buy Buttons', () => {
  test('js-buy button triggers createCheckout', () => {
    const buyBtn = document.querySelector('.js-buy[data-product="user-create"]');
    buyBtn.click();
    const modal = document.getElementById('checkout-modal');
    expect(modal.classList.contains('open')).toBe(true);
    expect(document.getElementById('modal-product').textContent).toBe('User Create');
  });
});

describe('Copy Order Button', () => {
  test('modal copy order button copies the active order ID', async () => {
    mod.createCheckout('se2-ultra-sender');
    const copyBtn = document.getElementById('modal-copy-order');
    await copyBtn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

describe('Download Button', () => {
  test('modal open download navigates to file URL', () => {
    delete window.location;
    window.location = { href: '' };
    mod.createCheckout('se2-ultra-sender');
    const dlBtn = document.getElementById('modal-open-download');
    dlBtn.click();
    expect(window.location.href).toBe('downloads/studio-suite-pro.zip');
  });
});

describe('productCatalog', () => {
  test('contains all expected products', () => {
    expect(mod.productCatalog).toHaveProperty('se2-ultra-sender');
    expect(mod.productCatalog).toHaveProperty('user-create');
    expect(mod.productCatalog).toHaveProperty('two-fa-create');
    expect(mod.productCatalog).toHaveProperty('remote-access-tool');
    expect(mod.productCatalog).toHaveProperty('aol-yahoo-sender');
    expect(mod.productCatalog).toHaveProperty('micro-recoder');
  });

  test('each product has name and price', () => {
    Object.values(mod.productCatalog).forEach((product) => {
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(typeof product.name).toBe('string');
      expect(typeof product.price).toBe('string');
    });
  });
});

describe('downloads mapping', () => {
  test('contains entries for all products', () => {
    expect(mod.downloads).toHaveProperty('se2-ultra-sender');
    expect(mod.downloads).toHaveProperty('user-create');
    expect(mod.downloads).toHaveProperty('two-fa-create');
    expect(mod.downloads).toHaveProperty('remote-access-tool');
    expect(mod.downloads).toHaveProperty('aol-yahoo-sender');
    expect(mod.downloads).toHaveProperty('micro-recoder');
  });

  test('all download paths are strings', () => {
    Object.values(mod.downloads).forEach((url) => {
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^downloads\//);
    });
  });
});

describe('Draggable WhatsApp Button', () => {
  test('mousedown initiates drag state', () => {
    const btn = document.getElementById('wa-float-btn');
    // getBoundingClientRect returns {left:0, top:0} in jsdom
    // so dragOffset = clientX - 0 = 100, dragOffsetY = 200 - 0 = 200
    btn.dispatchEvent(new MouseEvent('mousedown', {
      clientX: 100, clientY: 200, bubbles: true,
    }));
    // Move to (150, 250): position = (150-100, 250-200) = (50, 50)
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 150, clientY: 250, bubbles: true,
    }));
    expect(btn.style.left).toBe('50px');
    expect(btn.style.top).toBe('50px');
  });

  test('mouseup ends drag', () => {
    const btn = document.getElementById('wa-float-btn');
    btn.dispatchEvent(new MouseEvent('mousedown', {
      clientX: 100, clientY: 200, bubbles: true,
    }));
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 150, clientY: 250, bubbles: true,
    }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    // After mouseup, mousemove should not move the button
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 300, clientY: 300, bubbles: true,
    }));
    // Position stays at (50, 50) from last valid move
    expect(btn.style.left).toBe('50px');
    expect(btn.style.top).toBe('50px');
  });

  test('touchstart initiates drag state', () => {
    const btn = document.getElementById('wa-float-btn');
    const touchEvent = new Event('touchstart', { bubbles: true });
    touchEvent.touches = [{ clientX: 100, clientY: 200 }];
    btn.dispatchEvent(touchEvent);
    const moveEvent = new Event('touchmove', { bubbles: true, cancelable: true });
    moveEvent.touches = [{ clientX: 150, clientY: 250 }];
    moveEvent.preventDefault = jest.fn();
    document.dispatchEvent(moveEvent);
    expect(btn.style.left).toBe('50px');
    expect(btn.style.top).toBe('50px');
  });

  test('touchend ends drag', () => {
    const btn = document.getElementById('wa-float-btn');
    const touchStart = new Event('touchstart', { bubbles: true });
    touchStart.touches = [{ clientX: 100, clientY: 200 }];
    btn.dispatchEvent(touchStart);
    const touchMove = new Event('touchmove', { bubbles: true, cancelable: true });
    touchMove.touches = [{ clientX: 150, clientY: 250 }];
    touchMove.preventDefault = jest.fn();
    document.dispatchEvent(touchMove);
    document.dispatchEvent(new Event('touchend', { bubbles: true }));
    // After touchend, further moves should not reposition
    const anotherMove = new Event('touchmove', { bubbles: true, cancelable: true });
    anotherMove.touches = [{ clientX: 400, clientY: 400 }];
    anotherMove.preventDefault = jest.fn();
    document.dispatchEvent(anotherMove);
    expect(btn.style.left).toBe('50px');
  });

  test('drag clamps to viewport boundaries', () => {
    const btn = document.getElementById('wa-float-btn');
    // Simulate window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 500, writable: true });
    btn.dispatchEvent(new MouseEvent('mousedown', {
      clientX: 100, clientY: 200, bubbles: true,
    }));
    // Try to move beyond viewport
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: -100, clientY: -100, bubbles: true,
    }));
    expect(parseInt(btn.style.left)).toBeGreaterThanOrEqual(0);
    expect(parseInt(btn.style.top)).toBeGreaterThanOrEqual(0);
  });

  test('drag also repositions chat box', () => {
    const btn = document.getElementById('wa-float-btn');
    const box = document.getElementById('wa-chat-box');
    btn.dispatchEvent(new MouseEvent('mousedown', {
      clientX: 100, clientY: 200, bubbles: true,
    }));
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 150, clientY: 250, bubbles: true,
    }));
    expect(box.style.left).toBe('50px');
    // top is calculated as y - offsetHeight - 10 (offsetHeight=0 in jsdom)
    expect(box.style.top).toBe('40px');
  });
});

describe('updateChatBoxPosition via MutationObserver', () => {
  test('positions chat box above button when button is below 100px top', () => {
    const btn = document.getElementById('wa-float-btn');
    const box = document.getElementById('wa-chat-box');
    // Set button position via style (simulating post-drag state)
    btn.style.left = '200px';
    btn.style.top = '300px';
    // Simulate chat box becoming visible
    box.style.display = 'flex';
    mutationObserverCallback();
    // Chat box should be positioned above the button
    expect(box.style.left).toBe('200px');
    // top = btnTop - boxHeight - 10 = 300 - 0 - 10 = 290
    expect(box.style.top).toBe('290px');
  });

  test('positions chat box below button when button is near top', () => {
    const btn = document.getElementById('wa-float-btn');
    const box = document.getElementById('wa-chat-box');
    btn.style.left = '200px';
    btn.style.top = '50px';
    box.style.display = 'flex';
    mutationObserverCallback();
    // top = btnTop + btnHeight + 10 = 50 + 0 + 10 = 60
    expect(box.style.top).toBe('60px');
  });

  test('resets chat box to default position when button has no position', () => {
    const box = document.getElementById('wa-chat-box');
    box.style.display = 'flex';
    mutationObserverCallback();
    expect(box.style.right).toBe('32px');
    expect(box.style.bottom).toBe('90px');
  });

  test('does not reposition when chat box is hidden', () => {
    const btn = document.getElementById('wa-float-btn');
    const box = document.getElementById('wa-chat-box');
    btn.style.left = '200px';
    btn.style.top = '300px';
    box.style.display = 'none';
    mutationObserverCallback();
    // Position should not change since box is hidden
    expect(box.style.top).not.toBe('290px');
  });
});

describe('Theme Initialization', () => {
  test('uses saved theme from localStorage when available', () => {
    // localStorage mock returns 'light' for the 'theme' key
    const store = { theme: 'light' };
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, val) => { store[key] = val; }),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    setupDOM();
    jest.resetModules();
    require('../script');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('uses prefers-color-scheme when no saved theme', () => {
    const store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    setupDOM();
    jest.resetModules();
    require('../script');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('defaults to dark when no saved theme and prefers dark', () => {
    const store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    setupDOM();
    jest.resetModules();
    require('../script');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
