FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /code

# System deps for sentence-transformers / postgres driver
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY req.txt .
RUN pip install --no-cache-dir -r req.txt

COPY app ./app

ENV VIBEMATCH_ENV=production
EXPOSE 8000

# $PORT is provided by Render/Fly/Railway. Default 8000 for local docker run.
CMD sh -c "gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"
