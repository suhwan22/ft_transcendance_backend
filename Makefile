all:
	docker compose up -d
	docker exec db su - postgres -c "psql -d postgres -f /init.sql"