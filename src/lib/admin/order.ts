export function moveItem<T extends { id: string }>(
  items: readonly T[],
  id: string,
  direction: "up" | "down",
): T[] | null {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return [...items];
  const next = items.slice();
  const [item] = next.splice(index, 1);
  if (!item) return [...items];
  next.splice(target, 0, item);
  return next;
}
