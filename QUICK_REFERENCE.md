# Quick Reference - College Jenkins Setup

## 🔑 Login Credentials

### Jenkins
- **URL:** http://jenkins.imcc.com/
- **Username:** student
- **Password:** Changeme@2025

### SonarQube
- **URL:** http://sonarqube.imcc.com/
- **Username:** student
- **Password:** Imccstudent@2025

### Nexus
- **URL:** http://nexus.imcc.com/
- **Username:** student
- **Password:** Imcc@2025

---

## ✅ Quick Setup Checklist

### Phase 1: Jenkins Configuration
- [ ] Login to Jenkins
- [ ] Install required plugins (see full guide)
- [ ] Configure Maven3, JDK17, NodeJS18, SonarScanner tools
- [ ] Configure SonarQube server connection
- [ ] Add Nexus credentials (ID: `nexus-credentials`)
- [ ] Add GitHub token (ID: `github-token`)
- [ ] Add SonarQube token (ID: `sonarqube-token`)

### Phase 2: Create Pipeline Job
- [ ] Create new Pipeline job: `Smart-Parking-Pipeline`
- [ ] Configure GitHub project URL
- [ ] Enable GitHub webhook trigger
- [ ] Set Pipeline from SCM (Git)
- [ ] Point to your GitHub repository
- [ ] Set Script Path: `Jenkinsfile`

### Phase 3: External Configuration
- [ ] Generate SonarQube token
- [ ] Generate GitHub Personal Access Token (scopes: `repo`, `admin:repo_hook`)
- [ ] Configure GitHub webhook (optional but recommended)

### Phase 4: Test
- [ ] Click "Build Now"
- [ ] Monitor console output
- [ ] Verify all stages pass

---

## 🔧 Tool Names (Must Match Jenkinsfile)

These names MUST match exactly in Jenkins Global Tool Configuration:

| Tool | Name in Jenkins | Name in Jenkinsfile |
|------|----------------|---------------------|
| Maven | `Maven3` | `Maven3` |
| JDK | `JDK17` | `JDK17` |
| NodeJS | `NodeJS18` | `NodeJS18` |
| SonarQube Scanner | `SonarScanner` | `SonarScanner` |
| SonarQube Server | `SonarQube` | `SonarQube` |

---

## 🔐 Credential IDs (Must Match Jenkinsfile)

| Purpose | ID in Jenkins | ID in Jenkinsfile |
|---------|--------------|-------------------|
| Nexus | `nexus-credentials` | `nexus-credentials` |
| SonarQube | `sonarqube-token` | `sonarqube-token` |
| GitHub | `github-token` | `github-token` |

---

## 📝 GitHub PAT Scopes

When creating GitHub Personal Access Token:
- ✅ `repo` (full control of repositories)
- ✅ `admin:repo_hook` (for webhooks)

---

## 🌐 GitHub Webhook Configuration

**Payload URL:** `http://jenkins.imcc.com/github-webhook/`  
**Content type:** `application/json`  
**Events:** Just the push event

---

## 🚨 Common Issues & Quick Fixes

### Issue: Docker permission denied
**Fix:** Jenkins user needs docker group membership (requires admin)

### Issue: SonarQube connection failed
**Fix:** Verify token is valid and URL is `http://sonarqube.imcc.com`

### Issue: Nexus 401 Unauthorized
**Fix:** Check credentials are `student` / `Imcc@2025`

### Issue: GitHub clone failed
**Fix:** Verify GitHub token has `repo` scope and hasn't expired

### Issue: Tool not found (Maven/JDK/Node)
**Fix:** Verify tool names match exactly (case-sensitive)

---

## 📞 Need Help?

1. Check Jenkins console output for detailed errors
2. Verify all credentials are correctly configured
3. Ensure tool names match exactly
4. Refer to `COLLEGE_JENKINS_SETUP.md` for detailed instructions
5. Contact college system administrator for server-specific issues

---

## 🎯 Files Updated for College Server

- ✅ `Jenkinsfile` - Updated URLs to college servers
- ✅ `smark-parking-backend/pom.xml` - Updated Nexus URLs
- ✅ `COLLEGE_JENKINS_SETUP.md` - Complete setup guide
- ✅ `QUICK_REFERENCE.md` - This file

---

**Last Updated:** 2025-11-24
