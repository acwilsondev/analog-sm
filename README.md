# Analog SM

**Analog SM** (Analog Social Media) is a self-hostable, indie social network inspired by the early days of Twitter. It prioritizes simplicity, a strictly temporal timeline, and intentional connectivity for small groups (1-10 people).

---

## 🚀 Vision & Features

Analog SM is designed for small communities who want a private space to share thoughts and media without algorithms or global scale noise.

- **Chronological Timeline:** No algorithms, just a strict temporal order of updates.
- **Rich Posting:** Support for short/long text posts and photo/photo-set uploads.
- **Intentional Friends:** Add friends to receive their timeline updates.
- **Personal Profiles:** Every user has a customizable profile to host their identity.
- **Privacy First:** Designed for limited concurrency and private, self-hosted environments.

---

## 🚦 Getting Started (Users)

### 1. Prerequisites

- Docker & Docker Compose

### 2. Quick Start

The easiest way to start the entire stack (App, Database, and Media Storage) is via Docker Compose:

1. **Clone the repository.**
2. **Create your configuration:**

    ```bash
    cp .env.example .env
    ```

    *Update `.env` with your specific domain and secrets.*
3. **Launch the app:**

    ```bash
    docker-compose up -d
    ```

4. **Access Analog SM:**
    Open `http://localhost:3000` in your browser.

---

## 🛠 For Developers

Interested in contributing or understanding the internal architecture?
Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for technical documentation, architectural standards, and local development guides.

---

## 📜 Legal & Standards

- [AGENTS.md](AGENTS.md) - Project-specific AI and engineering mandates.
- [LICENSE](LICENSE) - Private / Internal.
