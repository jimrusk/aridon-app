import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryContext, money } from '../../../lib/storefront';
import { LeadForm, TrackView } from '../StoreActions';
import styles from '../shop.module.css';

export const dynamic = 'force-dynamic';

type Props = { params: { category: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getCategoryContext(params.category);
  if (!store) return { title: 'Store category not found | Aridon Market' };
  return {
    title: `${store.category.name} | Aridon Market`,
    description: store.category.description,
    alternates: { canonical: `/shop/${store.category.slug}` },
    openGraph: { title: `${store.category.name} | Aridon Market`, description: store.category.description, url: `/shop/${store.category.slug}`, type: 'website' },
  };
}

export default async function CategoryPage({ params }: Props) {
  const store = await getCategoryContext(params.category);
  if (!store) notFound();
  const showroom: any = store.showroom;
  const sections = Array.isArray(showroom?.sections) ? showroom.sections : [];

  return <main className={styles.shell}>
    <TrackView eventName="category_view" data={{ category: store.category.slug }}/>
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <div className={styles.brand}>ARIDON MARKET</div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}><Link href="/shop">All categories</Link><Link href="/">Aridon</Link></div>
      </nav>
      <div className={styles.breadcrumb}><Link href="/shop">Market</Link><span>›</span><span>{store.category.name}</span></div>
      <section className={styles.hero}>
        <div className={styles.eyebrow}>{store.category.name.toUpperCase()}</div>
        <h1>{showroom?.headline || store.category.name}</h1>
        <p>{showroom?.subheadline || store.category.description}</p>
        <div className={styles.pills}>
          <span className={styles.pill}>Verified dealer terms</span>
          <span className={styles.pill}>Freight-aware</span>
          <span className={styles.pill}>Project support</span>
        </div>
      </section>
      <section className={styles.whiteSection}>
        <div className={styles.sectionTitle}><div><h2>Shop {store.category.name}</h2><p>{store.products.length} dealer-approved products are currently live.</p></div></div>
        {store.products.length ? <div className={styles.grid}>{store.products.map((product) => <article className={styles.productCard} key={product.id}>
          <Link href={`/shop/product/${product.slug}`}>
            <h2>{product.title}</h2>
            <p>{product.description || 'Verified product details are available on the product page.'}</p>
            <div className={styles.price}>{product.quoteOnly ? 'Request quote' : money(product.sellingPrice)}</div>
            <div className={styles.meta}>
              {product.availability && <span>Availability: {product.availability}</span>}
              {product.supplierName && <span>Authorized supplier: {product.supplierName}</span>}
            </div>
            <div className={styles.arrow}>View product →</div>
          </Link>
        </article>)}</div> : <div className={styles.empty}>
          <strong>Catalog onboarding is underway.</strong><br/>We can still source and quote projects in this category while dealer applications and SKU data are being finalized.
        </div>}

        {sections.length > 0 && <div className={styles.grid} style={{marginTop:28}}>{sections.map((section: any, index: number) => <article className={styles.panel} key={`${section?.title || 'section'}-${index}`}>
          <h2>{String(section?.title || 'Project support')}</h2><p>{String(section?.body || '')}</p>
        </article>)}</div>}

        <div style={{marginTop:36}}><LeadForm category={store.category.slug} productInterest={store.category.name} heading={`Request ${store.category.name} pricing`}/></div>
        <footer className={styles.footer}><Link href="/shop">← Back to Aridon Market</Link></footer>
      </section>
    </div>
  </main>;
}
