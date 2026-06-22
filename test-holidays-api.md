# Testing Holidays API

## Steps to Debug:

### 1. Check Browser Console
Open Developer Tools (F12) and look for these logs:
- `[HolidaysManager] Fetching holidays for business: <id>`
- `[HolidaysManager] Saving holiday: {...}`
- `[HolidaysManager] Holiday saved: {...}`
- `[HolidaysManager] Refreshing list...`
- `Fetched holidays: {...}`

### 2. Check Server Logs
In your Next.js terminal, look for:
- `[Holidays API] Fetching business for user: <id>`
- `[Holidays API] Fetching holidays for business: <id>`
- `[Holidays API] Found holidays: <count> [...]`
- `[Holidays API POST] Received: {...}`
- `[Holidays API POST] Created holiday: {...}`

### 3. Test the API Directly

#### Test GET endpoint:
```bash
# Check if holidays are being returned
curl http://localhost:3000/api/business/holidays \
  -H "Cookie: <your-session-cookie>" \
  -v
```

#### Test POST endpoint:
```bash
# Add a test holiday
curl http://localhost:3000/api/business/holidays \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"businessId":"<your-business-id>","date":"2026-12-25","reason":"Christmas"}' \
  -v
```

### 4. Check Database Directly
```sql
SELECT * FROM blocked_dates ORDER BY date;
```

### 5. Common Issues:

1. **Business ID Mismatch**: POST uses businessId from props, GET uses session's business
2. **Cache Issue**: Browser might be caching the GET response
3. **Session Issue**: User session might not match the business
4. **Database Connection**: Check if data is actually being saved

### 6. Quick Fix Test:
Click the "Refresh" button after adding a holiday to manually trigger a fresh fetch.

