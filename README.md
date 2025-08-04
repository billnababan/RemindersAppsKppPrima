# KPP Si PRIMA – Reminder & e-Sign Document System

A fullstack web-based application built for **KPP Prima Persada**, designed to streamline internal workflows through automated reminder notifications and a secure electronic document signing system.

---

## 🔧 Tech Stack

* **Frontend**: React.js + Tailwind CSS
* **Backend**: Node.js, Express.js
* **Database**: MySQL
* **Messaging Integration**: Fontee WhatsApp API
* **Authentication**: JWT Tokens
* **File Upload**: Multer

---

## ✨ Features

### 🔔 Smart Reminder System

* Role-based reminders (Surveyor, Engineering, Sign BA, FATB PELH, etc.)
* Types: Manual, Automatic, Scheduled
* Priority levels: Low, Medium, High, Urgent
* Due date tracking & WhatsApp notifications

### 📝 e-Sign Document Workflow

* Review, approve, or reject documents online
* Digital signature implementation
* Document status tracking: Pending, Approved, Rejected, Completed
* Role-based document access

### 📁 Document Management

* Upload/manage document templates
* File validation and security
* Version control

### 📩 WhatsApp Integration

* Real-time updates via Fontee API
* Notification for reminders & document approval
* Custom message templates

### 👥 Role-based Access Control

* Multiple permission levels
* Secure authentication and authorization
* User management

### 📊 Responsive Dashboard

* Built with Tailwind CSS
* Clean, mobile-friendly UI
* Real-time data updates

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v16+)
* MySQL (v8.0+)
* npm or yarn

### Installation

#### Clone the Repository

```bash
git clone https://github.com/yourusername/kpp-si-prima.git
cd kpp-si-prima
```

#### Install Backend Dependencies

```bash
cd backend
npm install
```

#### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Database Setup

#### Create MySQL Database

```sql
CREATE DATABASE your_database_name;
```

#### Import Schema

```bash
mysql -u your_user -p your_database_name < database/schema.sql
```

#### (Optional) Import Sample Data

```bash
mysql -u your_user -p your_database_name < database/sample_data.sql
```

---

## 📂 Environment Configuration

### Backend `.env`

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
DB_PORT=3306
PORT=4000
NODE_ENV=development
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
FONTEE_API_KEY=your_fontee_api_key
FONTEE_BASE_URL=https://api.fontee.id
FONTEE_DEVICE_ID=your_device_id
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:4000/api/v1
```

---

## 📢 Fontee WhatsApp API Setup

1. Register at [Fontee.id](https://fontee.id)
2. Verify WhatsApp number
3. Get API Key and Device ID
4. Add them to the backend `.env` file

#### Test WhatsApp Integration

```bash
# From backend directory
npm run test:whatsapp
```

---

## 🌐 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

App running at: `http://localhost:4000`

### Start Frontend Server

```bash
cd frontend
npm start
```

App running at: `http://localhost:3000`

---

## 📃 API Documentation

### Base URL

```
http://localhost:4000/api/v1
```

### 🔑 Authentication

* `POST /login` - Login
* `POST /register` - Register
* `POST /logout` - Logout

### ⏰ Reminder Endpoints

* `GET /reminders` - List reminders
* `POST /reminders` - Create reminder
* `GET /reminders/:id` - Get a reminder
* `DELETE /reminders/:id` - Delete reminder
* `PATCH /reminders/:id/complete` - Mark as completed
* `PATCH /reminders/:id/read` - Mark as read
* `PATCH /reminders/:id/notes` - update notes

### 📄 Document Endpoints

* `GET /documents` - List documents to esign
* `POST /documents/upload` - Upload document
* `GET /documents/:id` - Get document detail
* `PUT /documents/:id` - Update document
* `DELETE /documents/:id` - Delete document

### 📄 Esign Endpoints

* `GET /documents` - List documents
* `POST /sign/id` - Sign document
* `POST /reject/id` - Reject document
  
---

## 📦 License

MIT – Feel free to use and adapt for your own project.
