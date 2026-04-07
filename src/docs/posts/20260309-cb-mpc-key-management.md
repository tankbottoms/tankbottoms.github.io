---
title: 'CB-MPC Key Management -- iOS App & Server'
blurb: 'Multi-party computation key management system built on Coinbase cb-mpc. ECDSA-2PC key generation splits private keys across phone and server so the full key never exists in one place. Includes iOS ARM64 builds, key refresh for forward security, PVE-encrypted backups with threshold access structures, and collaborative signing indistinguishable from single-signer ECDSA.'
date: March 9, 2026
significance: 4
research: [cryptography]
tags: [mpc, ecdsa, key-management, ios, cryptography, zero-knowledge, threshold-signing]
featured: true
---

CB-MPC implements secure multi-party computation protocols for cryptographic key management, built on [Coinbase's open-source cb-mpc library](https://github.com/coinbase/cb-mpc). The system distributes private keys across multiple parties -- a phone and a server in the 2-party configuration -- so the full private key is never materialized on any single device. The implementation includes iOS ARM64 builds, key refresh for forward security, PVE-encrypted backups, and collaborative signing that produces standard ECDSA signatures indistinguishable from single-signer output.

**[View the full visual guide with protocol diagrams and iOS mockups →](/cb-mpc)**

Source: [github.com/tankbottoms/cb-mpc](https://github.com/tankbottoms/cb-mpc) (see iOS ARM64 branches)

## Core Protocols

| Protocol | Purpose | Parties |
|----------|---------|---------|
| ECDSA-2PC | Two-party key generation, signing, refresh | 2 |
| ECDSA-MPC | N-party threshold key generation & signing | N |
| EC-DKG | Distributed key generation with access structures | N |
| PVE | Publicly verifiable encryption for key backup | N |
| Schnorr 2PC/MPC | Schnorr threshold signing | 2/N |
| ZK Proofs | Zero-knowledge proofs (discrete log, Paillier) | 1 |
| OT | Oblivious transfer & extensions | 2 |
| AgreeRandom | Jointly agree on random values | 2 |

## ECDSA-2PC Architecture

The two-party computation model splits key operations between a phone (Party 0) and a server (Party 1). Each party holds a key share `x_i`, and the public key `Q = (x_0 + x_1) * G` is computed jointly. The private key `x = x_0 + x_1` never exists in any single location.

### Key Generation

During distributed key generation, each party independently generates its share and commits to it using cryptographic commitments. The commitment exchange prevents either party from biasing the result. Both parties derive the same public key `Q` without ever learning the other's share.

- Party 0 (Phone): stores `x_0` in iOS Secure Enclave, non-exportable, hardware-bound
- Party 1 (Server): stores `x_1` in HSM/TEE environment
- Public key `Q` is derived jointly and shared

### Collaborative Signing

Transaction signing requires both parties to participate. The protocol uses nonce commitments and partial signatures to produce a standard DER-encoded ECDSA signature. The three-phase process -- nonce commitment, partial signature exchange, signature assembly -- is invisible to verifiers. The output is indistinguishable from a signature produced by a single signer.

### Key Refresh

Key refresh re-randomizes both shares using a random delta `δ`: Party 0 gets `x_0' = x_0 + δ` and Party 1 gets `x_1' = x_1 - δ`. The sum remains constant (`x_0' + x_1' = x`), so the public key is unchanged, but any previously leaked or backed-up shares become cryptographically useless. This provides forward security -- compromised historical shares cannot be used to reconstruct the key.

## Key Share Lifecycle

| Operation | What Happens | Security Property |
|-----------|--------------|-------------------|
| Generate | DKG protocol creates shares; each party gets x_i | Full key x never exists in one place |
| Store | x_i stored in device Secure Enclave/TEE | Hardware-bound, non-exportable |
| Backup | x_i encrypted via PVE; ciphertext publicly verifiable | Verifiable without decrypting |
| Refresh | x_i re-randomized; Q unchanged; old shares invalidated | Forward security -- old leaks useless |
| Sign | Threshold parties run MPC signing; one gets signature | Standard ECDSA -- indistinguishable from single-signer |
| Restore | Quorum holders partially decrypt; owner aggregates | Threshold enforcement by access structure |

## Backup & Recovery

Backup uses Publicly Verifiable Encryption (PVE) with RSA-OAEP KEM. Each party encrypts their key share, and the ciphertext is publicly verifiable without decryption -- anyone can confirm the backup is valid without learning the share.

Recovery requires satisfying an access structure -- a boolean tree encoding authorization policies. For example: the device owner (required) AND 2 of 3 recovery contacts. Partial decryptions must be routed to the correct party only; misrouting leaks information.

### Access Structure Example

```
AND
├── LEAF: Device Owner (required)
└── THRESHOLD (2/3)
    ├── LEAF: Recovery Contact #1
    ├── LEAF: Recovery Contact #2
    └── LEAF: Recovery Contact #3
```

## iOS Implementation

The iOS app targets ARM64 and integrates with the Secure Enclave for hardware-bound key storage. Key shares are non-exportable once stored. The app provides:

- **Key generation** with on-device DKG against a server counterparty
- **Biometric-gated signing** with three-phase protocol visualization
- **USB-C drive backup** with PVE encryption and access structure configuration
- **Key refresh** with share re-randomization and status tracking
- **Restore flow** requiring quorum verification before share reconstruction

See the iOS ARM64 branches at [github.com/tankbottoms/cb-mpc](https://github.com/tankbottoms/cb-mpc) for the full implementation.

## Security Guidelines

| Rule | Rationale |
|------|-----------|
| Never export raw key shares | Keys live in HSM/Secure Enclave/TEE; use PVE for backup |
| Refresh keys after suspected compromise | Refresh invalidates all previous shares |
| Verify PVE backups before trusting | PVE is publicly verifiable without decryption |
| Route partial decryptions carefully | Misrouting leaks information during restore |
| Use access structures for backup policies | Define who can restore via AND/OR/THRESHOLD |
| Bind party identity to key shares | Use public key hashes, not just indices |
| Library is not thread-safe | Protect shared objects with mutexes |
| Refresh backups after key refresh | Old backups contain old shares; create new ones |

## Demo Modules

The repository includes demonstration modules covering the full protocol stack:

1. **Basic Primitives** (C++) -- Hash functions, commitments, curve operations
2. **Zero-Knowledge Proofs** (C++/Go) -- Fischlin's transform, 16 parallel repetitions, 2315-byte proofs
3. **Agree Random** (Go) -- Two-party random generation via commitment exchange
4. **ECDSA 2-Party** (Go) -- KeyGen → Sign → Refresh → Sign workflow
5. **ECDSA MPC with Backup** (Go) -- 4-Party DKG → PVE Backup → Verify → Restore → Sign
6. **Access Structures** (Go) -- Boolean trees for authorization policies
