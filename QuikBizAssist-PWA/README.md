QuikBizAssist PWA

Quickstart:

1. Serve the project directory from a web server (HTTP/HTTPS). For camera features, use HTTPS or localhost.

```bash
npx serve .
```

2. Open the app and allow camera access.

Notes:
- Images are embedded as base64 in saved contact JSON. For production, switch to multipart upload to store files server-side.
# QuikBizAssist PWA

A Progressive Web App for scanning, OCR-ing, and managing business cards with contact information storage and product/pricing management.

## Features

- 📷 **Camera Capture** — Capture front/back of business cards in portrait or landscape mode
- 🤖 **OCR Recognition** — Extract text using Tesseract.js with auto-fill of contact fields
- 📦 **Contact Management** — Save contacts with category (Supplier/Buyer/Reseller), tags, and products
- 🔐 **Authentication** — JWT-based login for secure API access
- 📊 **Image Compression** — Automatic client-side compression before upload
- 💾 **Offline Support** — Service worker caching for offline-first experience
- 📱 **PWA Ready** — Installable on mobile and desktop

## Quick Start

### Local Development

```bash
npm install
npm start
```

This will serve the app at `http://localhost:3000` with CORS enabled.

### Production Deployment

Deploy to a static hosting service like:
- **Netlify**: Push to GitHub, auto-deploy
- **Vercel**: Push to GitHub, auto-deploy
- **Firebase Hosting**: `firebase init && firebase deploy`
- **AWS S3 + CloudFront**: Static site hosting with HTTPS

### HTTPS Requirement

Camera and service workers require HTTPS in production. Use:
- Let's Encrypt for free SSL certificates
- Cloudflare for easy SSL/TLS setup
- Netlify/Vercel (automatic HTTPS)

## Configuration

Before using, set the API Base URL in the app. Default is `https://api.quiknu.com`. Update your backend API endpoint in the login form.

### Environment Variables

For static hosting, update `app.js` to read from `window` globals or inject at build time.

## API Integration

The PWA communicates with the QuikBizAssist API:

- `POST /auth/login` — Get JWT token
- `POST /contacts` — Save new contact (requires auth)
- `PUT /contacts/:id` — Update existing contact (requires auth)
- `DELETE /contacts/:id` — Delete contact (requires auth)
- `POST /api/contacts/:contactId/products` — Add product/pricing (requires auth)
- `GET /api/contacts/:contactId/products` — Get contact products (requires auth)
- `POST /images/:userId/:contactId/images` — Upload front/back images (requires auth)

## Architecture

- **Frontend**: Vanilla JS, Tesseract.js, Canvas API
- **Storage**: LocalStorage (auth tokens), IndexedDB (optional)
- **PWA**: Service worker caching, manifest.json
- **Compression**: Canvas-based image resizing before upload
- **OCR**: Tesseract.js for text recognition and field auto-fill

## License

MIT
