# DBMS Quiz Flashcards

A full-stack web application for learning Database Management Systems (DBMS) using spaced repetition. Features an Anki-like interface with flashcards scraped from Sanfoundry, SM-2 algorithm for optimal learning, and beautiful modern UI.

![DBMS Quiz Flashcards](https://img.shields.io/badge/React-18.2-blue) ![Flask](https://img.shields.io/badge/Flask-2.3-green) ![Material-UI](https://img.shields.io/badge/MUI-5.14-purple)

## Features

- 🎴 **Interactive Flashcards**: Flip cards to reveal answers with smooth animations
- 🧠 **Spaced Repetition (SM-2)**: Anki-like algorithm for optimal memory retention
- 📊 **Progress Tracking**: Visual stats, streaks, and category progress
- 🔐 **User Authentication**: Register/login with secure sessions
- 📚 **30+ DBMS Topics**: SQL, Normalization, ER Models, Transactions, and more
- 🌙 **Beautiful Dark UI**: Modern glassmorphism design with Material-UI
- 🔄 **Web Scraper**: Automatic question fetching from Sanfoundry

## Tech Stack

**Backend:**
- Python 3.8+
- Flask (REST API)
- SQLite (Database)
- BeautifulSoup4 (Web Scraping)

**Frontend:**
- React 18
- Material-UI v5
- React Router v6
- Axios

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd /home/auxilus/Desktop/quiz
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server** (Terminal 1)
   ```bash
   cd backend
   python app.py
   ```
   The API will be available at `http://localhost:5000`

2. **Start the frontend** (Terminal 2)
   ```bash
   cd frontend
   npm start
   ```
   The app will open at `http://localhost:3000`

3. **Create an account and start learning!**

## Project Structure

```
quiz/
├── backend/
│   ├── app.py              # Flask application & API routes
│   ├── srs.py              # SM-2 spaced repetition algorithm
│   ├── scraper.py          # Web scraper for Sanfoundry
│   ├── requirements.txt    # Python dependencies
│   └── quiz.db             # SQLite database (auto-created)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js          # Main app with routing
│   │   ├── index.js        # Entry point with theme
│   │   └── components/
│   │       ├── Navbar.js     # Navigation bar
│   │       ├── Login.js      # Login page
│   │       ├── Register.js   # Registration page
│   │       ├── Dashboard.js  # Main dashboard
│   │       ├── Quiz.js       # Quiz mode
│   │       ├── Flashcard.js  # Flashcard component
│   │       └── Stats.js      # Statistics page
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions` | Get all questions |
| GET | `/api/questions/categories` | Get categories with counts |
| GET | `/api/due-cards/<user_id>` | Get cards due for review |
| POST | `/api/submit-review` | Submit card review |
| GET | `/api/stats/<user_id>` | Get user statistics |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scrape` | Run web scraper |
| POST | `/api/init-sample` | Initialize sample questions |
| GET | `/api/health` | Health check |

## Spaced Repetition (SM-2)

The app uses the SuperMemo SM-2 algorithm:

- **Again (0)**: Complete failure - reset interval to 1 day
- **Hard (2)**: Difficult recall - small interval increase
- **Good (4)**: Correct with effort - normal interval increase
- **Easy (5)**: Perfect recall - large interval increase

Intervals progress: 1 day → 6 days → (interval × ease factor)

## Configuration

### Environment Variables

```bash
# Backend (optional)
export SECRET_KEY="your-secret-key"
export FLASK_ENV="development"

# Frontend .env (optional)
REACT_APP_API_URL=http://localhost:5000
```

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

## Deployment

### Heroku (Backend)

```bash
cd backend
heroku create dbms-quiz-api
git push heroku main
```

### Vercel (Frontend)

```bash
cd frontend
npm run build
vercel deploy
```

### Docker (Full Stack)

```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

## Adding More Questions

1. **Using the scraper** (may require site adjustment):
   ```bash
   cd backend
   python scraper.py
   ```

2. **Via API**:
   ```bash
   curl -X POST http://localhost:5000/api/init-sample
   ```

3. **Manually edit** `scraper.py` to add more URLs to `DBMS_URLS` list.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Question content adapted from [Sanfoundry](https://www.sanfoundry.com/)
- SM-2 Algorithm by Piotr Wozniak (SuperMemo)
- UI inspiration from Anki and modern web apps

---

**Happy Learning! 🎓**
