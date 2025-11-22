# 🚀 CI/CD Pipeline Setup Guide

Complete guide for setting up Jenkins CI/CD pipeline with SonarQube and Nexus for the Smart Car Parking System.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [Jenkins Installation](#jenkins-installation)
4. [SonarQube Setup](#sonarqube-setup)
5. [Nexus Setup (Optional)](#nexus-setup-optional)
6. [GitHub Configuration](#github-configuration)
7. [Jenkins Credentials](#jenkins-credentials)
8. [Pipeline Creation](#pipeline-creation)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## 1. Prerequisites

### Required Tools
- ✅ AWS EC2 instance (t2.small minimum - 2GB RAM)
- ✅ Docker and Docker Compose installed
- ✅ Git installed
- ✅ GitHub repository with admin access
- ✅ Docker Hub account

### Recommended EC2 Specifications
```
Instance Type: t2.small or larger
RAM: 2GB minimum (4GB recommended)
Storage: 30GB EBS volume
OS: Ubuntu 20.04 LTS or Amazon Linux 2
```

### Security Group Ports
Open the following ports in your EC2 security group:
- `22` - SSH
- `80` - Frontend (HTTP)
- `443` - Frontend (HTTPS, optional)
- `8080` - Jenkins
- `8081` - Backend API / Nexus
- `9000` - SonarQube

---

## 2. AWS EC2 Setup

### 2.1 Connect to EC2
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2.2 Update System
```bash
sudo yum update -y  # For Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # For Ubuntu
```

### 2.3 Install Docker
```bash
# Amazon Linux
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Ubuntu
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2.4 Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 2.5 (Optional) Add Swap for Free Tier
If using t2.micro (1GB RAM), add swap space:
```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. Jenkins Installation

### 3.1 Install Jenkins via Docker
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped \
  jenkins/jenkins:lts
```

### 3.2 Get Initial Admin Password
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 3.3 Access Jenkins
Open browser: `http://your-ec2-ip:8080`

1. Enter the initial admin password
2. Install suggested plugins
3. Create admin user
4. Configure Jenkins URL: `http://your-ec2-ip:8080`

### 3.4 Install Required Plugins
Go to **Manage Jenkins** → **Manage Plugins** → **Available**

Install:
- ✅ **Docker Pipeline**
- ✅ **SonarQube Scanner**
- ✅ **GitHub Integration**
- ✅ **Pipeline**
- ✅ **Nexus Artifact Uploader** (if using Nexus)
- ✅ **NodeJS Plugin**

### 3.5 Configure Tools
**Manage Jenkins** → **Global Tool Configuration**

#### Maven Configuration
- Name: `Maven3`
- Install automatically: ✅
- Version: Latest 3.x

#### JDK Configuration
- Name: `JDK17`
- Install automatically: ✅
- Version: OpenJDK 17

#### NodeJS Configuration
- Name: `NodeJS18`
- Install automatically: ✅
- Version: NodeJS 18.x

#### SonarQube Scanner
- Name: `SonarScanner`
- Install automatically: ✅
- Version: Latest

---

## 4. SonarQube Setup

### 4.1 Start SonarQube with Docker Compose
```bash
cd /path/to/smart_car_parking
docker-compose -f docker-compose-sonarqube.yml up -d
```

### 4.2 Access SonarQube
Open browser: `http://your-ec2-ip:9000`

Default credentials:
- Username: `admin`
- Password: `admin`

**Change password immediately!**

### 4.3 Generate Authentication Token
1. Click on **Administrator** (top right) → **My Account**
2. Go to **Security** tab
3. Generate Token:
   - Name: `jenkins-token`
   - Click **Generate**
   - **Copy and save the token** (you won't see it again!)

### 4.4 Configure Quality Gates (Optional)
1. Go to **Quality Gates**
2. Create new gate or use default "Sonar way"
3. Set thresholds:
   - Coverage: > 80%
   - Duplications: < 3%
   - Maintainability Rating: A

---

## 5. Nexus Setup (Optional)

### 5.1 Install Nexus via Docker
```bash
docker run -d \
  --name nexus \
  -p 8081:8081 \
  -v nexus-data:/nexus-data \
  --restart unless-stopped \
  sonatype/nexus3
```

### 5.2 Access Nexus
Open browser: `http://your-ec2-ip:8081`

Wait 2-3 minutes for Nexus to start.

### 5.3 Get Admin Password
```bash
docker exec nexus cat /nexus-data/admin.password
```

### 5.4 Initial Setup
1. Sign in with username `admin` and the password from above
2. Change admin password
3. Enable anonymous access (optional)

### 5.5 Create Repositories
1. Go to **Settings** (gear icon) → **Repositories**
2. Create **maven-releases** (if not exists)
3. Create **maven-snapshots** (if not exists)

---

## 6. GitHub Configuration

### 6.1 Generate Personal Access Token
1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Scopes to select:
   - ✅ `repo` (all)
   - ✅ `admin:repo_hook` (all)
4. Generate and **copy the token**

### 6.2 Configure Webhook
1. Go to your repository → **Settings** → **Webhooks** → **Add webhook**
2. Payload URL: `http://your-ec2-ip:8080/github-webhook/`
3. Content type: `application/json`
4. Events: **Just the push event**
5. Active: ✅
6. Add webhook

---

## 7. Jenkins Credentials

Go to **Manage Jenkins** → **Manage Credentials** → **System** → **Global credentials**

### 7.1 Add GitHub Credentials
- Kind: **Username with password**
- ID: `github-credentials`
- Username: Your GitHub username
- Password: Personal Access Token from step 6.1

### 7.2 Add Docker Hub Credentials
- Kind: **Username with password**
- ID: `dockerhub-credentials`
- Username: Your Docker Hub username
- Password: Your Docker Hub password

### 7.3 Add SonarQube Token
- Kind: **Secret text**
- ID: `sonarqube-token`
- Secret: Token from step 4.3

### 7.4 Add Nexus Credentials (if using)
- Kind: **Username with password**
- ID: `nexus-credentials`
- Username: `admin`
- Password: Your Nexus admin password

### 7.5 Configure SonarQube Server
**Manage Jenkins** → **Configure System** → **SonarQube servers**

- Name: `SonarQube`
- Server URL: `http://localhost:9000` (or your EC2 IP)
- Server authentication token: Select `sonarqube-token`

---

## 8. Pipeline Creation

### 8.1 Update Jenkinsfiles
Before creating pipelines, update the Docker image names in Jenkinsfiles:

**Backend Jenkinsfile:**
```groovy
DOCKER_IMAGE_NAME = 'your-dockerhub-username/smart-parking-backend'
```

**Frontend Jenkinsfile:**
```groovy
DOCKER_IMAGE_NAME = 'your-dockerhub-username/smart-parking-frontend'
```

### 8.2 Create Backend Pipeline
1. **New Item** → Enter name: `smart-parking-backend-pipeline`
2. Select **Pipeline** → OK
3. Under **Build Triggers**:
   - ✅ GitHub hook trigger for GITScm polling
4. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/your-username/smart_car_parking.git`
   - Credentials: Select `github-credentials`
   - Branch: `*/main` (or your branch)
   - Script Path: `smark-parking-backend/Jenkinsfile`
5. **Save**

### 8.3 Create Frontend Pipeline
1. **New Item** → Enter name: `smart-parking-frontend-pipeline`
2. Select **Pipeline** → OK
3. Under **Build Triggers**:
   - ✅ GitHub hook trigger for GITScm polling
4. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/your-username/smart_car_parking.git`
   - Credentials: Select `github-credentials`
   - Branch: `*/main`
   - Script Path: `smart-parking-frontend/Jenkinsfile`
5. **Save**

### 8.4 Test Pipelines
Click **Build Now** on each pipeline to test.

---

## 9. Monitoring & Troubleshooting

### 9.1 View Pipeline Logs
- Click on pipeline → Click on build number → **Console Output**

### 9.2 Common Issues

#### Issue: Docker permission denied
```bash
sudo usermod -aG docker jenkins
docker restart jenkins
```

#### Issue: SonarQube connection refused
Check if SonarQube is running:
```bash
docker ps | grep sonarqube
docker logs sonarqube
```

#### Issue: Out of memory
Add more swap or upgrade EC2 instance:
```bash
free -h  # Check memory
```

#### Issue: Nexus not accessible
```bash
docker logs nexus
# Wait 2-3 minutes for Nexus to fully start
```

#### Issue: GitHub webhook not triggering
1. Check webhook delivery in GitHub repo settings
2. Ensure Jenkins is accessible from internet
3. Check Jenkins system log: **Manage Jenkins** → **System Log**

### 9.3 Health Checks
```bash
# Check all containers
docker ps

# Check Jenkins
curl http://localhost:8080

# Check SonarQube
curl http://localhost:9000

# Check Nexus
curl http://localhost:8081

# Check application
curl http://localhost:8081/actuator/health  # Backend
curl http://localhost:80  # Frontend
```

### 9.4 View SonarQube Reports
1. Go to `http://your-ec2-ip:9000`
2. Click on project name
3. View code quality metrics, bugs, vulnerabilities

### 9.5 View Nexus Artifacts
1. Go to `http://your-ec2-ip:8081`
2. Browse → Select repository
3. View uploaded JAR files

---

## 🎉 Pipeline Flow

Once everything is set up, the flow works as follows:

```
1. Developer pushes code to GitHub
2. GitHub webhook triggers Jenkins
3. Jenkins pulls latest code
4. Backend Pipeline:
   - Maven build
   - Run tests
   - SonarQube analysis
   - Quality gate check
   - Build JAR
   - Deploy to Nexus
   - Build Docker image
   - Push to Docker Hub
   - Deploy to EC2
   - Health check
5. Frontend Pipeline:
   - npm install
   - npm build
   - SonarQube analysis
   - Quality gate check
   - Build Docker image
   - Push to Docker Hub
   - Deploy to EC2
   - Health check
6. Application is live! 🚀
```

---

## 📚 Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [Nexus Documentation](https://help.sonatype.com/repomanager3)
- [Docker Documentation](https://docs.docker.com/)

---

## 🆘 Need Help?

If you encounter issues:
1. Check Jenkins console logs
2. Check Docker container logs: `docker logs <container-name>`
3. Check SonarQube analysis reports
4. Review GitHub webhook delivery status

---

**Happy Deploying! 🚀**
