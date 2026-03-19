#!/bin/bash
set -e

echo "========================================="
echo "  CHIC - Script de deploiement VPS"
echo "========================================="

# Variables
APP_DIR="/root/app/chic"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# 1. Mise a jour systeme et installation des prerequis
echo ""
echo "[1/7] Installation des prerequis..."
apt-get update -y
apt-get install -y curl nginx

# Installer Node.js 20 si pas present
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
    echo "Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Installer PM2 globalement
echo ""
echo "[2/7] Installation de PM2..."
npm install -g pm2

# 2. Creer le repertoire de l'application
echo ""
echo "[3/7] Creation du repertoire $APP_DIR..."
mkdir -p "$APP_DIR"

# 3. Installation des dependances backend
echo ""
echo "[4/7] Installation des dependances backend..."
cd "$BACKEND_DIR"
npm install

# 4. Configuration du fichier .env backend
echo ""
echo "[5/7] Configuration du backend..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    cat > "$BACKEND_DIR/.env" << 'ENVEOF'
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="chic-costume-secret-key-2026"
PORT=5000
ENVEOF
    echo "Fichier .env cree."
else
    echo "Fichier .env existe deja, conservation."
fi

# Generation Prisma et migration
cd "$BACKEND_DIR"
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

# 5. Lancer le backend avec PM2
echo ""
echo "[6/7] Lancement du backend avec PM2..."
cd "$BACKEND_DIR"
pm2 delete chic-backend 2>/dev/null || true
pm2 start src/index.js --name chic-backend
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 6. Configurer Nginx
echo ""
echo "[7/7] Configuration de Nginx..."
cat > /etc/nginx/sites-available/chic << 'NGINXEOF'
server {
    listen 80;
    server_name 164.132.116.132;

    root /root/app/chic/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Activer le site et desactiver le default
ln -sf /etc/nginx/sites-available/chic /etc/nginx/sites-enabled/chic
rm -f /etc/nginx/sites-enabled/default

# Tester et redemarrer Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

echo ""
echo "========================================="
echo "  DEPLOIEMENT TERMINE AVEC SUCCES!"
echo "========================================="
echo ""
echo "  Frontend: http://164.132.116.132"
echo "  API:      http://164.132.116.132/api"
echo ""
echo "  PM2 status: pm2 status"
echo "  PM2 logs:   pm2 logs chic-backend"
echo "========================================="
