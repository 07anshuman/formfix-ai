# FormFix AI Deployment Guide

## 🚀 GitHub Deployment

### **1. Create GitHub Repository**

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `formfix-ai`
3. Make it public
4. Don't initialize with README (we already have one)

### **2. Push to GitHub**

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/formfix-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### **3. Enable GitHub Pages (Optional)**

For static dashboard deployment:
1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: main
4. Folder: `/dashboard/dist`

## 🌐 Live Deployment Options

### **Option 1: Vercel (Recommended)**

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect React app

2. **Configure Build Settings**
   ```bash
   Build Command: cd dashboard && npm run build
   Output Directory: dashboard/dist
   Install Command: npm run install-all
   ```

3. **Environment Variables**
   ```
   NODE_ENV=production
   ```

### **Option 2: Netlify**

1. **Deploy Dashboard**
   - Connect GitHub repository to Netlify
   - Build command: `cd dashboard && npm run build`
   - Publish directory: `dashboard/dist`

2. **Deploy Backend**
   - Use Netlify Functions for API
   - Or deploy backend separately on Railway/Heroku

### **Option 3: Railway**

1. **Deploy Backend**
   - Connect GitHub repository
   - Railway will auto-detect Node.js app
   - Set start command: `npm start`

2. **Environment Variables**
   ```
   PORT=3000
   NODE_ENV=production
   ```

### **Option 4: Heroku**

1. **Create Heroku App**
   ```bash
   heroku create formfix-ai
   git push heroku main
   ```

2. **Add Buildpacks**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

3. **Set Environment**
   ```bash
   heroku config:set NODE_ENV=production
   ```

## 🔧 Production Configuration

### **Environment Variables**

Create `.env` file:
```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
```

### **Database Setup (Optional)**

For production, consider adding a database:

```bash
# Install MongoDB or PostgreSQL
npm install mongoose
# or
npm install pg
```

### **Security Considerations**

1. **CORS Configuration**
   ```javascript
   app.use(cors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
   }));
   ```

2. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

3. **Helmet for Security**
   ```bash
   npm install helmet
   ```

## 📊 Monitoring & Analytics

### **Add Logging**

```bash
npm install winston
```

### **Health Check Endpoint**

Add to `server.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

## 🚀 Quick Deploy Commands

### **Vercel (One-click)**
```bash
npm install -g vercel
vercel
```

### **Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy
```

### **Railway**
```bash
npm install -g @railway/cli
railway login
railway up
```

## 📈 Performance Optimization

### **Dashboard Build**
```bash
cd dashboard
npm run build
```

### **Backend Optimization**
- Enable compression
- Add caching headers
- Optimize database queries

## 🔍 Troubleshooting

### **Common Issues**

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Clear npm cache: `npm cache clean --force`

2. **CORS Errors**
   - Update CORS origin in production
   - Check environment variables

3. **Port Issues**
   - Use `process.env.PORT` for production
   - Default to 3000 for development

### **Debug Commands**

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Test backend locally
npm start

# Test dashboard locally
cd dashboard && npm run dev
```

## Support

- **Issues**: Create GitHub issue
- **Documentation**: Check README.md


---

**FormFix AI** - Ready for production deployment! 🚀 
