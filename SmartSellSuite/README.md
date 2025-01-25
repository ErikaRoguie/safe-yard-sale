# Safe Yard Sale - AI-Powered Item Listing Platform

## Elevator Pitch
Transform your yard sale into a smart, digital marketplace with Safe Yard Sale. Our AI-powered platform automatically generates professional listings from your photos, tracks real-time performance metrics, and helps you price items competitively. Whether you're decluttering your home or running a small business, Safe Yard Sale makes selling as simple as taking a photo. With features like instant item recognition, automated description generation, and real-time analytics, we're bringing yard sales into the digital age – making selling safer, smarter, and more profitable.

## Features
- 🤖 AI-powered listing generation
- 📊 Real-time performance tracking
- 🖼️ Automatic image enhancement
- 📱 Responsive design
- 📈 Analytics dashboard
- 🔍 Smart search with similar item suggestions
- 🔄 Real-time WebSocket updates
- 📤 Social media sharing integration

## Tech Stack
- **Frontend**
  - React with TypeScript
  - Shadcn UI components
  - TanStack Query for data fetching
  - WebSocket for real-time updates
  - Tailwind CSS for styling

- **Backend**
  - Node.js with Express
  - PostgreSQL with pgvector for vector similarity search
  - WebSocket server for real-time metrics
  - OpenAI GPT-4 Vision API integration
  - Drizzle ORM for database management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL with pgvector extension
- OpenAI API key

### Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=your_openai_api_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/safe-yard-sale.git
cd safe-yard-sale
```

2. Install dependencies:
```bash
npm install
```

3. Push the database schema:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and API clients
│   │   └── pages/        # Page components
├── db/                    # Database schema and configuration
├── server/                # Backend Express application
│   ├── services/         # Business logic and services
│   └── routes.ts         # API routes
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.