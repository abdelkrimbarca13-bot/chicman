#!/bin/bash

# Update code
echo "Pulling latest changes..."
git fetch origin
git reset --hard origin/main

# Update Backend
echo "Updating Backend..."
cd costume/backend
npm install
npx prisma generate
npx prisma migrate deploy
node scripts/fix-balances.js

# Update Frontend
echo "Updating Frontend..."
cd ../frontend
npm install
npm run build

# Restart Application
echo "Restarting application..."
pm2 restart all

echo "Deployment complete!"
