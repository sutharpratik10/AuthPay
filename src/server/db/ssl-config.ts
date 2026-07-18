// src/db/ssl-config.ts
import type { ConnectionOptions } from "tls";

export type SSLConfig = boolean | ConnectionOptions | undefined;

/**
 * Create SSL configuration for database connections
 * Supports both Drizzle Kit and runtime database connections
 */
export function createSSLConfig(): SSLConfig {
  let url: URL | null = null;
  try {
    url = new URL(process.env.DATABASE_URL || "");
  } catch (e) {
    // ignore invalid URLs
  }
  const sslMode = url?.searchParams.get("sslmode") || process.env.DB_SSLMODE || "prefer";

  // Function to create SSL config with optional CA certificate
  const buildSSLConfig = (rejectUnauthorized: boolean = true): ConnectionOptions => {
    // 1. Prefer raw certificate string if provided (Edge-friendly)
    if (process.env.DB_CA_CERT) {
      return {
        ca: process.env.DB_CA_CERT,
        rejectUnauthorized,
      };
    }

    // 2. Fallback to file path
    const certPath = process.env.DB_CERT_PATH || process.env.db_cert_path;
    if (process.env.DB_USE_CA === "true" && certPath) {
      try {
        // Prevent Next.js Edge Runtime from statically analyzing Node.js built-in requires
        const fsName = "fs";
        const pathName = "path";
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require(fsName);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require(pathName);

        const caPath = path.resolve(certPath);
        if (fs.existsSync(caPath)) {
          return {
            ca: fs.readFileSync(caPath, "utf8"),
            rejectUnauthorized,
          };
        } else {
          console.warn(`[SSL Config] CA certificate not found at ${caPath}. Using SSL without CA verification.`);
          return { rejectUnauthorized: false };
        }
      } catch (e) {
        console.warn(`[SSL Config] Could not load CA certificate from file system (likely running in Edge Runtime).`);
        return { rejectUnauthorized: false };
      }
    }

    // Always return an object, not a boolean
    return { rejectUnauthorized };
  };

  // Handle different SSL modes according to PostgreSQL standards
  switch (sslMode.toLowerCase()) {
    case "disable":
      return false;

    case "allow":
      // Try SSL first, fallback to non-SSL if it fails (handled by client)
      return buildSSLConfig(false);

    case "prefer":
      // Default behavior: prefer SSL but don't fail if unavailable
      return buildSSLConfig(false);

    case "require":
      // SSL required, but don't verify server certificate
      return buildSSLConfig(false);

    case "verify-ca":
      // SSL required and verify server certificate
      return buildSSLConfig(true);

    case "verify-full":
      // SSL required, verify server certificate and hostname
      return buildSSLConfig(true);

    default:
      // Default to prefer SSL with relaxed verification
      return buildSSLConfig(false);
  }
}

/**
 * Get SSL configuration specifically for Drizzle Kit
 */
export function getDrizzleSSLConfig(): boolean | { ca?: string; rejectUnauthorized: boolean } {
  const sslConfig = createSSLConfig();

  // Handle environment variable overrides
  if (process.env.DB_REQUIRE_SSL === "true") {
    const config = createSSLConfig();
    if (typeof config === "boolean" || config === undefined) {
      return config || { rejectUnauthorized: false };
    }
    return {
      ca: typeof config.ca === "string" ? config.ca : undefined,
      rejectUnauthorized: config.rejectUnauthorized !== false,
    };
  } else if (process.env.DB_REQUIRE_SSL === "false") {
    return false;
  }

  // Return appropriate format for Drizzle Kit
  if (typeof sslConfig === "boolean" || sslConfig === undefined) {
    return sslConfig || false;
  }

  return {
    ca: typeof sslConfig.ca === "string" ? sslConfig.ca : undefined,
    rejectUnauthorized: sslConfig.rejectUnauthorized !== false,
  };
}

/**
 * Get SSL configuration for postgres.js client
 */
export function getPostgresSSLConfig(): ConnectionOptions | boolean | undefined {
  const sslConfig = createSSLConfig();

  // Handle environment variable overrides
  if (process.env.DB_REQUIRE_SSL === "false") {
    return undefined;
  }

  return sslConfig;
}
