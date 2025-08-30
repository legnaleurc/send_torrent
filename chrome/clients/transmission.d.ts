/**
 * Client options interface that combines client config with global options
 */
export interface TransmissionOptions {
  /** The URL of the client server */
  url: string;
  /** The username for the client server */
  username: string;
  /** The password for the client server */
  password: string;
  /** Whether to add torrents in a paused state */
  addPaused: boolean;
  /** The URL of the torrent file */
  torrentUrl: string;
  /** Pre-downloaded torrent data (ArrayBuffer that can be encoded as needed) */
  torrentData?: ArrayBuffer;
}
