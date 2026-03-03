FROM denoland/deno:2.5.1

WORKDIR /app

# Copy dependency files first (for better caching)
COPY deno.json deno.lock* ./

# Cache dependencies
RUN deno cache --reload deno.json || true

# Copy application source
COPY . .

# Build the application (AOT island compilation)
RUN deno run -A dev.ts build

# Expose Fresh default port
EXPOSE 8000

# Run production server
CMD ["deno", "run", "-A", "main.ts"]
