/**
 * Client options interface
 */
export interface ClientOptions {
  /** Whether this client is enabled */
  enabled: boolean;
  /** The URL of the client server */
  url: string;
  /** The username for the client server */
  username: string;
  /** The password for the client server */
  password: string;
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
    transmission: ClientOptions;
    qbittorrent: ClientOptions;
  };
  /** Whether to add torrents in a paused state */
  "add-paused": boolean;
  /** Whether to upload the torrent file */
  "upload-file": boolean;
}
