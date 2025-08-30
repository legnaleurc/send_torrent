import { loadOptions } from "./storage.mjs";
import { sendToTransmission } from "./clients/transmission.mjs";
import { sendToQBittorrent } from "./clients/qbittorrent.mjs";

/**
 * Send a torrent to the enabled torrent clients.
 * @param {string} torrentUrl - The URI of the torrent to send.
 */
export async function sendTorrent(torrentUrl) {
  const options = await loadOptions();

  // Download torrent once if upload-file is enabled
  const torrentData = await prepareTorrentData(
    torrentUrl,
    options["upload-file"],
  );

  const enabledClients = [];

  // Prepare Transmission client if enabled
  if (options.clients.transmission.enabled) {
    const transmissionOptions = {
      url: options.clients.transmission.url,
      username: options.clients.transmission.username,
      password: options.clients.transmission.password,
      addPaused: options["add-paused"],
      torrentUrl,
      torrentData, // Pass ArrayBuffer data if available
    };
    enabledClients.push({
      name: "Transmission",
      promise: sendToTransmission(transmissionOptions),
    });
  }

  // Prepare qBittorrent client if enabled
  if (options.clients.qbittorrent.enabled) {
    const qbittorrentOptions = {
      url: options.clients.qbittorrent.url,
      username: options.clients.qbittorrent.username,
      password: options.clients.qbittorrent.password,
      addPaused: options["add-paused"],
      torrentUrl,
      torrentData, // Pass ArrayBuffer data if available
    };
    enabledClients.push({
      name: "qBittorrent",
      promise: sendToQBittorrent(qbittorrentOptions),
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

/**
 * Maybe prepare the torrent data for sending.
 * @param {string} torrentUrl - The URL of the torrent file.
 * @param {boolean} uploadFile - Whether to upload the torrent file.
 * @returns {Promise<ArrayBuffer|null>} The raw torrent data or null if not needed.
 */
async function prepareTorrentData(torrentUrl, uploadFile) {
  if (!uploadFile) {
    return null;
  }
  // Only download for http(s) URLs, skip magnet links.
  const url = new URL(torrentUrl);
  const isHttp = url.protocol === "https:" || url.protocol === "http:";
  if (!isHttp) {
    return null;
  }
  return await downloadTorrent(torrentUrl);
}

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
