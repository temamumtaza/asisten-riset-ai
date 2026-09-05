import { describe, expect, it } from "vitest";
import { paperSearchSchema, projectCreateSchema } from "@/lib/validators";

describe("request validation", () => {
  it("trims and accepts a valid project", () => {
    const result = projectCreateSchema.safeParse({
      title: "  Kebiasaan membaca  ",
      researchField: "Pendidikan",
      researchQuestion: "Bagaimana kebiasaan membaca digital berubah?"
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Kebiasaan membaca");
  });

  it("rejects an invalid year range", () => {
    const result = paperSearchSchema.safeParse({
      query: "higher education",
      sources: ["openalex"],
      limit: 10,
      yearFrom: 2025,
      yearTo: 2020
    });
    expect(result.success).toBe(false);
  });

  it("limits provider selection to three known sources", () => {
    const result = paperSearchSchema.safeParse({
      query: "higher education",
      sources: ["openalex", "semantic_scholar", "crossref", "openalex"],
      limit: 10
    });
    expect(result.success).toBe(false);
  });
});

