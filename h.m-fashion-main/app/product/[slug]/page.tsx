import { notFound } from 'next/navigation';
import { getAllProductSlugs, getProductBySlug } from '@/lib/catalog';
import { ProductDetailClient } from './product-client';
import { PublicLayout } from '@/components/layout/public-layout';

export const revalidate = 60;

export async function generateStaticParams() {
  return getAllProductSlugs();
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const data = await getProductBySlug(params.slug);
  if (!data) notFound();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.product.title,
    description: data.product.description,
    image: data.product.images,
    sku: data.product.sku,
    brand: { '@type': 'Brand', name: 'M.H.Fashion' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: data.product.rating,
      reviewCount: data.product.review_count,
    },
    offers: {
      '@type': 'Offer',
      price: data.product.price,
      priceCurrency: 'INR',
      availability: data.product.stock > 0 ? 'InStock' : 'OutOfStock',
    },
  };
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailClient {...data} />
    </PublicLayout>
  );
}
