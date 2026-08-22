# EduQueue Production Deployment Guide (Ubuntu Server)

This guide provides step-by-step instructions for deploying **EduQueue: Web-Based Student Service Appointment and Queue Management System** on a fresh **Ubuntu Server 22.04 LTS or 24.04 LTS** instance.

---

## 1. Target Server Architecture

```
Internet (Port 80 / 443)
        │
        ▼
[ UFW Firewall: 22 (SSH), 80 (HTTP), 443 (HTTPS) ]
        │
        ▼
[ Nginx Web Server (Reverse Proxy & Static File Delivery) ]
  ├── Location /     ──> /var/www/eduqueue/frontend/dist (React SPA)
  └── Location /api  ──> FastCGI ──> PHP 8.2-FPM (unix:/var/run/php/php8.2-fpm.sock)
                                            │
                                            ▼
                     [ MySQL 8.0 Database (127.0.0.1:3306) ]
                                            │
                                            ▼
                     [ External Transactional Email API ]
```

---

## 2. Server Prerequisites

- **Operating System:** Ubuntu 22.04 LTS / 24.04 LTS (64-bit)
- **Minimum Specs:** 1 vCPU, 1 GB RAM, 20 GB SSD
- **Network:** Static Public IP, Domain Name pointed to server IP (optional for SSL)

---

## 3. Step-by-Step Installation

### Step 1: Connect via OpenSSH and Update Packages
```bash
ssh deploy@YOUR_SERVER_IP

sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git unzip software-properties-common ufw openssh-server
```

---

### Step 2: Configure UFW Firewall Security
Lock down all ports except SSH, HTTP, and HTTPS:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # OpenSSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status verbose
```

---

### Step 3: Install PHP 8.2 and Required Extensions
```bash
sudo add-apt-repository -y ppa:ondrej/php
sudo apt-get update -y
sudo apt-get install -y php8.2-fpm php8.2-mysql php8.2-curl php8.2-mbstring php8.2-xml php8.2-zip php8.2-gd
```

Verify PHP-FPM is running:
```bash
sudo systemctl status php8.2-fpm
```

---

### Step 4: Install and Secure MySQL 8.0
```bash
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

Run MySQL security hardening:
```bash
sudo mysql_secure_installation
```

---

### Step 5: Install Node.js 20 LTS (For Frontend Build)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v # Should display v20.x.x
npm -v
```

---

### Step 6: Deploy Application Code & Set Permissions
Clone or upload the repository to `/var/www/eduqueue`:
```bash
sudo mkdir -p /var/www/eduqueue
# Copy your repository files into /var/www/eduqueue

# Set permissions for web server user (www-data)
sudo chown -R www-data:www-data /var/www/eduqueue
sudo chmod -R 755 /var/www/eduqueue
sudo chmod -R 775 /var/www/eduqueue/backend/storage
```

---

### Step 7: Configure Environment Variables
Copy and configure the backend `.env`:
```bash
cd /var/www/eduqueue/backend
sudo cp .env.example .env
sudo nano .env
```

Set your production database credentials and Email API key:
```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=student_services_db
DB_USERNAME=root
DB_PASSWORD=your_secure_mysql_password

JWT_SECRET=your_long_random_production_secret_key_change_me_2026

# Email API (resend, brevo, sendgrid, or smtp)
MAIL_DRIVER=resend
MAIL_API_KEY=re_your_api_key_here
MAIL_FROM_ADDRESS=notifications@yourdomain.com
MAIL_FROM_NAME="SRCB Student Services"
```

---

### Step 8: Initialize Database Schema & Seed Data
```bash
sudo mysql -u root -p < /var/www/eduqueue/database/schema.sql
sudo mysql -u root -p < /var/www/eduqueue/database/seeds.sql
```

---

### Step 9: Build React Frontend
```bash
cd /var/www/eduqueue/frontend
sudo npm install
sudo npm run build
```
This produces the optimized production bundle in `/var/www/eduqueue/frontend/dist`.

---

### Step 10: Configure Nginx Virtual Host
Copy the provided Nginx configuration:
```bash
sudo cp /var/www/eduqueue/deploy/nginx.conf /etc/nginx/sites-available/eduqueue.conf
sudo ln -sf /etc/nginx/sites-available/eduqueue.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### Step 11: Setup Free SSL/TLS via Let's Encrypt (Certbot)
If you have a public domain pointed to your server:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 4. Default Demonstration Accounts

| Role | Email | Student ID | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@srcb.edu.ph` | N/A | `password123` | Full system governance, services CRUD, schedule configuration, user provisioning, audit & email logs |
| **Staff Personnel** | `staff@srcb.edu.ph` | N/A | `password123` | Appointment approvals/declines/rescheduling, Queue counter calling & servicing |
| **Student (Demo 1)** | `student1@srcb.edu.ph` | `2026-0001` | `password123` | Appointment booking, queue ticket issuance, live position monitoring |
| **Student (Demo 2)** | `student2@srcb.edu.ph` | `2026-0002` | `password123` | Appointment booking, queue ticket issuance |

---

## 5. Maintenance & Troubleshooting

- **Check Nginx Access & Error Logs:**
  ```bash
  sudo tail -f /var/log/nginx/eduqueue_error.log
  ```
- **Check PHP-FPM Logs:**
  ```bash
  sudo tail -f /var/log/php8.2-fpm.log
  ```
- **Check Application Mail Logs:**
  ```bash
  cat /var/www/eduqueue/backend/storage/logs/mail.log
  ```
- **Restart Services:**
  ```bash
  sudo systemctl restart nginx
  sudo systemctl restart php8.2-fpm
  sudo systemctl restart mysql
  ```
