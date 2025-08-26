import { loadOptions } from "./storage.mjs";
import { sendToTransmission } from "./transmission.mjs";
import { sendToQBittorrent } from "./qbittorrent.mjs";

/**
 * Download a torrent file and return the raw ArrayBuffer.
 * @param {string} torrentUrl - The URL of the torrent file.
 * @returns {Promise<ArrayBuffer>} The raw torrent data.
 */
async function downloadTorrent(torrentUrl) {
  const response = await fetch(torrentUrl);
  if (!response.ok) {
    throw new Error(`Failed to download torrent: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

/**
 * Send a torrent to the enabled torrent clients.
 * @param {string} torrentUri - The URI of the torrent to send.
 */
export async function sendTorrent(torrentUri) {
  const options = await loadOptions();
  if (!options) {
    throw new Error("cannot load options");
  }

  // Download torrent once if upload-file is enabled
  let torrentData = null;
  if (options["upload-file"]) {
    try {
      torrentData = await downloadTorrent(torrentUri);
    } catch (error) {
      throw new Error(
        `upload-file is enabled but failed to download torrent: ${error.message}`,
      );
    }
  }

  const enabledClients = [];

  // Prepare Transmission client if enabled
  if (options.clients.transmission.enabled) {
    const transmissionOptions = {
      url: options.clients.transmission.url,
      username: options.clients.transmission.username,
      password: options.clients.transmission.password,
      "add-paused": options["add-paused"],
      "upload-file": options["upload-file"],
      torrentData: torrentData, // Pass ArrayBuffer data if available
    };
    enabledClients.push({
      name: "Transmission",
      promise: sendToTransmission(torrentUri, transmissionOptions),
    });
  }

  // Prepare qBittorrent client if enabled
  if (options.clients.qbittorrent.enabled) {
    const qbittorrentOptions = {
      url: options.clients.qbittorrent.url,
      username: options.clients.qbittorrent.username,
      password: options.clients.qbittorrent.password,
      "add-paused": options["add-paused"],
      "upload-file": options["upload-file"],
      torrentData: torrentData, // Pass ArrayBuffer data if available
    };
    enabledClients.push({
      name: "qBittorrent",
      promise: sendToQBittorrent(torrentUri, qbittorrentOptions),
    });
  }

  // If no clients are enabled
  if (enabledClients.length === 0) {
    throw new Error("no torrent clients are enabled");
  }

  // Send to all enabled clients simultaneously
  try {
    const results = await Promise.all(
      enabledClients.map((client) =>
        client.promise
          .then((result) => ({ name: client.name, success: true, result }))
          .catch((error) => ({
            name: client.name,
            success: false,
            error: error.message,
          })),
      ),
    );

    // Check if any client succeeded
    const successfulResults = results.filter((r) => r.success);
    if (successfulResults.length > 0) {
      // Return the first successful result
      const firstSuccess = successfulResults[0];
      if (firstSuccess.success && "result" in firstSuccess) {
        return firstSuccess.result;
      }
    }

    // All clients failed
    const failedClients = results.filter((r) => !r.success);
    const errorMessages = failedClients.map((r) => {
      if (!r.success && "error" in r) {
        return `${r.name}: ${r.error}`;
      }
      return `${r.name}: unknown error`;
    });
    throw new Error(`all enabled clients failed: ${errorMessages.join(", ")}`);
  } catch (error) {
    // Handle any unexpected errors
    throw new Error(`failed to send torrent: ${error.message}`);
  }
}
