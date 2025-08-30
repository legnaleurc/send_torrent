/**
 * Client configuration interface
 */
export interface ClientConfig {
  /** Whether this client is enabled */
  enabled: boolean;
  /** The URL of the client server */
  url: string;
  /** The username for the client server */
  username: string;
  /** The password for the client server */
  password: string;
}

/**
 * Client options interface that combines client config with global options
 */
export interface ClientOptions {
  /** The URL of the client server */
  url: string;
  /** The username for the client server */
  username: string;
  /** The password for the client server */
  password: string;
  /** Whether to add torrents in a paused state */
  "add-paused": boolean;
  /** Whether to upload the torrent file */
  "upload-file": boolean;
  /** Pre-downloaded torrent data (ArrayBuffer that can be encoded as needed) */
  torrentData?: ArrayBuffer;
}

export interface OptionsV1 {
  version: 1;
  url: string;
  username: string;
  password: string;
  "add-paused": boolean;
}

export interface OptionsV2 {
  version: 2;
  url: string;
  username: string;
  password: string;
  "add-paused": boolean;
  "upload-file": boolean;
}

/**
 * Options configuration for the torrent client
 */
export interface OptionsV3 {
  /** The version of the options */
  version: 3;
  /** Configuration for different torrent clients */
  clients: {
    transmission: ClientConfig;
    qbittorrent: ClientConfig;
  };
  /** Whether to add torrents in a paused state */
  "add-paused": boolean;
  /** Whether to upload the torrent file */
  "upload-file": boolean;
}
