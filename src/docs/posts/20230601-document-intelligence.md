---
title: 'Document Intelligence & OCR Systems'
blurb: 'Vision model-based OCR pipelines combining GLM-Edge (0.9B), Qwen3-VL, and structured extraction for document processing at scale. Deployed as MCP servers on local GPU infrastructure with Ollama, supporting multi-format ingestion (PDF, DOCX, images), Blue Book legal citation formatting, and embedding generation via ModernBERT.'
date: June 1, 2023
significance: 3
research: [ai-llm]
tags: [ocr, document-processing, vision-models, llm, extraction]
featured: false
---

Traditional OCR systems treat document processing as a character recognition problem, converting pixel patterns to text without understanding the semantic structure of the document. The document intelligence systems described here take a fundamentally different approach, combining vision-based OCR models with LLM-powered structured extraction to process documents with an understanding of their content and purpose.

## Pipeline Architecture

The processing pipeline operates in stages, each building on the output of the previous stage to progressively transform raw document images into structured, queryable data.

The first stage handles image preprocessing: deskewing, contrast normalization, border removal, and page segmentation for multi-page documents. These operations are performed using standard computer vision techniques and ensure that downstream models receive clean, consistently formatted input regardless of the quality of the original scan or photograph.

The second stage applies vision-based OCR using models specifically trained for document text recognition. The pipeline supports multiple OCR backends including GLM-Edge-V (a compact 0.9B parameter model optimized for edge deployment) and Qwen-VL (a larger vision-language model with stronger contextual understanding). Model selection is configurable based on the tradeoff between processing speed and extraction accuracy required for a given use case.

The third stage takes the raw OCR text output and applies LLM-powered structured extraction. Rather than relying on regex patterns or template matching to identify specific fields, an instruction-tuned language model interprets the document content and extracts named fields into a structured JSON format. This approach handles the natural variation in document layouts far more robustly than rule-based extraction.

## Model Selection and Deployment

The model selection process was driven by practical deployment constraints. Models needed to run efficiently on local hardware (Nvidia DGX Spark nodes with GPU acceleration) without requiring cloud API calls for every document processed. This local-first approach addresses both cost concerns at volume and data privacy requirements when processing sensitive documents.

GLM-Edge-V was selected for high-throughput scenarios where documents follow relatively standard formats and the priority is processing speed. Qwen-VL serves as the higher-accuracy option for documents with complex layouts, mixed languages, or degraded image quality. The pipeline allows model switching on a per-document or per-batch basis.

## MCP Server Integration

The document intelligence capabilities are exposed through an MCP (Model Context Protocol) server, making them available as tools within AI-assisted development workflows. This integration allows Claude Code and other MCP-compatible clients to invoke OCR, vision analysis, and structured extraction operations as part of larger automated workflows.

The MCP server runs on local infrastructure and provides tools for document OCR, vision-based analysis, structured extraction, summarization, and classification. Each tool accepts configurable parameters for model selection, output format, and extraction schemas, providing flexibility while maintaining a consistent interface.

## Practical Applications

The system has been applied to legal document processing, where scanned court filings and correspondence need to be converted to searchable text and have key fields (case numbers, dates, party names, relief sought) extracted automatically. It has also been used for financial filing analysis, processing SEC documents that arrive in various formats, and general-purpose document digitization workflows where manual data entry is prohibitively time-consuming.
