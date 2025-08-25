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

browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.tabId !== -1) {
      // skip real page requests
      return {};
    }

    let headers = details.requestHeaders;
    const marked = headers.find(
      (h) => h.name.toLowerCase() === "x-send-torrent-origin",
    );
    if (!marked) {
      // skip if not ours
      return {};
    }
    const overwriteOrigin = marked.value;

    // Remove marker
    headers = headers.filter(
      (h) => h.name.toLowerCase() !== "x-send-torrent-origin",
    );

    // Overwrite Origin
    const origin = headers.find((h) => h.name.toLowerCase() === "origin");
    if (origin) {
      origin.value = overwriteOrigin;
    } else {
      headers.push({ name: "Origin", value: overwriteOrigin });
    }

    return { requestHeaders: headers };
  },
  {
    urls: ["<all_urls>"],
    types: ["xmlhttprequest"],
  },
  ["blocking", "requestHeaders"],
);

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
