---
title: 'LLM & AI Developer Tools'
blurb: 'MCP servers, Claude Code skills, and AI-assisted development infrastructure built for modern engineering workflows. Includes the subchat CLI for multi-model orchestration, VecGrep semantic code search, document processing pipelines, and custom agent configurations spanning research, debugging, and code review automation.'
date: January 1, 2024
significance: 4
research: [ai-llm]
tags: [llm, mcp, claude-code, ai-tools, developer-experience]
featured: true
---

The emergence of large language models as practical development tools has created a need for infrastructure that bridges the gap between model capabilities and developer workflows. The tools and infrastructure described here were built to make LLMs composable components in development processes rather than standalone chat interfaces, enabling AI-assisted workflows that integrate naturally with existing toolchains.

## MCP Server Implementations

The Model Context Protocol provides a standardized interface for exposing tools, resources, and prompts to LLM-based agents. Several MCP server implementations were developed to make domain-specific capabilities available within AI-assisted development sessions.

The document processing MCP server exposes OCR, vision analysis, summarization, classification, and structured extraction as callable tools. Built on local model infrastructure (Ollama for inference, vLLM for embeddings), this server enables document intelligence operations without requiring external API calls, addressing both cost and privacy concerns when processing sensitive materials.

The VecGrep MCP servers provide semantic search capabilities over indexed document collections. These servers enable natural language queries against large corpora of legal documents, SEC filings, and email archives, returning semantically relevant results rather than requiring exact keyword matches. Multiple collection-specific servers can be loaded on demand, each exposing search, file context retrieval, and metadata operations for its indexed content.

## Claude Code Skills

Claude Code skills are packaged capabilities that extend the Claude Code CLI with domain-specific knowledge and automated workflows. Several skills were developed to encapsulate recurring development patterns.

The build and deployment skills automate cross-platform compilation targeting macOS ARM64 and Linux ARM64 architectures, handling the platform-specific flags, dependency resolution, and artifact packaging that differ between targets. The deployment skills manage multi-target publishing to IPFS nodes, Cloudflare Workers, Vercel, and GitHub Pages, abstracting the deployment configuration differences behind a consistent interface.

The documentation and formatting skills enforce project-specific conventions for markdown formatting, commit message style, and code documentation standards. These skills encode institutional knowledge that would otherwise be lost or inconsistently applied across development sessions.

## Local Model Infrastructure

The AI development infrastructure runs on local hardware, specifically Nvidia DGX Spark nodes providing GPU-accelerated inference. Ollama serves as the model runtime, supporting a curated set of models selected for their performance on specific tasks: Qwen3 8B for general-purpose text generation and structured extraction, GLM-Edge-V for OCR, and Qwen3-VL for vision analysis.

vLLM provides high-performance embedding generation using ModernBERT, supporting the semantic search capabilities used by VecGrep and other retrieval-augmented workflows. The embedding pipeline processes documents in batches, generates vector representations, and indexes them for efficient similarity search.

Remote model access is provided through an OpenAI-compatible API gateway that routes requests to external providers (OpenAI, OpenRouter, Gemini, DeepSeek, Mistral) based on model specification and context length requirements. This allows seamless switching between local and remote models based on task requirements.

## Design Philosophy

The guiding principle is augmentation over replacement. These tools are designed to make developers more effective by automating routine operations, providing instant access to relevant context, and handling the mechanical aspects of development tasks. They do not attempt to replace developer judgment or decision-making but instead provide better information and faster execution for the decisions developers make.

The composable architecture means individual tools can be loaded on demand, avoiding the token overhead and cognitive load of maintaining all capabilities simultaneously. This pay-for-what-you-use approach keeps development sessions focused on the task at hand while maintaining access to a broad toolkit when needed.
