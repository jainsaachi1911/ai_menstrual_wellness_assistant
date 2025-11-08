# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy entire project
COPY . .

# Install Python dependencies from backend
RUN pip install --no-cache-dir -r backend/requirements.txt

# Expose port 8080 (Railway default)
EXPOSE 8080

# Set environment variables
ENV FLASK_APP=backend/app.py
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend

# Change to backend directory and run the application
WORKDIR /app/backend
CMD exec gunicorn --bind 0.0.0.0:${PORT} --workers 4 --timeout 0 app:app
