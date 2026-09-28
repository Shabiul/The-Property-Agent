import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';

// ─── CONSTANTS ──────────────────────────────────────────
const SITE_URL = 'https://www.thepropertyagent.in';
const SITE_NAME = 'The Property Agent';
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.jpg`;
const EMAIL = 'thepropertyagent129@gmail.com';
const ADDRESS = 'No. 84, 4th cross kashi nagar, yelachanahalli, B-78., Bengaluru, Karnataka';

// ─── TYPES ──────────────────────────────────────────────
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface PropertySchemaData {
  /** The property's actual route id (property.id) — used to build the
   *  schema's `url` so it matches the real /listings/:id page and the
   *  canonical tag exactly, instead of a title-derived path that 404s. */
  id: string;
  name: string;
  description: string;
  price: number;
  priceCurrency?: string;
  type: 'rent' | 'sale' | 'lease' | 'commercial' | 'plot' | 'farmhouse' | 'land';
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: string;
  areaName: string;
  images: string[];
  amenities: string[];
  furnished: string;
  availability: string;
  deposit?: string;
  floor?: string;
  facing?: string;
  reviews?: Array<{
    name: string;
    rating: number;
    text: string;
    date: string;
  }>;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  location?: string;
  geoRegion?: string;
  geoPosition?: string;
  // Enhanced props
  canonicalPath?: string;
  breadcrumbs?: BreadcrumbItem[];
  faqData?: FAQItem[];
  propertyData?: PropertySchemaData;
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

// ─── DEFAULT VALUES ─────────────────────────────────────
const defaultProps: Required<Pick<SEOProps, 'description' | 'keywords' | 'image' | 'type' | 'location' | 'geoRegion' | 'geoPosition'>> = {
  description: 'The Property Agent is a Karnataka-wide real estate agent dealing in plot sales, farmhouse plots, agricultural land, rental & lease homes, and commercial properties. New listings are added and updated regularly across Karnataka.',
  keywords: 'The Property Agent, Karnataka real estate agent, plot for sale Karnataka, farmhouse plot Karnataka, agricultural land for sale Karnataka, rental house Karnataka, lease property Karnataka, commercial property Karnataka, Bengaluru real estate agent',
  image: DEFAULT_OG_IMAGE,
  type: 'website',
  location: 'Karnataka, India',
  geoRegion: 'IN-KA',
  geoPosition: '12.9716;77.5946',
};

// ─── SCHEMA GENERATORS ─────────────────────────────────

/** WebSite schema with SearchAction for sitelinks search box */
function generateWebSiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['The Property Agent Karnataka'],
    url: SITE_URL,
    description: defaultProps.description,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/listings?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** RealEstateAgent + LocalBusiness combined schema */
function generateBusinessSchema(callNumbers: string[], whatsappNumber: string): object {
  const primaryPhone = callNumbers[0] || '';
  const waDigits = whatsappNumber.replace(/\D/g, '');

  const contactPoints = callNumbers.map((num, i) => ({
    '@type': 'ContactPoint',
    telephone: num,
    contactType: i === 0 ? 'customer service' : 'sales',
    areaServed: 'IN',
    availableLanguage: ['English', 'Kannada'],
  }));

  return {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: 'The Property Agent Karnataka',
    description: 'The Property Agent is an independent real estate agent covering all of Karnataka, dealing in plot sales, farmhouse plots, agricultural land, rental & lease homes, and commercial properties as they become available.',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_OG_IMAGE,
      width: 512,
      height: 512,
    },
    image: DEFAULT_OG_IMAGE,
    telephone: primaryPhone,
    email: EMAIL,
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, Bank Transfer, UPI',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No. 84, 4th cross kashi nagar, yelachanahalli, B-78.',
      addressLocality: 'Bengaluru',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '12.9716',
      longitude: '77.5946',
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '19:00',
      },
    ],
    areaServed: [
      { '@type': 'State', name: 'Karnataka' },
      { '@type': 'City', name: 'Bengaluru' },
    ],
    knowsAbout: [
      'Plot Sales', 'Farmhouse Plots', 'Agricultural Land', 'Rental Properties',
      'Lease Properties', 'Commercial Properties', 'Real Estate Documentation',
      'Site Visits', 'Property Valuation',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Property Categories Across Karnataka',
      itemListElement: [
        { '@type': 'OfferCatalog', name: 'Plots for Sale' },
        { '@type': 'OfferCatalog', name: 'Farmhouse Plots' },
        { '@type': 'OfferCatalog', name: 'Agricultural Land' },
        { '@type': 'OfferCatalog', name: 'Rental Houses' },
        { '@type': 'OfferCatalog', name: 'Lease Properties' },
        { '@type': 'OfferCatalog', name: 'Properties for Sale' },
        { '@type': 'OfferCatalog', name: 'Commercial Properties' },
      ],
    },
    priceRange: '₹₹ - ₹₹₹₹',
    slogan: 'Plots, Farmhouses & Land Across Karnataka',
    ...(contactPoints.length > 0 ? { contactPoint: contactPoints } : {}),
    sameAs: [
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`,
      ...(waDigits ? [`https://wa.me/${waDigits}`] : []),
      `${SITE_URL}/llms.txt`,
      `${SITE_URL}/llms-full.txt`,
    ],
    founder: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };
}

/** BreadcrumbList schema */
function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/** FAQPage schema for AEO */
function generateFAQSchema(faqs: FAQItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** RealEstateListing schema for property detail pages */
function generatePropertySchema(property: PropertySchemaData): object {
  const isRent = property.type === 'rent';
  
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.name,
    description: property.description,
    url: `${SITE_URL}/listings/${property.id}`,
    image: property.images.map(img => img.startsWith('http') ? img : `${SITE_URL}${img}`),
    datePosted: new Date().toISOString().split('T')[0],
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'INR',
      availability: property.availability === 'Immediate' || property.availability === 'Ready to Move'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...(isRent ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: property.price, priceCurrency: 'INR', unitText: 'MONTH' } } : {}),
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.areaName,
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '12.9716',
      longitude: '77.5946',
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.area,
      unitCode: 'FTK',
      unitText: 'sqft',
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    amenityFeature: property.amenities.map(a => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    })),
  };

  // Add floor info
  if (property.floor) {
    schema.floorLevel = property.floor;
  }

  // Add facing direction
  if (property.facing) {
    schema.additionalProperty = [
      { '@type': 'PropertyValue', name: 'Facing', value: property.facing },
      { '@type': 'PropertyValue', name: 'Furnished', value: property.furnished },
    ];
  }

  // Add aggregate rating from reviews
  if (property.reviews && property.reviews.length > 0) {
    const avgRating = property.reviews.reduce((sum, r) => sum + r.rating, 0) / property.reviews.length;
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: property.reviews.length.toString(),
      bestRating: '5',
      worstRating: '1',
    };
    schema.review = property.reviews.slice(0, 3).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
      datePublished: r.date,
    }));
  }

  const isLand = property.type === 'plot' || property.type === 'farmhouse' || property.type === 'land';
  schema.mainEntity = {
    '@type': isLand ? 'Place' : 'SingleFamilyResidence',
    name: property.name,
    description: property.description,
    address: schema.address,
    geo: schema.geo,
    ...(isLand ? {} : {
      numberOfRooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
    }),
    floorSize: schema.floorSize,
    amenityFeature: schema.amenityFeature,
  };

  return schema;
}

/** ItemList schema for listings page */
function generateItemListSchema(title: string, description: string, numberOfItems: number = 0): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: description,
    url: `${SITE_URL}/listings`,
    numberOfItems,
    itemListOrder: 'https://schema.org/ItemListUnordered',
  };
}

// ─── SEO COMPONENT ──────────────────────────────────────
export const SEO: React.FC<SEOProps> = (props) => {
  const location = useLocation();
  const { callNumbers, whatsappNumber } = useSettingsStore(s => s.settings);

  const {
    title,
    description = defaultProps.description,
    keywords = defaultProps.keywords,
    image = defaultProps.image,
    type = defaultProps.type,
    geoRegion = defaultProps.geoRegion,
    geoPosition = defaultProps.geoPosition,
    canonicalPath,
    breadcrumbs,
    faqData,
    propertyData,
    noIndex = false,
  } = props;

  // Build the full page title
  const pageTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Plots, Farmhouses, Land, Rentals & Properties Across Karnataka`;

  // Build canonical URL
  const canonical = canonicalPath
    ? `${SITE_URL}${canonicalPath}`
    : `${SITE_URL}${location.pathname}`;

  // Build absolute image URL
  const absoluteImage = image?.startsWith('http') ? image : `${SITE_URL}${image}`;

  // Determine if this is the home page
  const isHomePage = location.pathname === '/';

  return (
    <Helmet>
      {/* ─── Primary Meta Tags ─── */}
      <html lang="en" />
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* ─── Canonical & Alternate ─── */}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en-IN" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* ─── Robots ─── */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <meta name="googlebot" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <meta name="bingbot" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />

      {/* ─── Open Graph / Facebook ─── */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* ─── Twitter Card ─── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {/* ─── Geo Tags (GEO/Local SEO) ─── */}
      <meta name="geo.region" content={geoRegion} />
      <meta name="geo.placename" content={props.location || defaultProps.location} />
      <meta name="geo.position" content={geoPosition} />
      <meta name="ICBM" content={geoPosition?.replace(';', ', ')} />

      {/* ─── Additional Meta Tags ─── */}
      <meta name="author" content={SITE_NAME} />
      <meta name="publisher" content={SITE_NAME} />
      <meta name="copyright" content={`© ${new Date().getFullYear()} ${SITE_NAME}`} />
      <meta name="theme-color" content="#0C2320" />
      <meta name="msapplication-TileColor" content="#0C2320" />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* ─── Verification Placeholders ─── */}
      {/* Uncomment and add your verification codes:
      <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" />
      <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />
      */}

      {/* ─── Favicon ─── */}
      <link rel="icon" type="image/jpeg" href="/logo.jpg" />
      <link rel="apple-touch-icon" href="/logo.jpg" />

      {/* ─── Structured Data: WebSite (Home page only) ─── */}
      {isHomePage && (
        <script type="application/ld+json">
          {JSON.stringify(generateWebSiteSchema())}
        </script>
      )}

      {/* ─── Structured Data: Business/Organization (always) ─── */}
      <script type="application/ld+json">
        {JSON.stringify(generateBusinessSchema(callNumbers, whatsappNumber))}
      </script>

      {/* ─── Structured Data: Breadcrumbs ─── */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(generateBreadcrumbSchema(breadcrumbs))}
        </script>
      )}

      {/* ─── Structured Data: FAQ (AEO) ─── */}
      {faqData && faqData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(generateFAQSchema(faqData))}
        </script>
      )}

      {/* ─── Structured Data: Property Listing ─── */}
      {propertyData && (
        <script type="application/ld+json">
          {JSON.stringify(generatePropertySchema(propertyData))}
        </script>
      )}
    </Helmet>
  );
};

// ─── EXPORTS ────────────────────────────────────────────
export { generateItemListSchema, generateBreadcrumbSchema, SITE_URL, SITE_NAME };
export type { BreadcrumbItem, FAQItem, PropertySchemaData };

// Export provider to wrap app
export const SEOProvider = HelmetProvider;
