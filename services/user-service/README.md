# User Service

## Overview
Authentication and user management microservice with JWT token generation.

## Port
3001

## Endpoints
- `POST /register` - Register new user
- `POST /login` - Login and get JWT token
- `GET /profile` - Get user profile (requires auth)
- `GET /health` - Health check

## Database Schema
```sql
users (
  id, email, password_hash, 
  first_name, last_name, 
  created_at, updated_at
)
```

## Key Technologies
- Express.js
- PostgreSQL (via pg driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)

## Learn About
- Authentication patterns
- Password security
- JWT tokens
- Database migrations
