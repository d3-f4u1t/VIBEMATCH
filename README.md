<h1 align="center" id="title">VIBEMATCH</h1>

<p align="center"><img src="https://socialify.git.ci/d3-f4u1t/VIBEMATCH/image?custom_language=FastAPI&amp;font=Inter&amp;language=1&amp;name=1&amp;owner=1&amp;pattern=Solid&amp;stargazers=1&amp;theme=Dark" alt="project-image"></p>

### VibeMatch is a music-first matchmaking app built around the idea that taste, energy, and compatibility can be modeled more meaningfully than traditional profile-only matching.

The current system focuses on:
- user auth
- profile onboarding
- music-based user setup
- vector-building from selected artists and tracks
- swipe/match infrastructure
- mobile frontend + FastAPI backend integration

The broader long-term vision is a multi-layer matching system that combines music, identity, behavioral patterns, and explicit preferences into a more intelligent compatibility engine.

---

## Current Status

This project is actively under development.

### What is implemented right now
- FastAPI backend with auth and user profile routes
- mobile app built with Expo / React Native
- step-based profile onboarding flow
- music profile setup foundation
- artist and track selection pipeline
- music vector generation
- swipe system foundation
- behavioral summary/vector groundwork

### What is planned next
- fully wired music onboarding in the mobile app
- cleaner match candidate flow
- stronger backend contracts for music search and selection
- improved testing and deployment setup
- progressive matching logic improvements

---

## Core Idea

Most matching systems rely heavily on simple profile fields or shallow preference filters.

VibeMatch is based on a different assumption:

> music taste, behavioral patterns, identity context, and explicit preferences can together create a richer compatibility model than surface-level profile matching alone.

The long-term architecture is designed around four layers:

1. Music / taste
2. Identity / demographics
3. Behavioral / personality signals
4. Preference / relationship goals

These layers are intended to evolve into a multi-dimensional matching system over time.

---

## Current Product Direction

Right now, VibeMatch should be understood as:

- a music-based compatibility project
- a full-stack learning and product-building effort
- an MVP moving toward smarter matching

It is **not yet** the full advanced matching system described in the long-term architecture documents.

That larger system is the direction, not the current state.

---

## Tech Stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite (current development database)

### Mobile
- React Native
- Expo
- TypeScript

### Data / Matching
- MusicBrainz API
- vector generation pipeline
- swipe and behavioral foundations

---

## Development Roadmap

### Phase 1
- auth
- profile setup
- music onboarding
- vector generation
- swipe flow

### Phase 2
- improved candidate generation
- stronger ranking and filtering
- profile completeness logic
- better API contracts and tests

### Phase 3
- behavioral learning
- more intelligent scoring
- multi-layer matching refinement

### Phase 4
- advanced clustering, ranking, and feedback systems

---

## Why This Project Exists

VibeMatch is both:
- a product exploration into music-first compatibility
- and a serious engineering project spanning backend systems, mobile development, data modeling, and matching logic

The goal is to turn a strong concept into a working end-to-end product, one layer at a time.

---

## Note

This repository contains both:
- implemented product code
- and architectural ideas that guide future development

The implementation is intentionally being built in stages, and the long-term design should be read as direction rather than a claim that every advanced system is already complete.

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
   git clone <https://github.com/d3-f4u1t/VIBEMATCH>
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

