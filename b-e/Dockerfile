FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen --no-install-project
COPY . .
RUN uv sync --frozen
CMD ["sh", "-c", "uv run gunicorn config.wsgi:application --bind 0.0.0.0:$PORT"]