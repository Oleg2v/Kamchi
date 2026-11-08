import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/catalog/ProductPage";
import { FIXTURES, getBrand, getFixtureBySlug } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return FIXTURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = getFixtureBySlug(slug);
  if (!f) return { title: "לא נמצא" };
  const brand = getBrand(f.brand)?.name ?? f.brand;
  return {
    title: `${f.name} · ${brand}`,
    description: f.description.he,
  };
}

export default async function FixturePage({ params }: Props) {
  const { slug } = await params;
  const f = getFixtureBySlug(slug);
  if (!f) notFound();
  return <ProductPage slug={slug} />;
}
