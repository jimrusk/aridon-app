import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicProduct, money } from '../../../../lib/storefront';
import { BuyButton, LeadForm, TrackView } from '../../StoreActions';
import styles from '../../shop.module.css';

type Props = { params: { slug: string } };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getPublicProduct(params.slug);
  if (!result) return { title: 'Product not found | Aridon Market' };
  return {
    title: `${result.product.title} | Aridon Market`,
    description: result.product.description,
    alternates: { canonical: `/shop/product/${result.product.slug}` },
    openGraph: { title: result.product.title, description: result.product.description, url: `/shop/product/${result.product.slug}`, type: 'website', images: result.product.imageUrls },
  };
}

export default async function ProductPage({ params }: Props) {
  const result = await getPublicProduct(params.slug);
  if (!result) notFound();
  const product = result.product;
  const specs = Object.entries(product.specs).slice(0, 12);
  return <main className={styles.shell}>
    <TrackView eventName="product_view" productId={product.id} data={{ category: product.category, slug: product.slug }}/>
    <div className={styles.wrap}>
      <nav className={styles.nav}><div className={styles.brand}>ARIDON MARKET</div><div style={{display:'flex',gap:16}}><Link href="/shop">Shop</Link><Link href={`/shop/${product.category}`}>Category</Link></div></nav>
      <div className={styles.breadcrumb}><Link href="/shop">Market</Link><span>›</span><Link href={`/shop/${product.category}`}>{product.category}</Link><span>›</span><span>{product.title}</span></div>
      <section className={styles.whiteSection} style={{marginTop:18,paddingTop:28}}>
        <div className={styles.productHero}>
          <div className={styles.imageBox}>{product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={product.title}/> : <div className={styles.imagePlaceholder}>⚡</div>}</div>
          <div className={styles.panel}>
            <div className={styles.eyebrow} style={{color:'#0d7a58'}}>{product.category.toUpperCase()}</div>
            <h1 style={{fontSize:38,lineHeight:1.05,margin:'10px 0 14px'}}>{product.title}</h1>
            <p>{product.description}</p>
            <div className={styles.price}>{product.quoteOnly ? 'Request a verified quote' : money(product.sellingPrice)}</div>
            <div className={styles.meta}>
              {product.supplierName && <span>Supplier: {product.supplierName}</span>}
              {product.availability && <span>Availability: {product.availability}</span>}
              {product.warranty && <span>Warranty: {product.warranty}</span>}
              {product.shippingNote && <span>Shipping: {product.shippingNote}</span>}
              {product.freightCost > 0 && !product.quoteOnly && <span>Freight reserve shown at checkout: {money(product.freightCost)}</span>}
            </div>
            <div className={styles.buttonRow}>
              {product.quoteOnly ? <a className={styles.buttonSecondary} href="#quote">Request pricing</a> : <BuyButton productId={product.id}/>} 
            </div>
            <div className={styles.notice}>Checkout is enabled only because this product is marked Live and its supplier is marked Approved in Aridon Commerce Engine.</div>
          </div>
        </div>
        {specs.length > 0 && <><div className={styles.sectionTitle}><div><h2>Product details</h2></div></div><div className={styles.specs}>{specs.map(([key,value]) => <div className={styles.spec} key={key}><strong>{key.replace(/_/g,' ')}</strong><div>{String(value)}</div></div>)}</div></>}
        <div id="quote" style={{marginTop:36}}><LeadForm productId={product.id} category={product.category} productInterest={product.title} heading={`Ask about ${product.title}`}/></div>
        <footer className={styles.footer}><Link href={`/shop/${product.category}`}>← Back to category</Link></footer>
      </section>
    </div>
  </main>;
}
