export const directCheckout = {
  launch: {
    name: 'Launch',
    price: '$49/month',
    url: 'https://buy.stripe.com/fZu3cu9zNaLhabQggi4AU00',
  },
  growth: {
    name: 'Growth',
    price: '$99/month',
    url: 'https://buy.stripe.com/7sY4gyfYb2eLabQ9RU4AU01',
  },
  command: {
    name: 'Command',
    price: '$249/month',
    url: 'https://buy.stripe.com/8x214m3bp06D2Jo0hk4AU02',
  },
} as const;

export type DirectCheckoutPlan = keyof typeof directCheckout;

export function directCheckoutUrl(plan: DirectCheckoutPlan, email?: string) {
  const base = directCheckout[plan].url;
  if (!email?.trim()) return base;
  return `${base}?prefilled_email=${encodeURIComponent(email.trim())}`;
}
