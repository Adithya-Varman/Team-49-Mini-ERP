# ERP MongoDB Backend

A clean FastAPI + MongoDB backend for an ERP-style system.

## Overview

This project provides:

- MongoDB connection management
- Data-only models
- Pure CRUD repository layer
- FastAPI backend for API access
- Seed scripts with realistic sample ERP data

It uses the local MongoDB instance:

- MongoDB URI: `mongodb://localhost:27017`
- Database name: `erp`

MongoDB Compass will show changes made through the API after refresh.

## Project Structure

```text
finaldb/
├── app/
│   ├── __init__.py
│   ├── crud_router.py
│   ├── main.py
│   └── utils.py
├── database/
│   ├── __init__.py
│   └── mongo.py
├── models/
│   ├── __init__.py
│   ├── product.py
│   ├── customer.py
│   ├── supplier.py
│   ├── sales_order.py
│   ├── purchase_order.py
│   ├── manufacturing_order.py
│   ├── bom.py
│   ├── user.py
│   ├── stock_ledger.py
│   ├── audit_log.py
│   └── notification.py
├── repositories/
│   ├── __init__.py
│   ├── _base.py
│   ├── product_repository.py
│   ├── customer_repository.py
│   ├── supplier_repository.py
│   ├── sales_repository.py
│   ├── purchase_repository.py
│   ├── manufacturing_repository.py
│   ├── bom_repository.py
│   ├── user_repository.py
│   ├── stock_repository.py
│   ├── audit_repository.py
│   └── notification_repository.py
├── scripts/
│   ├── seed_dummy_data.py
│   ├── check_counts.py
│   ├── run_test.py
│   └── uvicorn_check.py
├── tests/
│   └── test_product_repository.py
├── requirements.txt
└── README.md
```

## What the code does

### Database layer
- `database/mongo.py` handles MongoDB connection lifecycle
- `connect()` creates the shared client
- `disconnect()` closes it
- `get_db()` returns the `erp` database

### Models
Each model is a simple data container with:
- constructor (`__init__`)
- `to_dict()`
- `ObjectId` handling where needed
- timestamps where relevant

### Repositories
Each repository provides pure CRUD methods:
- `create()`
- `get_by_id()`
- `get_all()`
- `update()`
- `delete()`

No business logic is included in repositories.

### FastAPI app
The FastAPI app is in `app/main.py`.
It exposes:
- `/health` for health checks
- `/` which redirects to `/docs`
- CRUD routes for all ERP collections

## Collection Names

The MongoDB collections are:

- `products`
- `customers`
- `suppliers`
- `sales_orders`
- `purchase_orders`
- `manufacturing_orders`
- `boms`
- `users`
- `stock_ledger`
- `audit_logs`
- `notifications`

## Seed Data

The seed script inserts realistic ERP sample data into the `erp` database.

Current seeded examples include:

- 3 users
- 3 customers
- 3 suppliers
- 6 products
- 2 BOMs
- 3 sales orders
- 2 purchase orders
- 2 manufacturing orders
- 4 stock ledger entries
- 3 audit logs
- 3 notifications

## How to Run

### 1. Start MongoDB
Make sure MongoDB is running locally on:

- `mongodb://localhost:27017`

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Seed the database

```powershell
python scripts/seed_dummy_data.py
```

To keep existing records and only add more data:

```powershell
python scripts/seed_dummy_data.py --keep-existing
```

### 4. Start the FastAPI backend

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 5. Open API docs

- http://127.0.0.1:8000/docs

### 6. Open MongoDB Compass
Connect to:

- `mongodb://localhost:27017`
- database: `erp`

Refresh collections after using the API to see updates.

## Example API Usage

### Health check
- `GET /health`

### Products
- `GET /products`
- `POST /products/`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`

The same pattern exists for all other collections.

## Notes

- This backend is intentionally data-layer focused.
- No ERP workflows, calculations, or stock rules are enforced.
- Data changes made through the API update MongoDB immediately.
- MongoDB Compass reflects those changes after refresh.

## Quick Hackathon Flow

1. Run the seed script once
2. Start FastAPI with Uvicorn
3. Use `/docs` to test CRUD endpoints
4. Open Compass and refresh the collection view to show live data updates

## Tech Stack

- Python 3.10
- FastAPI
- Uvicorn
- PyMongo
- MongoDB Compass
- MongoDB local server
