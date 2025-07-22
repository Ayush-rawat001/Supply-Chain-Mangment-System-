 Supply Chain Management System
A full-stack web application to efficiently manage supply chain operations including suppliers, products, orders, and inventory.

✅ Key Features
Secure Authentication with bcrypt

CRUD operations on Supplier/Product/Order/Inventory Management

Low Stock Alerts

Dashboard Overview

Mobile-Responsive UI

🛠️ Tech Stack
Backend: Node.js, Express.js, MongoDB, Mongoose, bcrypt, express-session

Frontend: HTML5, CSS3, JavaScript (ES6+), Fetch API

🗂️ Project Structure
Organized into folders for:

models/ (Mongoose schemas)

routes/ (API endpoints)

public/ (Frontend HTML/CSS/JS)

server.js (Main entry)

🚀 Getting Started
Clone the repo

Install dependencies with npm install

Configure environment variables in .env

Run MongoDB locally or via Atlas

Start the app using npm run dev or npm start

Visit http://localhost:3000

🔌 Core API Endpoints
Auth: Register, login, logout, check session

Suppliers/Products/Orders/Inventory: Full CRUD operations

Inventory: Low stock alert and stock updates

Orders: Status tracking (pending → delivered)

🧾 Schemas Overview
User: Auth roles, hashed passwords

Supplier/Product: Details + relationships

Order/Inventory: Quantity, status, stock tracking

🧑‍💻 Usage Workflow
Register/Login → Dashboard Access

Manage Suppliers, Products, and Inventory

Create and update Orders

View Summary Stats on the dashboard

🔐 Security
Password hashing, session management, input validation, error handling

🛠 Development Tips
Use npm run dev for auto-restart

Extend app via routes/, models/, and public/

🆘 Troubleshooting
MongoDB errors, port issues, missing modules, or session problems – addressed in detail

🤝 Contributing
Fork → Branch → Code → Test → Pull Request

