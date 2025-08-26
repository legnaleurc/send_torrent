/**
 * A class to manage the prompt messages in the browser.
 */
export class PromptServer {
  /**
   * @param {number} tabId
   */
  constructor(tabId) {
    this._tabId = tabId;
  }

  /**
   * Set the message for the prompt.
   * @param {string} message - The message to display.
   */
  async setMessage(message) {
    await browser.tabs.sendMessage(this._tabId, {
      topic: "show-prompt",
      args: {
        message,
      },
    });
  }

  /**
   * Close the prompt.
   */
  async close() {
    await browser.tabs.sendMessage(this._tabId, {
      topic: "close-prompt",
    });
  }
}
