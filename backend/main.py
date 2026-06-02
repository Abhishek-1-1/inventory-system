from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@localhost:5432/inventory_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

# Allow React frontend to communicate 
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
    name = Column(String, nullable=False) # [cite: 54]
    sku = Column(String, unique=True, index=True) # Unique SKU [cite: 92, 55]
    price = Column(Float, nullable=False) # [cite: 56]
    quantity = Column(Integer, default=0) # Cannot be negative [cite: 94, 57]

class DBOrder(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False) # [cite: 87]
    product_id = Column(Integer, ForeignKey("products.id")) # [cite: 88]
    quantity_ordered = Column(Integer, nullable=False) # [cite: 88]
    total_amount = Column(Float, nullable=False) # [cite: 89]

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Schemas (Data Validation) [cite: 99] ---
class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    quantity: int

class OrderCreate(BaseModel):
    customer_id: int
    product_id: int
    quantity_ordered: int

# --- APIs ---
@app.post("/products") # 
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    if product.quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative") # [cite: 94, 98]
    db_item = DBProduct(**product.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/products") # [cite: 43]
def get_products(db: Session = Depends(get_db)):
    return db.query(DBProduct).all()

@app.post("/orders") # [cite: 77]
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == order.product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found") # [cite: 98]
        
    if product.quantity < order.quantity_ordered:
        raise HTTPException(status_code=400, detail="Insufficient inventory") # [cite: 95]
        
    # Auto-calculate total [cite: 97]
    total = product.price * order.quantity_ordered
    
    # Auto-reduce stock [cite: 96]
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