# Use a lightweight base image [cite: 142]
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Expose port for local development
EXPOSE 3000
CMD ["npm", "start"]