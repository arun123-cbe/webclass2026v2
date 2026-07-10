FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (Vite frontend + Express backend)
RUN npm run build

# Expose port (default 3000 as configured in server.ts)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
