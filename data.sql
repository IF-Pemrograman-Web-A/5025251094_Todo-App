CREATE DATABASE IF NOT EXISTS todo_db;
USE todo_db;

-- 1. Personal Tasks Table (for index.php)
CREATE TABLE IF NOT EXISTS personal_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    reminder_date DATETIME,
    image_path VARCHAR(255) DEFAULT NULL,
    completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Shared/Team Tasks Table (for team.php)
CREATE TABLE IF NOT EXISTS team_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    assignee VARCHAR(100) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dummy Data for Personal Tasks
INSERT INTO personal_tasks (title, description, due_date, completed) VALUES
('Complete Web Assignment E04', 'Migrate HTML to modular PHP and implement PDO CRUD', '2026-10-19', 0),
('Buy Groceries', 'Milk, eggs, bread, and coffee', '2026-10-20', 1);

-- Dummy Data for Shared/Team Tasks
INSERT INTO team_tasks (title, assignee, description, due_date, status) VALUES
('Setup Database Schema', 'Alex', 'Create database structures and import data.sql', '2026-10-18', 'Completed'),
('Design Front-end Modules', 'Sam', 'Separate static components into header, menu, and footer', '2026-10-19', 'In Progress');