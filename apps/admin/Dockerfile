# Admin image for per-PR previews on Cloud Run. Build context is the repository root:
#   docker build -f apps/admin/Dockerfile .
# The image carries no environment configuration. ADMIN_* and NEXT_PUBLIC_FIREBASE_* are read
# at runtime (src/lib/firebase/config.server.ts) from the Cloud Run service environment.

# Official node:24.19.0-bookworm-slim, pulled from Google's Docker Hub mirror (no anonymous rate
# limit) and pinned to the multi-arch index digest, so the content is the same as on Docker Hub.
ARG NODE_IMAGE=mirror.gcr.io/library/node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
# The lockfile describes both workspaces, so npm ci needs both manifests (not apps/public sources).
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/
COPY apps/public/package.json apps/public/
# Builds behind a TLS-inspecting proxy may pass its CA as the optional `extra_ca` build secret.
# Secret mounts are never written to image layers.
RUN --mount=type=secret,id=extra_ca \
    if [ -s /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    npm ci --no-audit --no-fund
COPY apps/admin apps/admin
RUN --mount=type=secret,id=extra_ca \
    if [ -s /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    ADMIN_NEXT_OUTPUT=standalone npm run build --workspace @ana-psi/admin

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=8080
# Application files stay owned by root and read-only for the runtime user.
COPY --from=build /repo/apps/admin/.next/standalone ./
COPY --from=build /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build /repo/apps/admin/public ./apps/admin/public
# Next only needs to write its cache directory.
RUN mkdir -p apps/admin/.next/cache && chown node:node apps/admin/.next/cache
USER node
EXPOSE 8080
CMD ["node", "apps/admin/server.js"]
