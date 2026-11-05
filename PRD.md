# Product Requirements Document — emblemático
**Version:** 1.1 — Website + Client Landing Pages  
**Stage:** MVP  
**Market:** Costa Rica  
**Primary language:** Spanish

## 1. Product Vision

emblemático combines personalized 3D-printed business products with simple digital experiences.

**Brand tagline:** Diseño y soluciones que distinguen tu negocio.

The website serves two purposes:

1. Promote and sell personalized physical products.
2. Host editable client landing pages connected to physical QR displays.

## 2. Target Customers

- Hotels, Airbnb hosts, and vacation rentals.
- Restaurants, cafés, and retail stores.
- Salons, clinics, and service businesses.
- Small business owners and property managers.

## 3. Core User Roles

### Visitor
- Explore products and services.
- Request a quotation via WhatsApp or contact form.
- Access public business landing pages by scanning a QR.

### Client
- Sign in to a secure account.
- Manage assigned business landing pages.
- Edit permitted text, images, links, and business information.
- Preview and publish changes.
- View or download the associated QR code.

### Administrator (emblemático)
- Manage all businesses, customers, and templates.
- Create and configure client pages.
- Assign customers to businesses.
- Activate, suspend, or archive pages.
- Control available editing fields and service plans.

## 4. Marketing Website

The public marketing website must include:

- Homepage with premium brand presentation.
- Product catalog.
- Product detail pages.
- Digital landing page service explanation.
- How it works.
- About the business.
- Contact and quotation requests.

Initial product categories:

1. Welcome Station.
2. Room Essentials.
3. Business QR Displays.
4. Hospitality Kits.

## 5. Client Landing Pages

Every customer may receive a landing page hosted under:

`https://www.emblematicocr.com/negocio/{slug}`

Example:

`https://www.emblematicocr.com/negocio/casa-brisa`

Requirements:

- Reuse shared templates instead of generating independent websites.
- Mobile-first design.
- Client-specific logo, imagery, colors, and business information.
- QR codes linking to a permanent URL.
- Client edits must not change the QR destination.
- Public pages require no login.
- Content changes become visible after publishing.
- Only active, published pages are publicly accessible.
- Reserve unique slugs and prevent collisions.
- Keep existing URLs stable when the business name changes.

### Template A: Hospitality

Sections:
- Logo and property name.
- Welcome message.
- Wi-Fi information.
- Check-in and check-out instructions.
- House rules.
- Property amenities and instructions.
- Contact via WhatsApp.
- Recommendations and useful links.

### Template B: General Business

Sections:
- Logo and business name.
- Business description.
- Location and opening hours.
- WhatsApp contact.
- Google Reviews link.
- Instagram and other social links.
- Menu, catalog, or website link.
- Primary call-to-action.

Templates must support optional sections.

## 6. Client Dashboard

Authenticated route: `/panel`

The client must be able to:

- View businesses assigned to the account.
- Select a business page.
- Edit approved content fields using simple forms.
- Upload and replace logo and cover photo.
- Enable or disable optional sections.
- Preview changes before publishing.
- Save a draft.
- Publish updates.
- View public landing page URL.
- Download or copy the QR code.

Clients cannot edit the underlying HTML, inject scripts, install plugins, or change other businesses' content.

## 7. Administrator Dashboard

Authenticated route: `/admin`

Admin functionality:

- List and search businesses.
- Create and manage business accounts.
- Assign one or more authorized users.
- Select a template for each page.
- Manage subscription/service status.
- Preview, publish, unpublish, and suspend pages.
- Manage the available product catalog.
- Access basic operational information.

Only administrators may change protected fields such as the page slug, template assignment, ownership, and service status.

## 8. Data Model

Minimum entities:

**Business**
- id
- name
- slug (unique)
- category
- status
- created_at

**BusinessMember**
- business_id
- user_id
- role

**Page**
- id
- business_id
- template_key
- draft_content (validated JSON)
- published_content (validated JSON)
- status
- published_at

**Media**
- id
- business_id
- storage_path
- media_type

**QRCode**
- id
- business_id
- destination_path
- created_at

Use immutable IDs internally and public slugs only for routing.

## 9. Technology

Preferred starting stack:

- Next.js with TypeScript.
- Tailwind CSS.
- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Server-rendered public landing pages.
- QR code generation and downloadable SVG/PNG.

The architecture must support multiple businesses in one application.

## 10. Security

- Implement tenant-level authorization.
- Enforce Row Level Security on exposed business data.
- Restrict asset access appropriately.
- Validate all editable input.
- Sanitize or restrict formatted content.
- Prevent arbitrary HTML and JavaScript injection.
- Protect admin operations with server-side authorization.
- Limit file sizes and accepted image formats.
- Never expose service credentials.
- Keep private operational data out of public pages.
- Use HTTPS.

## 11. Business Model

Initial model:

- One-time sale of customized physical products.
- Optional landing page setup fee.
- Defined initial hosting period and maintenance conditions.
- Optional recurring fee for hosting, support, and enhanced features.

Exact fees and plan inclusions will be defined after market validation.

QR codes must remain associated with stable destination URLs. Define service cancellation, expiration, export, and deletion behavior before launching paid hosting.

## 12. Non-Functional Requirements

- Fully responsive.
- Fast mobile performance.
- Accessible interface.
- Spanish-first UI.
- Search-friendly public marketing pages.
- Configurable indexing for client pages.
- Reliable page publishing.
- Automated backups and recovery procedures.
- Scalable without deploying a separate website per customer.

## 13. MVP Acceptance Criteria

The MVP is complete when:

1. Visitors can explore products and request a quotation.
2. An admin can create a new business and assign a template.
3. The system can publish a page under `/negocio/{slug}`.
4. A generated QR opens that page on a mobile device.
5. An authenticated client can edit and publish allowed fields.
6. Changes do not require a code deployment or new QR.
7. A customer cannot access or modify another business's data.
8. An administrator can suspend a page.
9. Public pages render correctly on mobile devices.
10. Core workflows have basic automated tests.

## 14. Out of Scope for MVP

- Online payments and full e-commerce checkout.
- Drag-and-drop website builder.
- Arbitrary page layouts.
- Custom domains for each client.
- Multi-language content management.
- Advanced analytics and visitor tracking.
- Reservation management.
- PMS integration.
- AI-generated page content.
- Automated billing.
- White-label platform resale.

These features may be added after validating customer demand.

## 15. Success Metrics

Track:

- Qualified quotation requests.
- Physical products sold.
- Landing pages activated.
- Time required to onboard a business.
- Number of active client pages.
- Support requests per customer.
- Recurring hosting revenue.
- Conversion from QR scan to customer action, when analytics are introduced with appropriate privacy safeguards.

**Primary MVP objective:** Validate whether businesses will purchase a combined physical QR product and hosted digital landing page, while maintaining low onboarding and support costs.