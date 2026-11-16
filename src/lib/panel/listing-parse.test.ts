import { describe, expect, it } from "vitest";

import { listingSource, parseListing } from "./listing-parse";

describe("listingSource", () => {
  it("acepta anuncios de Airbnb y quita parámetros", () => {
    const found = listingSource(
      "https://www.airbnb.com/rooms/12345?adults=2&check_in=2026-12-01",
    );
    expect(found?.source).toBe("airbnb");
    expect(found?.url.toString()).toBe("https://www.airbnb.com/rooms/12345");
    expect(listingSource("https://www.airbnb.co.cr/rooms/99")?.source).toBe(
      "airbnb",
    );
  });

  it("acepta Booking", () => {
    const found = listingSource(
      "https://www.booking.com/hotel/cr/casa-sol.es.html?aid=1",
    );
    expect(found?.source).toBe("booking");
    expect(found?.url.search).toBe("");
  });

  it("rechaza otros sitios, http y hosts parecidos", () => {
    expect(listingSource("http://www.airbnb.com/rooms/1")).toBeNull();
    expect(listingSource("https://evil.com/rooms/1")).toBeNull();
    expect(listingSource("https://airbnb.com.evil.com/rooms/1")).toBeNull();
    expect(listingSource("https://www.airbnb.com/")).toBeNull();
    expect(listingSource("https://user:pw@www.airbnb.com/rooms/1")).toBeNull();
    expect(listingSource("no es un enlace")).toBeNull();
  });
});

const HTML = `<!doctype html><html><head>
<title>Casa Sol &amp; Mar - Casas en renta en Tamarindo - Airbnb</title>
<meta property="og:description" content="Descripción de respaldo">
<meta property="og:image" content="https://a0.muscache.com/im/pictures/abc.jpg?im_w=720">
<script type="application/ld+json">{
  "@type":"VacationRental","name":"Casa Sol &amp; Mar",
  "description":"<b>Casa</b> frente al mar con piscina.",
  "image":["https://a0.muscache.com/im/pictures/xyz.jpg"],
  "checkinTime":"15:00:00","checkoutTime":"11:00:00",
  "amenityFeature":[{"name":"Wifi"},{"name":"Piscina"},{"name":"Cocina","value":false}]
}</script></head><body><p>No se permite fumar. No se admiten mascotas.</p></body></html>`;

describe("parseListing", () => {
  it("extrae los datos del JSON-LD", () => {
    const data = parseListing(HTML, "airbnb");
    expect(data).toMatchObject({
      name: "Casa Sol & Mar",
      description: "Casa frente al mar con piscina.",
      amenities: ["Wifi", "Piscina"],
      checkIn: "15:00",
      checkOut: "11:00",
      imageUrl: "https://a0.muscache.com/im/pictures/xyz.jpg",
    });
    expect(data?.rules).toEqual([
      "No se permite fumar",
      "No se admiten mascotas",
    ]);
  });

  it("cae a las etiquetas og y al título", () => {
    const data = parseListing(
      `<title>Loft Centro - Lofts - Airbnb</title><meta property="og:description" content="Loft céntrico">`,
      "airbnb",
    );
    expect(data?.name).toBe("Loft Centro");
    expect(data?.description).toBe("Loft céntrico");
    expect(data?.imageUrl).toBeNull();
  });

  it("ignora fotos de hosts no permitidos y devuelve null sin contenido", () => {
    const data = parseListing(
      `<title>X - Airbnb</title><meta property="og:image" content="https://evil.com/a.jpg">`,
      "airbnb",
    );
    expect(data?.imageUrl).toBeNull();
    expect(parseListing("<html></html>", "airbnb")).toBeNull();
  });
});
