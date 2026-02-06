# Cart-style order page (static)

This is a simple cart-like ordering page (no payments). It runs as static files and sends orders to a Make webhook.

## Files
- index.html
- style.css
- app.js

## 1) Configure products
Open `app.js` and edit the `PRODUCTS` list:
- `id` (unique)
- `name`
- `price` (number)
- `image` (URL)

## 2) Connect to Make (webhook)
1. In Make, create a Scenario
2. Add module: **Webhooks → Custom webhook**
3. Copy the webhook URL
4. Paste it into `app.js` as `MAKE_WEBHOOK_URL`
5. Turn the scenario ON

### Suggested payload (Make will receive this)
```json
{
  "name": "Customer Name",
  "phone": "+56 9 ...",
  "note": "",
  "items": [{"id":"pino","name":"Empanada de Pino","qty":2,"price":3900,"subtotal":7800}],
  "subtotal": 7800,
  "total": 7800,
  "timestamp": "2026-02-06T12:34:56Z"
}
```

## 3) Save to Google Sheets (one row per order)
In Make, after the webhook:
- Add: **Tools → JSON / Parse JSON** (optional; Make often detects automatically)
- Add: **Google Sheets → Add a Row**
  - Columns: Name, Phone, Note, Items, Subtotal, Total, Timestamp
  - Items can be a text like: `Empanada de Pino x2; Pollo-Queso x1`

If you prefer **one row per item**, use an Iterator in Make on `items`.

## 4) Publish
### Netlify (quick)
- Drag-and-drop the folder into Netlify “Deploy manually”
- You get a public link

### GitHub Pages
- Create a repo
- Upload these files
- Enable Pages in repo settings

## Notes
- This is client-side only. Don't put secrets in the code.
- Make webhook URL is okay to be public for simple orders, but you can add filtering in Make and rate limiting via Make/Cloudflare if needed.
