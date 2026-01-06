FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen --no-install-project
COPY . .
RUN uv sync --frozen
EXPOSE 8080
CMD ["uv", "run", "gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8080"]