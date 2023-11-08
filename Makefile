all:
	docker compose up -d

down:
	docker compose down

init:
	docker exec db su - postgres -c "psql -d postgres -f /init.sql"	

fclean:
	sudo docker compose -f ./docker-compose.yml down --rmi all --volumes

re:
	make fclean
	make all

.PHONY: all init fclean re