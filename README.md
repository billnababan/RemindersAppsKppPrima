📌 KPP Si PRIMA – Reminder & e-Sign Document System
A fullstack web-based application built for KPP Prima Persada, designed to streamline internal workflows through automated reminder notifications and a secure electronic document signing system.

🔧 Tech Stack

Frontend: React.js + Tailwind CSS
Backend: Node.js, Express.js
Database: MySQL
Messaging Integration: Fontee WhatsApp API
Authentication: JWT Tokens
File Upload: Multer

✨ Features
🔔 Smart Reminder System

Schedule and send role-based reminders (Surveyor, Engineering, Sign BA, FATB PELH, etc.)
Multiple reminder types: Manual, Automatic, Scheduled
Priority levels: Low, Medium, High, Urgent
Due date tracking and notifications

📝 e-Sign Document Workflow

Users can review, approve, or reject documents online
Digital signature implementation
Document status tracking (Pending, Approved, Rejected, Completed)
Role-based document access control

📁 Document Management

Upload and manage document templates
File type validation and security
Document version control

📬 WhatsApp Integration

Auto-send updates and reminders via Fontee WhatsApp API
Real-time notifications for document approvals
Custom message templates

👥 Role-based Access Control

Different permission levels for various user roles
Secure authentication and authorization
User management system

📊 Responsive Dashboard

Clean and mobile-friendly UI built with Tailwind CSS
Real-time data updates
Intuitive user experience

🚀 Getting Started
Prerequisites
Make sure you have the following installed:

Node.js (v16 or higher)
MySQL (v8.0 or higher)
npm or yarn

Installation

Clone the repository
bashgit clone https://github.com/yourusername/kpp-si-prima.git
cd kpp-si-prima

Install Backend Dependencies
bashcd backend
npm install

Install Frontend Dependencies
bashcd ../frontend
npm install


Database Setup

Create MySQL Database
sqlCREATE DATABASE your_databases_name;

Import Database Schema
bashmysql -u your_username -p your_databases < database/schema.sql

Import Sample Data (Optional)
bashmysql -u your_username -p your_databases < database/sample_data.sql


Environment Configuration

Backend Environment Setup
Create .env file in the backend directory:
env# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_databases_name
DB_PORT=3306

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Fontee WhatsApp API Configuration
FONTEE_API_KEY=your_fontee_api_key_here
FONTEE_BASE_URL=https://api.fontee.id
FONTEE_DEVICE_ID=your_device_id

Frontend Environment Setup
Create .env file in the frontend directory:
env# API Configuration
API_VITE_URL=http://localhost:4000/api/v1


Fontee WhatsApp API Setup

Get API Key

Register at Fontee.id
Verify your WhatsApp number
Get your API key and device ID
Add them to your backend .env file


Test WhatsApp Integration
bash# In backend directory
npm run test:whatsapp


Running the Application

Start Backend Server
bashcd backend
npm run dev
Backend will run on: http://localhost:4000
Start Frontend Development Server
bashcd frontend
npm start
Frontend will run on: http://localhost:3000

📚 API Documentation
Base URL
http://localhost:4000/api/v1
Authentication Endpoints

POST /auth/login - User login
POST /auth/register - User registration
POST /auth/logout - User logout
GET /auth/me - Get current user info

Reminder Endpoints

GET /reminders - Get all reminders
POST /reminders - Create new reminder
GET /reminders/:id - Get specific reminder
PUT /reminders/:id - Update reminder
DELETE /reminders/:id - Delete reminder
POST /reminders/:id/complete - Mark reminder as completed

Document Endpoints

GET /documents - Get all documents
POST /documents - Upload new document
GET /documents/:id - Get specific document
PUT /documents/:id - Update document
DELETE /documents/:id - Delete document
POST /documents/:id/sign - Sign document
POST /documents/:id/approve - Approve document
POST /documents/:id/reject - Reject document
