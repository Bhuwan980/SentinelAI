# SentinelAI

SentinelAI is an AI-powered system for secure content protection, real-time monitoring, and copyright enforcement. It provides comprehensive tools for intellectual property protection, automated content scanning, and DMCA takedown management.

## 🚀 Features

### Core Functionality
- **AI-Powered Content Detection**: Advanced image recognition and matching using CLIP embeddings
- **Real-time Monitoring**: Automated scanning of web content for copyright violations
- **DMCA Management**: Automated DMCA takedown notice generation and tracking
- **User Authentication**: Secure user management with JWT tokens and Google OAuth
- **Dashboard Analytics**: Comprehensive reporting and analytics dashboard

### Content Protection
- **Image Upload & Protection**: Secure image storage and protection registration
- **Similarity Matching**: Vector-based similarity search for content identification
- **Batch Processing**: Efficient processing of multiple images and content
- **Notification System**: Email alerts for matches and takedown status

### Web Scraping & Monitoring
- **Automated Scraping**: Intelligent web scraping for content monitoring
- **Queue Management**: Redis-based job queuing for scalable processing
- **Report Generation**: PDF report generation for DMCA notices

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with pgvector extension
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT, Google OAuth
- **Queue**: Redis with RQ
- **AI/ML**: CLIP embeddings, vector similarity search
- **Image Processing**: Pillow
- **PDF Generation**: ReportLab
- **Web Scraping**: BeautifulSoup, icrawler

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: Google OAuth, JWT decode

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+** with pgvector extension
- **Redis Server**
- **Git**

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SentinelAI
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Database Setup
```bash
# Create PostgreSQL database
createdb sentineldai

# Install pgvector extension
psql -d sentineldai -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run database migrations
alembic upgrade head
```

#### Environment Configuration
Create a `.env` file in the backend directory:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost/sentineldai

# Redis
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Other configurations...
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Environment Configuration
Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🏃‍♂️ Usage

### Running the Application

#### Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Key Workflows

1. **User Registration/Login**: Users can sign up and authenticate
2. **Content Upload**: Upload images for protection
3. **Monitoring Setup**: Configure content monitoring parameters
4. **Match Detection**: System automatically detects similar content
5. **DMCA Actions**: Generate and send takedown notices
6. **Reporting**: View analytics and reports

## 📚 API Documentation

### Authentication Endpoints
- `POST /users/login` - User login
- `POST /users/register` - User registration
- `POST /users/google-login` - Google OAuth login

### IP Protection Endpoints
- `POST /ip/upload` - Upload image for protection
- `GET /ip/matches` - Get content matches
- `POST /ip/scan` - Initiate content scan
- `GET /ip/reports` - Get protection reports

### Notification Endpoints
- `GET /notifications` - Get user notifications
- `POST /notifications/send` - Send notification

For detailed API documentation, visit `/docs` when the backend is running.

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@sentinelai.com or join our Discord community.

## 🙏 Acknowledgments

- CLIP model for image embeddings
- FastAPI community
- React ecosystem
- Open source contributors
