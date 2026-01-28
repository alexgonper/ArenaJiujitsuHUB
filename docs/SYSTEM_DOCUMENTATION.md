# 🥋 Arena Jiu-Jitsu Hub - System Documentation

## 1. Executive Summary

**Arena Jiu-Jitsu Hub** is a comprehensive, AI-powered management ecosystem designed for the **Arena Jiu-Jitsu** network. It provides a centralized command center ("Arena Matrix") for headquarters to oversee the entire network of academies, and a dedicated portal ("Portal do Franqueado") for individual unit owners to manage their operations.

The system integrates real-time performance tracking, financial metrics, student management, and advanced AI features (via Google Gemini) to provide actionable insights, SWOT analyses, and marketing content generation.

---

## 2. System Architecture

The project follows a **Client-Server** architecture, capable of running in a fully integrated mode or a standalone demonstration mode.

### 2.1 Technology Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | Vanilla implementation for maximum performance and portability. |
| **Styling** | Tailwind CSS (via CDN) | Utility-first framework for rapid UI development. |
| **Visuals** | Chart.js, FontAwesome | Interactive charts and iconography. |
| **Maps** | Leaflet.js | Geospatial visualization of academy units. |
| **Backend** | Node.js + Express | RESTful API server. |
| **Database** | MongoDB | NoSQL database for flexible data modeling (Franchises, Directives, Students). |
| **AI Engine** | Google Gemini API | Generative AI for analytics, chat, and content creation. |
| **DevOps** | Shell Scripts | Automation for startup, teardown, and database seeding. |

### 2.2 Application Components

1.  **Arena Matrix (HQ Dashboard)**
    *   **Entry Point**: `index.html`
    *   **User**: Network Admins / Headquarters.
    *   **Features**: Global network stats, heatmap visualization, "AI Auditors" for unit health, strategic communications (Matrix Hub).

2.  **Franchisee Portal**
    *   **Entry Point**: `franqueado-premium.html`
    *   **User**: Unit Owners (Franchisees).
    *   **Features**: Unit-specific dashboard, Student/Teacher management, Financial overview, Message board.

3.  **Standalone Mode**
    *   **Entry Point**: `index-standalone.html` or `standalone-app.js` logic.
    *   **Purpose**: Demonstrations or fallback when the backend is offline. Uses internal mock data instead of API calls.

---

## 3. Installation & Setup

### 3.1 Prerequisites

*   **OS**: macOS (recommended for scripts), Linux, or Windows (manual setup required).
*   **Runtime**: [Node.js](https://nodejs.org/) (v18+).
*   **Database**: [MongoDB Community Edition](https://www.mongodb.com/try/download/community) (v7.0+).
*   **Utilities**: Python 3 (for serving frontend), `git`.

### 3.2 Automated Setup (macOS/Linux)

The system includes a robust master script to handle all services.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd ArenaHub
    ```

2.  **Run the Start Script**:
    ```bash
    ./start-all.sh
    ```
    *   This script will:
        *   Check for MongoDB installation (and install via Homebrew if missing).
        *   Start the MongoDB service.
        *   Install backend dependencies (`npm install`).
        *   Seed the database with initial data (optional prompt).
        *   Start the Backend API on port `5000`.
        *   Start the Frontend Server on port `8080`.

3.  **Access the Application**:
    *   Frontend: [http://localhost:8080](http://localhost:8080)
    *   Backend Health Check: [http://localhost:5000/health](http://localhost:5000/health)

### 3.3 Manual Setup

If the script cannot be used, follow these manual steps:

**Backend:**
```bash
cd server
npm install
# Create .env file (see Configuration section)
npm run seed  # Optional: Populates DB
npm run dev   # Starts server
```

**Frontend:**
```bash
# From the root directory (ArenaHub)
python3 -m http.server 8080
```

---

## 4. Configuration

### 4.1 Backend Environment (`server/.env`)

Create a `.env` file in the `server/` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arena-matrix
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:8080
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.2 Frontend Configuration (`config.js`)

Located in the root directory, `config.js` handles client-side settings:

```javascript
const appConfig = {
    apiBaseUrl: 'http://localhost:5000/api/v1',
    useMockData: false, // Set to true to force standalone mode
    enableFirebase: false // Optional persistence layer
};

const geminiConfig = {
    apiKey: "YOUR_API_KEY", // Required for AI features
    modelName: "gemini-2.0-flash"
};
```

---

## 5. API Reference

The backend exposes a RESTful API at `http://localhost:5000/api/v1`.

### Franchises
*   `GET /franchises` - List all units.
*   `GET /franchises/:id` - Get details for a specific unit.
*   `POST /franchises` - Create a new unit.
*   `GET /franchises/stats/network` - Get aggregated network metrics.

### Directives (Communications)
*   `GET /directives` - List official announcements.
*   `POST /directives` - Create a new directive (Admin only).

**Note**: Full API documentation can be explored via the code in `server/routes/`.

---

## 6. Directory Structure

```text
ArenaHub/
├── index.html              # HQ Dashboard entry point
├── franqueado-premium.html # Franchisee Portal entry point
├── styles.css              # Global styles & Tailwind utilities
├── app.js                  # Main HQ frontend logic
├── widgets-franchisee.js   # Franchisee frontend widgets
├── api-client.js           # Shared API wrapper class
├── config.js               # Global configuration
├── start-all.sh            # Master startup script
├── stop-all.sh             # Master teardown script
└── server/                 # Backend Application
    ├── server.js           # Server entry point
    ├── models/             # Mongoose Schemas (Franchise, Directive)
    ├── routes/             # API Route definitions
    ├── controllers/        # Business logic
    └── scripts/            # Database seeding scripts
```

## 7. Troubleshooting

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| **Map not loading** | Internet connection or Leaflet CDN issues. | Check network; verify Leaflet JS/CSS links in HTML head. |
| **Backend connection failed** | Server not running or wrong port. | Run `./start-all.sh` or check `server/.env`. |
| **AI features stuck** | Missing Gemini API Key. | Add valid key to `config.js` or `server/.env` depending on implementation. |
| **CORS Errors** | Frontend URL not allowed by backend. | Update `CORS_ORIGIN` in `server/.env`. |

## 8. Development Workflow

1.  **Modifying Frontend**: Changes to HTML/CSS/JS are reflected immediately upon refresh (ensure browser cache is disabled).
2.  **Modifying Backend**: The server uses `nodemon` (in dev mode) to auto-restart on file changes.
3.  **Database Inspection**: Use `check_db.js` in the root or a GUI like MongoDB Compass to inspect data.

---

*Generated by Antigravity - 2026*
