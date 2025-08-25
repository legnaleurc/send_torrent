/** @typedef {import("./storage.mjs").Options} Options */

const kPathAddTorrent = "/api/v2/torrents/add";

/**
 * Send a torrent to the qBittorrent server.
 * @param {string} torrentUrl - The URL of the torrent file.
 * @param {Options} options - The options to use for the request.
 */
export async function sendToQBittorrent(torrentUrl, options) {
  let succeed = await addTorrent(torrentUrl, options);
  if (succeed) {
    return;
  }
  await authorize(options);
  succeed = await addTorrent(torrentUrl, options);
  if (!succeed) {
    throw new Error("Failed to send torrent to qBittorrent");
  }
}

/**
 * Add a torrent to the qBittorrent server.
 * @param {string} torrentUrl - The URL of the torrent file.
 * @param {Options} options - The options to use for the request.
` */
async function addTorrent(torrentUrl, options) {
  const apiUrl = `${options.url}${kPathAddTorrent}`;
  const addPaused = options["add-paused"];
  const uploadFile = options["upload-file"];
  const form = new FormData();
  if (addPaused) {
    form.append("paused", "true");
  }
  if (uploadFile) {
    const blob = await downloadTorrent(torrentUrl);
    form.append("torrents", blob, "_.torrent");
  } else {
    form.append("urls", torrentUrl);
  }
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "X-Send-Torrent-Origin": options.url,
    },
    body: form,
  });
  if (response.ok) {
    return true;
  }
  if (response.status === 403) {
    return false;
  }
  throw new Error(`Failed to add torrent: ${response.statusText}`);
}

/**
 * Authorize the user with the qBittorrent server.
 * @param {Options} options - The options to use for the request.
 * @returns {Promise<boolean>} Whether the authorization was successful.
 */
async function authorize(options) {
  const apiUrl = `${options.url}/api/v2/auth/login`;
  const query = new URLSearchParams();
  query.append("username", options.username);
  query.append("password", options.password);
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "X-Send-Torrent-Origin": options.url,
    },
    body: query,
  });
  if (!response.ok) {
    throw new Error(`Failed to authorize: ${response.statusText}`);
  }
  return true;
}

/**
 * Download a torrent file.
 * @param {string} torrentUrl - The URL of the torrent file.
 * @returns {Promise<Blob>} The blob of the downloaded torrent file.
 */
async function downloadTorrent(torrentUrl) {
  const response = await fetch(torrentUrl);
  if (!response.ok) {
    throw new Error(`Failed to download torrent: ${response.statusText}`);
  }
  const blob = await response.blob();
  return blob;
}
