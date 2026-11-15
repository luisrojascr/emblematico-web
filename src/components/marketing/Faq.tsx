import { FAQ } from "@/lib/content/hospitality";

export function Faq() {
  return (
    <dl className="grid gap-8 md:grid-cols-2">
      {FAQ.map((item) => (
        <div key={item.q} className="space-y-2">
          <dt className="font-serif text-xl">{item.q}</dt>
          <dd className="text-ink-soft">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}
