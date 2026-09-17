import type { Metadata } from 'next';
import Link from 'next/link';
import { getStoreContext, money } from '../../lib/storefront';
import { LeadForm, TrackView } from './StoreActions';
import styles from './shop.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Aridon Market | Energy, Greenhouses & Ag Technology',
  description: 'Dealer-vetted energy resilience, greenhouse and agricultural technology equipment with project support and freight-aware quoting.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Aridon Market',
    description: 'Practical equipment for energy resilience, growing, and smarter property operations.',
    type: 'website',
    url: '/shop',
  },
};

export default async function ShopPage() {
  const store = await getStoreContext();
  const liveProducts = store.products;
  return <main className={styles.shell}>
    <TrackView eventName="store_view" data={{ store: 'aridon-market' }}/>
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <div className={styles.brand}>ARIDON MARKET</div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          <Link href="/">Aridon</Link>
          <Link href="/shop">Shop</Link>
          <a href={`mailto:${store.profile.support_email || 'evaaridon@gmail.com'}`}>Support</a>
        </div>
      </nav>
      <section className={styles.hero}>
        <div className={styles.eyebrow}>ENERGY · GROWING · AG TECHNOLOGY</div>
        <h1>{store.profile.store_name || 'Aridon Market'}</h1>
        <p>{store.profile.tagline || 'Practical equipment for resilient homes, properties, farms and ranches.'}</p>
        <div className={styles.pills}>
          <span className={styles.pill}>Dealer-vetted products</span>
          <span className={styles.pill}>Freight-aware pricing</span>
          <span className={styles.pill}>Project support</span>
          <span className={styles.pill}>Secure Stripe checkout</span>
        </div>
        <div className={styles.kpiGrid}>
          <div className={styles.kpi}><strong>{store.categories.length}</strong><span>active store categories</span></div>
          <div className={styles.kpi}><strong>{liveProducts.length}</strong><span>dealer-approved live products</span></div>
          <div className={styles.kpi}><strong>100%</strong><span>approval-gated checkout</span></div>
        </div>
      </section>
      <section className={styles.whiteSection}>
        <div className={styles.sectionTitle}><div><h2>Choose a project area</h2><p>We are launching by category as supplier agreements clear.</p></div><div className={styles.status}>Storefront live · catalog onboarding active</div></div>
        <div className={styles.grid}>
          {store.categories.map((category) => <article className={styles.categoryCard} key={category.slug}>
            <Link href={`/shop/${category.slug}`}>
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <div className={styles.arrow}>Explore category →</div>
            </Link>
          </article>)}
        </div>

        <div className={styles.sectionTitle} style={{marginTop:48}}><div><h2>Available now</h2><p>Only dealer-authorized products with verified price and fulfillment terms appear here.</p></div></div>
        {liveProducts.length ? <div className={styles.grid}>{liveProducts.slice(0,6).map((product) => <article className={styles.productCard} key={product.id}>
          <Link href={`/shop/product/${product.slug}`}>
            <h2>{product.title}</h2>
            <p>{product.description}</p>
            <div className={styles.price}>{product.quoteOnly ? 'Request quote' : money(product.sellingPrice)}</div>
            <div className={styles.arrow}>View product →</div>
          </Link>
        </article>)}</div> : <div className={styles.empty}>
          <strong>Dealer products are being onboarded now.</strong><br/>The storefront is open for project requests, but direct checkout stays locked until supplier authorization and pricing are verified.
        </div>}

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18,marginTop:48}}>
          <div className={styles.panel}>
            <h2>What changed</h2>
            <p>This is no longer the old prospect demo. Aridon Market now runs from the Commerce Engine database, records leads and funnel events, and has an approval-gated Stripe checkout path.</p>
            <p>As suppliers approve us, their verified SKUs can be switched from Draft to Live without rebuilding the storefront.</p>
          </div>
          <LeadForm heading="Need something before it is listed?" productInterest="General storefront request"/>
        </div>
        <footer className={styles.footer}>Aridon Market · Products are sold only where reseller authorization, pricing, freight and warranty terms have been verified. Product availability and final freight may vary by destination.</footer>
      </section>
    </div>
  </main>;
}
