# Arena Matrix - Quick Start Guide

## 🚀 Getting Started (3 Easy Steps)

### Step 1: Open the Application

**Option A - Standalone Version (Recommended for Quick Start):**
```
Simply open index-standalone.html in your web browser
```
✅ **Benefits:**
- Works immediately without any setup
- No server required
- No CORS issues
- Perfect for testing and local use

**Option B - Full Version (For Production):**
```
Use index.html with a local web server
```
See "Running with a Server" section below.

### Step 2: Explore the Dashboard

Once opened, you'll see:

1. **📊 Dashboard Geral** - Overview of all units
   - Total students across the network
   - Total revenue estimation
   - Number of active units
   - Global presence indicators

2. **🌐 Rede de Academias** - Network management
   - View all academies in list or map format
   - See detailed information for each unit
   - Click "Ver Detalhes" on any unit to see analytics

3. **💬 Matrix Hub** - Communication center
   - (Requires Firebase configuration)

### Step 3: Optional Enhancements

#### Add Your Gemini API Key (For AI Features)

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open `standalone-app.js` (for standalone version) or `config.js` (for full version)
3. Add your key:
   ```javascript
   const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
   ```
4. Save and reload the page

**AI Features Unlocked:**
- 🤖 Marketing Kit Generator
- 📊 SWOT Analysis
- 📈 Growth Predictions
- 🧠 Sensei Virtual Assistant

## 📱 Features Overview

### Dashboard Features
- **Real-time Statistics**: Total students, revenue, units, global presence
- **Performance Charts**: Visualize network growth
- **Top Units Ranking**: See which academies are leading
- **Theme Toggle**: Switch between financial and student metrics

### Network Management
- **List View**: Cards with detailed information
- **Map View**: Geographic visualization of all units
- **Unit Details**: Deep dive into any specific academy
- **Add New Units**: (Configure your own units in the code)

### Unit Detail Page
- **Operational Metrics**: Students, revenue, expenses
- **Historical Charts**: Track growth over time
- **AI Analysis**: Health check, SWOT, predictions (with API key)
- **Quick Actions**: Marketing, analysis, forecasting

## 🛠️ Customization

### Adding New Units

Edit the `mockFranchises` array in `standalone-app.js`:

```javascript
const mockFranchises = [
    // ... existing units
    {
        id: "6",
        name: "Your Academy Name",
        owner: "Professor Name",
        address: "Full Address",
        phone: "Phone Number",
        students: 50,
        revenue: 8000,
        expenses: 3000,
        lat: -23.5505,  // Your latitude
        lng: -46.6333   // Your longitude
    }
];
```

### Changing Colors

Edit `styles.css`:

```css
.orange-gradient {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

## 🖥️ Running with a Server

For the full version (`index.html`) with all features:

### Option 1: Python Server
```bash
cd ArenaHub
python3 -m http.server 8000
```
Open: http://localhost:8000

### Option 2: Node.js Server
```bash
npm install -g http-server
cd ArenaHub
http-server -p 8000
```
Open: http://localhost:8000

### Option 3: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## 🔧 Troubleshooting

### Stats Not Loading?
- ✅ Use `index-standalone.html` for local files
- ✅ Or run a local web server for `index.html`

### Charts Not Showing?
- Check if Chart.js is loaded (requires internet)
- Open browser console (F12) for error messages

### Map Not Displaying?
- Requires internet connection for Leaflet tiles
- Check GPS coordinates are valid

### AI Features Not Working?
- Add your Gemini API key
- Check browser console for API errors
- Verify you have internet connection

## 📚 File Structure Explained

```
ArenaHub/
├── index.html              # Full version (requires server)
├── index-standalone.html   # Standalone version (works directly)
├── styles.css             # All custom styles
├── config.js              # Configuration for full version
├── app.js                 # Full app logic with Firebase
├── standalone-app.js      # Standalone app logic
└── README.md              # Complete documentation
```

## 🎯 Next Steps

1. **Customize Your Data**: Add your own academies
2. **Add API Keys**: Enable AI features
3. **Configure Firebase**: For data persistence (optional)
4. **Deploy Online**: Use GitHub Pages, Netlify, or Vercel

## 💡 Tips & Tricks

### Mobile Access
The app is fully responsive! Open on any device.

### Keyboard Shortcuts
- `Esc` - Close modals
- `Enter` - Submit chat messages

### Performance
- Charts auto-scale based on data
- Maps only load when needed
- Optimized for smooth performance

### Data Management
- Standalone version uses browser memory
- Full version can sync with Firebase
- Export data manually from console

## 🆘 Getting Help

1. Check the main `README.md` for detailed documentation
2. Look at browser console (F12) for error messages
3. Verify all files are in the same directory
4. Ensure you have internet for external libraries

## 🎨 Customization Ideas

- Change the color scheme to match your brand
- Add more metrics to the dashboard
- Create custom reports and charts
- Integrate with your existing systems
- Add photo galleries for each unit

## ✨ Pro Tips

1. **Start Simple**: Use standalone version first
2. **Test with Mock Data**: Verify everything works
3. **Add Real Data**: Replace mock data with your actual units
4. **Enable AI Gradually**: Add API key when ready
5. **Deploy When Ready**: Move to production hosting

---

**Need More Help?** Check the full `README.md` file for comprehensive documentation!

🥋 **Boa Sorte com Arena Matrix!**
