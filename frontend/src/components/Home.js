import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to E-Commerce Store</h1>
        {isAuthenticated ? (
          <p className="hero-subtitle">
            Hello, {user?.firstName || user?.email}! Start shopping now.
          </p>
        ) : (
          <p className="hero-subtitle">
            Your one-stop shop for all your needs
          </p>
        )}
        
        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary btn-large">
            Browse Products
          </Link>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-secondary btn-large">
              Sign Up
            </Link>
          )}
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>🚀 Fast Delivery</h3>
          <p>Get your products delivered quickly</p>
        </div>
        <div className="feature-card">
          <h3>💳 Secure Payment</h3>
          <p>Your transactions are safe with us</p>
        </div>
        <div className="feature-card">
          <h3>🎁 Great Deals</h3>
          <p>Amazing prices on quality products</p>
        </div>
        <div className="feature-card">
          <h3>🔒 Privacy First</h3>
          <p>Your data is protected and secure</p>
        </div>
      </div>

      <div className="about-section">
        <h2>About This Project</h2>
        <p>
          This is a learning project demonstrating a full-stack microservices architecture
          with React frontend, Node.js backend services, PostgreSQL database, Redis caching,
          and complete DevOps pipeline.
        </p>
        <div className="tech-stack">
          <span className="tech-badge">React</span>
          <span className="tech-badge">Node.js</span>
          <span className="tech-badge">PostgreSQL</span>
          <span className="tech-badge">Redis</span>
          <span className="tech-badge">Docker</span>
          <span className="tech-badge">Kubernetes</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
