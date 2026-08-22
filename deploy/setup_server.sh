#!/usr/bin/env bash
# =====================================================================
# Automated Ubuntu Server Provisioning Script for EduQueue
# Target: Ubuntu 22.04 LTS / 24.04 LTS
# Installs: Nginx, PHP 8.2-FPM, MySQL 8.0, Node.js 20, UFW Firewall
# =====================================================================

set -e

echo "=========================================================="
echo "  EduQueue Student Services - Ubuntu Server Setup Script  "
echo "=========================================================="

# 1. Update OS packages
echo "[1/8] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git unzip software-properties-common ufw openssh-server

# 2. Configure UFW Firewall
echo "[2/8] Configuring UFW Firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # OpenSSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
echo "y" | sudo ufw enable

# 3. Install Nginx & PHP 8.2 with required extensions
echo "[3/8] Installing Nginx and PHP 8.2-FPM..."
sudo add-apt-repository -y ppa:ondrej/php
sudo apt-get update -y
sudo apt-get install -y nginx php8.2-fpm php8.2-mysql php8.2-curl php8.2-mbstring php8.2-xml php8.2-zip php8.2-gd

# 4. Install MySQL 8.0 Server
echo "[4/8] Installing MySQL Server..."
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# 5. Install Node.js 20 (for building React frontend)
echo "[5/8] Installing Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 6. Setup Application Directory & Permissions
echo "[6/8] Setting up application directory..."
sudo mkdir -p /var/www/eduqueue
# Copy project files if script is run inside repo directory
if [ -d "./frontend" ] && [ -d "./backend" ]; then
    sudo cp -r . /var/www/eduqueue/
fi

# Set directory permissions
sudo chown -R www-data:www-data /var/www/eduqueue
sudo chmod -R 755 /var/www/eduqueue
sudo chmod -R 775 /var/www/eduqueue/backend/storage

# 7. Build React Frontend
echo "[7/8] Building Frontend..."
cd /var/www/eduqueue/frontend
sudo npm install
sudo npm run build

# 8. Setup Database & Nginx
echo "[8/8] Initializing Database & Nginx..."
sudo mysql < /var/www/eduqueue/database/schema.sql
sudo mysql < /var/www/eduqueue/database/seeds.sql

sudo cp /var/www/eduqueue/deploy/nginx.conf /etc/nginx/sites-available/eduqueue.conf
sudo ln -sf /etc/nginx/sites-available/eduqueue.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm

echo "=========================================================="
echo "  EduQueue Successfully Deployed on Ubuntu Server!        "
echo "  Access via server IP or domain in your web browser.     "
echo "=========================================================="
