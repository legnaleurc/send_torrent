/** @typedef {import("../storage").ClientOptions} ClientOptions */

const kPathAddTorrent = "/api/v2/torrents/add";
const kPathLogin = "/api/v2/auth/login";

/**
 * Send a torrent to the qBittorrent server.
 * @param {string} torrentUrl - The URL of the torrent file.
 * @param {ClientOptions} options - The options to use for the request.
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
 * @param {ClientOptions} options - The options to use for the request.
 */
async function addTorrent(torrentUrl, options) {
  const apiUrl = `${options.url}${kPathAddTorrent}`;
  const addPaused = options["add-paused"];
  const uploadFile = options["upload-file"];

  const headers = new Headers();
  headers.append("X-Send-Torrent-Origin", options.url);
  if (options.username && options.password) {
    const authToken = btoa(`${options.username}:${options.password}`);
    headers.append("Authorization", `Basic ${authToken}`);
  }

  const form = new FormData();
  if (addPaused) {
    form.append("paused", "true");
  }
  if (uploadFile) {
    if (options.torrentData) {
      // Encode ArrayBuffer to Blob for qBittorrent
      const blob = new Blob([options.torrentData]);
      form.append("torrents", blob, "_.torrent");
    } else {
      throw new Error("upload-file is enabled but no torrent data provided");
    }
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
 * @param {ClientOptions} options - The options to use for the request.
 * @returns {Promise<boolean>} Whether the authorization was successful.
 */
async function authorize(options) {
  const apiUrl = `${options.url}${kPathLogin}`;
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
