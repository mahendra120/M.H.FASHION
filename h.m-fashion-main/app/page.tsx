import { getHomePageData } from '@/lib/catalog';
import { HomeClient } from './home-client';

export const revalidate = 60;

export default async function HomePage() {
  const data = await getHomePageData();
  return <HomeClient {...data} />;
}
