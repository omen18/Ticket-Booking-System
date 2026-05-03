export function formatDate(input: string | Date, locale = "en-IN") {
  const date = input instanceof Date ? input : new Date(input);

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
