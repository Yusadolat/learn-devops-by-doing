import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateQuantity = (productId, change) => {
    const updatedCart = cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const orderData = {
        userId: user.id,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }))
      };

      await ordersAPI.create(orderData);
      
      // Clear cart
      setCart([]);
      localStorage.removeItem('cart');
      setSuccess(true);
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !success) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <p>Add some products to get started!</p>
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Browse Products
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="order-success">
        <h2>✅ Order Placed Successfully!</h2>
        <p>Thank you for your purchase.</p>
        <p>Redirecting to your orders...</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      
      <div className="cart-items">
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <h3>{item.name}</h3>
              <p className="cart-item-price">${parseFloat(item.price).toFixed(2)}</p>
            </div>
            
            <div className="cart-item-controls">
              <div className="quantity-controls">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="btn-quantity"
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="btn-quantity"
                >
                  +
                </button>
              </div>
              
              <div className="cart-item-total">
                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
              </div>
              
              <button
                onClick={() => removeItem(item.id)}
                className="btn-remove"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <h3>Total:</h3>
          <h2>${calculateTotal()}</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button
          onClick={handleCheckout}
          className="btn btn-primary btn-full"
          disabled={loading || cart.length === 0}
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

export default Cart;
