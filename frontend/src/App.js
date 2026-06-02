import React, { useState, useEffect } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null); // Proper state management [cite: 126]

  // Fetch products from our Python API 
  useEffect(() => {
    fetch('http://localhost:8000/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => setError("Failed to load products.")); // Clear error messages [cite: 125]
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Inventory Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <h2>Product List</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>${product.price.toFixed(2)}</td>
              <td style={{ color: product.quantity < 5 ? 'red' : 'black' }}>
                {product.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;