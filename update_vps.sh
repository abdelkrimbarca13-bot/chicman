#!/bin/bash
# Script de mise a jour du VPS
set -e

echo "=== CONNEXION AU VPS POUR METTRE A JOUR L'APPLICATION ==="

ssh -o StrictHostKeyChecking=no root@164.132.116.132 << 'ENDSSH'
set -e
echo "[1/4] Téléchargement des nouveautés depuis Github..."
cd /root/repo/chicman
git pull

echo "[2/4] Mise à jour du Backend..."
cd /root/repo/chicman/costume/backend
npm install
npx prisma db push --accept-data-loss
pm2 restart chic-backend

echo "[3/4] Mise à jour du Frontend (Construction en cours)..."
cd /root/repo/chicman/costume/frontend
npm install
npm run build

echo "[4/4] Déploiement du Frontend..."
cp -R dist/* /var/www/chic/
systemctl restart nginx

echo "=== MISE À JOUR TERMINÉE AVEC SUCCÈS ! ==="
ENDSSH
