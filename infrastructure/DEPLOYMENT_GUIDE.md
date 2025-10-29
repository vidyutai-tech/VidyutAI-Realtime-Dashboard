# VidyutAI Dashboard - Deployment Guide

## 🎯 Deployment Options

### Option 1: AWS EC2 (Recommended for Production)
**Cost:** ~$8-15/month (t2.small) or **FREE** with AWS Free Tier (t2.micro for 1 year)

**Pros:**
- ✅ Full control over infrastructure
- ✅ Scalable (can upgrade instance type)
- ✅ Can add Kafka/MQTT later easily
- ✅ Professional/enterprise-ready
- ✅ Free tier eligible

**Cons:**
- ⚠️ Requires AWS account setup
- ⚠️ Manual configuration needed

### Option 2: Render.com (Best Free Option)
**Cost:** FREE (with limitations)

**Pros:**
- ✅ Completely free tier
- ✅ Automatic HTTPS
- ✅ Git-based deployments
- ✅ Zero DevOps required
- ✅ Good for demos/POCs

**Cons:**
- ⚠️ Spins down after 15 min inactivity (slow first load)
- ⚠️ Limited resources
- ⚠️ Harder to add Kafka/MQTT later

### Option 3: Railway.app
**Cost:** $5/month credit (free tier)

**Pros:**
- ✅ Very easy deployment
- ✅ Good free tier
- ✅ Supports Docker
- ✅ Can scale easily

**Cons:**
- ⚠️ Free tier may run out quickly with 3 services

---

## 🚀 Quick Start - Docker Local Testing

### 1. Build and Run Locally

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Access:**
- Frontend: http://localhost
- Backend API: http://localhost:3000/api/v1
- AI Service: http://localhost:8000

---

## ☁️ AWS EC2 Deployment (Recommended)

### Prerequisites
- AWS Account (free tier eligible)
- AWS CLI installed and configured

### Step 1: Launch EC2 Instance

```bash
# Launch t2.micro (free tier)
aws ec2 run-instances \
  --image-id ami-0c2af51e265bd5e0e \
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --user-data file://infrastructure/aws/ec2-user-data.sh
```

### Step 2: Configure Security Group

Allow inbound traffic:
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 22 (SSH) - from your IP only

### Step 3: SSH into Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### Step 4: Deploy Application

```bash
# Clone your repository
git clone https://github.com/yourusername/vidyutai-dashboard.git
cd vidyutai-dashboard

# Create .env file
cat > .env <<EOF
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
EOF

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 5: Setup Domain (Optional)

1. Get a free domain from Freenom or use Route 53
2. Point DNS A record to EC2 IP
3. Setup SSL with Let's Encrypt:

```bash
# Install certbot
sudo yum install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

---

## 🆓 Render.com Deployment (Easiest Free Option)

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/vidyutai-dashboard.git
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Blueprint"
4. Connect your repository
5. Render will auto-detect `render.yaml`
6. Click "Apply"

**Done!** Your app will be live at:
- Frontend: `https://vidyutai-frontend.onrender.com`
- Backend: `https://vidyutai-backend.onrender.com`
- AI Service: `https://vidyutai-ai-service.onrender.com`

### Step 3: Update Frontend Environment

Go to Render dashboard → Frontend service → Environment:
```
VITE_API_BASE_URL=https://vidyutai-backend.onrender.com/api/v1
VITE_WS_URL=wss://vidyutai-backend.onrender.com
```

---

## 🚄 Railway.app Deployment

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Initialize Project

```bash
cd vidyutai-dashboard
railway init
```

### Step 3: Deploy

```bash
# Deploy all services
railway up

# Or deploy individually
railway up --service backend
railway up --service ai-service
railway up --service frontend
```

---

## 📊 Post-Deployment Checklist

### Security
- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Change default admin password
- [ ] Enable rate limiting

### Monitoring
- [ ] Setup error logging (Sentry)
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Enable CloudWatch (AWS) or built-in monitoring
- [ ] Set up alerts for downtime

### Performance
- [ ] Enable gzip compression (✅ already in nginx.conf)
- [ ] Setup CDN for static assets (CloudFront/Cloudflare)
- [ ] Configure caching headers (✅ already configured)
- [ ] Optimize database queries

### Backup
- [ ] Setup automated database backups
- [ ] Configure backup retention policy
- [ ] Test restore procedure

---

## 🔄 Adding Kafka/MQTT Later

When you're ready to add Kafka/MQTT:

### 1. Add to docker-compose.yml

```yaml
  kafka:
    image: confluentinc/cp-kafka:latest
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    networks:
      - vidyutai-network

  mosquitto:
    image: eclipse-mosquitto:latest
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./infrastructure/mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf
    networks:
      - vidyutai-network
```

### 2. Update Backend to Use Kafka/MQTT

No major changes needed - just add new routes/services!

---

## 💰 Cost Estimates

### AWS (Production)
- **t2.micro (Free Tier):** $0/month for 1 year
- **t2.small (After free tier):** ~$15/month
- **With Load Balancer:** +$18/month
- **Total:** $15-35/month

### Render.com (Free)
- **Free Tier:** $0/month
- **Paid Tier:** $7/month per service = $21/month for 3 services

### Railway.app
- **Free Credit:** $5/month (may not be enough for 3 services)
- **Paid:** ~$10-15/month

---

## 🆘 Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose build --no-cache backend
docker-compose up -d
```

### Database not persisting
```bash
# Check volume
docker volume ls
docker volume inspect vidyutai-dashboard_vidyutai-db
```

### Port already in use
```bash
# Change ports in docker-compose.yml
ports:
  - "8080:80"  # Change 80 to 8080
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS EC2 Free Tier](https://aws.amazon.com/free/)
- [Render.com Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Last Updated:** October 29, 2025  
**Deployment Version:** 1.0.0

