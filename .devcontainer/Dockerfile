FROM mcr.microsoft.com/devcontainers/base:debian

# dont use interactive mode
ENV DEBIAN_FRONTEND=noninteractive

# utils
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    nano \
    ca-certificates \
    gnupg \
    lsb-release \
    mc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# node 24 + yarn
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    corepack enable && corepack prepare yarn@stable --activate

# Java 21
RUN apt-get update \
    && apt-get install -y openjdk-21-jdk
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

# Kotlin
RUN apt-get install -y kotlin

# Postgres
RUN apt-get install -y postgresql-client

# gRPC
RUN npm install -g \
    grpc-tools \
    @grpc/grpc-js

# checks
RUN node -v \
    && npm -v \
    && yarn --version \
    && git --version \
    && java -version \
    && kotlin -version \
    && psql --version \
    && grpc_tools_node_protoc --version 

USER vscode
