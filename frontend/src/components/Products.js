import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Products.css';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products || []);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const getCartQuantity = (productId) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Our Products</h1>
        <p>Browse our collection of quality products</p>
        {cart.length > 0 && (
          <div className="cart-indicator">
            🛒 Cart: {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="no-products">
          <p>No products available at the moment.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <span className="product-icon">📦</span>
              </div>
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-category">{product.category}</div>
                <div className="product-footer">
                  <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                  <div className="product-stock">
                    {product.stock_quantity > 0 ? (
                      <span className="in-stock">In Stock ({product.stock_quantity})</span>
                    ) : (
                      <span className="out-of-stock">Out of Stock</span>
                    )}
                  </div>
                </div>
                {isAuthenticated ? (
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity === 0}
                  >
                    {getCartQuantity(product.id) > 0
                      ? `Added (${getCartQuantity(product.id)})`
                      : 'Add to Cart'}
                  </button>
                ) : (
                  <div className="login-prompt">
                    <a href="/login">Login to purchase</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
