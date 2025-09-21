import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema';

/**
 * Type definition for database connection options
 */
export interface DbConnectionOptions {
  tenantId?: string;
  userId?: string;
  bypassRls?: boolean;
}

/**
 * Create a database connection with or without RLS (Row Level Security) context
 * @param options Connection options including tenant and user context
 */
export function createDbConnection(options?: DbConnectionOptions) {
  // Don't attempt to connect to the database in the browser
  if (typeof window !== 'undefined') {
    console.warn('Database connection attempted in browser environment');
    return null;
  }

  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('No database connection string was provided');
      return null;
    }    // Create a PostgreSQL client with RLS context
    const queryString: string[] = [];
      
    // Set tenant ID if provided
    if (options?.tenantId) {
      queryString.push(`SET app.current_tenant_id='${options.tenantId}'`);
    }
      
    // Set user ID if provided  
    if (options?.userId) {
      queryString.push(`SET app.current_user_id='${options.userId}'`);
    }
      
    // Bypass RLS if specified (for super admin operations)
    if (options?.bypassRls) {
      queryString.push(`SET app.bypass_rls=true`);
      queryString.push(`SET app.is_super_admin=true`);
    }
        // Create connection
    const sql = postgres(connectionString, {
      prepare: false,
      // @ts-expect-error - postgres.js has updated its types and 'connect.fetch' is valid but not in the type definitions
      connect: {
        fetch: (_: unknown, __: unknown, query: string) => queryString.length > 0 ? [query, ...queryString] : undefined,
      },
    });
      
    return drizzle(sql, { schema });
  } catch (error) {
    console.error('Error creating database connection:', error);
    return null;
  }
}

/**
 * Get a database connection for a specific tenant
 * @param tenantId The tenant ID
 * @param userId Optional user ID
 */
export function getTenantDB(tenantId: string, userId?: string) {
  return createDbConnection({
    tenantId,
    userId,
  });
}

/**
 * Get a database connection with super admin privileges
 * This bypasses Row Level Security restrictions
 */
export function getSuperUserDB() {
  return createDbConnection({
    bypassRls: true,
  });
}

/**
 * Get a database connection for a specific user
 * This is for user-specific operations outside tenant context
 * @param userId The user ID
 */
export function getUserDB(userId: string) {
  return createDbConnection({
    userId,
  });
}
