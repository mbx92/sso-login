# Operations Guide

Panduan operasional untuk menjalankan dan memelihara SSO Identity Provider.

## Deployment

### Production Requirements

- **Node.js**: 18+ LTS
- **PostgreSQL**: 14+
- **Memory**: Minimum 512MB, recommended 1GB+
- **CPU**: 1+ cores
- **Storage**: 10GB+ untuk database dan logs
- **Network**: HTTPS mandatory, load balancer recommended

### Environment Setup

```bash
# Production environment
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgres://user:password@db.server:5432/sso_prod?sslmode=require

# Security - generate dengan: openssl rand -hex 32
SESSION_SECRET=your-32-char-secret-here
SSO_ISSUER=https://sso.company.com

# Admin bootstrap (hapus setelah setup)
SUPERADMIN_EMAIL=admin@company.com
SUPERADMIN_PASSWORD=change-immediately

# HRIS Integration
HRIS_API_BASE_URL=https://hris.internal.company.com
HRIS_API_TOKEN=secure-api-token
```

### Build & Deploy

```bash
# Build
npm run build

# Run production
node .output/server/index.mjs

# Atau dengan PM2
pm2 start .output/server/index.mjs --name sso-idp
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .output .output

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  sso:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/sso
      - SESSION_SECRET=${SESSION_SECRET}
      - SSO_ISSUER=https://sso.company.com
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=sso
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=sso
    restart: unless-stopped

volumes:
  postgres_data:
```

## Logging

### Log Format

Semua log menggunakan format JSON untuk kemudahan parsing:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/oidc/token",
  "statusCode": 200,
  "durationMs": 45,
  "msg": "Request completed"
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| `fatal` | Application crash |
| `error` | Unhandled errors, failed operations |
| `warn` | Rate limiting, deprecated features |
| `info` | Request completion, auth events |
| `debug` | Detailed debugging info |
| `trace` | Very detailed tracing |

### Log Aggregation

Recommended setup dengan ELK atau similar:

```bash
# Pipe logs ke file
node .output/server/index.mjs 2>&1 | tee -a /var/log/sso/app.log

# Atau gunakan pino-pretty untuk development
node .output/server/index.mjs | pino-pretty
```

### Filebeat Configuration

```yaml
# /etc/filebeat/filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/sso/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "sso-logs-%{+yyyy.MM.dd}"
```

## Audit Logs

### Event Categories

| Category | Events |
|----------|--------|
| Authentication | `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT` |
| OIDC | `OIDC_AUTHORIZE_*`, `OIDC_TOKEN_*`, `OIDC_LOGOUT` |
| Admin | `ADMIN_CLIENT_*`, `ADMIN_USER_*`, `ADMIN_ROLE_*` |
| System | `HRIS_SYNC_*` |

### Retention Policy

Recommended retention:

- **Audit logs**: 2 tahun (compliance)
- **Application logs**: 30 hari
- **Debug logs**: 7 hari

```sql
-- Cleanup old audit logs (jalankan via cron)
DELETE FROM audit_logs 
WHERE at < NOW() - INTERVAL '2 years';

-- Cleanup expired OIDC artifacts
DELETE FROM oidc_kv 
WHERE expires_at IS NOT NULL AND expires_at < NOW();
```

### Cron Jobs

```bash
# /etc/cron.d/sso-maintenance

# Cleanup expired tokens (setiap jam)
0 * * * * sso-user cd /app && node scripts/cleanup-expired.mjs >> /var/log/sso/cleanup.log 2>&1

# HRIS sync (setiap hari jam 2 pagi)
0 2 * * * sso-user curl -X POST http://localhost:3000/api/admin/sync/hris -H "Authorization: Bearer $ADMIN_TOKEN" >> /var/log/sso/hris-sync.log 2>&1

# Backup database (setiap hari jam 1 pagi)
0 1 * * * root pg_dump $DATABASE_URL | gzip > /backup/sso-$(date +\%Y\%m\%d).sql.gz
```

## Database Maintenance

### Backup Strategy

```bash
#!/bin/bash
# /scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backup/sso

# Full backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/full_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "full_*.sql.gz" -mtime +30 -delete
```

### Restore

```bash
# Restore from backup
gunzip -c /backup/sso/full_20240115.sql.gz | psql $DATABASE_URL
```

### Migrations

```bash
# Generate migration setelah schema change
npm run db:generate

# Apply migrations
npm run db:migrate

# Rollback (manual, perlu script)
psql $DATABASE_URL < migrations/rollback-xxxx.sql
```

### Performance Tuning

```sql
-- Check slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Reindex jika perlu
REINDEX TABLE oidc_kv;
REINDEX TABLE audit_logs;

-- Vacuum untuk reclaim space
VACUUM ANALYZE;
```

## Key Management

### JWT Signing Keys

oidc-provider generates keys automatically. Untuk production:

1. **Generate keys manually**:

```bash
# Generate RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Convert ke JWK
npx pem-jwk private.pem > jwk.json
```

2. **Store di environment** atau key management service:

```env
OIDC_PRIVATE_JWKS='{"keys":[{"kty":"RSA","kid":"key-1",...}]}'
```

### Key Rotation

Recommended rotation: setiap 90 hari

1. Generate key baru dengan `kid` berbeda
2. Add key baru ke JWKS (kedua key active)
3. Tunggu semua token yang sign dengan key lama expired
4. Remove key lama dari JWKS

```javascript
// Contoh JWKS dengan multiple keys
{
  "keys": [
    { "kid": "key-2024-04", ... }, // Current
    { "kid": "key-2024-01", ... }  // Previous (untuk validasi token lama)
  ]
}
```

## Monitoring

### Health Check Endpoint

```bash
# Basic health check
curl http://localhost:3000/health

# Response
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Metrics to Monitor

| Metric | Warning | Critical |
|--------|---------|----------|
| Response time (p95) | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |
| Login failures/min | > 10 | > 50 |
| Token issuance/min | < 1 or > 1000 | - |
| Database connections | > 80% | > 95% |
| Memory usage | > 80% | > 95% |

### Prometheus Metrics

```typescript
// Contoh custom metrics
import { Counter, Histogram } from 'prom-client';

const authCounter = new Counter({
  name: 'sso_auth_total',
  help: 'Total authentication attempts',
  labelNames: ['status', 'method']
});

const tokenHistogram = new Histogram({
  name: 'sso_token_duration_seconds',
  help: 'Token endpoint response time',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: sso-alerts
    rules:
      - alert: SSOHighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate on SSO

      - alert: SSOHighLoginFailures
        expr: rate(sso_auth_total{status="failed"}[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High login failure rate (possible brute force)
```

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to database"

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Check max connections
psql $DATABASE_URL -c "SHOW max_connections"
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"
```

#### 2. "Session expired unexpectedly"

- Check `SESSION_SECRET` consistency across instances
- Verify cookie settings match domain
- Check for clock drift between servers

#### 3. "OIDC token validation failed"

```bash
# Verify JWKS endpoint
curl $SSO_ISSUER/.well-known/jwks.json | jq

# Check token expiry
echo $ACCESS_TOKEN | cut -d'.' -f2 | base64 -d | jq
```

#### 4. High memory usage

```bash
# Check Node.js heap
node --expose-gc -e "console.log(process.memoryUsage())"

# Monitor over time
NODE_OPTIONS="--max-old-space-size=1024" node .output/server/index.mjs
```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug node .output/server/index.mjs

# OIDC provider debug
DEBUG=oidc-provider:* node .output/server/index.mjs
```

## Security Checklist

### Pre-deployment

- [ ] All secrets in environment variables (not in code)
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] SESSION_SECRET is unique and secure (32+ chars)
- [ ] SSO_ISSUER uses HTTPS
- [ ] Admin password changed from default
- [ ] Rate limiting configured
- [ ] CORS configured correctly

### Post-deployment

- [ ] HTTPS working with valid certificate
- [ ] Security headers present (HSTS, CSP, etc.)
- [ ] Health check accessible
- [ ] Audit logs recording events
- [ ] Backup running and tested
- [ ] Monitoring alerts configured

### Regular Audits

- [ ] Review audit logs weekly
- [ ] Rotate keys every 90 days
- [ ] Update dependencies monthly
- [ ] Penetration test annually
