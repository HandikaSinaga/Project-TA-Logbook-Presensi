# 🚀 Quick Deploy Script for Frontend

echo "=== Cleaning Previous Build ==="
rm -rf dist/ node_modules/.vite

echo ""
echo "=== Installing Dependencies ==="
npm install

echo ""
echo "=== Building Frontend for Production ==="
echo "ℹ️  Mode: production"
echo "ℹ️  API URL will automatically use /api for production build"
npm run build

echo ""
echo "=== Verifying Build ==="
echo "Checking for localhost references in bundle..."
if grep -rq "localhost:3001" dist/; then
    echo ""
    echo "⚠️  WARNING: localhost:3001 found in bundle!"
    echo "Files containing localhost:3001:"
    grep -r "localhost:3001" dist/ | head -5
    echo ""
    echo "Possible causes:"
    echo "1. Build not using production mode"
    echo "2. Vite cache not cleared"
    echo "3. Check frontend/src/utils/Constant.jsx"
    echo ""
    read -p "Continue deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
else
    echo "✅ Clean build - no localhost references"
fi

echo ""
echo "=== Deploying to Nginx ==="
sudo rm -rf /usr/share/nginx/logbook-presensi/*
sudo cp -r dist/* /usr/share/nginx/logbook-presensi/
sudo chown -R www-data:www-data /usr/share/nginx/logbook-presensi
sudo chmod -R 755 /usr/share/nginx/logbook-presensi

echo ""
echo "✅ Frontend deployed successfully!"
echo "🌐 Access: http://[YOUR_SERVER_IP]"
echo ""
echo "⚠️ Don't forget to clear browser cache (Ctrl+F5)"
