# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the Python Backend & Bundle Frontend
FROM python:3.10-slim AS backend-runner
WORKDIR /workspace

# Install system dependencies (needed for compiling certain packages or pdf processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/app/ ./app/

# Copy compiled frontend build from Stage 1
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Create uploads directory
RUN mkdir -p ./uploads && chmod 777 ./uploads

# Expose port and start Uvicorn
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
