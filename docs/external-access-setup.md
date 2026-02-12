# External Access Setup Guide

This guide helps you configure Q-CENTRAL to be accessible from other devices on your network or from the internet when **hosting locally**.

## Current Status

✅ **Working:**
- Backend listens on `0.0.0.0:8000` (all network interfaces)
- Frontend listens on `0.0.0.0:5173` (all network interfaces)
- CORS allows all origins
- **Frontend uses relative API URLs** (`/api/v1`): same origin as the page, so it works for both localhost and external domains (e.g. `quaintance.tplinkdns.com`) without changing config. The Vite dev server proxies `/api` to the backend.

❌ **Potential issues:**
- Windows Firewall may block ports 8000 and 5173 (add rules if needed)
- Router port forwarding required for internet access

## Step 1: Configure Windows Firewall

You need to allow incoming connections on ports 8000 and 5173.

### Option A: Using PowerShell (Run as Administrator)

```powershell
# Allow port 8000 (Backend)
New-NetFirewallRule -DisplayName "Q-CENTRAL Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# Allow port 5173 (Frontend)
New-NetFirewallRule -DisplayName "Q-CENTRAL Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Option B: Using Windows Firewall GUI

1. Open **Windows Defender Firewall** → **Advanced Settings**
2. Click **Inbound Rules** → **New Rule**
3. Select **Port** → **Next**
4. Select **TCP** and enter port **8000** → **Next**
5. Select **Allow the connection** → **Next**
6. Check all profiles (Domain, Private, Public) → **Next**
7. Name it "Q-CENTRAL Backend" → **Finish**
8. Repeat for port **5173** (name it "Q-CENTRAL Frontend")

## Step 2: Frontend API URL (optional)

The frontend uses **relative URLs** for the API (`/api/v1`). The browser sends requests to the same host and port as the page (e.g. `http://your-domain:5173/api/v1/...`). The Vite dev server proxies `/api` to the backend, so no `VITE_API_URL` is needed for external access when using the dev server.

- **If you use a custom domain:** Add it to `allowedHosts` in `frontend/vite.config.js` (e.g. `quaintance.tplinkdns.com`, `home.quaintance.net`).
- **If you ever need a fixed API URL** (e.g. production build with separate API host): set `VITE_API_URL` in `docker-compose.yml` and rebuild the frontend.

## Step 3: Router Port Forwarding (For Internet Access)

If you want to access from outside your local network:

1. Log into your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Find **Port Forwarding** or **Virtual Server** settings
3. Add rules:
   - **Port 8000** → Forward to `192.168.1.98:8000` (Backend)
   - **Port 5173** → Forward to `192.168.1.98:5173` (Frontend)
4. Save and restart router if needed

**Security Warning:** Exposing ports directly to the internet is a security risk. Consider:
- Using a reverse proxy (nginx) with SSL/TLS
- Implementing rate limiting
- Using a VPN instead of direct port forwarding
- Restricting access by IP address if possible

## Step 4: Test External Access

### From Another Device on Your Network

1. Find your computer's IP: `192.168.1.98` (from ipconfig)
2. Access:
   - Frontend: `http://192.168.1.98:5173`
   - Backend API: `http://192.168.1.98:8000/api/v1/status`

### From the Internet (if port forwarding configured)

1. Find your public IP: Visit `https://whatismyipaddress.com`
2. Access:
   - Frontend: `http://YOUR_PUBLIC_IP:5173`
   - Backend API: `http://YOUR_PUBLIC_IP:8000/api/v1/status`

## Troubleshooting

### Port Still Not Accessible

1. **Check if ports are listening:**
   ```powershell
   netstat -an | Select-String ":8000|:5173"
   ```
   Should show `0.0.0.0:8000` and `0.0.0.0:5173` in LISTENING state.

2. **Check Docker container logs:**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Test locally first:**
   ```powershell
   # Test backend
   curl http://localhost:8000/api/v1/status
   
   # Test frontend (should return HTML)
   curl http://localhost:5173
   ```

4. **Check Windows Firewall:**
   ```powershell
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Q-CENTRAL*"}
   ```

### Frontend Can't Connect to Backend

If external users can see the frontend but get API errors:

1. Check browser console for CORS or network errors
2. Ensure the frontend is loaded from the same host you expect (relative `/api/v1` works when the page and API are same origin or proxied)
3. If you set `VITE_API_URL`, rebuild frontend after changing it: `docker-compose up -d --build frontend`

## Production Recommendations

For production deployment, consider:

1. **Use a reverse proxy (nginx)** to handle SSL/TLS and route traffic
2. **Use standard ports** (80 for HTTP, 443 for HTTPS)
3. **Set up SSL certificates** (Let's Encrypt is free)
4. **Use environment-specific configs** (separate dev/prod docker-compose files)
5. **Implement authentication** and rate limiting
6. **Use a domain name** instead of IP addresses
7. **Set up monitoring** and logging

For local hosting, the setup above is sufficient. GCP deployment is optional; see [gcp-deployment.md](gcp-deployment.md) only if you choose to deploy to the cloud.
