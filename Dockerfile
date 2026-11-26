FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/ui/package.json packages/ui/package.json
COPY packages/assets/package.json packages/assets/package.json
COPY apps/ui-catalog/package.json apps/ui-catalog/package.json

RUN bun install

COPY packages/ packages/
COPY apps/ apps/

RUN bun --filter @moonwitness/ui build \
  && bun --filter @moonwitness/ui-catalog build:built

FROM nginx:alpine AS runtime
RUN printf 'server {\n  listen 8080;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n\n  location /assets/ {\n    alias /usr/share/nginx/assets/;\n    expires 30d;\n    add_header Cache-Control "public, immutable";\n    add_header Access-Control-Allow-Origin "*";\n  }\n\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/apps/ui-catalog/dist /usr/share/nginx/html
COPY --from=builder /app/packages/assets /usr/share/nginx/assets

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
