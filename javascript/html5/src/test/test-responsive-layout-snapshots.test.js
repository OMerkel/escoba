import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function extractMatch(css, regex, label) {
  const match = css.match(regex);
  expect(match, `Missing CSS token: ${label}`).not.toBeNull();
  return match[1].trim();
}

describe("Responsive Layout Snapshots", () => {
  const css = readFileSync("src/css/game.css", "utf8");

  it("should keep strict 5:8 card ratio token", () => {
    const cardAspectRatio = extractMatch(
      css,
      /--card-aspect-ratio:\s*([^;]+);/,
      "--card-aspect-ratio",
    );
    const cardHeightFormula = extractMatch(
      css,
      /--card-height:\s*([^;]+);/,
      "--card-height",
    );

    expect({ cardAspectRatio, cardHeightFormula }).toMatchInlineSnapshot(`
      {
        "cardAspectRatio": "5 / 8",
        "cardHeightFormula": "calc(var(--card-width) * 8 / 5)",
      }
    `);
  });

  it("should keep small landscape layout tokens stable", () => {
    const landscapeCardWidth = extractMatch(
      css,
      /@media\s*\(max-height:\s*520px\)\s*and\s*\(orientation:\s*landscape\)\s*\{[\s\S]*?:root\s*\{[\s\S]*?--card-width:\s*([^;]+);/,
      "landscape --card-width",
    );
    const landscapePlayAreaMinHeight = extractMatch(
      css,
      /@media\s*\(max-height:\s*520px\)\s*and\s*\(orientation:\s*landscape\)\s*\{[\s\S]*?\.play-area\s*\{[\s\S]*?min-height:\s*([^;]+);/,
      "landscape .play-area min-height",
    );

    expect({
      landscapeCardWidth,
      landscapePlayAreaMinHeight,
    }).toMatchInlineSnapshot(`
      {
        "landscapeCardWidth": "54px",
        "landscapePlayAreaMinHeight": "clamp(92px, 26vh, 116px)",
      }
    `);
  });

  it("should keep tablet portrait layout tokens stable", () => {
    const tabletCardWidth = extractMatch(
      css,
      /@media\s*\(min-width:\s*700px\)\s*and\s*\(max-width:\s*1024px\)\s*and\s*\(orientation:\s*portrait\)\s*\{[\s\S]*?:root\s*\{[\s\S]*?--card-width:\s*([^;]+);/,
      "tablet portrait --card-width",
    );
    const tabletPlayAreaMinHeight = extractMatch(
      css,
      /@media\s*\(min-width:\s*700px\)\s*and\s*\(max-width:\s*1024px\)\s*and\s*\(orientation:\s*portrait\)\s*\{[\s\S]*?\.play-area\s*\{[\s\S]*?min-height:\s*([^;]+);/,
      "tablet portrait .play-area min-height",
    );

    expect({ tabletCardWidth, tabletPlayAreaMinHeight }).toMatchInlineSnapshot(`
      {
        "tabletCardWidth": "72px",
        "tabletPlayAreaMinHeight": "clamp(138px, 20vh, 164px)",
      }
    `);
  });
});
