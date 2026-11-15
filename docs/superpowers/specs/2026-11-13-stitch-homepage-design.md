# Homepage design from the Stitch screen

Rebuild the public homepage so it follows the downloaded Stitch screen, using the copy, prices, demo, WhatsApp number, logo files, and photos this site already has. Add Hospitality Free beside the two paid plans.

Source screen: `/Users/luisrojas/Documents/Proyectos/Emblematico/Stitch/stitch_emblem_tico_portal_and_website/` (`DESIGN.md`, `code.html`, `screen.png`). That HTML is a visual reference. Do not paste it into the app. It contains a placeholder WhatsApp number, remote images, a Swedish lodge demo, and a seven-language switcher. None of those ship.

## Scope

In:

- `src/app/(site)/page.tsx`
- New homepage sections in `src/components/marketing/home/`
- Shared chrome: `Header`, `Footer`, `WhatsAppButton`, and the marketing font switch on `SiteShell`
- `src/lib/plans.ts` and `PlanCards`, because the free plan is real catalog data and `/productos` already renders `PlanCards`
- Font resets on the panel and admin layouts so their content keeps Inter and Fraunces
- A unit test for the three plans, and the homepage smoke check for “Hospitality Free”

Out:

- Rebuilding the bodies of `/landing-digital`, `/como-funciona`, `/contacto`, `/productos`, the panel, admin, or guest guides
- A public signup or any provisioning of the free plan
- A second quote form on the homepage
- Terms, privacy, or warranty pages
- The Material Symbols font, or any new icon package
- Importing the full Stitch color token list

`FeatureGrid`, `Steps`, `Faq`, `Section`, and `ButtonLink` stay as they are. `/como-funciona` and `/landing-digital` still use them. The homepage does not.

## Plans

`Plan.id` becomes `"free" | "essential" | "plus"`. Order in `PLANS` is free, essential, plus. Essential and Plus keep their current prices, renewals, summaries, and included lines.

Hospitality Free:

- Price `0`, renewal `0`
- Summary: “Para probar la guía en un solo alojamiento.”
- Includes, in this order: “1 alojamiento”; “1 idioma, sin traducciones”; “Tema estándar”; “Wi-Fi, contacto, información de la casa, check-out, normas y recomendaciones”; “Código QR permanente y plantilla PDF”; “Panel editable”

`PlanCards` lays the three cards in one column, and in one row from the `md` breakpoint. Plus is the only highlighted card: bronze border and the label “Más recomendado”. Free and Essential stay quiet.

Price display:

- Free always shows ₡0 with the label “Sin costo”, and “Sin costo de renovación”. It ignores `SHOW_PRICES`.
- Paid plans keep today’s behavior: “Desde” plus the amount and the annual renewal when `SHOW_PRICES` is true, otherwise “Cotiza”.

Buttons, all to `/contacto`:

- Free: “Comenzar gratis”
- Essential and Plus: “Solicitar propuesta”

There is no account creation on these buttons. An admin still creates the client.

`/productos` picks up these three cards because it renders `PlanCards`. The rest of that page stays.

## Visual system

Keep the existing tokens: cream `#F6EFE6`, charcoal `#1F1F1F`, bronze `#C9AC87`, and the derived ink, sand, and cream tones already in `globals.css`. The demo band uses charcoal. Cards are white with a hairline border. Do not add the Stitch Material palette.

Root layout keeps Inter and Fraunces as the default body fonts, and also loads Playfair Display and Plus Jakarta Sans. `SiteShell` points `--font-sans` and `--font-serif` at Plus Jakarta Sans and Playfair Display for its subtree. Guest routes never enter `SiteShell`, so they stay on Inter and Fraunces.

Panel and admin layouts wrap their own content with a class that points those variables back at Inter and Fraunces. Header and footer sit outside that wrapper, so they use the new type even on panel and admin routes.

Ivory header and footer use `/brand/logo-black.png`. The cream logo is for dark backgrounds only.

Buttons drawn by the homepage, header, and footer use a 4px radius. `ButtonLink` stays pill-shaped for the pages that already use it.

Icons are inline SVG, `aria-hidden`, with no new dependency.

## Chrome

Header links stay:

- Inicio `/`
- La solución `/landing-digital`
- Funciones `/como-funciona`
- Ver demo `/negocio/casa-nebora`
- Planes `/#planes`
- Contacto `/contacto`
- Ingresar `/ingresar`
- Solicitar propuesta `/contacto`

The bar is 5rem tall, labels are uppercase, and the proposal button uses the 4px charcoal style. Below the `lg` breakpoint the same links stay in a horizontally scrollable row. Do not hide them.

Footer background becomes cream. Keep the current destinations: Productos, La solución, Funciones, Contacto, Ingresar, and WhatsApp `+506 8899 7060` via `whatsappLink()`. Copyright stays “© 2026 emblemático. Todos los derechos reservados.”

The floating WhatsApp control keeps its accessible name “Cotizar por WhatsApp” and the current `wa.me/50688997060` message link. Only its shape and colors change, to the bronze pill on the screen.

## Homepage sections

Copy comes from the current homepage and from `src/lib/content/hospitality.ts`. Do not replace it with the Stitch sentences.

1. **Hero.** Eyebrow “Hospitality · Costa Rica”. Heading “Una mejor bienvenida. Menos trabajo para tu propiedad.” Intro: “Reúne las instrucciones, el Wi-Fi, las recomendaciones y los servicios de tu propiedad en una guía digital multilingüe, conectada a una pieza de bienvenida personalizada.” Actions: “Ver demo” to `SITE.demoPath`, “Solicitar propuesta” to `/contacto`. Three benefits: “Español, inglés y francés”, “Sin app que instalar”, “Contenido editable”. Photo `/images/overview.webp`, alt “Welcome Station, placas de servicios y kit de hospedaje personalizados con código QR”, inside a framed card.
2. **Problems.** Eyebrow “El reto”. Title “Situaciones comunes en los alojamientos”. Description “Si te suena familiar, una buena bienvenida puede ahorrarte mensajes y malentendidos.” The four `PROBLEMS` entries render as cards. The “Para quién” audience strip is removed from this page. `AUDIENCES` stays in the content module and is unused.
3. **Solution.** Title “Pieza 3D + guía digital”. Body: “Una pieza de bienvenida personalizada, impresa en 3D, con un código QR que abre la guía digital de tu propiedad. Facilita el acceso a la información, reduce las preguntas repetidas y te permite presentar tus servicios y recomendaciones.” Two cards restate claims already on the page:
   - Physical: “Pieza de bienvenida personalizada, impresa en 3D, con un código QR.”
   - Digital: “Guía en español, inglés y francés. Se abre con la cámara, sin instalar una app.”
   - Note: “No publiques códigos de acceso ni datos sensibles en una página abierta a quien tenga el QR.”
   - Link “Conocer la solución” to `/landing-digital`.
4. **Demo.** Charcoal band. Title “Conoce Casa Nébora”. Body: “Casa Nébora es una propiedad ficticia creada solo para demostrar cómo se ve y se usa la guía. No es un cliente real.” A static phone frame shows the name Casa Nébora, the line “Propiedad de muestra”, and these four labels: Información esencial, Guía de la propiedad, Explora la zona, Panel del anfitrión. It is not an embed and has no language switcher. “Ver demo” goes to `/negocio/casa-nebora`.
5. **Features.** Title “Todo lo que tu guía puede incluir”. Intro: “Seis módulos que activas según lo que necesite tu propiedad.” The access-code warning is only in the solution section. The six `FEATURES` entries render as cards.
6. **Plans.** `id="planes"`. Title “Hospitality Essential y Hospitality Plus” becomes “Hospitality Free, Essential y Plus”. The three `PlanCards`. The existing link to `/productos` stays.
7. **Steps.** The three `STEPS` entries. The link “Ver las funciones” to `/como-funciona` stays.
8. **Catalog.** A server section calls `getCategories()` and renders every category in `sort_order`. Each card uses that category’s name, description, and `image_path`, and the whole card is one link to `/productos/{slug}`. The visible action is “Ver modelo”. If the query throws or returns no categories, omit the section. The rest of the page still renders.
9. **FAQ.** The `FAQ` entries in an accordion. One question open at a time is not required; native `details` is enough. Do not change `components/marketing/Faq.tsx`.
10. **Contact.** Heading “Hablemos de tu alojamiento”. Body: “Pide una demo o una propuesta. Te respondemos por WhatsApp.” “Completar el formulario” goes to `/contacto`. “Escribir por WhatsApp” uses `whatsappLink("Hola, me gustaría una propuesta de emblemático para mi alojamiento.")`. The quote form is not duplicated here.

## Data flow and errors

Plans, problems, features, steps, FAQ, and the hero are static. The only new request is `getCategories()`, already cached. A catalog failure is caught at the homepage boundary and drops that one section. It does not change `getCategories()` for `/productos`, which may still throw.

No new form, so no new validation. Plan buttons and the contact card only navigate.

## Tests

- Unit test: `PLANS` is free, essential, plus, in that order. Free price and renewal are `0`. Plus is the only highlighted plan. Essential stays ₡39.900 / ₡24.900. Plus stays ₡69.900 / ₡49.900.
- The existing smoke test still finds the heading “Una mejor bienvenida. Menos trabajo para tu propiedad.”
- That smoke test also expects the text “Hospitality Free” on `/`.
- The product-page smoke test still finds a link named “Cotizar por WhatsApp” whose href matches `https://wa.me/50688997060?text=`.
- After implementation, check the homepage at desktop and at a phone width: the demo control opens Casa Nébora, each plan control opens `/contacto`, and `/como-funciona` still shows its current feature grid under the new header.

## Open decisions

None. The screen’s free plan, three-column plans, homepage-only rebuild, static Casa Nébora demo, and link to `/contacto` are decided.
