FROM ghcr.io/puppeteer/puppeteer:24.16.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

USER root
RUN curl -fsSL https://deno.land/install.sh | sh -s -- v2.4.4
ENV DENO_INSTALL=/root/.deno
ENV PATH=$DENO_INSTALL/bin:$PATH

WORKDIR /app
COPY deno.json ./
RUN deno install --allow-scripts=npm:puppeteer@24.16.0
COPY . .
RUN deno cache --no-check main.ts

CMD ["deno", "run", "dev"]