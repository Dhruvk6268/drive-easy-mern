<div align="center">
  <h1>🚗 Drive Easy</h1>
  <p><strong>Full-Stack MERN Car Rental Platform</strong></p>
  <p>Seamless car rental experience with AI-powered support</p>

  <p>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#installation">Installation</a> •
    <a href="#api-endpoints">API Endpoints</a> •
    <a href="#license">License</a>
  </p>
</div>

<hr />

<h2 id="about">📋 About</h2>
<p>
  Drive Easy is a comprehensive car rental platform built with the MERN stack. It features a modern React frontend powered by Vite, a robust Express.js backend with MongoDB, and includes advanced features like AI-powered chatbot using Google Gemini, partner management system, complete booking workflow with payment processing, and a comprehensive admin panel.
</p>

<h2 id="features">✨ Key Features</h2>
<ul>
  <li><strong>🔐 Authentication & Authorization:</strong> JWT-based secure authentication with role-based access control for users, partners, and admins.</li>
  <li><strong>🤝 Partner System:</strong> Complete partner onboarding with document verification, car management, earnings tracking (90% commission), and payment redemption.</li>
  <li><strong>📅 Booking Management:</strong> Full booking lifecycle from creation to completion with payment integration and status tracking.</li>
  <li><strong>🚙 Car Management:</strong> Comprehensive car listings with detailed specs, images, availability tracking, and advanced filtering options.</li>
  <li><strong>🤖 AI Chatbot:</strong> Google Gemini-powered chatbot for customer support with ticket creation and conversation management.</li>
  <li><strong>💳 Payment Processing:</strong> Multi-method payment support (Bank Transfer, UPI) with admin approval workflow and commission tracking.</li>
  <li><strong>👨‍💼 Admin Panel:</strong> Comprehensive dashboard for managing users, partners, bookings, payments, and support tickets.</li>
  <li><strong>📊 Analytics & Reports:</strong> Real-time earnings tracking, booking statistics, and partner performance metrics.</li>
</ul>

<h2 id="tech-stack">🛠️ Tech Stack</h2>

<h3>Frontend</h3>
<ul>
  <li><strong>React 19</strong> - UI library</li>
  <li><strong>Vite</strong> - Build tool and dev server</li>
  <li><strong>React Router v7</strong> - Client-side routing</li>
  <li><strong>Bootstrap 5</strong> - CSS framework</li>
  <li><strong>React Bootstrap</strong> - React components</li>
  <li><strong>Axios</strong> - HTTP client</li>
  <li><strong>jsPDF</strong> - PDF generation</li>
</ul>

<h3>Backend</h3>
<ul>
  <li><strong>Node.js</strong> - Runtime environment</li>
  <li><strong>Express.js 5</strong> - Web framework</li>
  <li><strong>MongoDB</strong> - Database</li>
  <li><strong>Mongoose</strong> - ODM library</li>
  <li><strong>JWT</strong> - Authentication</li>
  <li><strong>Bcrypt</strong> - Password hashing</li>
  <li><strong>Multer</strong> - File uploads</li>
  <li><strong>Google Gemini AI</strong> - AI chatbot</li>
</ul>

<h2 id="installation">📦 Installation & Setup</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Node.js (v14 or higher)</li>
  <li>MongoDB (local or Atlas)</li>
  <li>Google Gemini API Key</li>
</ul>

<h3>Setup Instructions</h3>

<ol>
  <li><strong>Clone the repository</strong>
    <pre><code>git clone https://github.com/Dhruvk6268/drive-easy-mern.git
cd drive-easy-mern</code></pre>
  </li>

  <li><strong>Install Backend Dependencies</strong>
    <pre><code>cd backend
npm install</code></pre>
  </li>

  <li><strong>Configure Backend Environment</strong>
    <p>Create a <code>.env</code> file in the backend directory:</p>
    <pre><code>PORT=5000
MONGODB_URI=mongodb://localhost:27017/carrental
JWT_SECRET=driveeasy_jwt_secret_2024
GEMINI_API_KEY=your_google_gemini_api_key_here</code></pre>
  </li>

  <li><strong>Install Frontend Dependencies</strong>
    <pre><code>cd ../frontend
npm install</code></pre>
  </li>

  <li><strong>Configure Frontend Environment</strong>
    <p>Create a <code>.env</code> file in the frontend directory:</p>
    <pre><code>VITE_API_URL=http://localhost:5000</code></pre>
  </li>

  <li><strong>Start the Backend Server</strong>
    <pre><code>cd backend
npm start
# For development with auto-reload:
npm run dev</code></pre>
  </li>

  <li><strong>Start the Frontend Development Server</strong>
    <pre><code>cd frontend
npm run dev</code></pre>
  </li>

  <li><strong>Access the Application</strong>
    <p>Open your browser and navigate to <code>http://localhost:5173</code></p>
  </li>
</ol>

<h2 id="project-structure">🗂️ Project Structure</h2>
<pre>
drive-easy-mern/
├── backend/
│   ├── server.js              # Main Express server with all routes
│   ├── uploads/               # Car images storage
│   ├── user/                  # Partner documents & car images
│   │   └── [userId]/
│   │       ├── id_proof_*     # Partner ID documents
│   │       └── uploads/       # Partner car images
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── BecomePartner.jsx
│   │   │   ├── PartnerDashboard.jsx
│   │   │   ├── BookingModal.jsx
│   │   │   ├── MyTickets.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── LoadingScreen.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Cars.jsx
│   │   │   ├── CarDetails.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── About.jsx
│   │   │   └── Contact.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
</pre>

<h2 id="api-endpoints">🔌 API Endpoints</h2>

<h3>Authentication</h3>
<ul>
  <li><code>POST /api/register</code> - Register new user</li>
  <li><code>POST /api/login</code> - User login</li>
  <li><code>POST /api/refresh-token</code> - Refresh JWT token</li>
</ul>

<h3>Cars</h3>
<ul>
  <li><code>GET /api/cars</code> - Get all cars</li>
  <li><code>GET /api/cars/:id</code> - Get car by ID</li>
  <li><code>POST /api/cars</code> - Create new car (Admin)</li>
  <li><code>PUT /api/cars/:id</code> - Update car (Admin)</li>
  <li><code>DELETE /api/cars/:id</code> - Delete car (Admin)</li>
</ul>

<h3>Bookings</h3>
<ul>
  <li><code>POST /api/bookings</code> - Create booking</li>
  <li><code>GET /api/bookings/user</code> - Get user's bookings</li>
  <li><code>GET /api/admin/bookings</code> - Get all bookings (Admin)</li>
  <li><code>PUT /api/admin/bookings/:id/status</code> - Update booking status (Admin)</li>
</ul>

<h3>Partner System</h3>
<ul>
  <li><code>POST /api/partner/register</code> - Register as partner</li>
  <li><code>GET /api/partner/status</code> - Get partner status</li>
  <li><code>POST /api/partner/cars</code> - Add partner car</li>
  <li><code>GET /api/partner/balance</code> - Get partner earnings balance</li>
  <li><code>POST /api/partner/redeem</code> - Request payment redemption</li>
</ul>

<h3>Payments</h3>
<ul>
  <li><code>GET /api/admin/payments</code> - Get all payment requests (Admin)</li>
  <li><code>PUT /api/admin/payments/:id/approve</code> - Approve payment (Admin)</li>
  <li><code>PUT /api/admin/payments/:id/processing</code> - Mark payment as processing (Admin)</li>
</ul>

<h3>AI Chatbot</h3>
<ul>
  <li><code>POST /api/chatbot</code> - Send message to AI chatbot</li>
  <li><code>GET /api/tickets</code> - Get user's support tickets</li>
  <li><code>GET /api/admin/tickets</code> - Get all tickets (Admin)</li>
</ul>

<h2 id="user-roles">👥 User Roles</h2>

<h3>🧑‍💼 Customer</h3>
<ul>
  <li>Browse and search available cars</li>
  <li>Create and manage bookings</li>
  <li>Make payments</li>
  <li>Use AI chatbot for support</li>
  <li>View booking history</li>
</ul>

<h3>🤝 Partner</h3>
<ul>
  <li>All customer features</li>
  <li>Register as a partner</li>
  <li>Add and manage cars</li>
  <li>Track earnings (90% commission)</li>
  <li>Request payment redemption</li>
  <li>View booking analytics</li>
</ul>

<h3>👨‍💻 Admin</h3>
<ul>
  <li>Manage all users and partners</li>
  <li>Approve/reject partner applications</li>
  <li>Manage all cars in the system</li>
  <li>Process payment redemptions</li>
  <li>Manage bookings and tickets</li>
  <li>View platform analytics</li>
</ul>

<h2 id="security">🔒 Security Features</h2>
<ul>
  <li>JWT-based authentication with token expiration</li>
  <li>Password hashing using bcrypt</li>
  <li>Role-based access control (RBAC)</li>
  <li>File upload validation and sanitization</li>
  <li>CORS protection</li>
  <li>Environment variable protection</li>
</ul>

<h2 id="license">📄 License</h2>
<p>
  This project is licensed under the MIT License - see the <a href="LICENSE">LICENSE</a> file for details.
</p>
<p>Copyright © 2026 Dhruvk6268</p>

<h2 id="contributing">🤝 Contributing</h2>
<p>Contributions are welcome! Please feel free to submit a Pull Request.</p>
<ol>
  <li>Fork the repository</li>
  <li>Create your feature branch (<code>git checkout -b feature/AmazingFeature</code>)</li>
  <li>Commit your changes (<code>git commit -m 'Add some AmazingFeature'</code>)</li>
  <li>Push to the branch (<code>git push origin feature/AmazingFeature</code>)</li>
  <li>Open a Pull Request</li>
</ol>

<hr />

<p align="center">
  Made with ❤️ by <a href="https://github.com/Dhruvk6268">Dhruvk6268</a>
  <br />
  Drive Easy - Your Trusted Car Rental Partner
</p>
