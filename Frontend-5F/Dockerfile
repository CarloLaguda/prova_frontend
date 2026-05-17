FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm install jspdf
COPY . .
RUN sed -i 's/"maximumError": "1MB"/"maximumError": "4MB"/g' angular.json && \
    sed -i 's/"maximumWarning": "500kB"/"maximumWarning": "2MB"/g' angular.json
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/Frontend-5F/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
