dev: ## Start both frontend and backend dev servers
	(cd demo/oval && npm run dev) & (cd server && uv run fastapi dev) & wait

install: ## Install all dependencies
	cd demo/oval && npm install
	cd server && uv sync

build: ## Build frontend for production
	cd demo/oval && npm run build

lint: ## Lint frontend code
	cd demo/oval && npm run lint

# These make tasks allow the default help text to work properly.
%:
	@true

.PHONY: help start install build lint

help:
	@echo 'Usage: make <command>'
	@echo
	@echo 'where <command> is one of the following:'
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
