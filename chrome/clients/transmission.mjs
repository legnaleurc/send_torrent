/** @typedef {import("./transmission").TransmissionOptions} TransmissionOptions */

const kCsrfTokenKey = "X-Transmission-Session-Id";
/**
 * @type {string | null}
 */
let gCurrentCsrfToken = null;

/**
 * Send a torrent to the Transmission server.
 * @param {TransmissionOptions} options - The options to use for the request
 * @returns {Promise<Object>} response from the Transmission server
 */
export async function sendToTransmission(options) {
  const { torrentUrl, torrentData, username, password, addPaused, url } =
    options;

  const torrentArg = await getTorrentArg(torrentUrl, torrentData);

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (username && password) {
    const authToken = btoa(`${username}:${password}`);
    headers.append("Authorization", `Basic ${authToken}`);
  }
  if (gCurrentCsrfToken) {
    headers.append(kCsrfTokenKey, gCurrentCsrfToken);
  }

  const args = {
    method: "torrent-add",
    arguments: {
      ...torrentArg,
      paused: addPaused,
    },
  };

  const request = new Request(url, {
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
      return sendToTransmission(options);
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
 * @param {string} torrentURL - The URL of the torrent file.
 * @param {ArrayBuffer} torrentData - Pre-downloaded torrent data.
 * @returns {Promise<Object>} The arguments for the torrent.
 */
async function getTorrentArg(torrentURL, torrentData) {
  if (!torrentData) {
    return {
      filename: torrentURL,
    };
  }
  // Encode ArrayBuffer to base64 for Transmission
  const uint8Array = new Uint8Array(torrentData);
  const string = String.fromCharCode(...uint8Array);
  const base64 = btoa(string);
  return {
    metainfo: base64,
  };
}
