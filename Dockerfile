FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN addgroup -S mcp && adduser -S mcp -G mcp
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
USER mcp
ENV QUESTRADE_MCP_TRANSPORT=http
EXPOSE 3100
CMD ["node", "dist/index.js"]
