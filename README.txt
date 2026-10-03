Pocket - installable version

This folder is the same app, packaged so a phone or computer can install it and run it offline.

To use it
1. Upload every file in this folder to any static web host that serves HTTPS
   (GitHub Pages, Netlify, Cloudflare Pages, Vercel, or your own server).
2. Open the address on your phone or desktop.
3. Install it: Chrome/Edge show "Install app" in the menu; on iPhone use Share > Add to Home Screen.
   Settings & backup inside the app also shows an Install button where the browser supports it.

Good to know
- Data is stored in that browser on that device only. Nothing is uploaded.
- To move data between devices, use Export backup on one and Restore from backup on the other.
- After uploading a changed index.html, bump VERSION in sw.js so installed copies refresh.
- Opening index.html straight from disk works as a normal page, but install and offline need HTTPS hosting.
