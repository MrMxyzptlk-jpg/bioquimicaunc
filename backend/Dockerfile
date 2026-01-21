# 1. Use the official Node.js image as the base
FROM node:20

# 2. Create the directory inside the container
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json first
# (This allows Docker to cache the installation step so it's faster later)
COPY package*.json ./

# 4. Install dependencies inside the container
RUN npm install

# 5. Copy the rest of your application code
COPY . .

# 6. BUILD the application
RUN npm run build

# 7. Expose the port the app runs on
EXPOSE 3000

# 8. Start the app in PRODUCTION mode (No watchers, just the app)
CMD ["node", "dist/main.js"]