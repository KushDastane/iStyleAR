# Use a lightweight official Python image
FROM python:3.10-slim

# Install system dependencies needed for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Expose the port Flask will run on
EXPOSE 5000

# Start Flask server
CMD ["python", "app.py"]
