import type { NormalizedPaper, PaperAuthor } from "@/lib/types";

export type PaperSource = NormalizedPaper["source"];
export type ProviderState = "ok" | "failed";

export interface ProviderStatus {
  state: ProviderState;
  count: number;
  message?: string;
}

export interface PaperSearchResult {
  papers: NormalizedPaper[];
  statuses: Record<PaperSource, ProviderStatus>;
  scholarUrl: string;
  partial: boolean;
}

class ProviderRequestError extends Error {
  constructor(
    public readonly source: PaperSource,
    public readonly status: number | null,
    message: string
  ) {
    super(message);
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function httpsUrl(value: unknown) {
  const url = stringValue(value);
  return url?.startsWith("https://") ? url : null;
}

export function normalizeDoi(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value
    .trim()
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/[.,;)\]}]+$/, "")
    .toLowerCase();
  return normalized || null;
}

export function reconstructOpenAlexAbstract(value: unknown) {
  const inverted = record(value);
  const words: Array<[number, string]> = [];

  for (const [word, positions] of Object.entries(inverted)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      if (typeof position === "number" && Number.isInteger(position)) {
        words.push([position, word]);
      }
    }
  }

  words.sort((a, b) => a[0] - b[0]);
  return words.length ? words.map((item) => item[1]).join(" ") : null;
}

function canonicalId(
  doi: string | null,
  source: PaperSource,
  sourceId: string,
  title: string,
  authors: PaperAuthor[],
  year: number | null
) {
  if (doi) return "doi:" + doi;
  const firstAuthor = authors[0]?.name.toLowerCase().replace(/\s+/g, " ") ?? "";
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return source + ":" + sourceId + ":" + normalizedTitle + ":" + firstAuthor + ":" + (year ?? "");
}

async function requestJson(source: PaperSource, url: string, headers: HeadersInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...headers
      },
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new ProviderRequestError(source, response.status, "Provider request failed");
    }

    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof ProviderRequestError) throw error;
    const message = error instanceof DOMException && error.name === "AbortError"
      ? "Provider timeout"
      : "Provider unavailable";
    throw new ProviderRequestError(source, null, message);
  } finally {
    clearTimeout(timeout);
  }
}

function safePaper(
  source: PaperSource,
  sourceId: string,
  title: string | null,
  abstract: string | null,
  authors: PaperAuthor[],
  year: number | null,
  venue: string | null,
  publisher: string | null,
  doi: string | null,
  landingUrl: string | null,
  pdfUrl: string | null,
  extra: Record<string, string>
): NormalizedPaper | null {
  if (!title || !landingUrl) return null;
  return {
    source,
    sourceId,
    canonicalId: canonicalId(doi, source, sourceId, title, authors, year),
    title,
    abstract,
    authors,
    publicationYear: year,
    venue,
    publisher,
    doi,
    landingUrl,
    pdfUrl,
    provenance: {
      source,
      sourceId,
      retrievedAt: new Date().toISOString(),
      ...extra
    }
  };
}

async function searchOpenAlex(
  query: string,
  limit: number,
  yearFrom: number | null | undefined,
  yearTo: number | null | undefined
) {
  const params = new URLSearchParams({
    search: query,
    per_page: String(limit),
    select: "id,doi,title,authorships,publication_year,publication_date,primary_location,abstract_inverted_index,best_oa_location,open_access"
  });
  if (yearFrom || yearTo) {
    const start = yearFrom ?? 1800;
    const end = yearTo ?? new Date().getUTCFullYear();
    params.set("filter", "from_publication_date:" + start + "-01-01,to_publication_date:" + end + "-12-31");
  }
  const apiKey = process.env.OPENALEX_API_KEY?.trim();
  if (apiKey) params.set("api_key", apiKey);
  const mailto = process.env.OPENALEX_MAILTO?.trim();
  if (mailto) params.set("mailto", mailto);

  const payload = record(await requestJson("openalex", "https://api.openalex.org/works?" + params.toString()));
  const results = Array.isArray(payload.results) ? payload.results : [];

  return results.flatMap((item): NormalizedPaper[] => {
    const work = record(item);
    const sourceId = stringValue(work.id) ?? "";
    const ids = record(work.ids);
    const doi = normalizeDoi(stringValue(work.doi) ?? stringValue(ids.doi));
    const location = record(work.primary_location);
    const bestLocation = record(work.best_oa_location);
    const source = record(location.source);
    const authorships = Array.isArray(work.authorships) ? work.authorships : [];
    const authors = authorships.flatMap((author): PaperAuthor[] => {
      const authorRecord = record(record(author).author);
      const name = stringValue(authorRecord.display_name);
      return name ? [{ name, orcid: stringValue(authorRecord.orcid) }] : [];
    });
    const paper = safePaper(
      "openalex",
      sourceId,
      stringValue(work.title),
      reconstructOpenAlexAbstract(work.abstract_inverted_index),
      authors,
      numberValue(work.publication_year),
      stringValue(source.display_name),
      stringValue(source.publisher),
      doi,
      httpsUrl(work.id) ?? (doi ? "https://doi.org/" + doi : null),
      httpsUrl(bestLocation.pdf_url) ?? httpsUrl(record(bestLocation).landing_page_url),
      { openAlexId: sourceId }
    );
    return paper ? [paper] : [];
  });
}

async function searchSemanticScholar(query: string, limit: number) {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    fields: "paperId,title,abstract,authors,year,venue,externalIds,url,openAccessPdf"
  });
  const headers: HeadersInit = {};
  const key = process.env.SEMANTIC_SCHOLAR_API_KEY?.trim();
  if (key) headers["x-api-key"] = key;

  const payload = record(
    await requestJson(
      "semantic_scholar",
      "https://api.semanticscholar.org/graph/v1/paper/search?" + params.toString(),
      headers
    )
  );
  const results = Array.isArray(payload.data) ? payload.data : [];

  return results.flatMap((item): NormalizedPaper[] => {
    const paper = record(item);
    const sourceId = stringValue(paper.paperId) ?? "";
    const externalIds = record(paper.externalIds);
    const doi = normalizeDoi(stringValue(externalIds.DOI));
    const authors = Array.isArray(paper.authors)
      ? paper.authors.flatMap((author): PaperAuthor[] => {
          const name = stringValue(record(author).name);
          return name ? [{ name }] : [];
        })
      : [];
    const openAccessPdf = record(paper.openAccessPdf);
    const result = safePaper(
      "semantic_scholar",
      sourceId,
      stringValue(paper.title),
      stringValue(paper.abstract),
      authors,
      numberValue(paper.year),
      stringValue(paper.venue),
      null,
      doi,
      httpsUrl(paper.url) ?? (doi ? "https://doi.org/" + doi : null),
      httpsUrl(openAccessPdf.url),
      { semanticScholarId: sourceId }
    );
    return result ? [result] : [];
  });
}

function stripMarkup(value: string | null) {
  return value?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
}

async function searchCrossref(query: string, limit: number) {
  const params = new URLSearchParams({
    "query.bibliographic": query,
    rows: String(limit),
    select: "DOI,title,author,published,published-print,published-online,container-title,publisher,URL,link,abstract,type"
  });
  const mailto = process.env.CROSSREF_MAILTO?.trim() || process.env.OPENALEX_MAILTO?.trim();
  if (mailto) params.set("mailto", mailto);

  const userAgent = "AsistenRisetAI/0.1" + (mailto ? " (mailto:" + mailto + ")" : "");
  const payload = record(
    await requestJson(
      "crossref",
      "https://api.crossref.org/works?" + params.toString(),
      { "User-Agent": userAgent }
    )
  );
  const message = record(payload.message);
  const results = Array.isArray(message.items) ? message.items : [];

  return results.flatMap((item): NormalizedPaper[] => {
    const work = record(item);
    const doi = normalizeDoi(stringValue(work.DOI));
    const sourceId = doi ?? stringValue(work.URL) ?? "";
    const titles = Array.isArray(work.title) ? work.title : [];
    const title = stringValue(titles[0]);
    const authors = Array.isArray(work.author)
      ? work.author.flatMap((author): PaperAuthor[] => {
          const authorRecord = record(author);
          const given = stringValue(authorRecord.given) ?? "";
          const family = stringValue(authorRecord.family) ?? "";
          const name = (given + " " + family).trim();
          return name ? [{ name, orcid: stringValue(authorRecord.ORCID) }] : [];
        })
      : [];
    const published = record(work.published);
    const dateParts = Array.isArray(published["date-parts"]) ? published["date-parts"][0] : null;
    const year = Array.isArray(dateParts) ? numberValue(dateParts[0]) : null;
    const links = Array.isArray(work.link) ? work.link : [];
    const pdfLink = links
      .map((link) => record(link))
      .find((link) => stringValue(link.contentType) === "application/pdf");
    const result = safePaper(
      "crossref",
      sourceId,
      title,
      stripMarkup(stringValue(work.abstract)),
      authors,
      year,
      stringValue(Array.isArray(work["container-title"]) ? work["container-title"][0] : null),
      stringValue(work.publisher),
      doi,
      doi ? "https://doi.org/" + doi : httpsUrl(work.URL),
      httpsUrl(pdfLink?.URL),
      { crossrefDoi: doi ?? "" }
    );
    return result ? [result] : [];
  });
}

function providerMessage(error: unknown) {
  if (!(error instanceof ProviderRequestError)) return "Sumber tidak dapat dihubungi.";
  if (error.status === 429) return "Sumber sedang membatasi permintaan.";
  if (error.status === 401 || error.status === 403) return "Akses ke sumber ditolak.";
  if (error.status === 404) return "Endpoint sumber tidak ditemukan.";
  if (error.message === "Provider timeout") return "Sumber tidak menjawab dalam batas waktu.";
  return "Sumber sedang tidak tersedia.";
}

export async function searchPapers(input: {
  query: string;
  sources: PaperSource[];
  limit: number;
  yearFrom?: number | null;
  yearTo?: number | null;
}): Promise<PaperSearchResult> {
  const jobs = input.sources.map(async (source) => {
    try {
      const papers =
        source === "openalex"
          ? await searchOpenAlex(input.query, input.limit, input.yearFrom, input.yearTo)
          : source === "semantic_scholar"
            ? await searchSemanticScholar(input.query, input.limit)
            : await searchCrossref(input.query, input.limit);
      return { source, papers, status: { state: "ok" as const, count: papers.length } };
    } catch (error) {
      return {
        source,
        papers: [],
        status: { state: "failed" as const, count: 0, message: providerMessage(error) }
      };
    }
  });

  const results = await Promise.all(jobs);
  const byCanonical = new Map<string, NormalizedPaper>();
  for (const result of results) {
    for (const paper of result.papers) {
      if (!byCanonical.has(paper.canonicalId)) byCanonical.set(paper.canonicalId, paper);
    }
  }

  const statuses = {} as Record<PaperSource, ProviderStatus>;
  for (const result of results) statuses[result.source] = result.status;

  const failed = results.filter((result) => result.status.state === "failed").length;
  return {
    papers: Array.from(byCanonical.values()),
    statuses,
    scholarUrl: buildGoogleScholarUrl(input.query),
    partial: failed > 0 && failed < results.length
  };
}

export function buildGoogleScholarUrl(query: string) {
  return "https://scholar.google.com/scholar?q=" + encodeURIComponent(query.trim());
}
