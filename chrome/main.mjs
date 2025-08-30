import { PromptServer } from "./prompt.mjs";
import { sendTorrent } from "./send.mjs";

const kMenuId = "send-torrent";

browser.menus.create({
  id: kMenuId,
  title: "Send Torrent",
  contexts: ["link"],
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === kMenuId) {
    main(info.linkUrl, tab.id);
  }
});

/**
 * Main function to handle the sending of a torrent.
 * @param {string} linkUrl Torrent url
 * @param {number} tabId Tab id
 */
async function main(linkUrl, tabId) {
  const prompt = new PromptServer(tabId);
  await prompt.setMessage("Sending ...");
  let msg = "Done";
  try {
    await sendTorrent(linkUrl);
  } catch (e) {
    console.error("Send Torrent", e);
    msg = e.toString();
  }
  await prompt.setMessage(msg);
  await prompt.close();
}
