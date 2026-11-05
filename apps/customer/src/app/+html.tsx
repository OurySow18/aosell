import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Default document shell + SEO/Open Graph fallback. expo-router/head's <Head>
// (used per-page, e.g. in the landing page) relies on useIsFocused(), which
// never becomes true during static export's server-side prerender — so its
// tags render correctly once a real browser hydrates the page, but stay
// empty in the raw static HTML. That raw HTML is exactly what non-JS
// crawlers and link-preview scrapers (Slack, WhatsApp, iMessage, X...) read,
// so this file gives every page a real default title/description/OG image
// at the document level, where static export always includes it.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>AoSell — Les cuisines de Bremen, livrées chez vous</title>
        <meta
          name="description"
          content="AoSell connecte les cuisines et commerces indépendants de Bremen à des clients locaux. Commandez sur le web ou téléchargez l'app."
        />
        <meta property="og:site_name" content="AoSell" />
        <meta property="og:title" content="AoSell — Les cuisines de Bremen, livrées chez vous" />
        <meta
          property="og:description"
          content="AoSell connecte les cuisines et commerces indépendants de Bremen à des clients locaux. Commandez sur le web ou téléchargez l'app."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />

        {/* react-native-web root element style reset for full-screen apps */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
