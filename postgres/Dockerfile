FROM postgres:12

EXPOSE 5432

COPY init.sql /init.sql
COPY clear.sql /clear.sql

CMD ["postgres", "-D", "/var/lib/postgresql/data", "-c", "listen_addresses=0.0.0.0"]