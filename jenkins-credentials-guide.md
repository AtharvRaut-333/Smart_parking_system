# Jenkins Credentials Setup Guide

Step-by-step guide for configuring all required credentials in Jenkins for the Smart Car Parking CI/CD pipeline.

---

## 📍 Access Credentials Page

1. Open Jenkins: `http://your-ec2-ip:8080`
2. Navigate to: **Manage Jenkins** → **Manage Credentials**
3. Click on **System** → **Global credentials (unrestricted)**
4. Click **Add Credentials**

---

## 1️⃣ GitHub Credentials

**Purpose:** Allow Jenkins to clone your repository and receive webhook events.

### Steps:
1. Click **Add Credentials**
2. Fill in:
   - **Kind:** Username with password
   - **Scope:** Global
   - **Username:** Your GitHub username
   - **Password:** Your GitHub Personal Access Token (not your GitHub password!)
   - **ID:** `github-credentials`
   - **Description:** GitHub Personal Access Token
3. Click **OK**

### How to Get GitHub Token:
1. Go to GitHub → **Settings** → **Developer settings**
2. Click **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token (classic)**
4. Select scopes:
   - ✅ `repo` (all sub-scopes)
   - ✅ `admin:repo_hook` (all sub-scopes)
5. Click **Generate token**
6. **Copy the token immediately** (you won't see it again!)

---

## 2️⃣ Docker Hub Credentials

**Purpose:** Push Docker images to Docker Hub registry.

### Steps:
1. Click **Add Credentials**
2. Fill in:
   - **Kind:** Username with password
   - **Scope:** Global
   - **Username:** Your Docker Hub username
   - **Password:** Your Docker Hub password
   - **ID:** `dockerhub-credentials`
   - **Description:** Docker Hub Login
3. Click **OK**

### Don't Have Docker Hub Account?
1. Go to [hub.docker.com](https://hub.docker.com)
2. Sign up for free
3. Create repositories:
   - `smart-parking-backend`
   - `smart-parking-frontend`

---

## 3️⃣ SonarQube Token

**Purpose:** Authenticate Jenkins with SonarQube for code analysis.

### Steps:
1. Click **Add Credentials**
2. Fill in:
   - **Kind:** Secret text
   - **Scope:** Global
   - **Secret:** Your SonarQube authentication token
   - **ID:** `sonarqube-token`
   - **Description:** SonarQube Authentication Token
3. Click **OK**

### How to Get SonarQube Token:
1. Open SonarQube: `http://your-ec2-ip:9000`
2. Login (default: admin/admin)
3. Click on **Administrator** icon (top right) → **My Account**
4. Go to **Security** tab
5. Under **Generate Tokens**:
   - Name: `jenkins-token`
   - Type: Global Analysis Token
   - Expires in: No expiration (or set as needed)
6. Click **Generate**
7. **Copy the token immediately!**

---

## 4️⃣ Nexus Credentials (Optional)

**Purpose:** Upload Maven artifacts to Nexus repository.

### Steps:
1. Click **Add Credentials**
2. Fill in:
   - **Kind:** Username with password
   - **Scope:** Global
   - **Username:** `admin`
   - **Password:** Your Nexus admin password
   - **ID:** `nexus-credentials`
   - **Description:** Nexus Repository Manager
3. Click **OK**

### How to Get Nexus Password:
If you just installed Nexus:
```bash
docker exec nexus cat /nexus-data/admin.password
```

---

## 5️⃣ EC2 SSH Credentials (Optional)

**Purpose:** Deploy to remote EC2 instances via SSH.

### Steps:
1. Click **Add Credentials**
2. Fill in:
   - **Kind:** SSH Username with private key
   - **Scope:** Global
   - **ID:** `ec2-ssh-credentials`
   - **Description:** EC2 SSH Key
   - **Username:** `ec2-user` (or `ubuntu` for Ubuntu)
   - **Private Key:** Enter directly
     - Click **Enter directly**
     - Paste your EC2 private key (.pem file content)
3. Click **OK**

---

## 🔧 Configure SonarQube Server in Jenkins

After adding the SonarQube token, configure the server:

1. Go to **Manage Jenkins** → **Configure System**
2. Scroll to **SonarQube servers**
3. Click **Add SonarQube**
4. Fill in:
   - **Name:** `SonarQube`
   - **Server URL:** `http://localhost:9000` (or `http://your-ec2-ip:9000`)
   - **Server authentication token:** Select `sonarqube-token` from dropdown
5. Click **Save**

---

## ✅ Verify Credentials

### Check All Credentials Are Added:
Go to **Manage Jenkins** → **Manage Credentials** → **System** → **Global credentials**

You should see:
- ✅ `github-credentials` (Username with password)
- ✅ `dockerhub-credentials` (Username with password)
- ✅ `sonarqube-token` (Secret text)
- ✅ `nexus-credentials` (Username with password) - Optional
- ✅ `ec2-ssh-credentials` (SSH Username with private key) - Optional

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
2. **Use Jenkins credentials binding** in pipelines
3. **Rotate tokens regularly** (every 90 days recommended)
4. **Use least privilege principle** - only grant necessary permissions
5. **Enable 2FA** on GitHub and Docker Hub
6. **Restrict credential scope** to specific pipelines if possible

---

## 🆘 Troubleshooting

### Issue: GitHub authentication failed
- Verify token has correct scopes (`repo`, `admin:repo_hook`)
- Check if token is expired
- Ensure username is correct (not email)

### Issue: Docker push failed
- Verify Docker Hub credentials are correct
- Check if repository exists on Docker Hub
- Ensure repository is public or you have access

### Issue: SonarQube authentication failed
- Verify token is valid and not expired
- Check SonarQube server URL is correct
- Ensure SonarQube is running: `docker ps | grep sonarqube`

### Issue: Nexus deployment failed
- Check Nexus is running: `docker ps | grep nexus`
- Verify credentials match Nexus admin password
- Ensure repositories exist in Nexus

---

## 📝 Update Jenkinsfiles

After setting up credentials, update your Jenkinsfiles with your Docker Hub username:

**Backend Jenkinsfile:**
```groovy
environment {
    DOCKER_IMAGE_NAME = 'YOUR_DOCKERHUB_USERNAME/smart-parking-backend'
}
```

**Frontend Jenkinsfile:**
```groovy
environment {
    DOCKER_IMAGE_NAME = 'YOUR_DOCKERHUB_USERNAME/smart-parking-frontend'
}
```

**docker-compose.yml:**
```yaml
services:
  backend:
    image: YOUR_DOCKERHUB_USERNAME/smart-parking-backend:latest
  frontend:
    image: YOUR_DOCKERHUB_USERNAME/smart-parking-frontend:latest
```

---

**You're all set! 🎉** Your Jenkins is now configured with all necessary credentials for the CI/CD pipeline.
