# Full-Stack Inventory & Order Management System

A production-ready, containerized application for managing products, customers, and orders. Built to satisfy strict business logic requirements including automated inventory tracking and unique data constraints.

## 🚀 Tech Stack
* **Frontend:** React.js (Responsive UI, Hooks, State Management)
* **Backend:** Python / FastAPI (RESTful API, Pydantic validation)
* **Database:** PostgreSQL (Relational data, SQLAlchemy ORM)
* **Infrastructure:** Docker & Docker Compose (Fully containerized, Alpine/Slim images)

## ✨ Core Features
* **Product Management:** Create, read, update, and delete products. Enforces unique SKUs and prevents negative inventory.
* **Customer Management:** Full CRUD operations for customer profiles. Enforces unique email addresses.
* **Order Processing:** Places orders linking customers to products. Automatically calculates total costs and dynamically reduces available product stock. 
* **Validation & Safety:** Prevents order creation if product stock is insufficient. Strong backend error handling and frontend UI alerts.
* **Live Dashboard:** Displays real-time metrics including total counts and low-stock alerts.

## 🛠️ How to Run Locally

This project is fully containerized. You do not need Python, Node, or PostgreSQL installed on your machine to run it—only Docker.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhishek-1-1/inventory-system.git
   cd inventory-system