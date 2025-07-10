# BrainDuel 🧠⚔️

**AI-Powered Learning Battles - Transform your study materials into competitive knowledge battles!**

BrainDuel is a modern web application that combines AI-powered question generation with real-time competitive learning. Upload your study materials, generate personalized questions, and challenge friends in epic knowledge battles.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Question Generation**: Upload notes, textbooks, or study materials and let our AI create challenging, relevant questions
- **Real-Time Battles**: Challenge friends or join public battles with live competition
- **Competitive Scoring**: Earn points based on accuracy, speed, and difficulty
- **Live Score Tracking**: See scores update in real-time during battles
- **Question Synchronization**: Both players must answer before moving to the next question

### 🎮 Battle System
- **Room Code System**: Create private battles with unique room codes
- **Battle Invitations**: Send and receive battle invitations
- **Real-Time WebSocket Communication**: Instant updates and synchronization
- **Comprehensive Results**: Detailed battle statistics and winner determination
- **Tie-Breaker System**: Fair winner determination with multiple criteria

### 📚 Study Management
- **Folder Organization**: Organize study materials by subject, course, or topic
- **Multiple File Support**: Upload PDFs, Word docs, text files, images, and more
- **Public/Private Folders**: Share study materials or keep them private
- **Question Customization**: Set difficulty levels and question counts

### 🎨 User Experience
- **Dark Mode Design**: Modern, eye-friendly interface
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-Time Notifications**: Battle invitations and updates
- **Dashboard Analytics**: Track your learning progress and battle history

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **WebSocket** - Real-time communication

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **Alembic** - Database migrations
- **PostgreSQL** - Reliable database
- **WebSocket** - Real-time communication
- **Groq API** - AI question generation

## 📦 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL database
- Groq API key

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Run database migrations
alembic upgrade head

# Start the backend server
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/brainduel
GROQ_API_KEY=your_grok_api_key_here
SECRET_KEY=your_secret_key_here
```

### Frontend
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎯 Usage

### Getting Started
1. **Sign Up**: Create an account at `/auth`
2. **Upload Materials**: Go to `/upload` and add your study files
3. **Create Battle**: Visit `/battle` to start a new battle or join existing ones
4. **Battle**: Answer questions in real-time and compete for the highest score!

### Battle Flow
1. **Create Battle**: Choose a folder and set battle parameters
2. **Share Room Code**: Send the room code to your opponent
3. **Join Battle**: Enter the room code to join
4. **Answer Questions**: Both players answer simultaneously
5. **View Results**: See detailed battle statistics and winner

### Dashboard
- View your battle history and statistics
- Track your learning progress
- Manage your study folders
- See recent activity

## 🏗️ Project Structure

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Groq API for AI question generation
- Next.js team for the amazing framework
- FastAPI for the modern Python web framework
- All contributors and beta testers

---

**Made with ❤️ for competitive learning**
