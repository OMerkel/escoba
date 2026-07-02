/**
 * Test suite for Sota card inclusion
 * Verifies that Sota cards are properly created, shuffled, and rendered
 */

import { describe, expect, it } from "vitest";
import { DealingEngine } from "../core/dealing.js";
import { Deck } from "../core/deck.js";
import { CardComponent } from "../ui/components/card.js";

describe("Sota Cards - Inclusion & Rendering", () => {
  it("should have exactly 4 Sota cards in deck", () => {
    const deck = new Deck();
    const sotas = deck.cards.filter((c) => c.rank === "sota");
    expect(sotas).toHaveLength(4);

    // Verify each suit has one Sota
    const suits = new Set(sotas.map((s) => s.suit));
    expect(suits).toEqual(new Set(["oros", "copas", "espadas", "bastos"]));
  });

  it("should have Sota cards with value 8", () => {
    const deck = new Deck();
    const sotas = deck.cards.filter((c) => c.rank === "sota");
    sotas.forEach((sota) => {
      expect(sota.value).toBe(8);
    });
  });

  it("should generate correct image path for Sota cards", () => {
    const orosSota = { suit: "oros", rank: "sota", value: 8 };
    const cardComponent = new CardComponent(orosSota, "baraja_espanola");
    const imagePath = cardComponent.getCardImagePath();
    expect(imagePath).toBe("img/deck/baraja_espanola/oros_sota.svg");
  });

  it("should shuffle and preserve all Sota cards", () => {
    const deck = new Deck();
    const shuffled = deck.shuffle();
    const sotas = shuffled.cards.filter((c) => c.rank === "sota");
    expect(sotas).toHaveLength(4);
  });

  it("should deal Sota cards in initial deal", () => {
    // Multiple games to increase probability of dealing Sota
    let foundSotaDealt = false;

    for (let i = 0; i < 50 && !foundSotaDealt; i++) {
      const deck = new Deck().shuffle();
      const dealResult = DealingEngine.initialDeal(deck);

      const allDealtCards = [
        ...dealResult.p1Hand,
        ...dealResult.p2Hand,
        ...dealResult.tableCards,
      ];

      if (allDealtCards.some((c) => c.rank === "sota")) {
        foundSotaDealt = true;
      }
    }

    expect(foundSotaDealt).toBe(true);
  });

  it("should display Sota in card name", () => {
    const sota = { suit: "copas", rank: "sota", value: 8 };
    const cardComponent = new CardComponent(sota);
    expect(cardComponent.getCardName()).toBe("Jack of Cups");
  });
});
