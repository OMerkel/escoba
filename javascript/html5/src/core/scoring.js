/**
 * ScoringEngine calculates scores from captured cards.
 * Handles: all 5 scoring categories (Cards, Oros, 7 Oros, Setenta, Escobas)
 * Requirement: FR-8 (Scoring rules)
 */
export const ScoringEngine = {
  /**
   * Score cards category (majority)
   * @param {number} cardsPlayer1
   * @param {number} cardsPlayer2
   * @returns {Object} {p1: 0|1, p2: 0|1}
   */
  scoreCards(cardsPlayer1, cardsPlayer2) {
    if (cardsPlayer1 > cardsPlayer2) return { p1: 1, p2: 0 };
    if (cardsPlayer2 > cardsPlayer1) return { p1: 0, p2: 1 };
    return { p1: 0, p2: 0 };
  },

  /**
   * Score oros category (majority)
   * @param {number} orosPlayer1
   * @param {number} orosPlayer2
   * @returns {Object} {p1: 0|1, p2: 0|1}
   */
  scoreOros(orosPlayer1, orosPlayer2) {
    if (orosPlayer1 > orosPlayer2) return { p1: 1, p2: 0 };
    if (orosPlayer2 > orosPlayer1) return { p1: 0, p2: 1 };
    return { p1: 0, p2: 0 };
  },

  /**
   * Score 7 of Oros (single card)
   * @param {boolean} player1Has
   * @param {boolean} player2Has
   * @returns {Object} {p1: 0|1, p2: 0|1}
   */
  score7Oros(player1Has, player2Has) {
    if (player1Has) return { p1: 1, p2: 0 };
    if (player2Has) return { p1: 0, p2: 1 };
    return { p1: 0, p2: 0 };
  },

  /**
   * Score setenta/prime (method-dependent)
   * @param {string} method "prime" | "simplified" | "numerical"
   * @param {Array} cardsPlayer1
   * @param {Array} cardsPlayer2
   * @returns {Object} {p1: 0|1|2, p2: 0|1|2}
   */
  scoreSetenta(method, cardsPlayer1, cardsPlayer2) {
    const p1Cards = cardsPlayer1 || [];
    const p2Cards = cardsPlayer2 || [];

    if (method === "simplified") {
      const p1Sevens = p1Cards.filter((c) => c.rank === "7").length;
      const p2Sevens = p2Cards.filter((c) => c.rank === "7").length;
      if (p1Sevens > p2Sevens) return { p1: 1, p2: 0 };
      if (p2Sevens > p1Sevens) return { p1: 0, p2: 1 };
      return { p1: 0, p2: 0 };
    }

    if (method === "numerical") {
      const numericalWeight = {
        7: 21,
        6: 18,
        as: 16,
        5: 15,
        4: 14,
        3: 13,
        2: 12,
        sota: 10,
        caballo: 10,
        rey: 10,
      };

      const p1Score = scoreBestPerSuit(p1Cards, numericalWeight);
      const p2Score = scoreBestPerSuit(p2Cards, numericalWeight);

      if (p1Score > p2Score) return { p1: 1, p2: 0 };
      if (p2Score > p1Score) return { p1: 0, p2: 1 };
      return { p1: 0, p2: 0 };
    }

    // Default and recommended rules.md path: prime-style lexicographic comparison
    const primeRank = {
      7: 8,
      6: 7,
      as: 6,
      5: 5,
      4: 4,
      3: 3,
      2: 2,
      sota: 1,
      caballo: 1,
      rey: 1,
    };

    const p1Vector = primeVectorByBestPerSuit(p1Cards, primeRank);
    const p2Vector = primeVectorByBestPerSuit(p2Cards, primeRank);

    for (let i = 0; i < p1Vector.length; i++) {
      if (p1Vector[i] > p2Vector[i]) return { p1: 1, p2: 0 };
      if (p2Vector[i] > p1Vector[i]) return { p1: 0, p2: 1 };
    }

    return { p1: 0, p2: 0 };
  },

  /**
   * Score escobas (sweep count)
   * @param {number} escobasPlayer1
   * @param {number} escobasPlayer2
   * @returns {Object} {p1: escobasPlayer1, p2: escobasPlayer2}
   */
  scoreEscobas(escobasPlayer1, escobasPlayer2) {
    return { p1: escobasPlayer1, p2: escobasPlayer2 };
  },
};

function scoreBestPerSuit(cards, weightByRank) {
  const suits = ["oros", "copas", "espadas", "bastos"];
  let total = 0;

  for (const suit of suits) {
    let best = 0;
    for (const card of cards) {
      if (card.suit !== suit) continue;
      const value = weightByRank[card.rank] || 0;
      if (value > best) best = value;
    }
    total += best;
  }

  return total;
}

function primeVectorByBestPerSuit(cards, primeRank) {
  const suits = ["oros", "copas", "espadas", "bastos"];
  const bestPerSuit = [];

  for (const suit of suits) {
    let best = 0;
    for (const card of cards) {
      if (card.suit !== suit) continue;
      const value = primeRank[card.rank] || 0;
      if (value > best) best = value;
    }
    bestPerSuit.push(best);
  }

  return bestPerSuit.sort((a, b) => b - a);
}
