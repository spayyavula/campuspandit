import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
  /** Full <title> text. Library does not append site name. */
  title: string;
  description: string;
  /** Absolute URL — used for canonical, og:url. */
  canonical: string;
  /** Defaults to /og-image.png (1200x630). */
  ogImage?: string;
  ogType?: 'website' | 'article';
  /** When true, emits <meta name="robots" content="noindex,follow"> (e.g. /apply/thanks). */
  noindex?: boolean;
  /** Additional JSON-LD blocks. Each becomes one <script type="application/ld+json">. */
  jsonLd?: object | object[];
}

const Seo: React.FC<SeoProps> = ({
  title,
  description,
  canonical,
  ogImage = 'https://www.campuspandit.ai/og-image.png',
  ogType = 'website',
  noindex = false,
  jsonLd,
}) => {
  const jsonLdBlocks = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
    : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {noindex && <meta name="robots" content="noindex,follow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
