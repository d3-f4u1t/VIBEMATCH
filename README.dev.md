# VIBEMATCH — Run in One Command

## Pick ONE

### Option A: Docker (packaged, recommended for "just runs")

**One-time setup (needs Admin + reboot once):**
```powershell
powershell -ExecutionPolicy Bypass -File setup-docker.ps1
# Click YES on UAC, let it install WSL, reboot when asked
# After reboot: open Docker Desktop, wait for "Engine running" (bottom-left green)
```

**Every day:**
```powershell
powershell -ExecutionPolicy Bypass -File docker-run.ps1
# or: docker compose up --watch
# first build is slow (downloads ML model), next runs are instant
```

**Stop:**
```powershell
powershell -ExecutionPolicy Bypass -File docker-run.ps1 -Down
# or: docker compose down
```

Check:
- API: http://localhost:8000/healthz  + docs http://localhost:8000/docs
- Website: http://localhost:5173
- Phone (same WiFi): http://<your-lan-ip>:8000/healthz

Live reload: edit `app/*.py` or `website/*` locally → container's `uvicorn --reload` / Vite HMR restarts instantly. No `docker build` on every edit. Changing `req.txt` or `Dockerfile` triggers rebuild automatically (`develop.watch`).

---

### Option B: No Docker (fastest today, no reboot)

Works **right now** without WSL/Docker. Uses your installed Python 3.11 + Node 24:

```powershell
powershell -ExecutionPolicy Bypass -File dev.ps1
# -> API http://localhost:8000/healthz  LAN http://<lan-ip>:8000 (phone uses this)
# -> Website http://localhost:5173
# -> Mobile: npm start --prefix mobile  (Expo Go 57 QR)
```

Or manually (2 terminals):
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
npm run dev --prefix website -- --host 0.0.0.0 --port 5173
npm start --prefix mobile  # separate terminal, scan QR
```

`dev.ps1` auto-creates `mobile/.env` with LAN IP and opens firewall port 8000.

---

## Which to use?
- **Want `docker compose up` and done?** → Option A (one reboot, then forever just `docker-run.ps1`)
- **Hack fast now?** → Option B (`dev.ps1`) — no Docker overhead, Expo Go identical

## Troubleshooting

| Problem | Fix |
|---|---|
| `docker: failed to connect to ... docker_engine` | Docker not running → run `setup-docker.ps1` once as Admin, reboot, open Docker Desktop |
| `WSL is not installed` | Same — `setup-docker.ps1` installs it |
| `vibematch.db` becomes a folder | `Remove-Item -Recurse vibematch.db; New-Item -ItemType File vibematch.db; docker compose up` (or just run `docker-run.ps1` which fixes it) |
| `npm install` slow in Docker | First build only; next `docker compose up` uses cache. `website/Dockerfile` caches deps |
| Phone can't reach API | Same WiFi? Test phone browser: `http://<lan-ip>:8000/healthz`. Check firewall: `netsh advfirewall firewall show rule name="VibeMatch 8000"` |
