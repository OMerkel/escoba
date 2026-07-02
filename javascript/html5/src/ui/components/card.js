/**
 * Card Component
 * Renders individual playing cards with SVG graphics and interaction
 */

export class CardComponent {
  constructor(card, deckName = "baraja_espanola") {
    this.card = card;
    this.deckName = deckName;
    this.element = null;
    this.isSelected = false;
  }

  /**
   * Get SVG path for card
   * @returns {string} Path to card SVG
   */
  getCardImagePath() {
    return `img/deck/${this.deckName}/${this.card.suit}_${this.card.rank}.svg`;
  }

  /**
   * Get card display name
   * @returns {string}
   */
  getCardName() {
    const rankNames = {
      as: "Ace",
      sota: "Jack",
      caballo: "Knight",
      rey: "King",
    };
    const rankName = rankNames[this.card.rank] || this.card.rank;
    const suitNames = {
      oros: "Coins",
      copas: "Cups",
      espadas: "Swords",
      bastos: "Clubs",
    };
    const suitName = suitNames[this.card.suit];
    return `${rankName} of ${suitName}`;
  }

  /**
   * Create card element
   * @param {Object} options - Rendering options
   * @returns {HTMLElement}
   */
  createElement(options = {}) {
    const { clickable = true, onSelect = null } = options;

    const div = document.createElement("div");
    div.className = "card-element";
    div.dataset.suit = this.card.suit;
    div.dataset.rank = this.card.rank;
    div.title = this.getCardName();

    const img = document.createElement("img");
    img.src = this.getCardImagePath();
    img.alt = this.getCardName();
    img.className = "card-image";
    img.loading = "lazy";

    if (clickable) {
      div.classList.add("card-clickable");
      div.setAttribute("role", "button");
      div.setAttribute("tabindex", "0");
      div.setAttribute("aria-label", this.getCardName());

      const handleSelect = () => {
        this.toggleSelect(); // Update visual state immediately
        if (onSelect) onSelect(this); // Then notify GameBoard
      };

      div.addEventListener("click", handleSelect);
      div.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      });
    }

    div.appendChild(img);
    this.element = div;
    return div;
  }

  /**
   * Toggle selection state
   */
  toggleSelect() {
    this.isSelected = !this.isSelected;
    if (this.element) {
      this.element.classList.toggle("card-selected", this.isSelected);
    }
  }

  /**
   * Set selection state
   */
  setSelected(selected) {
    this.isSelected = selected;
    if (this.element) {
      this.element.classList.toggle("card-selected", selected);
    }
  }

  /**
   * Get card data for identification
   */
  getCardData() {
    return {
      suit: this.card.suit,
      rank: this.card.rank,
      value: this.card.value,
    };
  }
}

/**
 * Create multiple card elements
 */
export function createCardElements(
  cards,
  deckName = "baraja_espanola",
  options = {},
) {
  return cards.map((card) => {
    const cardComponent = new CardComponent(card, deckName);
    return cardComponent.createElement(options);
  });
}
