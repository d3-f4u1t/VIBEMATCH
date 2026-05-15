<h1 align="center" id="title">VIBEMATCH</h1>

<p align="center"><img src="https://socialify.git.ci/d3-f4u1t/VIBEMATCH/image?custom_language=FastAPI&amp;font=Inter&amp;language=1&amp;name=1&amp;owner=1&amp;pattern=Solid&amp;stargazers=1&amp;theme=Dark" alt="project-image"></p>

<p id="description">VibeMatch is a hierarchical matchmaking system that combines vector-based user representation behavioral clustering and game-theoretic optimization with stable matching algorithms.</p>

  ## Features

### AI-Powered Vector Matching
- **Semantic Embeddings**: Transforms music preferences into 384 dimensional vectors using SentenceTransformer (all-MiniLM-L6-v2) for deep semantic understanding
- **Cosine Similarity Engine**: Advanced mathematical matching that goes beyond simple playlist overlaps to find true compatibility
- **Multi-Modal Architecture**: Designed for personality, behavior, and face embeddings, creating holistic user profiles

### Advanced Discovery Engine
- **Fallback Search Strategies**: Robust multi-stage search that adapts to query complexity and API limitations
- **Metadata Enrichment**: Pulls comprehensive artist data including country origins, musical tags, and historical context
- **Rate-Limited API Management**: Smart throttling to maximize MusicBrainz API usage while staying compliant
- **Semantic Track Matching**: Finds recordings across different releases and artist variations

### Scalable Matching Architecture
- **Extensible Vector System**: Framework ready for personality questionnaires, behavioral data, and facial recognition
- **Real-Time Vector Computation**: Automatic embedding generation as users build their music profiles
- **Profile Completion Intelligence**: Smart validation ensuring minimum data requirements for meaningful matches
- **Future-Proof Design**: Built for advanced algorithms like Gale-Shapley stable matching and density-based clustering

## Roadmap

### Current Development Focus
- **Personality Vectors**: Adding bio and personality questionnaire data with semantic embeddings
- **Behavior Tracking**: Implementing user interaction patterns (swipes, likes, passes) for behavior vectors
- **Weighted Similarity**: Multi-factor compatibility scoring combining music, personality, and behavior

### Upcoming Features
- **Face Embeddings**: AI-powered facial recognition for visual compatibility matching
- **Stable Matching Algorithm**: Implementing Gale-Shapley for reciprocal, stable pair matching
- **Behavioral Clustering**: Density-based clustering to group users by attraction patterns
- **Preference Vectors**: Learning what users are attracted to from their interaction history

### Production Readiness
- **Database Migration**: Transitioning from SQLite to PostgreSQL for scalability
- **API Optimization**: Caching strategies and performance improvements
- **Security Hardening**: Environment-based configuration, CORS, and rate limiting
- **Containerization**: Docker setup for easy deployment

### Quality Assurance
- **Monitoring & Logging**: Structured logging and performance monitoring
- **API Documentation**: Enhanced OpenAPI specs with examples

#### Project Structure
```
VIBEMATCH/
├── app/                   # Main application code
│   ├── models/            # Database models
│   ├── routes/            # API endpoints
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   └── main.py            # Application entry point
├── scripts/               # Utility scripts
└── tests/                 # Test suite (when implemented)
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup Steps
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VIBEMATCH
   ```

2. **Install dependencies**
   ```bash
   pip install -r req.txt
   ```

3. **Run the application**
   ```bash
   python app/main.py
   ```

4. **Access the API**
   - Open your browser to `http://localhost:8000`
   - Interactive API documentation available at `http://localhost:8000/docs`

### Optional: Seed Test Data
```bash
python scripts/seed_proxy_data.py
```
### Testing

1. **Run Existing Tests**
   ```bash
   pytest  # When test suite is implemented
   ```

2. **Add New Tests**
   - Write unit tests for new functions
   - Add integration tests for API endpoints
   - Test edge cases and error conditions
   - Maintain test coverage above 80%

### Submitting Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Implement your feature or fix
   - Add/update tests
   - Update documentation if needed

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

4. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Open a Pull Request on GitHub
   - Provide a clear description of changes
   - Reference any related issues

### Communication

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join conversations in GitHub Discussions
- **Code Review**: All PRs require review before merging
- **Commit Convention**: Use conventional commits (feat, fix, docs, etc.)

