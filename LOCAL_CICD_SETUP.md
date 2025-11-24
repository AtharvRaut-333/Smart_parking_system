# 🏠 Complete Local CI/CD Pipeline Setup

Run the entire CI/CD pipeline on your Windows machine for development.

---

## 📋 Prerequisites

- ✅ Windows 10/11
- ✅ Docker Desktop installed
- ✅ Git installed
- ✅ 8GB RAM minimum (16GB recommended)

---

## 🚀 Quick Start (5 Steps)

### Step 1: Start All Services

Open PowerShell in your project directory:

```powershell
cd "D:\G Drive\parking website\smart_car_parking"

# Start MySQL
docker-compose -f docker-compose-mysql.yml up -d

# Start SonarQube
docker-compose -f docker-compose-sonarqube.yml up -d

# Start Nexus
docker-compose -f docker-compose-nexus.yml up -d

# Start Jenkins (we'll create this next)
docker-compose -f docker-compose-jenkins.yml up -d
```

### Step 2: Wait for Services to Start

```powershell
# Check all containers are running
docker ps

# You should see:
# - smart-parking-mysql
# - sonarqube
# - sonarqube-postgres
# - nexus
# - jenkins
```

### Step 3: Access Services

- **Jenkins:** http://localhost:8080
- **SonarQube:** http://localhost:9000 (admin/admin)
- **Nexus:** http://localhost:8081 (admin/get password from container)
- **MySQL:** localhost:3306

### Step 4: Configure Services

Follow the configuration steps below for each service.

### Step 5: Run Pipeline

Push code to GitHub → Jenkins automatically builds → Full pipeline runs locally!

---

## 📦 Service Details

### MySQL Database
- **Port:** 3306
- **Database:** smart_parking
- **User:** parking_user
- **Password:** parking_pass123

### SonarQube
- **Port:** 9000
- **Default Login:** admin/admin
- **Change password on first login**
- **Generate token:** My Account → Security → Generate Token

### Nexus
- **Port:** 8081 (UI)
- **Port:** 8082 (Docker Registry)
- **Get password:**
  ```powershell
  docker exec nexus cat /nexus-data/admin.password
  ```

### Jenkins
- **Port:** 8080
- **Get password:**
  ```powershell
  docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
  ```

---

## 🔧 Detailed Setup

### 1. SonarQube Setup

```powershell
# Wait for SonarQube to start (2-3 minutes)
docker logs -f sonarqube
# Wait for: "SonarQube is operational"
```

**Access:** http://localhost:9000
1. Login: admin/admin
2. Change password
3. My Account → Security → Generate Token
4. Name: `jenkins-token`
5. **Copy token** (save it!)

### 2. Nexus Setup

```powershell
# Get admin password
docker exec nexus cat /nexus-data/admin.password
```

**Access:** http://localhost:8081
1. Sign in with admin and password above
2. Change password
3. Enable anonymous access

**Create Docker Registry:**
1. Settings (gear icon) → Repositories
2. Create repository → docker (hosted)
3. Name: `docker-hosted`
4. HTTP: ✅ Port: 8082
5. Allow anonymous docker pull: ✅
6. Create

**Enable Docker Realm:**
1. Settings → Security → Realms
2. Add "Docker Bearer Token Realm" to Active
3. Save

**Configure Docker:**
```powershell
# Edit Docker Desktop settings
# Settings → Docker Engine → Add:
{
  "insecure-registries": ["localhost:8082"]
}
# Apply & Restart
```

**Test Docker Login:**
```powershell
docker login localhost:8082
# Username: admin
# Password: your-nexus-password
```

### 3. Jenkins Setup

**Access:** http://localhost:8080

1. **Get initial password:**
   ```powershell
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```

2. **Install suggested plugins**

3. **Create admin user**

4. **Install additional plugins:**
   - Manage Jenkins → Manage Plugins → Available
   - Install: Docker Pipeline, SonarQube Scanner, GitHub Integration, NodeJS

5. **Configure tools:**
   - Manage Jenkins → Global Tool Configuration
   - Maven3: Install automatically, latest 3.x
   - JDK17: Install automatically, OpenJDK 17
   - NodeJS18: Install automatically, NodeJS 18.x
   - SonarScanner: Install automatically, latest

6. **Add credentials:**
   - Manage Jenkins → Manage Credentials → Global
   
   **GitHub:**
   - Kind: Username with password
   - ID: `github-credentials`
   - Username: your GitHub username
   - Password: GitHub Personal Access Token
   
   **SonarQube:**
   - Kind: Secret text
   - ID: `sonarqube-token`
   - Secret: token from SonarQube
   
   **Nexus:**
   - Kind: Username with password
   - ID: `nexus-credentials`
   - Username: admin
   - Password: your Nexus password

7. **Configure SonarQube server:**
   - Manage Jenkins → Configure System → SonarQube servers
   - Name: `SonarQube`
   - Server URL: `http://host.docker.internal:9000`
   - Token: Select `sonarqube-token`

---

## 🔗 GitHub Webhook (Optional for Local)

For local development, you can:
- **Manually trigger** builds in Jenkins (Build Now)
- **Poll SCM** every 5 minutes (already configured in Jenkinsfiles)
- **Skip webhook** (since your machine isn't publicly accessible)

---

## 🎯 Create Pipeline

### Unified Full-Stack Pipeline
1. New Item → `smart-parking-full-stack-pipeline`
2. Type: Pipeline
3. Pipeline from SCM → Git
4. Repository: your GitHub URL
5. Credentials: `github-credentials`
6. Branch: `*/main`
7. Script Path: `Jenkinsfile` (at repository root)
8. Save

**What it does:**
- ✅ Builds **both frontend and backend in parallel** (faster!)
- ✅ Runs SonarQube analysis on both components
- ✅ Deploys artifacts to Nexus (JAR + Docker images)
- ✅ Deploys full stack using docker-compose
- ✅ Performs health checks on both services

> **Note:** The old separate pipelines (`smark-parking-backend/Jenkinsfile` and `smart-parking-frontend/Jenkinsfile`) are still available if you need to run them individually.

---

## ✅ Test Pipeline

1. Go to `smart-parking-full-stack-pipeline`
2. Click **Build Now**
3. Watch the parallel stages execute (backend + frontend simultaneously!)
4. Check SonarQube for analysis results:
   - `smart-parking-backend` project
   - `smart-parking-frontend` project
5. Check Nexus for artifacts:
   - Maven: `maven-snapshots` repository (backend JAR)
   - Docker: `docker-hosted` repository (both images)

---

## 🐳 Deploy Locally

After pipeline succeeds:

```powershell
# Deploy full stack
docker-compose up -d

# Access:
# Backend: http://localhost:8081
# Frontend: http://localhost:80
```

---

## 📊 Monitor Services

```powershell
# View all containers
docker ps

# View logs
docker logs jenkins
docker logs sonarqube
docker logs nexus

# Check resource usage
docker stats
```

---

## 🔄 Daily Workflow

```powershell
# Start your day
docker-compose -f docker-compose-jenkins.yml start
docker-compose -f docker-compose-sonarqube.yml start
docker-compose -f docker-compose-nexus.yml start
docker-compose -f docker-compose-mysql.yml start

# Make code changes
# Push to GitHub
# Jenkins automatically builds (or click Build Now)

# End of day (optional - stop to save resources)
docker-compose -f docker-compose-jenkins.yml stop
docker-compose -f docker-compose-sonarqube.yml stop
docker-compose -f docker-compose-nexus.yml stop
# Keep MySQL running if you want
```

---

## 🆘 Troubleshooting

### Jenkins can't connect to SonarQube/Nexus
Use `host.docker.internal` instead of `localhost` in Jenkins configuration:
- SonarQube: `http://host.docker.internal:9000`
- Nexus: `http://host.docker.internal:8081`

### Out of memory
- Increase Docker Desktop memory: Settings → Resources → Memory (8GB+)
- Close unused applications

### Port conflicts
- Check if ports are already in use
- Change ports in docker-compose files if needed

---

## 🎉 Benefits of Local Pipeline

✅ **No EC2 costs** - everything runs on your machine  
✅ **Fast development** - instant feedback  
✅ **Full control** - easy debugging  
✅ **No networking issues** - everything is localhost  
✅ **Learn CI/CD** - hands-on experience  

---

**Your complete local CI/CD pipeline is ready!** 🚀

All services run on your Windows machine. When you're ready for production, you can deploy to EC2 with the same configuration!
