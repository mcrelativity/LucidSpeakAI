import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LocaleLink({ href, children, ...props }) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'es';
  
  // If href already includes locale, use as-is
  if (href.startsWith(`/${locale}/`) || href.startsWith('/en/') || href.startsWith('/es/')) {
    return <Link href={href} {...props}>{children}</Link>;
  }
  
  // Otherwise, prepend locale
  const localizedHref = `/${locale}${href}`;
  return <Link href={localizedHref} {...props}>{children}</Link>;
}