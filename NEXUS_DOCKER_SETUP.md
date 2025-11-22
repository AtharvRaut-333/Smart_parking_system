# 🐳 Nexus Docker Registry Setup Guide

Complete guide for configuring Nexus as a Docker registry for your CI/CD pipeline.

---

## 📋 Overview

This guide will help you set up Nexus Repository Manager with a Docker registry to store your Docker images locally instead of using Docker Hub.

---

## 🚀 Step 1: Start Nexus

```bash
cd /path/to/smart_car_parking
docker-compose -f docker-compose-nexus.yml up -d
```

**Wait 2-3 minutes** for Nexus to fully start.

---

## 🔑 Step 2: Get Admin Password

```bash
docker exec nexus cat /nexus-data/admin.password
```

Copy this password - you'll need it for initial login.

---

## 🌐 Step 3: Access Nexus

Open browser: `http://your-ec2-ip:8081`

1. Click **Sign In** (top right)
2. Username: `admin`
3. Password: (from Step 2)
4. **Change the password** when prompted
5. Enable anonymous access: **Enable** (recommended for easier Docker pulls)

---

## 📦 Step 4: Create Docker Registry

### 4.1 Create Docker Hosted Repository

1. Click **Settings** (gear icon) → **Repositories**
2. Click **Create repository**
3. Select **docker (hosted)**
4. Configure:
   - **Name:** `docker-hosted`
   - **HTTP:** Check the box
   - **Port:** `8082`
   - **Allow anonymous docker pull:** ✅ Check
   - **Enable Docker V1 API:** ✅ Check (for compatibility)
5. Click **Create repository**

### 4.2 Verify Repository

You should now see `docker-hosted` in the repository list.

---

## 🔐 Step 5: Configure Docker Realm

1. Go to **Settings** → **Security** → **Realms**
2. Add **Docker Bearer Token Realm** to Active list
3. Click **Save**

---

## 🐋 Step 6: Configure Docker Client

### On Your EC2 Instance:

#### 6.1 Create Docker Daemon Config
```bash
sudo mkdir -p /etc/docker
sudo nano /etc/docker/daemon.json
```

Add this content:
```json
{
  "insecure-registries": ["localhost:8082", "your-ec2-ip:8082"]
}
```

#### 6.2 Restart Docker
```bash
sudo systemctl restart docker
```

#### 6.3 Test Docker Login
```bash
docker login localhost:8082
# Username: admin
# Password: your-nexus-password
```

You should see: **Login Succeeded**

---

## ✅ Step 7: Test Push/Pull

### Test with a simple image:
```bash
# Pull a test image
docker pull hello-world

# Tag it for Nexus
docker tag hello-world localhost:8082/hello-world:test

# Push to Nexus
docker push localhost:8082/hello-world:test

# Verify in Nexus UI
# Go to Browse → docker-hosted → you should see hello-world
```

---

## 🔧 Step 8: Configure Jenkins

### 8.1 Add Nexus Credentials in Jenkins

**Manage Jenkins** → **Manage Credentials** → **Add Credentials**

- **Kind:** Username with password
- **ID:** `nexus-credentials`
- **Username:** `admin`
- **Password:** Your Nexus admin password
- **Description:** Nexus Docker Registry

### 8.2 Configure Docker in Jenkins

If Jenkins is running in Docker, ensure it can access the Docker daemon:

```bash
# Give Jenkins container access to Docker
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

---

## 📊 Step 9: Verify Pipeline Integration

### Run Backend Pipeline:
1. Go to Jenkins → `smart-parking-backend-pipeline`
2. Click **Build Now**
3. Watch the stages:
   - Build Docker Image ✅
   - Push to Nexus Docker Registry ✅

### Check Nexus:
1. Go to Nexus UI: `http://your-ec2-ip:8081`
2. Click **Browse** → **docker-hosted**
3. You should see: `smart-parking-backend` with tags

---

## 🎯 Repository Structure in Nexus

After successful builds, you'll have:

```
docker-hosted/
├── smart-parking-backend/
│   ├── latest
│   ├── 1 (build number)
│   ├── 2
│   └── ...
└── smart-parking-frontend/
    ├── latest
    ├── 1
    ├── 2
    └── ...
```

---

## 🔍 View Images in Nexus

### Via UI:
1. Browse → docker-hosted
2. Click on image name
3. View tags and layers

### Via Docker CLI:
```bash
# List images
docker images | grep localhost:8082

# Pull specific version
docker pull localhost:8082/smart-parking-backend:5
```

---

## 🧹 Cleanup Old Images

### Manual Cleanup:
1. Nexus UI → Browse → docker-hosted
2. Select old image tags
3. Delete

### Automatic Cleanup (Recommended):
1. Settings → Tasks
2. Create task → **Docker - Delete unused manifests and images**
3. Schedule: Daily at 2 AM
4. Repository: `docker-hosted`
5. Save

---

## 🆘 Troubleshooting

### Issue: Cannot push to registry
```bash
# Check Docker daemon config
cat /etc/docker/daemon.json

# Restart Docker
sudo systemctl restart docker

# Re-login
docker login localhost:8082
```

### Issue: Jenkins cannot push
- Verify `nexus-credentials` are configured in Jenkins
- Check Nexus is running: `docker ps | grep nexus`
- Check Nexus logs: `docker logs nexus`

### Issue: Port 8082 not accessible
```bash
# Check if port is open
netstat -tuln | grep 8082

# Check EC2 security group allows port 8082
```

### Issue: Out of disk space
```bash
# Check disk usage
df -h

# Clean old Docker images
docker system prune -a
```

---

## 📈 Benefits of Nexus Registry

✅ **Self-hosted** - No external dependencies  
✅ **Private** - Images stay on your infrastructure  
✅ **Fast** - Local network speeds  
✅ **Free** - No Docker Hub rate limits  
✅ **Versioning** - Keep all build versions  
✅ **Integrated** - Works with Maven artifacts  

---

## 🔐 Security Best Practices

1. **Change default password** immediately
2. **Use HTTPS** in production (configure SSL)
3. **Limit anonymous access** to pull-only
4. **Regular backups** of `/nexus-data`
5. **Monitor disk usage** - Docker images can be large
6. **Set up cleanup policies** to remove old images

---

## 📦 Backup Nexus Data

```bash
# Stop Nexus
docker-compose -f docker-compose-nexus.yml down

# Backup data
sudo tar -czf nexus-backup-$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/smart_car_parking_nexus-data

# Start Nexus
docker-compose -f docker-compose-nexus.yml up -d
```

---

## ✅ Verification Checklist

- [ ] Nexus is running on port 8081
- [ ] Docker registry is accessible on port 8082
- [ ] Can login with `docker login localhost:8082`
- [ ] Jenkins has `nexus-credentials` configured
- [ ] Backend pipeline pushes images successfully
- [ ] Frontend pipeline pushes images successfully
- [ ] Images visible in Nexus UI under docker-hosted
- [ ] Can pull images: `docker pull localhost:8082/smart-parking-backend:latest`

---

**Your Nexus Docker Registry is ready! 🎉**

All Docker images will now be stored locally on your EC2 instance instead of Docker Hub.
