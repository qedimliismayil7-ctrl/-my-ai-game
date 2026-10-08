# Nuanza

Azərbaycan dili ilə işləyən tərcüməçilərin iş masası: sayt (Telegram Mini App kimi də açılır) və Telegram botu.
Hamısı bir Cloudflare Worker-də işləyir. AI üçün Google Gemini istifadə olunur.

- **Peşəkar rejim:** iş masası, tərcüməçi (Danışıq / Neytral / Rəsmi / Hüquqi), layihələr, seqment redaktoru, keyfiyyət yoxlaması (QA), Mirzə Məclisi.
- **Akademiya:** tapşırıqlar, yoxlama, oyunlar, yaddaş kartları, inkişaf.
- **Nuanza:** hər ekranda yanınızda olan köməkçi qız.

## Qovluqlar

| Yol | Nədir |
|---|---|
| `public/` | Sayt: `index.html`, `app.css`, `app.js` (qabıq), `s-*.js` (ekranlar), `nuanza.js` (köməkçi), `meclis.js` (Mirzə Məclisi) |
| `public/ai/` | Real AI: `core.js` (`/api` ilə əlaqə və ümumi qaydalar) və hər iş növü üçün adapter |
| `src/server.js` | Worker: statik fayllar, `/api` (Gemini), `/tg` (Telegram botu), `/setup` |
| `build.mjs` | Hamısını tək `dist/worker.js` faylına yığır |
| `docs/` | Dizayn sistemi, strategiya, tərcümə mühərriki planı, köhnə promptlar |

## Yayımlamaq

### Variant A — Cloudflare redaktoru (ən sadə)

1. `dist/worker.js` faylını açın və bütün mətni kopyalayın (və ya `node build.mjs` ilə özünüz yaradın).
2. Cloudflare → **Workers & Pages** → worker-iniz → **Edit code**.
3. Köhnə kodu silin, yenisini yapışdırın, **Deploy** basın.
4. **Settings → Variables and Secrets**:
   - `GEMINI_KEY` — məcburi (Secret)
   - `ACCESS_CODE` — tövsiyə olunur. Sayta və AI-a giriş kodu. İstifadəçilər onu **Ayarlar → Hesab** bölməsinə yazır.
   - `TG_TOKEN` — Telegram botu üçün (Secret)
   - `TG_ALLOWED` — istəyə bağlı: botdan istifadə edə bilən Telegram ID-ləri, vergüllə
   - `API_LIMIT` — istəyə bağlı: bir IP üçün 10 dəqiqədə AI sorğusu (standart 40)
   - `MODEL` — istəyə bağlı: standart `gemini-flash-latest`
5. Bir dəfə açın: `https://SİZİN-ÜNVAN/setup?key=ACCESS_CODE`. Səhifə Gemini açarını yoxlayır və Telegram botunu sayta bağlayır.

### Variant B — wrangler

```bash
npx wrangler secret put GEMINI_KEY
npx wrangler secret put ACCESS_CODE
npx wrangler secret put TG_TOKEN
npm run deploy
```

## Təhlükəsizlik

- `ACCESS_CODE` qoyulubsa, `/api` və `/setup` kodsuz işləmir.
- `/api`-də hər IP üçün sorğu limiti var, mətn 30 000 simvolla məhdudlaşır.
- Telegram webhook-u gizli başlıqla yoxlanılır; botda da hər söhbət üçün limit var.
- Müştəri sənədləri Google Gemini-yə göndərilir. Pullu Gemini açarı (məlumatı modelin öyrədilməsində istifadə etmir) tövsiyə olunur. Google Cloud-da büdcə xəbərdarlığı qoyun.

## Lokal yoxlama

```bash
node build.mjs            # dist/worker.js
node --check dist/worker.js
```
