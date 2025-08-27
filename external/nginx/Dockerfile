FROM nginx:stable-alpine3.20-perl

# Create the directory for SSL certificates
# RUN mkdir -p /etc/nginx/ssl

# Copy SSL certificates to the container
# COPY ssl/*.pem /etc/nginx/ssl/
# COPY ssl/*.key /etc/nginx/ssl/

# Copy the Nginx configuration to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]