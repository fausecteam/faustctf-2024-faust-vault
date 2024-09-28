FROM faust.cs.fau.de:5000/faustvault-deps
COPY src/ .

RUN go build -mod=vendor -o app

EXPOSE 8080

CMD ["./app"]
