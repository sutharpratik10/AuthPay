# User Documentation for AccessLayer

## Overview
AccessLayer is a robust web application built with Next.js, designed to provide seamless authentication and user management. It integrates multiple authentication providers, including Google, GitHub, Facebook, and Microsoft, and offers a secure and scalable architecture for managing user sessions, roles, and permissions.

---

## Features
- **Multi-Provider Authentication**: Supports Google, GitHub, Facebook, and Microsoft OAuth.
- **Email/Password Authentication**: Includes fallback authentication for email and password.
- **Role-Based Access Control (RBAC)**: Manage user roles and permissions.
- **Tenant Management**: Multi-tenant support for enterprise applications.
- **Localization**: Language and timezone settings for global users.
- **API Integration**: RESTful APIs for user and tenant management.

---

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm, yarn, or pnpm
- A database (PostgreSQL recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd AccessLayer
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Fill in the required values, including database connection and OAuth credentials.

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

### Key Directories
- **`src/app`**: Contains Next.js pages and API routes.
- **`src/components`**: Reusable UI components.
- **`src/db`**: Database schema and migration files.
- **`src/lib`**: Utility functions and configuration files.
- **`src/services`**: Business logic for authentication, email, and session management.
- **`src/routes`**: Route handlers and architecture documentation.

---

## Configuration

### Environment Variables
- **Database**:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/accesslayer
  ```
- **OAuth Providers**:
  ```env
  GOOGLE_CLIENT_ID=<your-google-client-id>
  GOOGLE_CLIENT_SECRET=<your-google-client-secret>
  GITHUB_CLIENT_ID=<your-github-client-id>
  GITHUB_CLIENT_SECRET=<your-github-client-secret>
  FACEBOOK_CLIENT_ID=<your-facebook-client-id>
  FACEBOOK_CLIENT_SECRET=<your-facebook-client-secret>
  AZURE_AD_CLIENT_ID=<your-azure-client-id>
  AZURE_AD_CLIENT_SECRET=<your-azure-client-secret>
  ```

---

## Deployment

### Vercel
1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy the application:
   ```bash
   vercel
   ```

### Docker
1. Build the Docker image:
   ```bash
   docker build -t accesslayer .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 accesslayer
   ```

---

## API Documentation

### Authentication
- **POST `/api/auth/login`**: User login.
- **POST `/api/auth/signup`**: User registration.
- **POST `/api/auth/logout`**: User logout.

### User Management
- **GET `/api/user`**: Fetch user details.
- **PUT `/api/user`**: Update user details.

### Tenant Management
- **GET `/api/tenant`**: Fetch tenant details.
- **POST `/api/tenant`**: Create a new tenant.

---

## Troubleshooting

### Common Issues
1. **Database Connection Error**:
   - Ensure the `DATABASE_URL` is correctly configured.
   - Verify that the database server is running.

2. **OAuth Redirect URI Mismatch**:
   - Check the callback URLs in your OAuth provider settings.
   - Ensure they match the URLs in your `.env` file.

3. **Environment Variables Not Loaded**:
   - Restart the server after updating `.env`.
   - Use a tool like `dotenv` to load environment variables.

---

## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contact
For support or inquiries, please contact [support@example.com](mailto:support@example.com).

---

## Database Schema

The database schema for AccessLayer is designed to support multi-tenant applications with robust authentication and role-based access control. Below are the key tables and their purposes:

### Tables

1. **Users**
   - Stores user information such as email, password, and profile details.
   - Includes fields for account status, creation date, and last login.

2. **Roles**
   - Defines roles within the system (e.g., Admin, User).
   - Includes a description and metadata for each role.

3. **Permissions**
   - Stores permissions that can be assigned to roles.
   - Includes details about the actions and resources the permission applies to.

4. **Role-Permission Mapping**
   - Maps roles to permissions, enabling role-based access control.

5. **Tenants**
   - Supports multi-tenancy by storing tenant-specific information.
   - Includes fields for tenant name, domain, and configuration.

6. **User-Tenant Mapping**
   - Maps users to tenants, allowing users to belong to multiple tenants.

7. **Sessions**
   - Tracks active user sessions for authentication and security purposes.
   - Includes session tokens, expiration times, and associated user IDs.

8. **Audit Logs**
   - Records changes and actions performed within the system for compliance and debugging.
   - Includes details such as the user who performed the action, timestamp, and affected resources.

9. **Localization**
   - Stores language and timezone settings for users and tenants.

10. **Resource Comments**
    - Supports collaboration by allowing users to comment on shared resources.
    - Includes fields for content, user ID, and resource ID.

### Relationships
- **Users and Roles**: Many-to-many relationship through a mapping table.
- **Roles and Permissions**: Many-to-many relationship through a mapping table.
- **Users and Tenants**: Many-to-many relationship through a mapping table.
- **Audit Logs**: Linked to users and resources for tracking changes.

### Database Technology
- **PostgreSQL**: The database is built on PostgreSQL, leveraging its advanced features such as JSONB fields, foreign key constraints, and indexing for performance.

---
