# College Jenkins Server Setup Guide

Complete step-by-step instructions to deploy the Smart Parking CI/CD pipeline on the college Jenkins server.

## 📋 Prerequisites

### College Server Details
- **Jenkins URL:** http://jenkins.imcc.com/
- **SonarQube URL:** http://sonarqube.imcc.com/
- **Nexus URL:** http://nexus.imcc.com/
- **Username:** student
- **Jenkins Password:** Changeme@2025
- **SonarQube Password:** Imccstudent@2025
- **Nexus Password:** Imcc@2025

### Required Tokens
- [ ] GitHub Personal Access Token (PAT)
- [ ] SonarQube Authentication Token

---

## 🚀 Step-by-Step Setup

### Step 1: Login to Jenkins

1. Open browser and navigate to: http://jenkins.imcc.com/
2. Login with credentials:
   - **Username:** `student`
   - **Password:** `Changeme@2025`

---

### Step 2: Install Required Plugins

1. Go to **Manage Jenkins** → **Manage Plugins**
2. Click on **Available plugins** tab
3. Search and install the following plugins (check the box and click "Install without restart"):

   **Essential Plugins:**
   - [ ] **GitHub Integration Plugin**
   - [ ] **Git Plugin** (usually pre-installed)
   - [ ] **Pipeline Plugin** (usually pre-installed)
   - [ ] **Docker Pipeline Plugin**
   - [ ] **SonarQube Scanner Plugin**
   - [ ] **Nexus Artifact Uploader Plugin**
   - [ ] **Maven Integration Plugin**
   - [ ] **NodeJS Plugin**
   - [ ] **Credentials Plugin** (usually pre-installed)
   - [ ] **Credentials Binding Plugin**

4. After installation, restart Jenkins if prompted

---

### Step 3: Configure Global Tools

#### 3.1 Configure Maven

1. Go to **Manage Jenkins** → **Global Tool Configuration**
2. Scroll to **Maven** section
3. Click **Add Maven**
4. Configure:
   - **Name:** `Maven3`
   - **Version:** Select latest Maven 3.x (e.g., 3.9.5)
   - Check **Install automatically**
5. Click **Save**

#### 3.2 Configure JDK

1. In the same **Global Tool Configuration** page
2. Scroll to **JDK** section
3. Click **Add JDK**
4. Configure:
   - **Name:** `JDK17`
   - **Install automatically:** Check this
   - **Version:** Select Java 17 (e.g., "jdk-17.0.9+9")
5. Click **Save**

#### 3.3 Configure NodeJS

1. In the same **Global Tool Configuration** page
2. Scroll to **NodeJS** section
3. Click **Add NodeJS**
4. Configure:
   - **Name:** `NodeJS18`
   - **Version:** Select Node 18.x (e.g., 18.18.0)
   - Check **Install automatically**
5. Click **Save**

#### 3.4 Configure SonarQube Scanner

1. In the same **Global Tool Configuration** page
2. Scroll to **SonarQube Scanner** section
3. Click **Add SonarQube Scanner**
4. Configure:
   - **Name:** `SonarScanner`
   - Check **Install automatically**
   - **Version:** Select latest version (e.g., SonarQube Scanner 5.0.1)
5. Click **Save**

---

### Step 4: Configure SonarQube Server

#### 4.1 Generate SonarQube Token

1. Open http://sonarqube.imcc.com/ in a new tab
2. Login with:
   - **Username:** `student`
   - **Password:** `Imccstudent@2025`
3. Click on your profile icon (top right) → **My Account**
4. Go to **Security** tab
5. Under **Generate Tokens**:
   - **Name:** `jenkins-integration`
   - **Type:** Select "Global Analysis Token" or "User Token"
   - **Expires in:** Select appropriate duration (e.g., 90 days)
6. Click **Generate**
7. **⚠️ COPY THE TOKEN IMMEDIATELY** - you won't see it again!

#### 4.2 Add SonarQube Server to Jenkins

1. Back in Jenkins, go to **Manage Jenkins** → **Configure System**
2. Scroll to **SonarQube servers** section
3. Check **Environment variables** → **Enable injection of SonarQube server configuration**
4. Click **Add SonarQube**
5. Configure:
   - **Name:** `SonarQube` (must match the name in Jenkinsfile)
   - **Server URL:** `http://sonarqube.imcc.com`
   - **Server authentication token:** Click **Add** → **Jenkins**
     - **Kind:** Secret text
     - **Secret:** Paste the SonarQube token you copied
     - **ID:** `sonarqube-token`
     - **Description:** SonarQube Authentication Token
     - Click **Add**
   - Select the credential you just created from dropdown
6. Click **Save**

---

### Step 5: Configure Nexus Credentials

1. Go to **Manage Jenkins** → **Manage Credentials**
2. Click on **(global)** domain
3. Click **Add Credentials**
4. Configure:
   - **Kind:** Username with password
   - **Scope:** Global
   - **Username:** `student`
   - **Password:** `Imcc@2025`
   - **ID:** `nexus-credentials`
   - **Description:** Nexus Repository Credentials
5. Click **Create**

---

### Step 6: Configure GitHub Credentials

#### 6.1 Create GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Configure:
   - **Note:** `Jenkins CI/CD - Smart Parking`
   - **Expiration:** 90 days (or custom)
   - **Select scopes:**
     - ✅ `repo` (full control)
     - ✅ `admin:repo_hook` (for webhooks)
4. Click **Generate token**
5. **⚠️ COPY THE TOKEN IMMEDIATELY**

#### 6.2 Add GitHub Token to Jenkins

1. In Jenkins, go to **Manage Jenkins** → **Manage Credentials**
2. Click on **(global)** domain
3. Click **Add Credentials**
4. Configure:
   - **Kind:** Secret text (or Username with password)
   - **Secret:** Paste your GitHub PAT
   - **ID:** `github-token`
   - **Description:** GitHub Personal Access Token
5. Click **Create**

---

### Step 7: Create Jenkins Pipeline Job

1. From Jenkins dashboard, click **New Item**
2. Enter item name: `Smart-Parking-Pipeline`
3. Select **Pipeline**
4. Click **OK**

#### 7.1 Configure General Settings

1. **Description:** `Full-stack CI/CD pipeline for Smart Parking application`
2. Check **GitHub project**
   - **Project url:** `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/`
   - (Replace with your actual GitHub repository URL)

#### 7.2 Configure Build Triggers

1. Check **GitHub hook trigger for GITScm polling**
   - This enables automatic builds when you push to GitHub
2. Optionally check **Poll SCM** for backup polling:
   - **Schedule:** `H/5 * * * *` (polls every 5 minutes)

#### 7.3 Configure Pipeline

1. Under **Pipeline** section:
   - **Definition:** Select **Pipeline script from SCM**
   - **SCM:** Select **Git**
   - **Repository URL:** `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`
     - (Replace with your actual repository URL)
   - **Credentials:** Select the GitHub credential you created (`github-token`)
   - **Branches to build:** `*/main` (or `*/master` depending on your default branch)
   - **Script Path:** `Jenkinsfile`
   - **Lightweight checkout:** Check this box (optional, for faster checkouts)

2. Click **Save**

---

### Step 8: Configure Docker Access (If Required)

If Jenkins needs to build and push Docker images, ensure the Jenkins user has Docker permissions:

> **Note:** This step may require college server administrator access. If you don't have sudo access, contact your system administrator.

```bash
# SSH into the Jenkins server (if you have access)
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

---

### Step 9: Configure Maven Settings for Nexus

#### 9.1 Create Maven Settings File

1. In Jenkins, go to **Manage Jenkins** → **Managed files**
   - If you don't see this option, install the **Config File Provider Plugin**
2. Click **Add a new Config**
3. Select **Global Maven settings.xml**
4. Configure:
   - **ID:** `maven-settings`
   - **Name:** `Maven Settings with Nexus`
5. In the content area, paste:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
    
    <servers>
        <server>
            <id>nexus</id>
            <username>student</username>
            <password>Imcc@2025</password>
        </server>
    </servers>
    
    <mirrors>
        <mirror>
            <id>nexus</id>
            <mirrorOf>*</mirrorOf>
            <url>http://nexus.imcc.com/repository/maven-public/</url>
        </mirror>
    </mirrors>
    
    <profiles>
        <profile>
            <id>nexus</id>
            <repositories>
                <repository>
                    <id>central</id>
                    <url>http://nexus.imcc.com/repository/maven-public/</url>
                    <releases><enabled>true</enabled></releases>
                    <snapshots><enabled>true</enabled></snapshots>
                </repository>
            </repositories>
            <pluginRepositories>
                <pluginRepository>
                    <id>central</id>
                    <url>http://nexus.imcc.com/repository/maven-public/</url>
                    <releases><enabled>true</enabled></releases>
                    <snapshots><enabled>true</enabled></snapshots>
                </pluginRepository>
            </pluginRepositories>
        </profile>
    </profiles>
    
    <activeProfiles>
        <activeProfile>nexus</activeProfile>
    </activeProfiles>
</settings>
```

6. Click **Submit**

---

### Step 10: Update Your Backend pom.xml

Ensure your `smark-parking-backend/pom.xml` has the distribution management section:

```xml
<distributionManagement>
    <repository>
        <id>nexus</id>
        <name>Nexus Release Repository</name>
        <url>http://nexus.imcc.com/repository/maven-releases/</url>
    </repository>
    <snapshotRepository>
        <id>nexus</id>
        <name>Nexus Snapshot Repository</name>
        <url>http://nexus.imcc.com/repository/maven-snapshots/</url>
    </snapshotRepository>
</distributionManagement>
```

---

### Step 11: Setup GitHub Webhook (Optional but Recommended)

For automatic builds on every push:

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL:** `http://jenkins.imcc.com/github-webhook/`
   - **Content type:** `application/json`
   - **Which events:** Select "Just the push event"
   - **Active:** Check this
4. Click **Add webhook**

---

### Step 12: Test the Pipeline

1. Go to your Jenkins job: `Smart-Parking-Pipeline`
2. Click **Build Now**
3. Watch the build progress in **Build History**
4. Click on the build number → **Console Output** to see detailed logs

---

## 🔍 Troubleshooting

### Common Issues

#### 1. **Docker Permission Denied**
```
Error: Got permission denied while trying to connect to the Docker daemon socket
```
**Solution:** Jenkins user needs to be in docker group (requires admin access)

#### 2. **SonarQube Connection Failed**
```
Error: Unable to connect to SonarQube server
```
**Solution:** 
- Verify SonarQube URL: `http://sonarqube.imcc.com`
- Check SonarQube token is valid
- Ensure SonarQube server is running

#### 3. **Nexus Upload Failed**
```
Error: 401 Unauthorized
```
**Solution:**
- Verify Nexus credentials are correct
- Check repository exists in Nexus
- Ensure user has deployment permissions

#### 4. **GitHub Clone Failed**
```
Error: Authentication failed
```
**Solution:**
- Verify GitHub token has `repo` scope
- Check repository URL is correct
- Ensure token hasn't expired

#### 5. **Maven Build Failed**
```
Error: Could not resolve dependencies
```
**Solution:**
- Check Nexus proxy repository is configured
- Verify internet connectivity
- Check Maven settings.xml configuration

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Jenkins can access GitHub repository
- [ ] Maven builds successfully
- [ ] SonarQube analysis runs
- [ ] Artifacts upload to Nexus
- [ ] Docker images build successfully
- [ ] Docker images push to Nexus registry
- [ ] Quality gates pass
- [ ] Deployment completes
- [ ] Health checks pass

---

## 📞 Support

If you encounter issues:

1. Check Jenkins console output for detailed error messages
2. Verify all credentials are correctly configured
3. Ensure all required plugins are installed
4. Contact your college system administrator for server-specific issues

---

## 🎯 Next Steps

Once the pipeline is running successfully:

1. Configure email notifications for build status
2. Set up Slack/Discord webhooks for alerts
3. Add more quality gates and security scans
4. Implement deployment to staging/production environments
5. Add automated integration tests

---

**Good luck with your deployment! 🚀**
