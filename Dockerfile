# Start from a node base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
