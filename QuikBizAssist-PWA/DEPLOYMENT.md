# Deployment Guide

## Netlify (Recommended)

1. Push `QuikBizAssist-PWA` to a GitHub repository.
2. Connect to Netlify: https://app.netlify.com
3. Select the repo, set build command: `npm install` (no build output needed)
4. Deploy. Netlify will auto-generate HTTPS URLs.
5. Update API Base URL in PWA to your QuikBizAssist API.

## Vercel

1. Push `QuikBizAssist-PWA` to GitHub.
2. Import to Vercel: https://vercel.com/import
3. No build config needed (static files).
4. Deploy.

## Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting  # select this directory
firebase deploy
```

## Docker (for local/self-hosted)

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

## Self-Hosted (Apache/Nginx)

Copy all files to your web server's root directory (e.g., `/var/www/quikbizassist/`).

### Nginx config:

```nginx
server {
    listen 443 ssl;
    server_name pwa.quiknu.com;
    
    ssl_certificate /etc/letsencrypt/live/pwa.quiknu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pwa.quiknu.com/privkey.pem;
    
    root /var/www/quikbizassist;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Service worker caching header
    location = /sw.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }
    
    # Static assets can be cached
    location ~* \.(js|css|png|jpg)$ {
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

Redirect HTTP to HTTPS:

```nginx
server {
    listen 80;
    server_name pwa.quiknu.com;
    return 301 https://$server_name$request_uri;
}
```

## Environment Configuration

For production, create a `config.js` file in the PWA root:

```javascript
// config.js
window.QBA_CONFIG = {
  API_BASE: 'https://api.quiknu.com',
  UPLOAD_TIMEOUT: 30000,
  MAX_IMAGE_SIZE: 5242880  // 5MB
};
```

Reference in `app.js`:

```javascript
const apiBase = window.QBA_CONFIG?.API_BASE || apiBaseEl.value;
```

Include in `index.html` before `app.js`:

```html
<script src="./config.js"></script>
<script src="./app.js"></script>
```

## HTTPS & SSL/TLS

All hosting platforms above provide free automatic HTTPS. For self-hosted:

- Use Let's Encrypt (free): `certbot certonly --standalone -d pwa.quiknu.com`
- Renew automatically with cron

## Monitoring & Analytics

Add Google Analytics or Plausible for PWA usage metrics.

## Support

For issues, check:
1. Browser console (F12) for client-side errors
2. Network tab for API call failures
3. Service worker status (Chrome DevTools > Application > Service Workers)
