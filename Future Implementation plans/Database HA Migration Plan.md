# Database High Availability Migration Plan

This document outlines the strategy, architecture, and step-by-step implementation plan for migrating the AuthPay database from a local Windows-hosted PostgreSQL instance to a containerized, High-Availability (HA) "Always On" PostgreSQL cluster.

---

## 1. Executive Summary & Architecture

To eliminate the single point of failure (SPOF) of the local Windows database and ensure automatic failover, high availability, and horizontal read scaling, we will transition to an **Orchestrated Patroni + etcd Cluster** (or Kubernetes CloudNativePG) frontend by **HAProxy** and pooled via **PgBouncer**.

### High-Level Architecture Flow

```mermaid
                    Client Application
                    ~~~~~~~~~~~~~~~~~~
                    
                  Next.js + Drizzle ORM
                           │
            ┌──────────────┴──────────────┐
            │                             │
      Write (5000)                  Read (5001)
            │                             │
            └──────────────┬──────────────┘
                           │
                      HAProxy LB
                           │
             ┌─────────────┴─────────────┐
             │                           │
      PgBouncer RW                 PgBouncer RO
       Port 6432                    Port 6433
             │                    ┌──────┴──────┐
             │                    │             │
        Patroni Primary      Patroni R1    Patroni R2
        PostgreSQL             Replica      Replica
             │                    ▲             ▲
             └──── Streaming Replication ───────┘

          Patroni Nodes ⇄ etcd Cluster (3 Nodes)
            Leader Election & Cluster State

HAProxy Health Checks
    ├── /primary → Primary
    └── /replica → Replicas
```

### Core Architecture Components

| Component | Technology | Purpose |
|---|---|---|
| **Consensus Store (DCS)** | `etcd` (3 nodes) | Maintains cluster state, configuration, and coordinates leader election (quorum). |
| **Cluster Manager** | `Patroni` | Python daemon that wraps Postgres, registers node state in `etcd`, performs auto-failover, bootstrap, and replication setup. |
| **Database Engine** | `PostgreSQL 16+` | The database engines configured for physical streaming replication. |
| **Connection Pooler** | `PgBouncer` | Manages connection scaling (transaction pooling mode) to handle high concurrency from Next.js Serverless/Edge endpoints. |
| **Load Balancer** | `HAProxy` | Acts as the entry point. Exposes Port `5000` (Write/Primary) and Port `5001` (Read/Replica). Dynamically checks Patroni REST API to locate the primary node. |

---

## 2. Infrastructure Deployment Modes

We define two target deployment patterns: **Docker Compose** (for localized setups, VPS hosting, or VMs) and **Kubernetes** (recommended for production-grade auto-scaling cloud environments).

### Option A: Docker Compose Deployment (Single/Multi-VM)

Below is the configuration for a resilient Docker Compose cluster involving 3 etcd nodes, 3 PostgreSQL/Patroni nodes, HAProxy, and PgBouncer.

```yaml
version: '3.8'

networks:
  db-net:
    driver: bridge

services:
  # ==========================================
  # etcd DCS Nodes (3-node Cluster for Quorum)
  # ==========================================
  etcd1:
    image: bitnami/etcd:3.5
    container_name: etcd1
    environment:
      - ETCD_NAME=etcd1
      - ETCD_INITIAL_ADVERTISE_PEER_URLS=http://etcd1:2380
      - ETCD_LISTEN_PEER_URLS=http://0.0.0.0:2380
      - ETCD_LISTEN_CLIENT_URLS=http://0.0.0.0:2379
      - ETCD_ADVERTISE_CLIENT_URLS=http://etcd1:2379
      - ETCD_INITIAL_CLUSTER_TOKEN=etcd-postgres-token
      - ETCD_INITIAL_CLUSTER=etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380
      - ETCD_INITIAL_CLUSTER_STATE=new
      - ALLOW_NONE_AUTHENTICATION=yes
    networks:
      - db-net

  etcd2:
    image: bitnami/etcd:3.5
    container_name: etcd2
    environment:
      - ETCD_NAME=etcd2
      - ETCD_INITIAL_ADVERTISE_PEER_URLS=http://etcd2:2380
      - ETCD_LISTEN_PEER_URLS=http://0.0.0.0:2380
      - ETCD_LISTEN_CLIENT_URLS=http://0.0.0.0:2379
      - ETCD_ADVERTISE_CLIENT_URLS=http://etcd2:2379
      - ETCD_INITIAL_CLUSTER_TOKEN=etcd-postgres-token
      - ETCD_INITIAL_CLUSTER=etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380
      - ETCD_INITIAL_CLUSTER_STATE=new
      - ALLOW_NONE_AUTHENTICATION=yes
    networks:
      - db-net

  etcd3:
    image: bitnami/etcd:3.5
    container_name: etcd3
    environment:
      - ETCD_NAME=etcd3
      - ETCD_INITIAL_ADVERTISE_PEER_URLS=http://etcd3:2380
      - ETCD_LISTEN_PEER_URLS=http://0.0.0.0:2380
      - ETCD_LISTEN_CLIENT_URLS=http://0.0.0.0:2379
      - ETCD_ADVERTISE_CLIENT_URLS=http://etcd3:2379
      - ETCD_INITIAL_CLUSTER_TOKEN=etcd-postgres-token
      - ETCD_INITIAL_CLUSTER=etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380
      - ETCD_INITIAL_CLUSTER_STATE=new
      - ALLOW_NONE_AUTHENTICATION=yes
    networks:
      - db-net

  # ==========================================
  # Patroni PostgreSQL Nodes
  # ==========================================
  pg-node1:
    image: registry.opensource.zalan.do/acid/spilo-16:3.0-p1
    container_name: pg-node1
    hostname: pg-node1
    depends_on:
      - etcd1
      - etcd2
      - etcd3
    environment:
      - SCOPE=authpay-cluster
      - PATRONI_NAME=pg-node1
      - PATRONI_ETCD3_HOSTS=etcd1:2379,etcd2:2379,etcd3:2379
      - PATRONI_SCOPE=authpay-cluster
      - PATRONI_BOOTSTRAP_DCS_postgresql_parameters_shared_buffers=256MB
      - PATRONI_BOOTSTRAP_DCS_postgresql_parameters_max_connections=200
      - PATRONI_POSTGRESQL_LISTEN=0.0.0.0:5432
      - PATRONI_RESTAPI_LISTEN=0.0.0.0:8008
      - PATRONI_POSTGRESQL_DATA_DIR=/home/postgres/pgdata/pgroot/data
      - PATRONI_SUPERUSER_USERNAME=postgres
      - PATRONI_SUPERUSER_PASSWORD=SecretSuperUserPassWord
      - PATRONI_REPLICATION_USERNAME=replicator
      - PATRONI_REPLICATION_PASSWORD=SecretReplicatorPassWord
    volumes:
      - pg-data1:/home/postgres/pgdata
    networks:
      - db-net

  pg-node2:
    image: registry.opensource.zalan.do/acid/spilo-16:3.0-p1
    container_name: pg-node2
    hostname: pg-node2
    depends_on:
      - etcd1
      - etcd2
      - etcd3
      - pg-node1
    environment:
      - SCOPE=authpay-cluster
      - PATRONI_NAME=pg-node2
      - PATRONI_ETCD3_HOSTS=etcd1:2379,etcd2:2379,etcd3:2379
      - PATRONI_SCOPE=authpay-cluster
      - PATRONI_POSTGRESQL_LISTEN=0.0.0.0:5432
      - PATRONI_RESTAPI_LISTEN=0.0.0.0:8008
      - PATRONI_POSTGRESQL_DATA_DIR=/home/postgres/pgdata/pgroot/data
      - PATRONI_SUPERUSER_USERNAME=postgres
      - PATRONI_SUPERUSER_PASSWORD=SecretSuperUserPassWord
      - PATRONI_REPLICATION_USERNAME=replicator
      - PATRONI_REPLICATION_PASSWORD=SecretReplicatorPassWord
    volumes:
      - pg-data2:/home/postgres/pgdata
    networks:
      - db-net

  pg-node3:
    image: registry.opensource.zalan.do/acid/spilo-16:3.0-p1
    container_name: pg-node3
    hostname: pg-node3
    depends_on:
      - etcd1
      - etcd2
      - etcd3
      - pg-node1
    environment:
      - SCOPE=authpay-cluster
      - PATRONI_NAME=pg-node3
      - PATRONI_ETCD3_HOSTS=etcd1:2379,etcd2:2379,etcd3:2379
      - PATRONI_SCOPE=authpay-cluster
      - PATRONI_POSTGRESQL_LISTEN=0.0.0.0:5432
      - PATRONI_RESTAPI_LISTEN=0.0.0.0:8008
      - PATRONI_POSTGRESQL_DATA_DIR=/home/postgres/pgdata/pgroot/data
      - PATRONI_SUPERUSER_USERNAME=postgres
      - PATRONI_SUPERUSER_PASSWORD=SecretSuperUserPassWord
      - PATRONI_REPLICATION_USERNAME=replicator
      - PATRONI_REPLICATION_PASSWORD=SecretReplicatorPassWord
    volumes:
      - pg-data3:/home/postgres/pgdata
    networks:
      - db-net

  # ==========================================
  # HAProxy Load Balancer
  # ==========================================
  haproxy-db:
    image: haproxy:2.8-alpine
    container_name: haproxy-db
    ports:
      - "5000:5000" # PostgreSQL Read-Write (Primary)
      - "5001:5001" # PostgreSQL Read-Only (Replicas)
      - "7000:7000" # HAProxy Stats Dashboard
    volumes:
      - ./haproxy/haproxy-db.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    depends_on:
      - pg-node1
      - pg-node2
      - pg-node3
    networks:
      - db-net

volumes:
  pg-data1:
  pg-data2:
  pg-data3:
```

#### HAProxy Database Configuration (`./haproxy/haproxy-db.cfg`)

```haproxy
global
    maxconn 10000

defaults
    log global
    mode tcp
    option tcplog
    timeout connect 4s
    timeout client 30m
    timeout server 30m

# HAProxy Admin Statistics
listen stats
    mode http
    bind *:7000
    stats enable
    stats uri /
    stats refresh 5s

# ---------------------------------------------
# Read-Write Backend (Routes to current Primary)
# ---------------------------------------------
frontend pg_cluster_write_front
    bind *:5000
    mode tcp
    option tcplog
    default_backend pg_cluster_write_back

backend pg_cluster_write_back
    mode tcp
    option httpchk GET /primary
    http-check expect status 200
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
    server pg-node1 pg-node1:5432 maxconn 500 check port 8008
    server pg-node2 pg-node2:5432 maxconn 500 check port 8008
    server pg-node3 pg-node3:5432 maxconn 500 check port 8008

# ---------------------------------------------
# Read-Only Backend (Load-balances replicas)
# ---------------------------------------------
frontend pg_cluster_read_front
    bind *:5001
    mode tcp
    option tcplog
    default_backend pg_cluster_read_back

backend pg_cluster_read_back
    mode tcp
    balance roundrobin
    option httpchk GET /replica
    http-check expect status 200
    default-server inter 3s fall 3 rise 2
    server pg-node1 pg-node1:5432 maxconn 500 check port 8008
    server pg-node2 pg-node2:5432 maxconn 500 check port 8008
    server pg-node3 pg-node3:5432 maxconn 500 check port 8008
```

---

### Option B: Kubernetes Deployment using CloudNativePG (Production-Grade)

If moving to Kubernetes (EKS, GKE, AKS, or self-hosted), the **CloudNativePG (CNPG)** operator is the modern standard. It handles failover, streaming replication, pgBouncer pooling, WAL archiving, and backups natively without requiring a separate `etcd` installation.

Create a manifest file `authpay-db-cluster.yaml`:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: authpay-db-cluster
  namespace: database
spec:
  instances: 3
  imageName: ghcr.io/cloudnativepg/postgresql:16.1

  # Allocate storage for PGDATA
  storage:
    size: 20Gi
    storageClass: premium-rwo # Fast SSD storage block

  # Define PostgreSQL bootstrap configurations
  bootstrap:
    initdb:
      database: authpay
      owner: authpay_admin
      secret:
        name: db-credentials

  # Automatic backups configuration to Cloud Storage (e.g. S3 / GCS)
  backup:
    barmanObjectStore:
      destinationPath: s3://authpay-db-backups/
      endpointURL: https://s3.amazonaws.com
      s3Credentials:
        accessKeyId:
          name: aws-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: aws-creds
          key: SECRET_ACCESS_KEY
      wal:
        compression: gzip

  # Postgres Configuration Overrides
  postgresql:
    parameters:
      shared_buffers: "512MB"
      max_connections: "200"
      work_mem: "16MB"
```

Applying this manifest creates:
* 3 Kubernetes Pods running PostgreSQL (1 Read-Write Primary, 2 Read Replicas).
* A primary service (`authpay-db-cluster-rw`) pointing directly to the primary node.
* A replica service (`authpay-db-cluster-ro`) round-robin balancing between the read-only standbys.

---

## 3. Data Migration Strategy (Minimal Downtime)

For a database migration from a local Windows PostgreSQL server to the new container cluster, we recommend a **Logical Replication** model. Unlike physical replication, logical replication supports cross-OS migration and allows synchronization while keeping the Windows database fully active.

### Phase 1: Source Database Preparation (Windows Server)

1. Verify network connectivity from the container environment to the Windows host port `5432`.
2. Edit `postgresql.conf` on the Windows host to support logical replication:
   ```ini
   wal_level = logical
   max_wal_senders = 10
   max_replication_slots = 10
   ```
3. Edit `pg_hba.conf` on the Windows host to allow replication connections from the container subnet:
   ```hba
   host    replication     replicator      10.0.0.0/16            md5
   host    authpay         replicator      10.0.0.0/16            md5
   ```
4. Restart the Windows PostgreSQL service to apply changes.
5. Create a replication user and grant it permissions:
   ```sql
   CREATE USER replicator WITH REPLICATION PASSWORD 'SecretReplicatorPassWord';
   GRANT ALL PRIVILEGES ON DATABASE authpay TO replicator;
   ```

### Phase 2: Schema Migration & Target Bootstrap

1. Export the schema structure (no data) from the Windows server using `pg_dump`:
   ```bash
   pg_dump -h localhost -U postgres -d authpay --schema-only -F p -f authpay_schema.sql
   ```
2. Apply the schema structure to the new target database cluster (connect to the HAProxy IP on port `5000`):
   ```bash
   psql -h <haproxy-ip> -p 5000 -U postgres -d authpay -f authpay_schema.sql
   ```

### Phase 3: Synchronizing Data via Logical Replication

1. **On the Windows Source**: Create a publication containing all tables:
   ```sql
   CREATE PUBLICATION authpay_pub FOR ALL TABLES;
   ```
2. **On the Container Target** (connect to the Write HAProxy on port `5000`): Create a subscription to stream data:
   ```sql
   CREATE SUBSCRIPTION authpay_sub 
   CONNECTION 'host=<windows-ip> port=5432 dbname=authpay user=replicator password=SecretReplicatorPassWord' 
   PUBLICATION authpay_pub;
   ```
3. **Monitor Replication Lag**:
   Check the sync status on the target:
   ```sql
   SELECT * FROM pg_stat_subscription;
   ```
   Check the replication lag on the Windows source:
   ```sql
   SELECT client_addr, sent_lsn, write_lsn, flush_lsn, replay_lsn,
          pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replication_lag_bytes
   FROM pg_stat_replication;
   ```

### Phase 4: Cutover & Go-Live (Downtime: < 2 Minutes)

1. Put the Next.js application into maintenance mode (stop web servers/services to prevent new write queries).
2. Wait for `replication_lag_bytes` on the source to drop to `0`.
3. Terminate the subscription on the target container database to finalize the sync:
   ```sql
   ALTER SUBSCRIPTION authpay_sub DISABLE;
   ALTER SUBSCRIPTION authpay_sub SET (slot_name = NONE);
   DROP SUBSCRIPTION authpay_sub;
   ```
4. Reset sequence values on the target database so primary keys auto-increment correctly (since logical replication does not sync sequence positions):
   Run this script on the target DB:
   ```sql
   SELECT 'SELECT SETVAL(' || quote_literal(quote_ident(PGT.schemaname) || '.' || quote_ident(S.relname)) || ', COALESCE(MAX(' || quote_ident(C.column_name) || '), 1) ) FROM ' || quote_ident(PGT.schemaname) || '.' || quote_ident(T.relname) || ';'
   FROM pg_class AS S,
        pg_depend AS D,
        pg_class AS T,
        pg_attribute AS C,
        pg_tables AS PGT
   WHERE S.relkind = 'S'
     AND S.oid = D.objid
     AND D.refobjid = T.oid
     AND D.refobjsubid = C.attnum
     AND T.relname = PGT.tablename
   ORDER BY S.relname;
   ```
   *Execute the output rows of the query above on the target database to update all sequences.*
5. Update the application connection string to point to the HAProxy instance (see Section 4).
6. Perform validation tests and restart the application.

---

## 4. Client Application configuration

No database code changes are required in the Next.js backend, since AuthPay utilizes Drizzle ORM configured with standard connection strings and pooling parameters. 

### Step 1: Update `.env` Settings

Update the database connection parameters in `.env` (or Kubernetes Secrets) to route traffic through the HAProxy load balancer:

```env
# Point to HAProxy's Write Port (5000)
DATABASE_URL="postgresql://postgres:SecretSuperUserPassWord@<haproxy-ip>:5000/authpay?sslmode=prefer"

# Connection Pooling Tweaks
DB_POOL_MAX=75
DB_IDLE_TIMEOUT=30
DB_CONNECT_TIMEOUT=15
```

### Step 2: Drizzle ORM Details

In [src/server/db/index.ts](file:///D:/Pratik/Dev/Projects/AuthPay/src/server/db/index.ts), the database driver connects using standard settings:

```typescript
const client = connectionString
  ? postgres(connectionString, {
      ...(ssl !== undefined ? { ssl } : {}),
      max: Number(process.env.DB_POOL_MAX ?? 50),
      idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 20),
      connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 10),
      prepare: false, // REQUIRED for PgBouncer / Transaction pool configurations
    })
  : null;
```

> [!IMPORTANT]
> The `prepare: false` config is critical here. It disables prepared statements, which avoids "Prepared statement already exists" conflicts when routing queries through PgBouncer in transaction mode.

---

## 5. Failover Validation & Disaster Recovery Tests

To verify that the high availability configuration works as expected, run the following automated and manual tests in a staging environment prior to production migration.

### Test 1: Automatic Failover (Node Termination)
* **Action**: Simulate a hardware or VM failure by stopping the current primary container:
  ```bash
  docker compose stop pg-node1
  ```
* **Expected Result**:
  1. `etcd` detects that `pg-node1` lost its lease.
  2. Patroni nodes elect a new leader (e.g., `pg-node2`).
  3. `pg-node2` is promoted to Primary. `pg-node3` re-points its replication stream to `pg-node2`.
  4. HAProxy health checks on `/primary` fail for `pg-node1` and succeed on `pg-node2`.
  5. Connection routing shifts automatically. Next.js experiences a brief retry delay (1–3 seconds), but no data loss occurs.

### Test 2: Graceful Switchover (Maintenance)
* **Action**: Trigger a planned switchover for system updates using Patroni's CLI tool:
  ```bash
  docker exec -it pg-node1 patronictl switchover --master pg-node1 --candidate pg-node2 --scheduled now
  ```
* **Expected Result**:
  1. Patroni demotes `pg-node1` gracefully.
  2. Replication coordinates catch up to ensure no loss.
  3. `pg-node2` is promoted.
  4. HAProxy updates backend configurations with zero dropped client queries (HAProxy buffers active TCP requests during the switch).

---

## 6. Migration Rollback Plan

If validation tests fail or database anomalies are detected post-cutover, execute this rollback process immediately:

1. Stop the Next.js application to prevent further database writes.
2. Since logical replication from Windows to the container did not modify the source data, the original Windows database is in a consistent state up to the moment of cutover.
3. If new business data was written to the container cluster during a short window of validation, export those transaction tables:
   ```bash
   pg_dump -h <haproxy-ip> -p 5000 -U postgres -d authpay --data-only -t users -t payment_orders -t subscriptions -f fallback_delta.sql
   ```
4. Point the Next.js connection string back to the Windows local database:
   ```env
   DATABASE_URL="postgresql://username:password@<windows-ip>:5432/Authpay_db"
   ```
5. Apply the delta records to the Windows database if necessary:
   ```bash
   psql -h <windows-ip> -p 5432 -U postgres -d Authpay_db -f fallback_delta.sql
   ```
6. Restart the Next.js application and declare rollback complete.
