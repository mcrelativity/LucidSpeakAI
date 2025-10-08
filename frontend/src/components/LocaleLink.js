'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LocaleLink({ href, children, ...props }) {
  const params = useParams();
  const locale = params?.locale || 'en';
  
  // If href already starts with a locale (en or es), use as-is
  if (href.startsWith('/en/') || href.startsWith('/es/')) {
    return <Link href={href} {...props}>{children}</Link>;
  }
  
  // If href starts with /, prepend locale
  const localizedHref = href.startsWith('/') && !href.startsWith(`/${locale}/`)
    ? `/${locale}${href}` 
    : href;

  return <Link href={localizedHref} {...props}>{children}</Link>;
}