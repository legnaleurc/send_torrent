/**
 * @typedef {Object} Options
 * @property {number} version - The version of the options.
 * @property {string} client - The torrent client to use (e.g., "transmission").
 * @property {string} url - The URL of the Transmission server.
 * @property {string} username - The username for the Transmission server.
 * @property {string} password - The password for the Transmission server.
 * @property {boolean} add-paused - Whether to add torrents in a paused state.
 * @property {boolean} upload-file - Whether to upload the torrent file.
 */

/**
 * Get the default options.
 * @returns {Options} Default options
 */
function getDefaultValue() {
  return {
    version: 3,
    client: "transmission",
    url: "",
    username: "",
    password: "",
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
  for (const input of form.elements) {
    if (opts.hasOwnProperty(input.name)) {
      if (input.type === "checkbox") {
        input.checked = opts[input.name];
      } else {
        input.value = opts[input.name];
      }
    }
  }
}

/**
 * Save options from the form to storage.
 * @param {HTMLFormElement} form HTML form element
 */
export async function saveOptionsFromForm(form) {
  const opts = Array.prototype.reduce.call(
    form.elements,
    (rv, input) => {
      if (input.name === "version") {
        rv.version = parseInt(input.value, 10);
        return rv;
      }
      switch (input.type) {
        case "text":
        case "password":
          rv[input.name] = input.value;
          break;
        case "checkbox":
          rv[input.name] = input.checked;
          break;
        case "select-one":
          rv[input.name] = input.value;
          break;
        default:
          break;
      }
      return rv;
    },
    {},
  );
  await saveOptions(opts);
}

/**
 * Load options from storage.
 * @returns {Promise<Options | null>} Options object
 */
export async function loadOptions() {
  let opts = null;
  try {
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
      opts["client"] = "transmission";
      opts.version = 3;
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
