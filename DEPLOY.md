# Canlıya Alma Rehberi (Kredi Kartı Gerektirmez)

Bu rehber, **UpScholl** projesini ücretsiz ve kredi kartı istemeyen servislerle canlıya alır:

| Katman | Servis | Neden |
|--------|--------|-------|
| **Veritabanı** | [Aiven PostgreSQL](https://aiven.io/free-tier) | Managed Postgres, kalıcı ücretsiz katman, **kredi kartı yok** |
| **Backend (FastAPI)** | [Render](https://render.com) | Docker deploy, GitHub entegrasyonu, **kredi kartı yok** (free tier) |
| **Frontend (Vite)** | [Cloudflare Pages](https://pages.cloudflare.com) | CDN, HTTPS, **kredi kartı yok** |
| **CI** | GitHub Actions | Her push'ta test + build (repo'da hazır) |

> **Not:** Render free tier'da 15 dakika hareketsizlikten sonra servis uyur; ilk istek 10–30 sn sürebilir (cold start). Portfolio / demo için yeterli; production SLA için ücretli plan gerekir.

---

## Ön koşullar

- GitHub repo: `muhammetbatuhandogan/UpScholl_301_Project`
- Docker Desktop (yerel test için, opsiyonel)
- Render, Aiven, Cloudflare hesapları (hepsi ücretsiz kayıt, kart gerekmez)

---

## Adım 1 — Aiven PostgreSQL (veritabanı)

1. [aiven.io](https://aiven.io) → **Sign up** (kredi kartı istemez).
2. **Create service** → **PostgreSQL** → **Free plan**.
3. Region seç (Avrupa: `aws-eu-central-1` vb.).
4. Servis hazır olunca **Connection information** → **URI** kopyala.
   - Örnek: `postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require`
5. FastAPI/SQLAlchemy için URI kullan:
   - Tercih: `postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require`
   - Aiven bazen `postgres://` verir; kod bunu otomatik `postgresql://` yapar, yine de `postgresql://` kullanmak daha güvenli.

Bu URL'yi bir yere kaydet — **Adım 2**'de `DATABASE_URL` olarak kullanacaksın.

---

## Adım 2 — Render (backend API)

1. [render.com](https://render.com) → GitHub ile kayıt ol.
2. **New +** → **Blueprint** (veya **Web Service**).
3. Repo'yu bağla: `UpScholl_301_Project`.
4. Blueprint kullanıyorsan repo kökündeki `render.yaml` otomatik okunur.
5. **Environment variables** ekle:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Aiven connection string (Adım 1) |
| `OTP_DEBUG` | `false` |
| `CORS_ORIGINS` | Cloudflare Pages URL'in (Adım 3'ten sonra), örn. `https://upscholl.pages.dev` |
| `CRON_SECRET` | Güçlü rastgele bir string (opsiyonel, bildirim cron için) |

6. Deploy başlasın. Bitince URL alırsın: `https://upscholl-api.onrender.com` (isim değişebilir).
7. Doğrula:
   - `https://YOUR-API.onrender.com/health` → `"database": "connected"`
   - `https://YOUR-API.onrender.com/docs` → Swagger UI

**Manuel Web Service** (Blueprint yerine):
- Runtime: **Docker**
- Root Directory: `backend`
- Dockerfile path: `Dockerfile`
- Health check path: `/health`

Container başlarken `scripts/start.sh` otomatik **Alembic migration** çalıştırır.

---

## Adım 3 — Cloudflare Pages (frontend)

> **Önemli:** **Workers** değil, **Pages** oluştur. Workers ekranında `Deploy command: npx wrangler deploy` görürsen yanlış yerdesin. Pages’te **Build output directory** alanı vardır; deploy command gerekmez.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** sekmesi → **Connect to Git**.
   - **Create Worker** / sadece Wrangler deploy ekranı **değil**.
2. GitHub repo'yu seç: `UpScholl_301_Project`.
3. Build ayarları:

| Alan | Değer |
|------|-------|
| Framework preset | None |
| Build command | `npm ci && npm run build --workspace frontend` |
| Build output directory | `frontend/dist` |
| Root directory | `/` (repo kökü) |

4. **Environment variables** (Production):

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Render backend URL, örn. `https://upscholl-api.onrender.com` |

5. Deploy et. URL: `https://upscholl-301-project.pages.dev` (proje adına göre değişir).

6. Render'daki `CORS_ORIGINS` değerini bu Cloudflare URL ile güncelle ve backend'i **redeploy** et.

---

## Adım 4 — Uçtan uca test

1. Frontend URL'ini aç.
2. **Dashboard** → demo login:
   - Username: `demo`
   - Password: `demo123`
3. Görev CRUD çalışıyor mu kontrol et.
4. `/health` linki backend'e bağlanıyor mu bak.
5. Onboarding / Bag / Family / Emergency sekmeleri şu an **localStorage** kullanıyor (backend API'ye tam bağlı değil); UI smoke test yeterli.

---

## Yerel production test (Docker)

Backend imajını yerelde dene:

```bash
docker build -t upscholl-api ./backend
docker run --rm -p 8000:8000 ^
  -e DATABASE_URL="postgresql://upscholl:upscholl_dev@host.docker.internal:5432/upscholl" ^
  -e PORT=8000 ^
  upscholl-api
```

Postgres için önce `docker compose up -d` (repo kökü).

Frontend production build:

```bash
npm ci
set VITE_API_URL=http://localhost:8000
npm run build --workspace frontend
npm run preview --workspace frontend
```

---

## GitHub Actions CI

`.github/workflows/ci.yml` her `main` push ve PR'da:

- Backend: Postgres service + migration + pytest
- Frontend: `npm run build`
- Docker: backend image build

Push sonrası GitHub → **Actions** sekmesinden yeşil tick kontrol et.

---

## Ortam değişkenleri özeti

### Backend (Render)

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `DATABASE_URL` | Evet | Aiven PostgreSQL URI |
| `CORS_ORIGINS` | Evet (prod) | Frontend origin(ler), virgülle ayrılmış |
| `OTP_DEBUG` | Hayır | Prod'da `false` |
| `NETGSM_*` | Hayır | SMS (OTP/SOS) için |
| `CRON_SECRET` | Hayır | `POST /api/notifications/run-due` |
| `ENABLE_NOTIFICATION_SCHEDULER` | Hayır | Prod'da genelde `false`; cron endpoint kullan |

### Frontend (Cloudflare Pages)

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `VITE_API_URL` | Evet | Render backend URL (sonunda `/` yok) |

---

## Sıradaki geliştirmeler (deploy sonrası)

- [ ] Frontend modüllerini backend API'ye bağla (onboarding, bag, family, emergency)
- [ ] Custom domain (Cloudflare + Render)
- [ ] Mobil istemci (React Native / Expo) — backend hazır
- [ ] Netgsm production SMS anahtarları

---

## Sorun giderme

| Sorun | Çözüm |
|-------|-------|
| `/health` → database unavailable | `DATABASE_URL` doğru mu? `sslmode=require` var mı? Aiven IP allowlist kapalı mı? |
| CORS hatası | `CORS_ORIGINS` frontend URL'ini içeriyor mu? |
| 502 / cold start | Render free tier uyku — 30 sn bekle, tekrar dene |
| Migration hatası | Render logs → `alembic upgrade head` çıktısına bak |
| Frontend eski API'ye gidiyor | Cloudflare'de `VITE_API_URL` doğru mu? Redeploy gerekir (build-time env) |
