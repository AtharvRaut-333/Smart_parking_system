# 🗄️ MySQL Database Setup Guide

Complete guide for setting up MySQL database in Docker for Smart Car Parking System.

---

## 🚀 Quick Start

### Option 1: Standalone MySQL (Recommended for Development)
```bash
cd /path/to/smart_car_parking
docker-compose -f docker-compose-mysql.yml up -d
```

### Option 2: Full Stack (MySQL + Backend + Frontend)
```bash
docker-compose up -d
```

---

## 📋 Database Configuration

### Default Credentials
- **Root Password:** `root123`
- **Database Name:** `smart_parking`
- **Username:** `parking_user`
- **Password:** `parking_pass123`
- **Port:** `3306`

### Connection String
```
jdbc:mysql://localhost:3306/smart_parking?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

---

## 🔧 Setup Steps

### Step 1: Start MySQL Container
```bash
docker-compose -f docker-compose-mysql.yml up -d
```

### Step 2: Verify MySQL is Running
```bash
docker ps | grep mysql
```

You should see:
```
smart-parking-mysql   mysql:8.0   Up   0.0.0.0:3306->3306/tcp
```

### Step 3: Check MySQL Logs
```bash
docker logs smart-parking-mysql
```

Look for: `ready for connections`

### Step 4: Test Connection
```bash
docker exec -it smart-parking-mysql mysql -u parking_user -pparking_pass123 smart_parking
```

You should see MySQL prompt:
```
mysql>
```

### Step 5: Verify Database
```sql
SHOW DATABASES;
USE smart_parking;
SHOW TABLES;
```

---

## 🔐 Update Application Configuration

### For Development (application-local.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_parking?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=parking_user
spring.datasource.password=parking_pass123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true
```

### For Production (application-prod.properties)
```properties
spring.datasource.url=jdbc:mysql://mysql:3306/smart_parking?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=parking_user
spring.datasource.password=parking_pass123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

**Note:** In production docker-compose, use `mysql` as hostname (service name), not `localhost`!

---

## 🗃️ Database Initialization

The `mysql-init/init.sql` script runs automatically on first startup.

### Add Custom Initialization
Edit `mysql-init/init.sql`:
```sql
USE smart_parking;

-- Example: Insert default roles
INSERT INTO roles (name) VALUES 
  ('ROLE_USER'), 
  ('ROLE_ADMIN'), 
  ('ROLE_OWNER');

-- Example: Insert default admin user
INSERT INTO users (username, email, password, role) VALUES 
  ('admin', 'admin@smartparking.com', '$2a$10$...', 'ROLE_ADMIN');
```

---

## 🔄 Common Operations

### Connect to MySQL CLI
```bash
docker exec -it smart-parking-mysql mysql -u parking_user -pparking_pass123 smart_parking
```

### Backup Database
```bash
docker exec smart-parking-mysql mysqldump -u parking_user -pparking_pass123 smart_parking > backup.sql
```

### Restore Database
```bash
docker exec -i smart-parking-mysql mysql -u parking_user -pparking_pass123 smart_parking < backup.sql
```

### View Database Size
```bash
docker exec -it smart-parking-mysql mysql -u parking_user -pparking_pass123 -e "
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'smart_parking'
GROUP BY table_schema;
"
```

### Reset Database
```bash
# Stop and remove container
docker-compose -f docker-compose-mysql.yml down -v

# Start fresh
docker-compose -f docker-compose-mysql.yml up -d
```

---

## 🐳 Docker Compose Integration

### Full Stack with MySQL
The main `docker-compose.yml` now includes MySQL:

```yaml
services:
  mysql:      # Database
  backend:    # Spring Boot (depends on mysql)
  frontend:   # React + nginx (depends on backend)
```

**Start everything:**
```bash
docker-compose up -d
```

**Check all services:**
```bash
docker-compose ps
```

---

## 🔍 Troubleshooting

### Issue: Connection refused
```bash
# Check if MySQL is running
docker ps | grep mysql

# Check MySQL logs
docker logs smart-parking-mysql

# Verify port is exposed
docker port smart-parking-mysql
```

### Issue: Access denied
```bash
# Reset password
docker exec -it smart-parking-mysql mysql -u root -proot123 -e "
ALTER USER 'parking_user'@'%' IDENTIFIED BY 'parking_pass123';
FLUSH PRIVILEGES;
"
```

### Issue: Tables not created
- Check `spring.jpa.hibernate.ddl-auto=update` in application.properties
- Verify JPA entities are properly annotated
- Check application logs for Hibernate errors

### Issue: Slow queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- View slow queries
SELECT * FROM mysql.slow_log;
```

---

## 📊 Monitoring

### Check Database Status
```bash
docker exec -it smart-parking-mysql mysql -u root -proot123 -e "SHOW STATUS;"
```

### View Active Connections
```bash
docker exec -it smart-parking-mysql mysql -u root -proot123 -e "SHOW PROCESSLIST;"
```

### Check Table Status
```bash
docker exec -it smart-parking-mysql mysql -u parking_user -pparking_pass123 smart_parking -e "SHOW TABLE STATUS;"
```

---

## 🔒 Security Best Practices

### For Production:
1. **Change default passwords** in docker-compose.yml
2. **Use environment variables** for sensitive data
3. **Enable SSL** for MySQL connections
4. **Restrict network access** - don't expose port 3306 publicly
5. **Regular backups** - automate database backups
6. **Use secrets management** - Docker secrets or AWS Secrets Manager

### Example with Environment Variables:
```bash
# Create .env file
cat > .env << EOF
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_user_password
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EOF

# Use in docker-compose.yml
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
  MYSQL_PASSWORD: ${MYSQL_PASSWORD}
```

---

## ✅ Verification Checklist

- [ ] MySQL container is running
- [ ] Can connect via MySQL CLI
- [ ] Database `smart_parking` exists
- [ ] User `parking_user` has access
- [ ] Backend connects successfully
- [ ] Tables are auto-created by Hibernate
- [ ] Data persists after container restart

---

## 🎯 Next Steps

1. **Start MySQL:** `docker-compose -f docker-compose-mysql.yml up -d`
2. **Update application.properties** with correct database URL
3. **Run your Spring Boot app** - tables will be created automatically
4. **Test the connection** - check application logs
5. **Deploy full stack:** `docker-compose up -d`

---

**Your MySQL database is ready! 🎉**

The database will persist data in Docker volume `mysql-data` even if you stop/restart containers.
