import createNextIntlPlugin from 'next-intl/plugin';

// Point to the correct i18n config file
const withNextIntl = createNextIntlPlugin('./src/i18n.js');

const nextConfig = {
  reactStrictMode: true,
  // Allow images from these domains if needed
  images: {
    domains: ['storage.googleapis.com'],
  },
};

export default withNextIntl(nextConfig);