# ✅ Complete CI/CD Setup Checklist

Follow this checklist step-by-step to set up your complete CI/CD pipeline.

---

## 📋 Pre-Setup Information Needed

Before we start, gather this information:

- [ ] **EC2 IP Address:** `_________________`
- [ ] **EC2 SSH Key Location:** `_________________`
- [ ] **GitHub Repository URL:** `_________________`
- [ ] **Database Details:**
  - Host: `_________________`
  - Database Name: `_________________`
  - Username: `_________________`
  - Password: `_________________`

---

## Phase 1: EC2 Initial Setup ⚙️

### Step 1.1: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```
- [ ] Successfully connected to EC2

### Step 1.2: Update System
```bash
sudo apt update && sudo apt upgrade -y
```
- [ ] System updated

### Step 1.3: Install Docker
```bash
# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```
- [ ] Docker installed
- [ ] Logout and login again for group changes to take effect

### Step 1.4: Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```
- [ ] Docker Compose installed
- [ ] Version displayed

### Step 1.5: Verify Docker
```bash
docker ps
```
- [ ] Docker running (should show empty list)

---

## Phase 2: Clone Your Repository 📥

```bash
cd ~
git clone YOUR_GITHUB_REPO_URL
cd smart_car_parking
```
- [ ] Repository cloned
- [ ] Inside project directory

---

## Phase 3: Start SonarQube 🔍

### Step 3.1: Start SonarQube
```bash
docker-compose -f docker-compose-sonarqube.yml up -d
```
- [ ] SonarQube container started

### Step 3.2: Wait and Access
Wait 2-3 minutes, then:
```bash
# Check if running
docker ps | grep sonarqube
```
- [ ] SonarQube container is running

### Step 3.3: Access SonarQube UI
Open browser: `http://YOUR_EC2_IP:9000`
- [ ] SonarQube UI loads
- [ ] Login with `admin` / `admin`
- [ ] Changed password to: `_________________` (write it down!)

### Step 3.4: Generate SonarQube Token
1. Click **Administrator** → **My Account** → **Security**
2. Generate token: Name = `jenkins-token`
3. **Copy token:** `_________________` (save this!)
- [ ] Token generated and saved

---

## Phase 4: Start Nexus 📦

### Step 4.1: Start Nexus
```bash
docker-compose -f docker-compose-nexus.yml up -d
```
- [ ] Nexus container started

### Step 4.2: Get Admin Password
Wait 2-3 minutes, then:
```bash
docker exec nexus cat /nexus-data/admin.password
```
**Admin password:** `_________________` (save this!)
- [ ] Got admin password

### Step 4.3: Access Nexus UI
Open browser: `http://YOUR_EC2_IP:8081`
- [ ] Nexus UI loads
- [ ] Logged in with `admin` and password from above
- [ ] Changed password to: `_________________` (write it down!)
- [ ] Enabled anonymous access

### Step 4.4: Create Docker Registry
1. Settings → Repositories → Create repository
2. Select **docker (hosted)**
3. Configure:
   - Name: `docker-hosted`
   - HTTP: ✅ Check
   - Port: `8082`
   - Allow anonymous docker pull: ✅
   - Enable Docker V1 API: ✅
4. Create repository
- [ ] Docker registry created on port 8082

### Step 4.5: Enable Docker Realm
1. Settings → Security → Realms
2. Add **Docker Bearer Token Realm** to Active
3. Save
- [ ] Docker realm enabled

### Step 4.6: Configure Docker Daemon
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "insecure-registries": ["localhost:8082", "YOUR_EC2_IP:8082"]
}
EOF
sudo systemctl restart docker
```
- [ ] Docker daemon configured
- [ ] Docker restarted

### Step 4.7: Test Docker Login
```bash
docker login localhost:8082
# Username: admin
# Password: (your Nexus password)
```
- [ ] Login succeeded

---

## Phase 5: Install Jenkins 🔧

### Step 5.1: Start Jenkins
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
- [ ] Jenkins container started

### Step 5.2: Get Admin Password
Wait 1-2 minutes, then:
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
**Jenkins password:** `_________________` (save this!)
- [ ] Got Jenkins password

### Step 5.3: Access Jenkins UI
Open browser: `http://YOUR_EC2_IP:8080`
- [ ] Jenkins UI loads
- [ ] Entered admin password
- [ ] Clicked "Install suggested plugins"
- [ ] Waited for plugins to install

### Step 5.4: Create Admin User
- Username: `_________________`
- Password: `_________________`
- Full name: `_________________`
- Email: `_________________`
- [ ] Admin user created

### Step 5.5: Configure Jenkins URL
- Jenkins URL: `http://YOUR_EC2_IP:8080`
- [ ] URL configured
- [ ] Clicked "Start using Jenkins"

---

## Phase 6: Configure Jenkins Plugins 🔌

### Step 6.1: Install Additional Plugins
**Manage Jenkins** → **Manage Plugins** → **Available**

Search and install:
- [ ] Docker Pipeline
- [ ] SonarQube Scanner
- [ ] GitHub Integration
- [ ] NodeJS Plugin

Click **Install without restart**
- [ ] All plugins installed

### Step 6.2: Restart Jenkins
```bash
docker restart jenkins
```
Wait 1 minute, then access Jenkins again.
- [ ] Jenkins restarted and accessible

---

## Phase 7: Configure Jenkins Tools 🛠️

**Manage Jenkins** → **Global Tool Configuration**

### Step 7.1: Maven
- Name: `Maven3`
- ✅ Install automatically
- Version: Latest 3.x
- [ ] Maven configured

### Step 7.2: JDK
- Name: `JDK17`
- ✅ Install automatically
- Version: OpenJDK 17
- [ ] JDK configured

### Step 7.3: NodeJS
- Name: `NodeJS18`
- ✅ Install automatically
- Version: NodeJS 18.x
- [ ] NodeJS configured

### Step 7.4: SonarQube Scanner
- Name: `SonarScanner`
- ✅ Install automatically
- Version: Latest
- [ ] SonarScanner configured

Click **Save**
- [ ] All tools saved

---

## Phase 8: Configure Jenkins Credentials 🔐

**Manage Jenkins** → **Manage Credentials** → **System** → **Global credentials** → **Add Credentials**

### Step 8.1: GitHub Credentials
First, generate GitHub token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Scopes: ✅ `repo` (all), ✅ `admin:repo_hook` (all)
4. Generate and copy token

**GitHub Token:** `_________________` (save this!)

Now in Jenkins:
- Kind: **Username with password**
- Username: Your GitHub username
- Password: (paste GitHub token)
- ID: `github-credentials`
- Description: GitHub Personal Access Token
- [ ] GitHub credentials added

### Step 8.2: SonarQube Token
- Kind: **Secret text**
- Secret: (paste SonarQube token from Phase 3.4)
- ID: `sonarqube-token`
- Description: SonarQube Authentication Token
- [ ] SonarQube token added

### Step 8.3: Nexus Credentials
- Kind: **Username with password**
- Username: `admin`
- Password: (your Nexus password from Phase 4.3)
- ID: `nexus-credentials`
- Description: Nexus Repository Manager
- [ ] Nexus credentials added

---

## Phase 9: Configure SonarQube Server in Jenkins 🔗

**Manage Jenkins** → **Configure System** → Scroll to **SonarQube servers**

- Click **Add SonarQube**
- Name: `SonarQube`
- Server URL: `http://localhost:9000`
- Server authentication token: Select `sonarqube-token`
- Click **Save**
- [ ] SonarQube server configured

---

## Phase 10: Setup GitHub Webhook 🪝

### Step 10.1: In GitHub Repository
1. Go to your repository → **Settings** → **Webhooks** → **Add webhook**
2. Payload URL: `http://YOUR_EC2_IP:8080/github-webhook/`
3. Content type: `application/json`
4. Events: **Just the push event**
5. Active: ✅
6. Add webhook
- [ ] Webhook created
- [ ] Shows green checkmark (may need to wait/refresh)

---

## Phase 11: Create Jenkins Pipelines 🚀

### Step 11.1: Backend Pipeline
1. **New Item** → Name: `smart-parking-backend-pipeline`
2. Type: **Pipeline** → OK
3. **Build Triggers:**
   - ✅ GitHub hook trigger for GITScm polling
4. **Pipeline:**
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: (your GitHub repo URL)
   - Credentials: `github-credentials`
   - Branch: `*/main` (or your branch)
   - Script Path: `smark-parking-backend/Jenkinsfile`
5. **Save**
- [ ] Backend pipeline created

### Step 11.2: Frontend Pipeline
1. **New Item** → Name: `smart-parking-frontend-pipeline`
2. Type: **Pipeline** → OK
3. **Build Triggers:**
   - ✅ GitHub hook trigger for GITScm polling
4. **Pipeline:**
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: (your GitHub repo URL)
   - Credentials: `github-credentials`
   - Branch: `*/main`
   - Script Path: `smart-parking-frontend/Jenkinsfile`
5. **Save**
- [ ] Frontend pipeline created

---

## Phase 12: Configure Environment Variables 🔧

### Step 12.1: Update .env File
```bash
cd ~/smart_car_parking/smark-parking-backend
cp .env.example .env
nano .env
```

Update with your actual values:
- Database URL, username, password
- JWT secret
- OAuth credentials
- Email configuration
- Razorpay keys

- [ ] .env file updated with real values

---

## Phase 13: Test Pipelines! 🧪

### Step 13.1: Test Backend Pipeline
1. Go to Jenkins → `smart-parking-backend-pipeline`
2. Click **Build Now**
3. Watch the build progress
4. Check console output if it fails
- [ ] Backend pipeline runs successfully
- [ ] All stages pass (green)

### Step 13.2: Test Frontend Pipeline
1. Go to Jenkins → `smart-parking-frontend-pipeline`
2. Click **Build Now**
3. Watch the build progress
- [ ] Frontend pipeline runs successfully
- [ ] All stages pass (green)

---

## Phase 14: Verify Everything 🎯

### Step 14.1: Check SonarQube
`http://YOUR_EC2_IP:9000`
- [ ] See `smart-parking-backend` project
- [ ] See `smart-parking-frontend` project
- [ ] Quality gates passed

### Step 14.2: Check Nexus
`http://YOUR_EC2_IP:8081`
- [ ] Browse → maven-snapshots → see JAR files
- [ ] Browse → docker-hosted → see Docker images

### Step 14.3: Check Running Containers
```bash
docker ps
```
Should see:
- [ ] smart-parking-backend (port 8081)
- [ ] smart-parking-frontend (port 80)
- [ ] jenkins
- [ ] sonarqube
- [ ] nexus

### Step 14.4: Test Application
```bash
# Backend health
curl http://localhost:8081/actuator/health

# Frontend
curl http://localhost:80
```
- [ ] Backend responds with health status
- [ ] Frontend loads

### Step 14.5: Test in Browser
- Backend API: `http://YOUR_EC2_IP:8081`
- Frontend: `http://YOUR_EC2_IP:80`
- [ ] Backend API accessible
- [ ] Frontend loads in browser

---

## Phase 15: Test Automatic Deployment 🔄

### Step 15.1: Make a Code Change
```bash
cd ~/smart_car_parking
# Make a small change (e.g., update README)
echo "# CI/CD Pipeline Active" >> README.md
git add .
git commit -m "Test CI/CD pipeline"
git push origin main
```
- [ ] Code pushed to GitHub

### Step 15.2: Watch Jenkins
1. Go to Jenkins dashboard
2. Watch pipelines automatically trigger
- [ ] Backend pipeline triggered automatically
- [ ] Frontend pipeline triggered automatically
- [ ] Both pipelines complete successfully

---

## 🎉 Setup Complete!

If all checkboxes are checked, your CI/CD pipeline is fully operational!

### What Happens Now:
Every time you push code to GitHub:
1. ✅ GitHub webhook triggers Jenkins
2. ✅ Jenkins builds your code
3. ✅ SonarQube analyzes code quality
4. ✅ Docker images are built
5. ✅ Images pushed to Nexus
6. ✅ Application deployed to EC2
7. ✅ Health checks verify deployment

---

## 📞 Need Help?

If something fails, check:
- **Jenkins Console Output** - detailed error messages
- **Docker Logs:** `docker logs <container-name>`
- **CICD_SETUP.md** - detailed troubleshooting
- **NEXUS_DOCKER_SETUP.md** - Nexus-specific help

---

**Your CI/CD Pipeline is Live! 🚀**
