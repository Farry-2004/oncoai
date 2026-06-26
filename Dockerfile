FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl && \
    rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code (exclude flutter SDK and db files)
COPY . .
RUN rm -rf flutter flutter_app *.db

# Create uploads directory
RUN mkdir -p uploads

# Non-root user for security
RUN useradd -m oncoai && chown -R oncoai:oncoai /app
USER oncoai

ENV PORT=8000
EXPOSE 8000

CMD gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT --timeout 120 --access-logfile -
