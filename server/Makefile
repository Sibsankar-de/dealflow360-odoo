.PHONY: dev docker-down docker-up npm-dev build prisma

dev: docker-down docker-up npm-dev

docker-down:
	docker compose down

docker-up:
	docker compose up -d

npm-dev:
	npm run dev

build:
	npm run build

prisma: docker-down docker-up
	npm run db:generate
	npm run db:migrate
