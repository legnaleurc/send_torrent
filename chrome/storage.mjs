/** @typedef {import("./storage").OptionsV1} OptionsV1 */
/** @typedef {import("./storage").OptionsV2} OptionsV2 */
/** @typedef {import("./storage").OptionsV3} OptionsV3 */

/**
 * Get the default options.
 * @returns {OptionsV3} Default options
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
  const options = getDefaultValue();

  // Handle top-level options
  const addPausedInput = form.querySelector('input[name="add-paused"]');
  const uploadFileInput = form.querySelector('input[name="upload-file"]');

  if (addPausedInput && addPausedInput instanceof HTMLInputElement)
    options["add-paused"] = addPausedInput.checked;
  if (uploadFileInput && uploadFileInput instanceof HTMLInputElement)
    options["upload-file"] = uploadFileInput.checked;

  // Handle client-specific options
  for (const clientName of Object.keys(options.clients)) {
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
      options.clients[clientName].enabled = enabledInput.checked;
    if (urlInput && urlInput instanceof HTMLInputElement)
      options.clients[clientName].url = urlInput.value;
    if (usernameInput && usernameInput instanceof HTMLInputElement)
      options.clients[clientName].username = usernameInput.value;
    if (passwordInput && passwordInput instanceof HTMLInputElement)
      options.clients[clientName].password = passwordInput.value;
  }

  await saveOptions(options);
}

/**
 * Load options from storage.
 * @returns {Promise<OptionsV3>} Options object
 */
export async function loadOptions() {
  const savedData = await browser.storage.local.get({
    options: getDefaultValue(),
  });
  /**
   * @type {OptionsV1 | OptionsV2 | OptionsV3}
   */
  const options = savedData.options;

  const migratedOptions = migrateOptions(options);
  await saveOptions(migratedOptions);

  return migratedOptions;
}

/**
 * Migrate options to the latest version.
 * @param {OptionsV1 | OptionsV2 | OptionsV3} options
 * @returns {OptionsV3}
 */
function migrateOptions(options) {
  while (true) {
    if (options.version === 1) {
      options = migrateToV2(options);
    } else if (options.version === 2) {
      options = migrateToV3(options);
    } else if (options.version === 3) {
      return options;
    } else {
      throw new Error("incompatible version");
    }
  }
}

/**
 * Migrate options from v1 to v2.
 * @param {OptionsV1} options
 * @returns {OptionsV2} Migrated options
 */
function migrateToV2(options) {
  /**
   * @type {OptionsV2}
   */
  const migrated = {
    version: 2,
    url: options.url ?? "",
    username: options.username ?? "",
    password: options.password ?? "",
    "add-paused": options["add-paused"] ?? false,
    "upload-file": options["upload-file"] ?? false,
  };
  return migrated;
}

/**
 * Migrate options from an older version to v3.
 * @param {OptionsV2} options
 * @returns {OptionsV3} Migrated options
 */
function migrateToV3(options) {
  /**
   * @type {OptionsV3}
   */
  const migrated = {
    version: 3,
    clients: {
      transmission: {
        enabled: true,
        url: options.url ?? "",
        username: options.username ?? "",
        password: options.password ?? "",
      },
      qbittorrent: {
        enabled: false,
        url: "",
        username: "",
        password: "",
      },
    },
    "add-paused": options["add-paused"] ?? false,
    "upload-file": options["upload-file"] ?? false,
  };
  return migrated;
}

/**
 * Save options to storage.
 * @param {OptionsV3} options Options object
 */
async function saveOptions(options) {
  await browser.storage.local.set({
    options,
  });
}
