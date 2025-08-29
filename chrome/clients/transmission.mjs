/** @typedef {import("../storage").ClientOptions} ClientOptions */

const kCsrfTokenKey = "X-Transmission-Session-Id";
/**
 * @type {string | null}
 */
let gCurrentCsrfToken = null;

/**
 * Send a torrent to the Transmission server.
 * @param {String} torrentURL to the torrent file
 * @param {ClientOptions} options - The options to use for the request
 * @returns {Promise<Object>} response from the Transmission server
 */
export async function sendToTransmission(torrentURL, options) {
  const torrentArg = await getTorrentArg(
    options["upload-file"],
    torrentURL,
    options.torrentData,
  );

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (options.username && options.password) {
    const authToken = btoa(`${options.username}:${options.password}`);
    headers.append("Authorization", `Basic ${authToken}`);
  }
  if (gCurrentCsrfToken) {
    headers.append(kCsrfTokenKey, gCurrentCsrfToken);
  }

  const args = {
    method: "torrent-add",
    arguments: {
      ...torrentArg,
      paused: options["add-paused"],
    },
  };

  const request = new Request(options.url, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
    mode: "cors",
    credentials: "include",
  });

  let response = await fetch(request);
  if (response.status === 409) {
    if (response.headers.has(kCsrfTokenKey)) {
      gCurrentCsrfToken = response.headers.get(kCsrfTokenKey);
      return sendToTransmission(torrentURL, options);
    }
  }
  if (!response.ok) {
    throw new Error(`request error: ${response.status}`);
  }
  const result = await response.json();
  if (result.result !== "success") {
    throw new Error(`transmission error: ${result.result}`);
  }
  return result;
}

/**
 * Get the arguments for the torrent.
 * @param {boolean} uploadFile - Whether to upload the torrent file.
 * @param {string} torrentURL - The URL of the torrent file.
 * @param {ArrayBuffer} [torrentData] - Pre-downloaded torrent data.
 * @returns {Promise<Object>} The arguments for the torrent.
 */
async function getTorrentArg(uploadFile, torrentURL, torrentData) {
  const url = new URL(torrentURL);
  const isHttp = url.protocol === "https:" || url.protocol === "http:";
  // only supports http, no magnet or anything else
  if (uploadFile && isHttp) {
    if (torrentData) {
      // Encode ArrayBuffer to base64 for Transmission
      const uint8Array = new Uint8Array(torrentData);
      const string = String.fromCharCode(...uint8Array);
      const base64 = btoa(string);
      return {
        metainfo: base64,
      };
    } else {
      throw new Error("upload-file is enabled but no torrent data provided");
    }
  } else {
    return {
      filename: torrentURL,
    };
  }
}
