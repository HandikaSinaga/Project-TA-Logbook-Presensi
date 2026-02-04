# 🚀 Quick Deploy Script for Frontend

echo "=== Building Frontend for Production ==="
npm install
npm run build

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
