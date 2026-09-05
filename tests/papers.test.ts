import { describe, expect, it } from "vitest";
import { buildGoogleScholarUrl, normalizeDoi, reconstructOpenAlexAbstract } from "@/lib/papers";

describe("paper normalization", () => {
  it("normalizes DOI variants to the same identifier", () => {
    expect(normalizeDoi(" DOI:10.1234/Example.01. ")).toBe("10.1234/example.01");
    expect(normalizeDoi("https://doi.org/10.1234/example.01")).toBe("10.1234/example.01");
    expect(normalizeDoi("http://dx.doi.org/10.1234/example.01")).toBe("10.1234/example.01");
  });

  it("rebuilds OpenAlex inverted abstracts in word order", () => {
    expect(
      reconstructOpenAlexAbstract({
        "evidence": [2],
        "A": [0],
        "question": [1]
      })
    ).toBe("A question evidence");
  });

  it("creates a real external Scholar URL without making a provider request", () => {
    expect(buildGoogleScholarUrl("digital reading")).toBe(
      "https://scholar.google.com/scholar?q=digital%20reading"
    );
  });
});

