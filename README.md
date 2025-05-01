# Task Tracker Application

## Overview
Task Tracker is a full-stack web application that enables users to manage projects and tasks efficiently. Built with ReactJS for the frontend, ExpressJS for the backend, and MongoDB for data storage, the app supports secure user authentication using JWT. Each user can create up to 4 projects, with multiple tasks per project to track progress seamlessly.

## Features
- **User Authentication:** Signup and login with JWT-based token authentication for secure access.
- **Project Management:** Create and view up to 4 projects per user.
- **Task Management:** Create, read, update, and delete tasks within each project.
- **Progress Tracking:** Tasks track status (pending, in-progress, completed) along with creation and completion dates.
- **Responsive UI:** A clean and intuitive interface with color-coded statuses and smooth transitions.
- **Error Handling:** User-friendly error messages and loading indicators throughout the app.

## Technologies Used
- Frontend: ReactJS, Axios, CSS
- Backend: Node.js, ExpressJS, JWT, bcrypt
- Database: MongoDB, Mongoose
- Other: CORS, dotenv

## Installation and Setup

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running locally, or a MongoDB Atlas account

### Backend Setup
1. Navigate to the backend directory (where `server.js` is located).
2. Create a `.env` file and set these variables:
MONGODB_URI=your_mongodb_connection_string JWT_SECRET=your_jwt_secret_key

Run
Copy code
3. Install dependencies:
```bash
npm install
Start the backend server:
bash
Run
Copy code
node server.js
The backend will run on http://localhost:5000.
Frontend Setup
Navigate to the React frontend directory (task-tracker-frontend).
Install dependencies:
bash
Run
Copy code
npm install
Ensure the proxy to backend is set in package.json:
json
Run
Copy code
"proxy": "http://localhost:5000"
Start the frontend app:
bash
Run
Copy code
npm start
The React app will run at http://localhost:3000.
Usage
Open your browser at http://localhost:3000.
Signup for a new account or login with existing credentials.
Create and select projects (up to 4 max).
Add, update, or delete tasks within a selected project.
Track task progress with clear visual status indicators.
Folder Structure
Run
Copy code
/backend
  - server.js
  - .env
  - package.json
/frontend (task-tracker-frontend)
  - src/
    - App.js
    - App.css
  - package.json
