Design and implement the MVP website and client portal for **emblemático**, a Costa Rican brand offering personalized 3D-printed products and digital business solutions.

**Brand identity**
- Name: emblemático (always lowercase).
- Tagline: "Diseño y soluciones que distinguen tu negocio."
- Colors: `#1F1F1F`, `#C9AC87`, `#F6EFE6`.
- Elegant serif headings, clean sans-serif body text.
- Premium, minimalist, responsive design.
- Reuse the supplied brand logo and icon.

**Marketing website**

Build a conversion-focused website in Spanish featuring:
- Homepage.
- Product catalog and product details.
- Welcome Station, Room Essentials, Business QR Displays, and Hospitality Kits.
- Information about hosted digital landing pages.
- About and contact pages.
- WhatsApp-based quotation requests.

**Client landing page platform**

Each customer gets a customizable landing page hosted at:

`https://www.emblematicocr.com/negocio/{slug}`

Build a multi-tenant system using reusable templates.

Initial templates:

1. **Hospitality:** Property information, Wi-Fi, house rules, check-in/out, contact, recommendations.
2. **General Business:** Business information, opening hours, WhatsApp, Google Reviews, social links, menu/catalog links.

**Client dashboard — `/panel`**

Authenticated customers can:
- Edit their own business information.
- Upload logos and photos.
- Edit approved sections through simple forms.
- Preview and publish changes.
- Access their permanent URL and downloadable QR.

Do not build a drag-and-drop page builder.

**Admin dashboard — `/admin`**

Administrators can:
- Create businesses and client accounts.
- Assign templates and business access.
- Manage products and page status.
- Publish, suspend, and manage customer pages.
- Manage the platform from one interface.

**Preferred technology**

- Next.js + TypeScript.
- Tailwind CSS.
- Supabase for PostgreSQL, authentication, and storage.
- Dynamic routes for client pages.
- Structured JSON content with schema validation.
- Secure multi-tenant authorization using Row Level Security.

**Critical requirements**

- One shared application, not separate websites for each client.
- Permanent QR URLs that remain valid after content updates.
- Draft and published content must be separated.
- Client permissions must be isolated by business.
- Mobile-first layouts and fast page loading.
- All public copy and interfaces in Spanish.
- No payments, complex CMS, or unnecessary SaaS features in the MVP.

**Implementation approach**

First inspect any existing repository and identify reusable components. Present a concise architecture, database schema, page structure, and phased implementation plan before modifying code.

Use the accompanying PRD as the source of truth. Build the simplest production-ready foundation that can support additional templates and paid digital services later.