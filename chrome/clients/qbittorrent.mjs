/** @typedef {import("./qbittorrent").QBittorrentOptions} QBittorrentOptions */

const kPathAddTorrent = "/api/v2/torrents/add";
const kPathLogin = "/api/v2/auth/login";

/**
 * Send a torrent to the qBittorrent server.
 * @param {QBittorrentOptions} options - The options to use for the request.
 */
export async function sendToQBittorrent(options) {
  let succeed = await addTorrent(options);
  if (succeed) {
    return;
  }
  await authorize(options);
  succeed = await addTorrent(options);
  if (!succeed) {
    throw new Error("Failed to send torrent to qBittorrent");
  }
}

/**
 * Add a torrent to the qBittorrent server.
 * @param {QBittorrentOptions} options - The options to use for the request.
 */
async function addTorrent(options) {
  const apiUrl = `${options.url}${kPathAddTorrent}`;
  const { torrentUrl, addPaused, torrentData } = options;

  const headers = new Headers();
  if (options.username && options.password) {
    const authToken = btoa(`${options.username}:${options.password}`);
    headers.append("Authorization", `Basic ${authToken}`);
  }

  const form = new FormData();
  if (addPaused) {
    form.append("paused", "true");
  }
  if (torrentData) {
    // Encode ArrayBuffer to Blob for qBittorrent
    const blob = new Blob([torrentData]);
    form.append("torrents", blob, "_.torrent");
  } else {
    form.append("urls", torrentUrl);
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
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
 * @param {QBittorrentOptions} options - The options to use for the request.
 * @returns {Promise<boolean>} Whether the authorization was successful.
 */
async function authorize(options) {
  throw new Error("Not implemented");
  const apiUrl = `${options.url}${kPathLogin}`;
  const query = new URLSearchParams();
  query.append("username", options.username);
  query.append("password", options.password);
  const response = await fetch(apiUrl, {
    method: "POST",
    body: query,
  });
  if (!response.ok) {
    throw new Error(`Failed to authorize: ${response.statusText}`);
  }
  return true;
}
