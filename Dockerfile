FROM node:22-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ARG VITE_APP_VERSION=dev
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
RUN npm run build

FROM node:22-alpine AS server
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=client /app/client/dist ./client/dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.js"]
