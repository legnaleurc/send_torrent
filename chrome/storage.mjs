/** @typedef {import("./storage").Options} Options */

/**
 * Get the default options.
 * @returns {Options} Default options
 */
function getDefaultValue() {
  return {
    version: 3,
    clients: {
      transmission: {
        enabled: false,
        url: "",
        username: "",
        password: "",
      },
      qbittorrent: {
        enabled: false,
        url: "",
        username: "",
        password: "",
      },
    },
    "add-paused": false,
    "upload-file": false,
  };
}

/**
 * Load options from storage and populate the form fields.
 * @param {HTMLFormElement} form HTML form element
 */
export async function loadOptionsToForm(form) {
  const opts = await loadOptions();

  // Handle top-level options
  const addPausedInput = form.querySelector('input[name="add-paused"]');
  const uploadFileInput = form.querySelector('input[name="upload-file"]');

  if (addPausedInput && addPausedInput instanceof HTMLInputElement)
    addPausedInput.checked = opts["add-paused"];
  if (uploadFileInput && uploadFileInput instanceof HTMLInputElement)
    uploadFileInput.checked = opts["upload-file"];

  // Handle client-specific options
  for (const clientName of Object.keys(opts.clients)) {
    const clientConfig = opts.clients[clientName];

    // Set enabled checkbox
    const enabledInput = form.querySelector(
      `input[name="${clientName}-enabled"]`,
    );
    if (enabledInput && enabledInput instanceof HTMLInputElement)
      enabledInput.checked = clientConfig.enabled;

    // Set URL, username, password
    const urlInput = form.querySelector(`input[name="${clientName}-url"]`);
    const usernameInput = form.querySelector(
      `input[name="${clientName}-username"]`,
    );
    const passwordInput = form.querySelector(
      `input[name="${clientName}-password"]`,
    );

    if (urlInput && urlInput instanceof HTMLInputElement)
      urlInput.value = clientConfig.url;
    if (usernameInput && usernameInput instanceof HTMLInputElement)
      usernameInput.value = clientConfig.username;
    if (passwordInput && passwordInput instanceof HTMLInputElement)
      passwordInput.value = clientConfig.password;
  }
}

/**
 * Save options from the form to storage.
 * @param {HTMLFormElement} form HTML form element
 */
export async function saveOptionsFromForm(form) {
  const opts = {
    version: 3,
    clients: {
      transmission: {
        enabled: false,
        url: "",
        username: "",
        password: "",
      },
      qbittorrent: {
        enabled: false,
        url: "",
        username: "",
        password: "",
      },
    },
    "add-paused": false,
    "upload-file": false,
  };

  // Handle top-level options
  const addPausedInput = form.querySelector('input[name="add-paused"]');
  const uploadFileInput = form.querySelector('input[name="upload-file"]');

  if (addPausedInput && addPausedInput instanceof HTMLInputElement)
    opts["add-paused"] = addPausedInput.checked;
  if (uploadFileInput && uploadFileInput instanceof HTMLInputElement)
    opts["upload-file"] = uploadFileInput.checked;

  // Handle client-specific options
  for (const clientName of Object.keys(opts.clients)) {
    const enabledInput = form.querySelector(
      `input[name="${clientName}-enabled"]`,
    );
    const urlInput = form.querySelector(`input[name="${clientName}-url"]`);
    const usernameInput = form.querySelector(
      `input[name="${clientName}-username"]`,
    );
    const passwordInput = form.querySelector(
      `input[name="${clientName}-password"]`,
    );

    if (enabledInput && enabledInput instanceof HTMLInputElement)
      opts.clients[clientName].enabled = enabledInput.checked;
    if (urlInput && urlInput instanceof HTMLInputElement)
      opts.clients[clientName].url = urlInput.value;
    if (usernameInput && usernameInput instanceof HTMLInputElement)
      opts.clients[clientName].username = usernameInput.value;
    if (passwordInput && passwordInput instanceof HTMLInputElement)
      opts.clients[clientName].password = passwordInput.value;
  }

  await saveOptions(opts);
}

/**
 * Load options from storage.
 * @returns {Promise<Options | null>} Options object
 */
export async function loadOptions() {
  let opts = null;
  try {
    // @ts-ignore - browser API is available in browser extension context
    opts = await browser.storage.local.get("options");
  } catch (e) {
    opts = null;
  }
  if (opts) {
    opts = opts.options;
  }
  if (!opts) {
    opts = getDefaultValue();
  }

  // migration
  while (true) {
    if (opts.version === 1) {
      opts["upload-file"] = false;
      opts.version = 2;
      await saveOptions(opts);
    } else if (opts.version === 2) {
      // Migrate from v2 to v3: convert single client config to multi-client
      const oldConfig = {
        version: 3,
        clients: {
          transmission: {
            enabled: true,
            url: opts.url || "",
            username: opts.username || "",
            password: opts.password || "",
          },
          qbittorrent: {
            enabled: false,
            url: "",
            username: "",
            password: "",
          },
        },
        "add-paused": opts["add-paused"] || false,
        "upload-file": opts["upload-file"] || false,
      };
      opts = oldConfig;
      await saveOptions(opts);
      break;
    } else if (opts.version === 3) {
      break;
    } else {
      throw new Error("incompatible version");
    }
  }

  delete opts.version;
  return opts;
}

/**
 * Save options to storage.
 * @param {Options} opts Options object
 */
async function saveOptions(opts) {
  await browser.storage.local.set({
    options: opts,
  });
}
