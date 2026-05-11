# Use Node.js LTS
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port (3000)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
