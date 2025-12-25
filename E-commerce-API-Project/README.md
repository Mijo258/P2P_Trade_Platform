# E-commerce Product API

## Project Overview
This project is a fully functional RESTful API for a simple e-commerce platform, built as the capstone for the ALX Backend Engineering curriculum. The API provides a comprehensive backend for managing products, categories, and users, with a focus on security, scalability, and adherence to professional development practices.
 The link to life API [https://mohamedalmajzoub.pythonanywhere.com/api/v1/]

## Key Features
- **Full CRUD Operations:** Create, Read, Update, and Delete for products.
- **Token-Based Authentication:** Secure user registration and login using Simple JWT.
- **Role-Based Access:** API endpoints are protected, restricting write operations (POST, PUT, DELETE) to authenticated users.
- **Advanced Filtering:** Filter the product list by category and price range.
- **Powerful Search:** A search endpoint to find products by name or category.
- **API Pagination:** Paginated responses for handling large datasets efficiently.

## Technology Stack
- **Framework:** Django
- **API:** Django REST Framework (DRF)
- **Database:** MySQL
- **Authentication:** DRF Simple JWT

## API Endpoint Documentation

**Base URL:** `/api/v1/`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register a new user. |
| `POST` | `/api/token/` | Obtain a JWT access and refresh token. |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products/` | List all products. Supports filtering and search. |
| `POST` | `/products/` | Create a new product (Authentication required). |
| `GET` | `/products/{id}/` | Retrieve a single product. |
| `PUT` | `/products/{id}/` | Update a product (Authentication required). |
| `DELETE`| `/products/{id}/` | Delete a product (Authentication required). |

**Filtering Example:** `GET /api/v1/products/?category=1&min_price=10.00&max_price=100.00`
**Search Example:** `GET /api/v1/products/?search=laptop`

## Local Setup Instructions
1. Clone the repository: `git clone [https://github.com/Mijo258/E-commerce-API-Project]`
2. Create and activate a virtual environment.
3. Install dependencies: `pip install -r requirements.txt`
4. Set up a local MySQL database and configure the credentials in `ecomm_api/settings.py`.
5. Run migrations: `python manage.py migrate`
6. Run the development server: `python manage.py runserver`
