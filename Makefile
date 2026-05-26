.PHONY: dev prod seed build clean logs

# Khởi chạy môi trường development (chỉ infra: postgres + qdrant)
dev-infra:
	docker compose -f docker-compose.dev.yml up -d
	@echo "Waiting for Postgres and Qdrant to be ready..."
	@sleep 5
	@echo "Infrastructure ready."
	@echo "Start server: cd backend && npm run start:dev"
	@echo "Start client: cd frontend && npm run dev"

# Chạy seed data (cần DATABASE_URL trong backend/.env)
seed:
	cd backend && npm run seed

# Build toàn bộ production images
build:
	docker compose build

# Khởi chạy production stack
prod:
	@if [ ! -f .env ]; then echo "ERROR: .env file not found. Copy .env.example to .env and fill in values."; exit 1; fi
	docker compose up -d

# Xem logs
logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

# Dừng tất cả containers
stop:
	docker compose down

# Xóa containers + volumes (CẢNH BÁO: mất dữ liệu)
clean:
	docker compose down -v

# Kiểm tra trạng thái
status:
	docker compose ps
