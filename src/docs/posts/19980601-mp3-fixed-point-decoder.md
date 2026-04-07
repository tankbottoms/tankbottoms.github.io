---
title: 'MP3 Fixed-Point Decoder for Embedded Platforms'
blurb: 'Real-time MP3 decoding on ARM7TDMI and MIPS R3000 processors without floating-point hardware. Achieved stereo playback at 128 kbps on a 40 MHz ARM7 using under 24 KB of working RAM through precomputed lookup tables, split-radix polyphase synthesis, and careful Q-format scaling across the IMDCT and dequantization pipeline.'
date: June 1, 1998
significance: 4
research: [embedded-systems]
tags: [mp3, dsp, fixed-point, audio-codec, embedded, decoder]
featured: false
---

While the fixed-point MP3 encoder solved the problem of creating compressed audio on embedded platforms, the decoder side presented its own distinct set of challenges. The MPEG-1 Layer III decoder must invert the encoding pipeline -- Huffman decoding, inverse quantization, stereo processing, the Inverse Modified Discrete Cosine Transform (IMDCT), and subband synthesis -- all within real-time constraints on processors with no floating-point unit.

## Decoder vs. Encoder: Different Constraints

The encoder is computationally heavier overall, but the decoder has stricter latency requirements. An encoder can buffer frames and process offline; a decoder must produce audio samples continuously at 44.1 kHz without gaps or glitches. On a 50 MHz ARM7TDMI or a MIPS R3000 derivative, every cycle counted. The working memory budget was often under 32 KB of SRAM, with the decoded PCM output streamed directly to a DAC via DMA.

## Huffman Decoding and Dequantization

The bitstream parsing and Huffman decoding stages operate on integer data and translated directly to the target architectures. The Huffman tables were restructured into a compact binary tree format optimized for the ARM's barrel shifter, allowing variable-length code extraction in two to three instructions per symbol.

The inverse quantization step was more problematic. The ISO standard defines dequantization using fractional exponents (raising values to the 4/3 power), which is inherently a floating-point operation. The solution was a precomputed lookup table covering the full range of quantized values (0-8206), stored in ROM. For values exceeding the table range, a piecewise polynomial approximation in Q15 format was used, with the exponent handled separately through bit shifting.

## IMDCT Implementation

The 36-point and 12-point Inverse Modified Discrete Cosine Transforms are the decoder's computational bottleneck. The reference implementation uses nested loops of floating-point multiplications and additions. The fixed-point port restructured these as cascaded butterfly operations with precomputed twiddle factors stored in Q14 format.

On the ARM7TDMI, the lack of a hardware multiplier wider than 32 bits meant that 32x32->64-bit multiplications required a multi-instruction sequence. The IMDCT was restructured to use 16x16->32-bit multiplications where possible, accepting a small precision trade-off in exchange for a 3x speedup in the butterfly inner loop.

The windowing and overlap-add stage, which blends adjacent IMDCT blocks to eliminate blocking artifacts, was implemented using a single-pass buffer strategy that minimized memory bandwidth. The window coefficients were stored as Q15 values, and the multiply-accumulate operations were carefully ordered to exploit the ARM's load-multiple instructions for fetching coefficient blocks.

## Subband Synthesis Polyphase Filter

The final stage -- the 32-subband polyphase synthesis filter bank -- reconstructs the time-domain audio samples from the decoded frequency-domain subbands. This involves a 512-tap FIR filter operating on a sliding window of subband samples.

The matrixing step (a 32-point DCT variant) was implemented using a split-radix approach that reduced the multiply count from 1024 to approximately 400 per block. The subsequent windowing and summation used saturating arithmetic to prevent clipping artifacts from propagating through the signal chain.

## Platform Results

The decoder achieved real-time stereo playback at 128 kbps on a 40 MHz ARM7TDMI with under 24 KB of working RAM. On MIPS R3000-class processors running at 33 MHz, joint stereo mode was required to maintain real-time performance at higher bitrates. The measured THD+N was within 0.5 dB of the floating-point reference across a standard test suite of audio material.

This decoder implementation was subsequently licensed for use in several portable audio products, including the Iomega HipZip player, where it ran alongside the companion fixed-point encoder on a shared DSP subsystem.
