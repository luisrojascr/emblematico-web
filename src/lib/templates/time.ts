/**
 * Horas de llegada y salida. Se guardan como "HH:MM" (24 h) cuando se pueden
 * leer; textos libres viejos ("después de las 3") se dejan tal cual.
 */

/** "3 pm", "3:00 PM", "15:00", "15h" → "15:00". null si no es una hora clara. */
export function toTime24(value: string): string | null {
  const match =
    /^\s*(\d{1,2})(?:[:.h](\d{2}))?\s*(?:h(?:rs?)?)?\s*([ap])?\.?\s*m?\.?\s*$/i.exec(
      value,
    );
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const half = match[3]?.toLowerCase();
  if (minute > 59) return null;
  if (half) {
    if (hour < 1 || hour > 12) return null;
    if (half === "p" && hour !== 12) hour += 12;
    if (half === "a" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Para mostrar a huéspedes: "15:00" → "3:00 PM". Otro texto se muestra igual. */
export function displayTime(value: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const hour = Number(match[1]);
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${match[2]} ${suffix}`;
}
