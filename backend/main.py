from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

# --- Database Setup ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@db:5432/inventory_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Models ---
class DBProduct(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False) # Must be unique
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=0)

class DBCustomer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False) # Must be unique
    phone = Column(String)

class DBOrder(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_ordered = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)

# Create tables in PostgreSQL
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Schemas (Data Validation) ---
class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    quantity: int

class CustomerCreate(BaseModel):
    full_name: str
    email: str
    phone: str

class OrderCreate(BaseModel):
    customer_id: int
    product_id: int
    quantity_ordered: int

# ==========================================
# PRODUCT APIs
# ==========================================

@app.post("/products")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    if product.quantity < 0:
        raise HTTPException(status_code=400, detail="Product quantity cannot be negative")
    
    # Check for unique SKU
    existing_product = db.query(DBProduct).filter(DBProduct.sku == product.sku).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product SKU must be unique")

    db_item = DBProduct(**product.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(DBProduct).all()

@app.get("/products/{id}")
def get_product_by_id(id: int, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.put("/products/{id}")
def update_product(id: int, product_update: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product_update.quantity < 0:
        raise HTTPException(status_code=400, detail="Product quantity cannot be negative")
        
    product.name = product_update.name
    product.sku = product_update.sku
    product.price = product_update.price
    product.quantity = product_update.quantity
    
    db.commit()
    db.refresh(product)
    return product

@app.delete("/products/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


# ==========================================
# CUSTOMER APIs
# ==========================================

@app.post("/customers")
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    # Check for unique email
    existing_customer = db.query(DBCustomer).filter(DBCustomer.email == customer.email).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Customer email must be unique")
        
    db_customer = DBCustomer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/customers")
def get_customers(db: Session = Depends(get_db)):
    return db.query(DBCustomer).all()

@app.get("/customers/{id}")
def get_customer_by_id(id: int, db: Session = Depends(get_db)):
    customer = db.query(DBCustomer).filter(DBCustomer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.delete("/customers/{id}")
def delete_customer(id: int, db: Session = Depends(get_db)):
    customer = db.query(DBCustomer).filter(DBCustomer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}


# ==========================================
# ORDER APIs
# ==========================================

@app.post("/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == order.product_id).first()
    customer = db.query(DBCustomer).filter(DBCustomer.id == order.customer_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    if product.quantity < order.quantity_ordered:
        raise HTTPException(status_code=400, detail="Orders cannot be placed if inventory is insufficient")
        
    # Auto-calculate total and reduce stock
    total = product.price * order.quantity_ordered
    product.quantity -= order.quantity_ordered
    
    new_order = DBOrder(
        customer_id=order.customer_id,
        product_id=order.product_id,
        quantity_ordered=order.quantity_ordered,
        total_amount=total
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    return db.query(DBOrder).all()

@app.get("/orders/{id}")
def get_order_by_id(id: int, db: Session = Depends(get_db)):
    order = db.query(DBOrder).filter(DBOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.delete("/orders/{id}")
def delete_order(id: int, db: Session = Depends(get_db)):
    order = db.query(DBOrder).filter(DBOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Optional but good practice: return stock when order is cancelled
    product = db.query(DBProduct).filter(DBProduct.id == order.product_id).first()
    if product:
        product.quantity += order.quantity_ordered
        
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}