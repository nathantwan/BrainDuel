# BrainDuel

A web app for learning with friends. Upload study notes, get AI-generated questions, and battle your friends to see who knows it better.

Live at: [https://brainduel-tau.vercel.app/](https://brainduel-tau.vercel.app/)

## What You Can Do

- Upload PDFs, docs, images, or text and generate quiz questions with AI
- Battle friends in real-time. Each player answers questions and scores points
- Create private battles with room codes or join public ones
- Organize your study materials in folders
- Share folders with friends or keep them private

## Stack

**Frontend**: Next.js, TypeScript, Tailwind CSS, WebSocket  
**Backend**: FastAPI, SQLAlchemy, PostgreSQL, Groq API for question generation

## Setup

### You'll need:
- Python 3.8+
- Node.js 18+
- PostgreSQL
- Groq API key

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with:
# DATABASE_URL=postgresql://user:password@localhost/brainduel
# GROQ_API_KEY=your_key
# SECRET_KEY=some_secret

alembic upgrade head
python run.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage

### Getting Started
1. Sign Up: Create an account at `/auth`
2. Upload Materials: Go to `/upload` and add your study files
3. Create Battle: Visit `/battle` to start a new battle or join existing ones
4. Battle: Answer questions in real-time and compete for the highest score

### Battle Flow
1. Create Battle: Choose a folder and set battle parameters
2. Share Room Code: Send the room code to your opponent
3. Join Battle: Enter the room code to join
4. Answer Questions: Both players answer simultaneously
5. View Results: See detailed battle statistics and winner

### Dashboard
- View your battle history and statistics
- Track your learning progress
- Manage your study folders
- See recent activity

## Project Structure

```
BrainDuel/
├── backend/
│   ├── alembic/          # Database migrations
│   ├── models/           # Database models
│   ├── routes/           # API endpoints
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   └── main.py          # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── public/          # Static assets
└── README.md
```


##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



