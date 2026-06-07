// Shared data configuration — single source of truth for product, wallet, and payment data.

const WALLET_ADDRESSES = [
  { label: 'Binance ID', value: '479800206' },
  { label: 'USDT TRC20 Address', value: 'replace-in-config' },
  { label: 'USDT BEP20 Address', value: 'replace-in-config' },
  { label: 'BTC Address', value: 'replace-in-config' }
];

const PAYMENT_METHODS = [
  { badge: 'BINANCE PAY', color: 'var(--accent-blue)', name: 'Binance Pay', description: 'Fast checkout with Binance Pay QR or merchant ID.' },
  { badge: 'TRC20', color: 'var(--accent-cyan)', name: 'USDT TRC20', description: 'Low-fee stablecoin transfer for instant confirmation.' },
  { badge: 'BEP20', color: 'var(--accent-green)', name: 'USDT BEP20', description: 'Cheap BNB Smart Chain settlement.' },
  { badge: 'MULTI-CHAIN', color: 'var(--accent-gold)', name: 'BTC / ETH / SOL', description: 'Support for major crypto assets through your gateway.' }
];

const PRODUCT_CATALOG = [
  {
    id: 'se2-ultra-sender',
    name: 'SE2 Ultra Sender',
    badge: 'Flagship',
    accent: 'var(--accent-blue)',
    description: 'Premium delivery-focused app slot for your main software product.',
    price: '$25',
    priceNote: 'per day',
    priceLabel: '$25 per day',
    features: ['Unlimited daily email delivery', 'Instant checkout integration', 'Secure digital file transfer'],
    download: 'downloads/studio-suite-pro.zip'
  },
  {
    id: 'user-create',
    name: 'User Create',
    badge: 'Utility',
    accent: 'var(--accent-cyan)',
    description: 'Account setup and user provisioning app slot for your catalog.',
    price: '$10',
    priceNote: '7 days',
    priceLabel: '$10 for 7 days',
    features: ['Quick onboarding', 'Simple setup flow', 'Protected delivery'],
    download: 'downloads/vault-automation.zip'
  },
  {
    id: 'two-fa-create',
    name: '2FA Create',
    badge: 'Security',
    accent: 'var(--accent-gold)',
    description: 'A premium security app slot for two-factor authentication workflows.',
    price: '$10',
    priceNote: '7 days',
    priceLabel: '$10 for 7 days',
    features: ['Security-first positioning', 'Fast checkout option', 'Instant file access'],
    download: 'downloads/cipher-pack.zip'
  },
  {
    id: 'remote-access-tool',
    name: 'Remote Access Tool',
    badge: 'Support',
    accent: 'var(--accent-green)',
    description: 'Remote support and access utility presented as a polished premium app.',
    price: '$200',
    priceNote: 'per month',
    priceLabel: '$200 per month',
    features: ['Support-friendly layout', 'Instant digital delivery', 'Branded product card'],
    download: 'downloads/studio-suite-pro.zip'
  },
  {
    id: 'aol-yahoo-sender',
    name: 'AOL and YAHOO Sender',
    badge: 'Messaging',
    accent: 'var(--accent-blue)',
    description: 'A messaging app listing with a clean premium presentation for your catalog.',
    price: '$5',
    priceNote: 'per day',
    priceLabel: '$5 per day',
    features: ['Clean product layout', 'Crypto checkout ready', 'Protected downloads'],
    download: 'downloads/vault-automation.zip'
  },
  {
    id: 'micro-recoder',
    name: 'Micro Recoder',
    badge: 'Recorder',
    accent: 'var(--accent-cyan)',
    description: 'Compact recording app slot for your software lineup.',
    price: '$10',
    priceNote: 'per month',
    priceLabel: '$10 per month',
    features: ['Minimal premium card', 'Instant purchase button', 'Secure file flow'],
    download: 'downloads/cipher-pack.zip'
  }
];
