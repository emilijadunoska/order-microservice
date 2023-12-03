FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
ENV MONGODB_URI="mongodb+srv://admin:admin@order-service-cluster.rmdhsxv.mongodb.net/ordersdb"
CMD ["npm", "start"]
