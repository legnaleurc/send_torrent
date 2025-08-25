import { loadOptions } from "./storage.mjs";

const kCsrfTokenKey = "X-Transmission-Session-Id";
/**
 * @type {string | null}
 */
let gCurrentCsrfToken = null;

/**
 * Send a torrent to the Transmission server.
 * @param {String} torrentURL to the torrent file
 * @returns {Promise<Object>} response from the Transmission server
 */
export async function sendToTransmission(torrentURL) {
  const opts = await loadOptions();

  const torrentArg = await getTorrentArg(opts["upload-file"], torrentURL);

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (opts.username && opts.password) {
    const authToken = btoa(`${opts.username}:${opts.password}`);
    headers.append("Authorization", `Basic ${authToken}`);
  }
  if (gCurrentCsrfToken) {
    headers.append(kCsrfTokenKey, gCurrentCsrfToken);
  }

  const args = {
    method: "torrent-add",
    arguments: {
      ...torrentArg,
      paused: opts["add-paused"],
    },
  };

  const request = new Request(opts.url, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
    mode: "cors",
    credentials: "include",
  });

  let rv = await fetch(request);
  if (rv.status === 409) {
    if (rv.headers.has(kCsrfTokenKey)) {
      gCurrentCsrfToken = rv.headers.get(kCsrfTokenKey);
      return sendToTransmission(torrentURL);
    }
  }
  if (!rv.ok) {
    throw new Error(`request error: ${rv.status}`);
  }
  rv = await rv.json();
  if (rv.result !== "success") {
    throw new Error(`transmission error: ${rv.result}`);
  }
  return rv;
}

/**
 * Get the arguments for the torrent.
 * @param {boolean} uploadFile - Whether to upload the torrent file.
 * @param {string} torrentURL - The URL of the torrent file.
 * @returns {Promise<Object>} The arguments for the torrent.
 */
async function getTorrentArg(uploadFile, torrentURL) {
  const url = new URL(torrentURL);
  const isHttp = url.protocol === "https:" || url.protocol === "http:";
  // only supports http, no magnet or anything else
  if (uploadFile && isHttp) {
    const content = await downloadTorrent(torrentURL);
    return {
      metainfo: content,
    };
  } else {
    return {
      filename: torrentURL,
    };
  }
}

/**
 * Download a torrent file.
 * @param {string} torrentURL - The URL of the torrent file.
 * @returns {Promise<string>} The base64-encoded content of the torrent file.
 */
async function downloadTorrent(torrentURL) {
  let rv = await fetch(torrentURL);
  rv = await rv.arrayBuffer();
  rv = new Uint8Array(rv);
  rv = String.fromCharCode(...rv);
  rv = btoa(rv);
  return rv;
}
