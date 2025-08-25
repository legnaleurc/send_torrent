import { loadOptions } from "./storage.mjs";
import { sendToTransmission } from "./transmission.mjs";
import { sendToQBittorrent } from "./qbittorrent.mjs";

/**
 * Send a torrent to the transmission server.
 * @param {string} torrentUri - The URI of the torrent to send.
 */
export async function sendTorrent(torrentUri) {
  const options = await loadOptions();
  if (!options) {
    throw new Error("cannot load options");
  }
  switch (options.client) {
    case "transmission":
      return await sendToTransmission(torrentUri, options);
    case "qbittorrent":
      return await sendToQBittorrent(torrentUri, options);
    default:
      throw new Error("unsupported client");
  }
}
