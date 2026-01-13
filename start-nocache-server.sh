#!/bin/bash

# Clear Browser Cache Helper Script
# This script helps force browser cache reload

echo "🔄 Arena Hub - Force Cache Clear"
echo "================================"
echo ""

# Kill existing server on port 8080
echo "1. Stopping existing server on port 8080..."
ps aux | grep "python3 -m http.server 8080" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
sleep 1

# Start server with cache-control headers disabled
echo "2. Starting server with no-cache headers..."
cd "$(dirname "$0")"

# Create a simple Python server that disables caching
cat > /tmp/nocache_server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 8080
Handler = NoCacheHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()
EOF

chmod +x /tmp/nocache_server.py
python3 /tmp/nocache_server.py &

echo ""
echo "✅ Server started on port 8080 with NO CACHE headers"
echo ""
echo "📋 Next steps:"
echo "1. Close ALL browser tabs for localhost:8080"
echo "2. Open a NEW tab"
echo "3. Go to: http://localhost:8080/franqueado-login.html"
echo "4. Open DevTools (F12)"
echo "5. You should see: 🔧 FRANCHISE CLIENT v104 LOADED"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

wait
