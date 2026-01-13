# 🚀 AWS Deployment Guide

Complete guide to deploy **Sistem Presensi & Logbook** to Amazon Web Services (AWS).

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [AWS Services Setup](#aws-services-setup)
4. [Backend Deployment (EC2)](#backend-deployment-ec2)
5. [Database Setup (RDS)](#database-setup-rds)
6. [File Storage (S3)](#file-storage-s3)
7. [Frontend Deployment (S3 + CloudFront)](#frontend-deployment-s3--cloudfront)
8. [Domain & SSL (Route 53 + ACM)](#domain--ssl-route-53--acm)
9. [Monitoring & Logging](#monitoring--logging)
10. [Security Best Practices](#security-best-practices)
11. [Cost Optimization](#cost-optimization)
12. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
                                 ┌─────────────────┐
                                 │   CloudFront    │
                                 │  (CDN + HTTPS)  │
                                 └────────┬────────┘
                                          │
                           ┌──────────────┴──────────────┐
                           │                             │
                    ┌──────▼──────┐              ┌──────▼──────┐
                    │   Route 53  │              │      S3     │
                    │    (DNS)    │              │  (Frontend) │
                    └──────┬──────┘              └─────────────┘
                           │
                    ┌──────▼──────┐
                    │     ALB     │
                    │(Load Balance│
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼──────┐          ┌──────▼──────┐
       │   EC2 (1)   │          │   EC2 (2)   │
       │  (Backend)  │          │  (Backend)  │
       └──────┬──────┘          └──────┬──────┘
              │                         │
              └────────────┬────────────┘
                           │
                  ┌────────▼────────┐
                  │   RDS MySQL     │
                  │   (Database)    │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │   S3 Bucket     │
                  │   (Uploads)     │
                  └─────────────────┘
```

---

## ✅ Prerequisites

-   **AWS Account** with billing enabled
-   **AWS CLI** installed and configured
-   **Domain name** (optional but recommended)
-   **SSH key pair** for EC2 access
-   **Git** installed
-   **Node.js** 22.x knowledge

### Install AWS CLI

**Windows:**

```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Linux/Mac:**

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: ap-southeast-1  (Singapore)
# Default output format: json
```

---

## 🗄️ Database Setup (RDS)

### Step 1: Create RDS MySQL Instance

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name presensi-db-subnet \
  --db-subnet-group-description "Subnet group for Presensi DB" \
  --subnet-ids subnet-xxx subnet-yyy \
  --tags Key=Name,Value=PresensiDBSubnet

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier presensi-database \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password YourStrongPassword123! \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxx \
  --db-name db_presensi_ta \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --publicly-accessible \
  --multi-az false \
  --tags Key=Name,Value=PresensiDatabase
```

### Step 2: Configure Security Group

Allow MySQL port 3306 from EC2 security group:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 3306 \
  --source-group sg-yyyyy
```

### Step 3: Get RDS Endpoint

```bash
aws rds describe-db-instances \
  --db-instance-identifier presensi-database \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

Save this endpoint for backend `.env` configuration.

---

## 📦 File Storage (S3)

### Step 1: Create S3 Bucket for Uploads

```bash
# Create bucket
aws s3 mb s3://presensi-uploads --region ap-southeast-1

# Configure bucket policy for public read (uploads folder only)
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::presensi-uploads/public/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket presensi-uploads \
  --policy file://bucket-policy.json

# Enable CORS
cat > cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket presensi-uploads \
  --cors-configuration file://cors.json
```

### Step 2: Create IAM User for S3 Access

```bash
# Create IAM user
aws iam create-user --user-name presensi-s3-user

# Attach S3 policy
cat > s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::presensi-uploads/*",
        "arn:aws:s3:::presensi-uploads"
      ]
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name presensi-s3-user \
  --policy-name PresensiS3Access \
  --policy-document file://s3-policy.json

# Create access keys
aws iam create-access-key --user-name presensi-s3-user
# Save the AccessKeyId and SecretAccessKey
```

---

## 🖥️ Backend Deployment (EC2)

### Step 1: Launch EC2 Instance

```bash
# Create key pair
aws ec2 create-key-pair \
  --key-name presensi-key \
  --query 'KeyMaterial' \
  --output text > presensi-key.pem

chmod 400 presensi-key.pem

# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Amazon Linux 2023
  --instance-type t3.micro \
  --key-name presensi-key \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=PresensiBackend}]' \
  --user-data file://user-data.sh
```

### Step 2: Create User Data Script

Create `user-data.sh`:

```bash
#!/bin/bash
# Update system
yum update -y

# Install Node.js 22.x
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
yum install -y nodejs git

# Install PM2
npm install -g pm2

# Create app directory
mkdir -p /var/www/presensi
cd /var/www/presensi

# Clone repository
git clone https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi.git .

# Install backend dependencies
cd backend
npm install --production

# Create .env file (will be configured manually later)
touch .env

# Setup PM2
pm2 start index.js --name presensi-api
pm2 startup
pm2 save

# Configure firewall
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload

echo "Backend setup complete!"
```

### Step 3: SSH and Configure Backend

```bash
# SSH to EC2
ssh -i presensi-key.pem ec2-user@<ec2-public-ip>

# Navigate to backend
cd /var/www/presensi/backend

# Edit .env file
nano .env
```

Configure `.env`:

```env
# Application
APP_PORT=3001
NODE_ENV=production

# Database (RDS Endpoint)
DB_HOST=presensi-database.xxxxx.ap-southeast-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourStrongPassword123!
DB_NAME=db_presensi_ta

# JWT
JWT_SECRET=your_production_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_production_refresh_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_s3_access_key
AWS_SECRET_ACCESS_KEY=your_s3_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=presensi-uploads

# CORS (ALB domain)
CORS_ORIGIN=https://presensi.yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://api.presensi.yourdomain.com/auth/google/callback
```

### Step 4: Run Database Migrations

```bash
# Run migrations
npx sequelize-cli db:migrate

# Seed initial data
npx sequelize-cli db:seed:all

# Restart PM2
pm2 restart presensi-api
pm2 logs presensi-api  # Check logs
```

### Step 5: Configure Nginx Reverse Proxy

**Important:** Nginx serves the **built `dist/` folder**, not the entire frontend directory.

```bash
# Install Nginx
sudo yum install nginx -y

# Configure Nginx for backend API
sudo nano /etc/nginx/conf.d/presensi-api.conf
```

Add backend API configuration:

```nginx
server {
    listen 80;
    server_name api.presensi.yourdomain.com;

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /home/ec2-user/project-ta/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**For serving frontend with Nginx (Alternative to S3+CloudFront):**

```bash
# Configure Nginx for frontend
sudo nano /etc/nginx/conf.d/presensi-frontend.conf
```

Add frontend configuration:

```nginx
server {
    listen 80;
    server_name presensi.yourdomain.com;

    # Root directory is the BUILT dist/ folder
    root /home/ec2-user/project-ta/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Reload after config changes
sudo systemctl reload nginx
```

---

## 🌐 Frontend Deployment Options

### Option 1: Nginx Static Server (Recommended for Simple Setup)

#### Step 1: Build Frontend Locally

```bash
# On your local machine or CI/CD
cd frontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production <<EOF
VITE_API_URL=https://api.presensi.yourdomain.com
VITE_SOCKET_URL=https://api.presensi.yourdomain.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
EOF

# Build for production (output: dist/ folder)
npm run build

# Verify build output
ls -lh dist/
```

**Expected build output:**

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
└── vite.svg
```

#### Step 2: Upload Built Files to Server

```bash
# Using SCP
scp -r dist/* ec2-user@your-ec2-ip:/home/ec2-user/project-ta/frontend/dist/

# Or using rsync (recommended)
rsync -avz --delete dist/ ec2-user@your-ec2-ip:/home/ec2-user/project-ta/frontend/dist/
```

#### Step 3: Configure Nginx (Already configured above)

The Nginx configuration serves the **`dist/` folder**, not the entire frontend directory.

```bash
# Verify dist folder on server
ls -lh /home/ec2-user/project-ta/frontend/dist/

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 4: Test Frontend

```bash
# Visit your domain
https://presensi.yourdomain.com

# Check browser console for API calls
# Should see requests to: https://api.presensi.yourdomain.com/api/
```

---

### Option 2: S3 + CloudFront (Recommended for Production)

#### Step 1: Build Frontend

```bash
# Same build process as Option 1
cd frontend
npm run build
```

#### Step 2: Create S3 Bucket

```bash
# On your local machine
cd frontend

# Update .env.production
cat > .env.production <<EOF
VITE_API_URL=https://api.presensi.yourdomain.com
VITE_SOCKET_URL=https://api.presensi.yourdomain.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
EOF

# Build for production
npm run build

# Output will be in dist/ folder
```

### Step 2: Create S3 Bucket for Frontend

```bash
# Create bucket
aws s3 mb s3://presensi-frontend --region ap-southeast-1

# Configure for static website hosting
aws s3 website s3://presensi-frontend \
  --index-document index.html \
  --error-document index.html

# Set bucket policy
cat > frontend-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::presensi-frontend/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket presensi-frontend \
  --policy file://frontend-policy.json
```

### Step 3: Upload Build Files

```bash
# Upload dist folder to S3
aws s3 sync dist/ s3://presensi-frontend --delete

# Set cache headers
aws s3 sync dist/ s3://presensi-frontend \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --delete

# index.html without caching
aws s3 cp dist/index.html s3://presensi-frontend/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

### Step 4: Setup CloudFront CDN

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name presensi-frontend.s3-website-ap-southeast-1.amazonaws.com \
  --default-root-object index.html

# Wait for distribution to deploy (15-20 minutes)
aws cloudfront wait distribution-deployed \
  --id E1234567890ABC
```

Or use AWS Console:

1. Navigate to CloudFront
2. Click "Create Distribution"
3. **Origin Settings:**
    - Origin Domain: `presensi-frontend.s3.ap-southeast-1.amazonaws.com`
    - Origin Path: (leave empty)
    - Name: `S3-presensi-frontend`
4. **Default Cache Behavior:**
    - Viewer Protocol Policy: `Redirect HTTP to HTTPS`
    - Allowed HTTP Methods: `GET, HEAD, OPTIONS`
    - Cache Policy: `CachingOptimized`
5. **Settings:**
    - Price Class: `Use Only North America and Europe`
    - Alternate Domain Names (CNAMEs): `presensi.yourdomain.com`
    - SSL Certificate: Select ACM certificate
    - Default Root Object: `index.html`
6. **Custom Error Responses:**
    - HTTP Error Code: `403`
    - Response Page Path: `/index.html`
    - HTTP Response Code: `200`
    - HTTP Error Code: `404`
    - Response Page Path: `/index.html`
    - HTTP Response Code: `200`

---

## 🌍 Domain & SSL (Route 53 + ACM)

### Step 1: Request SSL Certificate (ACM)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name presensi.yourdomain.com \
  --subject-alternative-names "*.presensi.yourdomain.com" \
  --validation-method DNS \
  --region us-east-1  # Must be us-east-1 for CloudFront

# Get certificate ARN
aws acm list-certificates --region us-east-1
```

### Step 2: Validate Certificate

1. Go to ACM console
2. Click on certificate
3. Create DNS records in Route 53 (click "Create records in Route 53")
4. Wait for validation (5-30 minutes)

### Step 3: Configure Route 53

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Create A record for frontend (CloudFront alias)
cat > change-batch-frontend.json <<EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "presensi.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1234567890abc.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://change-batch-frontend.json

# Create A record for backend (ALB alias)
cat > change-batch-backend.json <<EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.presensi.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z1234567890DEF",
          "DNSName": "presensi-alb-123456789.ap-southeast-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://change-batch-backend.json
```

---

## ⚖️ Application Load Balancer (ALB)

### Step 1: Create Target Group

```bash
# Create target group
aws elbv2 create-target-group \
  --name presensi-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Register EC2 instances
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:targetgroup/presensi-backend-tg/1234567890abcdef \
  --targets Id=i-1234567890abcdef
```

### Step 2: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name presensi-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:loadbalancer/app/presensi-alb/1234567890abcdef \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:ap-southeast-1:123456789012:certificate/12345678-1234-1234-1234-123456789012 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:targetgroup/presensi-backend-tg/1234567890abcdef

# Create HTTP listener (redirect to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:loadbalancer/app/presensi-alb/1234567890abcdef \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}
```

---

## 📊 Monitoring & Logging

### CloudWatch Alarms

```bash
# CPU Utilization Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name presensi-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=InstanceId,Value=i-xxxxx

# Database Connection Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name presensi-db-connections \
  --alarm-description "Alert when DB connections exceed 80" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=DBInstanceIdentifier,Value=presensi-database
```

### Application Logs

Backend PM2 logs are stored in:

```bash
# View logs
pm2 logs presensi-api

# Export logs to CloudWatch
pm2 install pm2-cloudwatch

# Configure
pm2 set pm2-cloudwatch:aws_access_key_id XXXXX
pm2 set pm2-cloudwatch:aws_secret_access_key YYYYY
pm2 set pm2-cloudwatch:aws_region ap-southeast-1
pm2 set pm2-cloudwatch:log_group presensi-backend-logs
```

---

## 🔒 Security Best Practices

### 1. Security Groups

**Backend EC2 Security Group:**

```
Inbound Rules:
- SSH (22) from your IP only
- HTTP (80) from ALB security group
- HTTPS (443) from ALB security group
- Custom TCP (3001) from ALB security group
```

**RDS Security Group:**

```
Inbound Rules:
- MySQL (3306) from Backend EC2 security group only
```

**ALB Security Group:**

```
Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
```

### 2. IAM Roles

Create IAM role for EC2:

```bash
# Create role
aws iam create-role \
  --role-name PresensiEC2Role \
  --assume-role-policy-document file://ec2-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name PresensiEC2Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name PresensiEC2Role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
```

### 3. Environment Variables

**Never commit** `.env` files. Use AWS Systems Manager Parameter Store:

```bash
# Store secrets
aws ssm put-parameter \
  --name /presensi/prod/DB_PASSWORD \
  --value "YourStrongPassword123!" \
  --type SecureString

aws ssm put-parameter \
  --name /presensi/prod/JWT_SECRET \
  --value "your_jwt_secret" \
  --type SecureString

# Retrieve in application
aws ssm get-parameter \
  --name /presensi/prod/DB_PASSWORD \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text
```

### 4. SSL/TLS

-   ✅ Use ACM certificates (auto-renewal)
-   ✅ Enforce HTTPS everywhere
-   ✅ Use TLS 1.2 or higher
-   ✅ Enable HSTS headers

### 5. Database Security

```sql
-- Create application user with limited privileges
CREATE USER 'presensi_app'@'%' IDENTIFIED BY 'StrongPassword123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON db_presensi_ta.* TO 'presensi_app'@'%';
FLUSH PRIVILEGES;
```

---

## 💰 Cost Optimization

### Estimated Monthly Costs (Singapore Region)

| Service               | Configuration               | Monthly Cost (USD) |
| --------------------- | --------------------------- | ------------------ |
| **EC2 (t3.micro)**    | 1 instance, 730 hrs         | $8.80              |
| **RDS (db.t3.micro)** | 1 instance, 20GB            | $18.50             |
| **S3 (Uploads)**      | 10GB storage, 100K requests | $0.50              |
| **S3 (Frontend)**     | 1GB storage, 1M requests    | $0.30              |
| **CloudFront**        | 100GB transfer, 1M requests | $10.00             |
| **Route 53**          | 1 hosted zone, 1M queries   | $0.90              |
| **Data Transfer**     | 50GB outbound               | $4.50              |
| **Total**             |                             | **~$43.50/month**  |

### Optimization Tips

1. **Use Reserved Instances**: Save 40-60% on EC2/RDS
2. **Enable S3 Lifecycle Policies**: Archive old uploads to Glacier
3. **Use CloudFront Caching**: Reduce origin requests
4. **Right-size Instances**: Monitor and adjust instance types
5. **Use Spot Instances**: For non-critical workloads
6. **Enable RDS Auto-scaling**: Scale storage automatically
7. **Set up Budgets**: AWS Budget alerts

```bash
# Create budget alert
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

---

## 🔧 Maintenance & Updates

### Backend Updates

```bash
# SSH to EC2
ssh -i presensi-key.pem ec2-user@<ec2-ip>

# Pull latest code
cd /var/www/presensi/backend
git pull origin main

# Install dependencies
npm install --production

# Run migrations
npx sequelize-cli db:migrate

# Restart application
pm2 restart presensi-api
pm2 save
```

### Frontend Updates

```bash
# Build locally
cd frontend
npm run build

# Sync to S3
aws s3 sync dist/ s3://presensi-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

### Database Backups

RDS automated backups are configured for 7 days. For manual backup:

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier presensi-database \
  --db-snapshot-identifier presensi-backup-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier presensi-database-restored \
  --db-snapshot-identifier presensi-backup-20260113
```

---

## 🐛 Troubleshooting

### Backend Not Responding

```bash
# Check EC2 instance status
aws ec2 describe-instance-status --instance-ids i-xxxxx

# SSH and check PM2
ssh -i presensi-key.pem ec2-user@<ec2-ip>
pm2 status
pm2 logs presensi-api --lines 100

# Check application port
sudo netstat -tlnp | grep 3001

# Restart application
pm2 restart presensi-api
```

### Database Connection Issues

```bash
# Test MySQL connection from EC2
mysql -h presensi-database.xxxxx.rds.amazonaws.com -u admin -p

# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier presensi-database \
  --query 'DBInstances[0].DBInstanceStatus'

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

### Frontend Not Loading

```bash
# Check CloudFront distribution
aws cloudfront get-distribution --id E1234567890ABC

# Check S3 bucket content
aws s3 ls s3://presensi-frontend/

# Test S3 website endpoint
curl http://presensi-frontend.s3-website-ap-southeast-1.amazonaws.com

# Check browser console for CORS errors
# Ensure CORS_ORIGIN is set correctly in backend
```

### SSL Certificate Issues

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/xxxxx \
  --region us-east-1

# Re-validate if needed
# Go to ACM Console → Certificate → Create Records in Route 53
```

---

## 📞 Support & Resources

-   **AWS Documentation**: https://docs.aws.amazon.com/
-   **AWS Support**: https://aws.amazon.com/support/
-   **AWS Architecture Blog**: https://aws.amazon.com/blogs/architecture/
-   **Project Repository**: https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi

---

## ✅ Deployment Checklist

-   [ ] AWS Account created and configured
-   [ ] Domain purchased and verified
-   [ ] RDS MySQL instance created
-   [ ] Database migrations completed
-   [ ] EC2 instance launched and configured
-   [ ] Backend deployed with PM2
-   [ ] S3 buckets created (uploads & frontend)
-   [ ] Frontend built and uploaded to S3
-   [ ] CloudFront distribution configured
-   [ ] SSL certificate issued and validated
-   [ ] Route 53 DNS records configured
-   [ ] Application Load Balancer setup
-   [ ] Security groups configured
-   [ ] CloudWatch alarms enabled
-   [ ] Backup strategy implemented
-   [ ] Cost budgets configured
-   [ ] Documentation updated

---

**Deployment Date:** January 13, 2026  
**Deployed By:** Handika Sinaga  
**Status:** ✅ Production Ready
