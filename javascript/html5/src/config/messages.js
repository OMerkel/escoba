/**
 * UI message templates for game flow and status text.
 * Centralizing messages avoids duplicated inline literals.
 */

export const GAME_MESSAGES = {
  EMPTY_HAND: "No cards in hand",
  INVALID_MOVE_GENERIC: "Invalid move. Please try again.",
  SELECT_ONE_HAND_CARD: "Please select only ONE card from your hand!",
  CARD_NOT_FOUND: "Card not found in hand or table!",
  SELECT_HAND_CARD: "Please select a card from your hand!",
  SYSTEM_ERROR_TRY_AGAIN: "An error occurred. Please try again.",

  ESCOBA_TOAST: "🧹 ¡Escoba! +1 point 🧹",

  ROUND_COMPLETE_TOAST: "Round complete! Starting new round...",
  ROUND_COMPLETE_STATUS: "Round complete. Dealing next round...",

  INITIAL_TABLE_SPECIAL_STATUS: (sum, dealerLabel, escobas) =>
    `Initial table totaled ${sum}. ${dealerLabel} captures the opening table and scores ${escobas} escoba${escobas === 1 ? "" : "s"}.`,

  INITIAL_TABLE_SPECIAL_PREVIEW: (sum, dealerLabel, escobas) =>
    `Opening mandatory capture: table totaled ${sum}. ${dealerLabel} captures all opening cards (+${escobas} escoba${escobas === 1 ? "" : "s"}).`,

  INVALID_CAPTURE_SUM: (handValue, tableSum, total) =>
    `Invalid capture! ${handValue} + ${tableSum} = ${total}, must equal 15.`,

  INVALID_MOVE_ERROR: (error) => `Invalid move: ${error}`,
  AI_MOVE_INVALID: (error) => `AI move invalid: ${error}`,

  PREVIEW_DISCARD: (handCard) =>
    `Preview discard: play ${handCard.rank} of ${handCard.suit} to table.`,
  PREVIEW_CAPTURE: (terms, total) => `Preview capture: ${terms} = ${total}.`,
  PREVIEW_ESCOBA: (terms, total) =>
    `Preview Escoba: ${terms} = ${total}. 🧹¡Escoba will sweep the table (+1)!🧹`,

  RESOLUTION_DISCARD: (handCard) =>
    `Discarded ${handCard.rank} of ${handCard.suit} to the table.`,
  RESOLUTION_CAPTURE: (count, terms, total) =>
    `Captured ${count} card(s): ${terms} = ${total}.`,
  RESOLUTION_ESCOBA_SUFFIX: " 🧹¡Escoba scored (+1)!🧹",
};
