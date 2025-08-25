/**
 * A class to manage the prompt messages in the browser.
 */
class PromptClient {
  constructor() {
    this._anchor = null;
    this._block = null;
  }

  /**
   * Set the message for the prompt.
   * @param {string} message - The message to display.
   */
  async setMessage(message) {
    this._maybeInitialize();
    this._block.textContent = message;
    this._update();
  }

  /**
   * Close the prompt.
   */
  close() {
    return new Promise((resolve) => {
      this._block.addEventListener("transitionend", () => {
        this._block.parentElement.removeChild(this._block);
        this._block = null;
        this._anchor = null;
        resolve();
      });
      this._block.classList.add("fade");
    });
  }

  /**
   * Initialize the prompt.
   */
  _maybeInitialize() {
    if (!this._anchor) {
      this._anchor = document.activeElement;
    }
    if (!this._block) {
      this._block = this._create();
      document.body.appendChild(this._block);
    }
  }

  /**
   * Create the prompt element.
   * @returns {HTMLElement} The prompt element.
   */
  _create() {
    const block = document.createElement("div");
    block.classList.add("send-torrent", "bubble");
    return block;
  }

  /**
   * Update the position of the prompt.
   */
  _update() {
    const position = getTargetPosition(this._anchor, this._block);
    moveElementCenterTo(this._block, position);
  }
}

/**
 * Get the target position for the prompt.
 * @param {HTMLElement} origin - The element to position the prompt relative to.
 * @param {HTMLElement} block - The prompt element.
 * @returns {Object} The target position.
 */
function getTargetPosition(origin, block) {
  origin = toCenterFromTopLeft(origin.getBoundingClientRect());
  block = toCenterFromTopLeft(block.getBoundingClientRect());
  // TODO top only for now
  return {
    x: origin.x,
    y: origin.y - origin.height / 2 - block.height / 2,
    width: block.width,
    height: block.height,
  };
}

/**
 * Convert a rectangle from top-left coordinates to center coordinates.
 * @param {DOMRect} rect - The rectangle to convert.
 * @returns {Object} The converted rectangle.
 */
function toCenterFromTopLeft(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Convert a rectangle from center coordinates to top-left coordinates.
 * @param {Object} rect - The rectangle to convert.
 * @returns {Object} The converted rectangle.
 */
function toTopLeftFromCenter(rect) {
  return {
    left: rect.x - rect.width / 2,
    top: rect.y - rect.height / 2,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Move an element to the center of a position.
 * @param {HTMLElement} element - The element to move.
 * @param {Object} position - The target position.
 */
function moveElementCenterTo(element, position) {
  position = toTopLeftFromCenter(position);
  element.style.top = position.top + "px";
  element.style.left = position.left + "px";
}

const prompt = new PromptClient();

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.topic) {
    case "show-prompt":
      return prompt.setMessage(message.args.message);
    case "close-prompt":
      return prompt.close();
    default:
      break;
  }
});
