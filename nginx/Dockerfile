FROM faust.cs.fau.de:5000/faustvault-wasmpack as build-wasm

WORKDIR /build

COPY frontend /build

RUN cd wasm-crypt && wasm-pack build --target web --out-dir pkg --mode no-install

FROM node:alpine AS build
WORKDIR /build

COPY frontend /build

COPY --from=faust.cs.fau.de:5000/faustvault-frontend-deps ./pkg ./rsa/pkg
COPY --from=build-wasm /build/wasm-crypt/pkg ./wasm-crypt/pkg
COPY --from=faust.cs.fau.de:5000/faustvault-nodemodules / ./node_modules

ARG NPM_CONFIG_UPDATE_NOTIFIER=false
RUN npm link --offline ./rsa/pkg/ ./wasm-crypt/pkg/
RUN npm run build --offline

FROM docker.io/nginx:alpine

COPY nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=build /build/dist /var/www/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
