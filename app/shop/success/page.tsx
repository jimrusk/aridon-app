import Link from 'next/link';
import { storeWrite } from '../../../lib/storefront';
import styles from '../shop.module.css';

export const dynamic = 'force-dynamic';

type Props = { searchParams: { session_id?: string } };

type StripeSession = {
  id?: string;
  payment_status?: string;
  payment_intent?: string | null;
  amount_total?: number | null;
  customer_details?: { email?: string | null; name?: string | null; phone?: string | null } | null;
  metadata?: Record<string,string> | null;
  error?: { message?: string };
};

export default async function SuccessPage({ searchParams }: Props) {
  const sessionId = String(searchParams.session_id || '').slice(0, 200);
  let paid = false;
  let orderId = '';
  let message = 'We are verifying your payment.';

  if (sessionId && process.env.STRIPE_SECRET_KEY?.trim()) {
    try {
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY.trim()}` },
        cache: 'no-store',
      });
      const session = await response.json() as StripeSession;
      if (!response.ok) throw new Error(session.error?.message || `Stripe returned ${response.status}.`);
      orderId = session.metadata?.commerce_order_id || '';
      paid = session.payment_status === 'paid';
      if (paid && orderId && session.id) {
        await storeWrite('mark_paid', {
          orderId,
          checkoutSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : '',
          customerEmail: session.customer_details?.email || '',
          customerName: session.customer_details?.name || '',
          amountTotal: Number(session.amount_total || 0) / 100,
          source: 'success_page',
        });
        message = 'Payment confirmed. Your order is now in the Aridon fulfillment queue.';
      } else {
        message = 'Checkout returned successfully, but payment is not marked paid yet. We will not release an order to a supplier until payment is confirmed.';
      }
    } catch (error) {
      console.error('store success verification failed', error);
      message = 'We could not verify the checkout automatically. Your payment record remains with Stripe and the Aridon team can reconcile it before fulfillment.';
    }
  }

  return <main className={styles.shell}>
    <div className={styles.wrap}>
      <nav className={styles.nav}><div className={styles.brand}>ARIDON MARKET</div><Link href="/shop">Back to store</Link></nav>
      <section className={styles.hero}>
        <div className={styles.eyebrow}>{paid ? 'PAYMENT CONFIRMED' : 'CHECKOUT STATUS'}</div>
        <h1>{paid ? 'Order received.' : 'We are checking the order.'}</h1>
        <p>{message}</p>
        {orderId && <div className={styles.pill}>Order reference: {orderId.slice(0,8).toUpperCase()}</div>}
      </section>
      <section className={styles.whiteSection}>
        <div className={styles.panel}>
          <h2>What happens next</h2>
          <p>Aridon verifies supplier availability, freight and fulfillment details before releasing the purchase. If anything materially differs from the listed terms, the team contacts the customer before supplier commitment.</p>
          <div className={styles.buttonRow}><Link className={styles.button} href="/shop">Continue shopping</Link></div>
        </div>
        <footer className={styles.footer}>Aridon Market · Secure payment verification and controlled supplier fulfillment.</footer>
      </section>
    </div>
  </main>;
}
