export function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Belum ditentukan";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatAuthors(authors: Array<{ name: string }>) {
  if (authors.length === 0) return "Penulis belum tercatat";
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return authors[0].name + " dan " + authors[1].name;
  return authors[0].name + " dan " + (authors.length - 1) + " penulis lain";
}

export function truncate(value: string | null | undefined, length: number) {
  if (!value) return "";
  return value.length > length ? value.slice(0, length).trim() + "…" : value;
}

