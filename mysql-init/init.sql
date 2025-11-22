-- Smart Car Parking Database Initialization Script
-- This script runs automatically when MySQL container starts for the first time

-- Create database if not exists (already created by environment variable)
CREATE DATABASE IF NOT EXISTS smart_parking;
USE smart_parking;

-- Grant privileges
GRANT ALL PRIVILEGES ON smart_parking.* TO 'parking_user'@'%';
FLUSH PRIVILEGES;

-- Optional: Create initial tables (if you want to pre-create schema)
-- Your Spring Boot application will auto-create tables with JPA/Hibernate
-- But you can add initial data here if needed

-- Example: Insert initial data
-- INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN'), ('ROLE_OWNER');

SELECT 'Database initialized successfully!' AS message;
