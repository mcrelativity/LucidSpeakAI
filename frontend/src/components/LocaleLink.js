'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LocaleLink({ href, children, ...props }) {
  const params = useParams();
  const locale = params?.locale || 'en';
  
  // Don't add locale if href already starts with a locale or is external
  const localizedHref = href.startsWith('/') && !href.startsWith(`/${locale}`) 
    ? `/${locale}${href}` 
    : href;

  return <Link href={localizedHref} {...props}>{children}</Link>;
}