# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set environment variable for Flask
ENV FLASK_APP=app.py
ENV PORT=8080

# Run the application with gunicorn
CMD exec gunicorn --bind 0.0.0.0:${PORT} --workers 4 --timeout 0 app:app
