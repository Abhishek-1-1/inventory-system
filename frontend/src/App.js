import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      const [prodRes, custRes, ordRes] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/customers`),
        fetch(`${API_URL}/orders`)
      ]);
      setProducts(await prodRes.json());
      setCustomers(await custRes.json());
      setOrders(await ordRes.json());
    } catch (err) {
      showMessage("Failed to connect to the server.", "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]); // Refresh data when switching tabs

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // --- UI Shell & Navigation ---
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: '0', padding: '0', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      <nav style={{ backgroundColor: '#2c3e50', padding: '15px 30px', color: 'white', display: 'flex', gap: '20px' }}>
        <h2 style={{ margin: '0', marginRight: 'auto' }}>Inventory System</h2>
        {['dashboard', 'products', 'customers', 'orders'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              background: activeTab === tab ? '#34495e' : 'transparent', 
              color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', textTransform: 'capitalize' 
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {message.text && (
          <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '5px', color: 'white', backgroundColor: message.type === 'error' ? '#e74c3c' : '#2ecc71' }}>
            {message.text}
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard products={products} customers={customers} orders={orders} />}
        {activeTab === 'products' && <Products products={products} fetchData={fetchData} showMessage={showMessage} />}
        {activeTab === 'customers' && <Customers customers={customers} fetchData={fetchData} showMessage={showMessage} />}
        {activeTab === 'orders' && <Orders orders={orders} products={products} customers={customers} fetchData={fetchData} showMessage={showMessage} />}
      </main>
    </div>
  );
}

// ==========================================
// DASHBOARD COMPONENT
// ==========================================
function Dashboard({ products, customers, orders }) {
  const lowStock = products.filter(p => p.quantity < 10);

  const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1 };

  return (
    <div>
      <h2>System Dashboard</h2>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}><h3>Total Products</h3><h1 style={{color: '#3498db'}}>{products.length}</h1></div>
        <div style={cardStyle}><h3>Total Customers</h3><h1 style={{color: '#9b59b6'}}>{customers.length}</h1></div>
        <div style={cardStyle}><h3>Total Orders</h3><h1 style={{color: '#2ecc71'}}>{orders.length}</h1></div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ color: '#e74c3c' }}>Low Stock Alerts (Under 10 units)</h3>
        {lowStock.length === 0 ? <p>All products are well stocked!</p> : (
          <ul>
            {lowStock.map(p => <li key={p.id}><strong>{p.name}</strong> - Only {p.quantity} left (SKU: {p.sku})</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

// ==========================================
// PRODUCTS COMPONENT
// ==========================================
function Products({ products, fetchData, showMessage }) {
  const [form, setForm] = useState({ name: '', sku: '', price: '', quantity: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      showMessage("Product added successfully", "success");
      setForm({ name: '', sku: '', price: '', quantity: '' });
      fetchData();
    } else {
      const data = await res.json();
      showMessage(data.detail, "error");
    }
  };

  const deleteProduct = async (id) => {
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    showMessage("Product deleted", "success");
    fetchData();
  };

  return (
    <div style={{ display: 'flex', gap: '30px' }}>
      <div style={{ flex: 1 }}>
        <h2>Product List</h2>
        <table style={{ width: '100%', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead><tr style={{ backgroundColor: '#ecf0f1', textAlign: 'left' }}><th>ID</th><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{p.id}</td><td>{p.name}</td><td>{p.sku}</td><td>${p.price}</td>
                <td style={{ color: p.quantity < 10 ? 'red' : 'black' }}>{p.quantity}</td>
                <td><button onClick={() => deleteProduct(p.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ width: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
        <h3>Add Product</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input required placeholder="SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
          <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          <input required type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none' }}>Add Product</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// CUSTOMERS COMPONENT
// ==========================================
function Customers({ customers, fetchData, showMessage }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      showMessage("Customer added successfully", "success");
      setForm({ full_name: '', email: '', phone: '' });
      fetchData();
    } else {
      const data = await res.json();
      showMessage(data.detail, "error");
    }
  };

  const deleteCustomer = async (id) => {
    await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
    showMessage("Customer deleted", "success");
    fetchData();
  };

  return (
    <div style={{ display: 'flex', gap: '30px' }}>
      <div style={{ flex: 1 }}>
        <h2>Customer List</h2>
        <table style={{ width: '100%', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead><tr style={{ backgroundColor: '#ecf0f1', textAlign: 'left' }}><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Action</th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{c.id}</td><td>{c.full_name}</td><td>{c.email}</td><td>{c.phone}</td>
                <td><button onClick={() => deleteCustomer(c.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ width: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
        <h3>Add Customer</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input required placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#9b59b6', color: 'white', border: 'none' }}>Add Customer</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// ORDERS COMPONENT
// ==========================================
function Orders({ orders, products, customers, fetchData, showMessage }) {
  const [form, setForm] = useState({ customer_id: '', product_id: '', quantity_ordered: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      showMessage("Order placed successfully", "success");
      setForm({ customer_id: '', product_id: '', quantity_ordered: '' });
      fetchData();
    } else {
      const data = await res.json();
      showMessage(data.detail, "error");
    }
  };

  const deleteOrder = async (id) => {
    await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
    showMessage("Order cancelled", "success");
    fetchData();
  };

  return (
    <div style={{ display: 'flex', gap: '30px' }}>
      <div style={{ flex: 1 }}>
        <h2>Order History</h2>
        <table style={{ width: '100%', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead><tr style={{ backgroundColor: '#ecf0f1', textAlign: 'left' }}><th>Order ID</th><th>Customer ID</th><th>Product ID</th><th>Qty</th><th>Total Amount</th><th>Action</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{o.id}</td><td>{o.customer_id}</td><td>{o.product_id}</td><td>{o.quantity_ordered}</td><td>${o.total_amount}</td>
                <td><button onClick={() => deleteOrder(o.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ width: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
        <h3>Create Order</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select required value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}>
            <option value="">Select Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <select required value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
            <option value="">Select Product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
          </select>
          <input required type="number" min="1" placeholder="Quantity" value={form.quantity_ordered} onChange={e => setForm({...form, quantity_ordered: e.target.value})} />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#2ecc71', color: 'white', border: 'none' }}>Place Order</button>
        </form>
      </div>
    </div>
  );
}