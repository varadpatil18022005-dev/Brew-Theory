# Brew Theory ☕

A full-stack cafe website built with **React, CSS, Node.js, Express, and MongoDB Atlas**. Guests can create an account, browse the cafe menu, place an order, reserve a table, leave a review, and contact the cafe.

## Features

- Sign up with email verification, sign in, and sign out.
- Six-digit verification codes sent through Gmail. Codes expire after 10 minutes; resend is limited to once per minute, with up to five verification attempts.
- Home, About, Menu, Order, Table Reservation, Reviews, and Contact pages.
- Menu items and customer activity stored in MongoDB Atlas.
- Orders use prices looked up by the backend and are saved with the customer's order history.
- Reservations check availability for the selected date and time, assign a suitable table, and can be cancelled.
- Customers can create or update one review per account.
- Contact form messages are saved to the database.
- Individual cafe and menu images are served from the frontend's `public/images` folder.

> Orders are saved in the database. Online payment processing is not included yet.

## Technology

- **Frontend:** React, Vite, CSS, Lucide icons
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas
- **Authentication:** bcrypt password hashing and signed JSON Web Tokens
- **Email:** Nodemailer with a Gmail App Password

## Project structure

```text
cafe-mern/
├── backend/
│   ├── .env.example              # Safe template for local environment settings
│   └── src/
│       ├── config/database.js    # MongoDB Atlas connection
│       ├── middleware/           # JWT-protected API access
│       ├── models/               # MongoDB/Mongoose schemas
│       ├── routes/               # Authentication and cafe APIs
│       ├── app.js                # Express app, CORS, and API routes
│       ├── seedMenu.js           # Inserts starter menu if the menu is empty
│       └── server.js             # Starts the API and database connection
├── frontend/
│   ├── public/images/            # Hero, cafe, and individual menu photos
│   ├── src/
│   │   ├── App.jsx               # Sign-up, verification, and sign-in screens
│   │   ├── CafeApp.jsx           # Signed-in cafe pages and API requests
│   │   ├── styles.css            # Authentication and shared styles
│   │   ├── site.css              # Cafe page styles
│   │   ├── images.css            # Cafe/menu image styles
│   │   └── main.jsx              # React entry point
│   ├── index.html                # Browser title and page metadata
│   └── vite.config.js
├── .gitignore                    # Excludes secrets, dependencies, and build output
├── package.json                  # Root commands for running/building the app
└── README.md
```

`node_modules`, `.env` files, and generated `dist` output are intentionally left out of this tree and should not be committed to GitHub.

## Requirements

- Node.js **20.19+** or **22.12+**
- npm (included with Node.js)
- A MongoDB Atlas cluster
- A Gmail account with 2-Step Verification and an App Password, for signup verification emails

## Run locally

### 1. Install packages

Open a terminal in the project root (`cafe-mern`) and run:

```powershell
npm install
npm install --prefix frontend
npm install --prefix backend
```

### 2. Configure MongoDB and email

Copy the example settings file and open the new local file:

```powershell
Copy-Item backend\.env.example backend\.env
notepad backend\.env
```

Fill in `backend/.env` with your own settings:

| Setting | Purpose |
| --- | --- |
| `PORT` | Backend port; defaults to `5000`. |
| `CLIENT_ORIGIN` | Frontend address allowed by the backend; use `http://localhost:5173` for local development. |
| `MONGODB_URI` | MongoDB Atlas connection string. Keep it on the backend only. |
| `JWT_SECRET` | Private random signing key, at least 32 characters. |
| `MAIL_USER` | Gmail address used to send verification codes. |
| `MAIL_APP_PASSWORD` | Gmail App Password for that sender account, with spaces removed. Do not use your normal Gmail password. |

In MongoDB Atlas, create a cluster and database user, then allow your current development IP under Network Access. Paste the Atlas connection string into `MONGODB_URI`, replacing the username, password, and host placeholders. The provided example uses the database name `coffee_house`; MongoDB creates it when the application first writes data.

Create the Gmail App Password from the Google account's Security settings after enabling 2-Step Verification. Use the App Password only in `backend/.env`.

**Never share or commit `backend/.env`, your Atlas URI, Gmail App Password, or JWT secret.** The `.gitignore` is set to ignore `.env` files while allowing the safe `.env.example` template.

### 3. Start the website and API

From the project root:

```powershell
npm run dev
```

- Website: <http://localhost:5173>
- API health check: <http://localhost:5000/api/health>

The backend connects to MongoDB and inserts the starter menu only when the menu collection is empty. Keep the terminal running while you use the website.

### Other commands

```powershell
npm run build                 # Build the frontend for production
npm start                     # Start the backend only
npm --prefix backend run dev  # Start the backend with file watching
npm --prefix frontend run dev # Start the frontend only
```

The frontend uses `http://localhost:5000/api` by default. If the API is hosted elsewhere, set `VITE_API_URL` in the frontend's environment before building and set the backend's `CLIENT_ORIGIN` to the frontend's exact origin.

## Database design

Mongoose creates collections from the model schemas in `backend/src/models/`:

| Model | Data stored |
| --- | --- |
| `User` | Name, unique email, password hash, and email verification date. |
| `EmailVerification` | Pending signup data, hashed verification code, expiry, send time, and attempt count. Expired records are removed by MongoDB's TTL index. |
| `MenuItem` | Name, category, description, price, icon, and availability. Starter items are in `backend/src/seedMenu.js`. |
| `Order` | Customer, ordered items and quantities, server-calculated prices and total, and status. |
| `Reservation` | Customer, guest count, assigned table, date/time, optional note, and booking status. |
| `Review` | Customer, 1–5 star rating, and review text; one review per customer account. |
| `ContactMessage` | Customer, subject, message, and message status. |

The database is the persistent source for menu, accounts, orders, reservations, reviews, and contact messages. The About page is static content in the React frontend.

## API overview

The API base URL for local development is `http://localhost:5000/api`.

| Method | Endpoint | Purpose | Sign-in required |
| --- | --- | --- | --- |
| `GET` | `/health` | Check that the API is running. | No |
| `POST` | `/auth/request-code` | Request an email code. Body: `{ "name", "email", "password" }`. | No |
| `POST` | `/auth/verify-code` | Verify signup code. Body: `{ "email", "code" }`. | No |
| `POST` | `/auth/login` | Sign in. Body: `{ "email", "password" }`. Returns a JWT. | No |
| `GET` | `/menu` | List available menu items. | No |
| `GET` | `/orders` | List this customer's orders. | Yes |
| `POST` | `/orders` | Place an order. Body: `{ "items": [{ "menuItemId", "quantity" }] }`. | Yes |
| `GET` | `/reservations/availability?date=YYYY-MM-DD&time=18:00` | Check available tables for a supported booking time. | Yes |
| `GET` | `/reservations` | List this customer's reservations. | Yes |
| `POST` | `/reservations` | Reserve a table. Body: `{ "date", "time", "guests", "note" }`. | Yes |
| `PATCH` | `/reservations/:id/cancel` | Cancel an upcoming reservation belonging to the customer. | Yes |
| `GET` | `/reviews` | List recent reviews and rating summary. | Yes |
| `GET` | `/reviews/mine` | Get the signed-in customer's review. | Yes |
| `PUT` | `/reviews/mine` | Create or update a review. Body: `{ "rating", "comment" }`. | Yes |
| `POST` | `/contact` | Save a contact message. Body: `{ "subject", "message" }`. | Yes |

For protected endpoints, send the login token in the HTTP header as `Authorization: Bearer <token>`. Tokens expire after 12 hours.

## Images

Place website images in `frontend/public/images/`. They can then be referenced in React with a path such as `/images/hero-coffee.png`. The unique menu photos are mapped by item name in `frontend/src/CafeApp.jsx`.

## GitHub safety

Before publishing, check that your local `backend/.env` is ignored and that no credentials, screenshots containing secrets, or private customer data are staged. Keep `backend/.env.example` in the repository with placeholders only.
