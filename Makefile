# ==============================================================================
# SSO Login - Makefile
# ==============================================================================
# Convenient commands for Docker operations
# ==============================================================================

.PHONY: help build up down restart logs shell db-shell db-migrate db-seed clean

# Default target
help:
	@echo "SSO Login - Docker Commands"
	@echo "============================"
	@echo ""
	@echo "  make build       - Build Docker images"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs (follow mode)"
	@echo "  make shell       - Open shell in app container"
	@echo "  make db-shell    - Open PostgreSQL shell"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make db-seed     - Seed initial data"
	@echo "  make clean       - Remove containers, volumes, and images"
	@echo ""

# Build Docker images
build:
	docker compose build

# Start all services
up:
	docker compose up -d

# Start with build
up-build:
	docker compose up -d --build

# Stop all services
down:
	docker compose down

# Restart all services
restart:
	docker compose restart

# View logs
logs:
	docker compose logs -f

# View app logs only
logs-app:
	docker compose logs -f sso-app

# Open shell in app container
shell:
	docker compose exec sso-app sh

# Open PostgreSQL shell
db-shell:
	docker compose exec sso-db psql -U postgres -d sso_db

# Run database migrations
db-migrate:
	docker compose exec sso-app npx drizzle-kit push

# Seed initial data
db-seed:
	docker compose exec sso-app npx tsx server/db/seed.ts

# Health check
health:
	@curl -s http://localhost:3000/api/health | jq . || echo "Service not available"

# Remove all containers, volumes, and images
clean:
	docker compose down -v --rmi local

# Production deployment
prod-up:
	docker compose -f docker-compose.yml up -d --build

# Development mode (with hot reload - requires mounting source)
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up
