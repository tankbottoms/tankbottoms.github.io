<script lang="ts">
	import { base } from '$app/paths';
	import FloatingNav from '$lib/components/FloatingNav.svelte';

	let activeDemo = $state<string | null>(null);

	function toggleDemo(id: string) {
		activeDemo = activeDemo === id ? null : id;
	}

	// Protocol data
	const protocols = [
		{ name: 'ECDSA-2PC', purpose: 'Two-party key generation, signing, refresh', parties: '2', color: '#6366f1' },
		{ name: 'ECDSA-MPC', purpose: 'N-party threshold key generation & signing', parties: 'N', color: '#6366f1' },
		{ name: 'EC-DKG', purpose: 'Distributed key generation with access structures', parties: 'N', color: '#10b981' },
		{ name: 'PVE', purpose: 'Publicly verifiable encryption for key backup', parties: 'N', color: '#f59e0b' },
		{ name: 'Schnorr 2PC/MPC', purpose: 'Schnorr threshold signing', parties: '2/N', color: '#6366f1' },
		{ name: 'ZK Proofs', purpose: 'Zero-knowledge proofs (discrete log, Paillier)', parties: '1', color: '#ef4444' },
		{ name: 'OT', purpose: 'Oblivious transfer & extensions', parties: '2', color: '#8b5cf6' },
		{ name: 'AgreeRandom', purpose: 'Jointly agree on random values', parties: '2', color: '#10b981' },
	];

	const lifecycle = [
		{ op: 'Generate', detail: 'DKG protocol creates shares; each party gets x_i', prop: 'Full key x never exists in one place', icon: 'fa-key' },
		{ op: 'Store', detail: 'x_i stored in device Secure Enclave/TEE', prop: 'Hardware-bound, non-exportable', icon: 'fa-lock' },
		{ op: 'Backup', detail: 'x_i encrypted via PVE; ciphertext publicly verifiable', prop: 'Verifiable without decrypting', icon: 'fa-cloud-arrow-up' },
		{ op: 'Refresh', detail: 'x_i re-randomized; Q unchanged; old shares invalidated', prop: 'Forward security -- old leaks useless', icon: 'fa-rotate' },
		{ op: 'Sign', detail: 'Threshold parties run MPC signing; one gets signature', prop: 'Standard ECDSA -- indistinguishable from single-signer', icon: 'fa-signature' },
		{ op: 'Restore', detail: 'Quorum holders partially decrypt; owner aggregates', prop: 'Threshold enforcement by access structure', icon: 'fa-arrow-rotate-left' },
	];

	const securityRules = [
		{ rule: 'Never export raw key shares', why: 'Keys live in HSM/Secure Enclave/TEE; use PVE for backup' },
		{ rule: 'Refresh keys after suspected compromise', why: 'Refresh invalidates all previous shares' },
		{ rule: 'Verify PVE backups before trusting', why: 'PVE is publicly verifiable without decryption' },
		{ rule: 'Route partial decryptions carefully', why: 'Misrouting leaks information during restore' },
		{ rule: 'Use access structures for backup policies', why: 'Define who can restore via AND/OR/THRESHOLD' },
		{ rule: 'Bind party identity to key shares', why: 'Use public key hashes, not just indices' },
		{ rule: 'Library is not thread-safe', why: 'Protect shared objects with mutexes' },
		{ rule: 'Refresh backups after key refresh', why: 'Old backups contain old shares; create new ones' },
	];
</script>

<svelte:head>
	<title>CB-MPC Visual Guide | atsignhandle.xyz</title>
	<meta name="description" content="Visual guide to CB-MPC multi-party computation key management -- protocol flows, iOS app mockups, and architecture diagrams" />
</svelte:head>

<FloatingNav />

<div class="guide">
	<nav class="guide-nav">
		<a href="{base}/20260309-cb-mpc-key-management" class="back-link"><i class="fat fa-arrow-left"></i> Back to blog post</a>
		<a href="https://github.com/tankbottoms/cb-mpc" target="_blank" rel="noopener" class="repo-link"><i class="fat fa-code-branch"></i> GitHub (iOS ARM64 branches)</a>
	</nav>

	<h1 class="guide-title">CB-MPC Key Management</h1>
	<p class="guide-subtitle">Visual guide to multi-party computation protocols for iOS and server key management</p>
	<p class="guide-source">Built from <a href="https://github.com/coinbase/cb-mpc" target="_blank" rel="noopener">coinbase/cb-mpc</a> -- Fork: <a href="https://github.com/tankbottoms/cb-mpc" target="_blank" rel="noopener">tankbottoms/cb-mpc</a> (iOS ARM64 branches)</p>

	<!-- ============================================ -->
	<!-- SECTION: Protocol Overview -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">01</span> Protocol Overview</h2>
		<p class="section-desc">CB-MPC distributes cryptographic keys across multiple parties so no single party ever sees the full key.</p>

		<div class="protocol-grid">
			{#each protocols as proto}
				<div class="protocol-card" style="--card-color: {proto.color};">
					<div class="protocol-header">
						<span class="protocol-name">{proto.name}</span>
						<span class="protocol-parties">{proto.parties}P</span>
					</div>
					<p class="protocol-purpose">{proto.purpose}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- ============================================ -->
	<!-- SECTION: ECDSA-2PC Key Generation -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">02</span> ECDSA-2PC Key Generation</h2>
		<p class="section-desc">Each party generates a key share. The full private key x = x_0 + x_1 is never computed anywhere.</p>

		<div class="diagram-container">
			<svg viewBox="0 0 720 420" class="flow-diagram" aria-label="ECDSA-2PC Key Generation Flow">
				<!-- Background -->
				<rect x="0" y="0" width="720" height="420" fill="none" />

				<!-- Party 0: Phone -->
				<rect x="30" y="20" width="280" height="380" rx="0" fill="none" stroke="#6366f1" stroke-width="3" />
				<rect x="30" y="20" width="280" height="40" fill="#6366f1" />
				<text x="170" y="46" text-anchor="middle" fill="white" font-family="monospace" font-weight="800" font-size="14">PARTY 0 -- PHONE</text>

				<!-- Party 1: Server -->
				<rect x="410" y="20" width="280" height="380" rx="0" fill="none" stroke="#f59e0b" stroke-width="3" />
				<rect x="410" y="20" width="280" height="40" fill="#f59e0b" />
				<text x="550" y="46" text-anchor="middle" fill="white" font-family="monospace" font-weight="800" font-size="14">PARTY 1 -- SERVER</text>

				<!-- Step 1: Generate shares -->
				<rect x="50" y="80" width="240" height="50" rx="0" fill="#6366f120" stroke="#6366f1" stroke-width="2" />
				<text x="170" y="100" text-anchor="middle" font-family="monospace" font-size="11" fill="#6366f1" font-weight="700">1. Generate share x_0</text>
				<text x="170" y="118" text-anchor="middle" font-family="monospace" font-size="10" fill="#6366f1">compute Q_0 = x_0 * G</text>

				<rect x="430" y="80" width="240" height="50" rx="0" fill="#f59e0b20" stroke="#f59e0b" stroke-width="2" />
				<text x="550" y="100" text-anchor="middle" font-family="monospace" font-size="11" fill="#f59e0b" font-weight="700">1. Generate share x_1</text>
				<text x="550" y="118" text-anchor="middle" font-family="monospace" font-size="10" fill="#f59e0b">compute Q_1 = x_1 * G</text>

				<!-- Step 2: Commitment exchange -->
				<rect x="50" y="150" width="240" height="40" rx="0" fill="#6366f120" stroke="#6366f1" stroke-width="2" />
				<text x="170" y="175" text-anchor="middle" font-family="monospace" font-size="11" fill="#6366f1" font-weight="700">2. Commit to Q_0</text>

				<rect x="430" y="150" width="240" height="40" rx="0" fill="#f59e0b20" stroke="#f59e0b" stroke-width="2" />
				<text x="550" y="175" text-anchor="middle" font-family="monospace" font-size="11" fill="#f59e0b" font-weight="700">2. Commit to Q_1</text>

				<!-- Arrows: commitment exchange -->
				<line x1="290" y1="165" x2="430" y2="165" stroke="#6366f1" stroke-width="2" marker-end="url(#arrow-indigo)" />
				<text x="360" y="158" text-anchor="middle" font-family="monospace" font-size="9" fill="var(--color-text-muted)">com(Q_0)</text>

				<line x1="430" y1="180" x2="290" y2="180" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrow-amber)" />
				<text x="360" y="198" text-anchor="middle" font-family="monospace" font-size="9" fill="var(--color-text-muted)">com(Q_1)</text>

				<!-- Step 3: Reveal -->
				<rect x="50" y="220" width="240" height="40" rx="0" fill="#6366f120" stroke="#6366f1" stroke-width="2" />
				<text x="170" y="245" text-anchor="middle" font-family="monospace" font-size="11" fill="#6366f1" font-weight="700">3. Reveal Q_0</text>

				<rect x="430" y="220" width="240" height="40" rx="0" fill="#f59e0b20" stroke="#f59e0b" stroke-width="2" />
				<text x="550" y="245" text-anchor="middle" font-family="monospace" font-size="11" fill="#f59e0b" font-weight="700">3. Reveal Q_1</text>

				<!-- Arrows: reveal -->
				<line x1="290" y1="235" x2="430" y2="235" stroke="#6366f1" stroke-width="2" marker-end="url(#arrow-indigo)" />
				<line x1="430" y1="245" x2="290" y2="245" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrow-amber)" />
				<text x="360" y="235" text-anchor="middle" font-family="monospace" font-size="9" fill="var(--color-text-muted)">Q_0, Q_1</text>

				<!-- Step 4: Derive public key -->
				<rect x="50" y="285" width="240" height="50" rx="0" fill="#10b98120" stroke="#10b981" stroke-width="3" />
				<text x="170" y="305" text-anchor="middle" font-family="monospace" font-size="11" fill="#10b981" font-weight="700">4. Compute Q = Q_0 + Q_1</text>
				<text x="170" y="323" text-anchor="middle" font-family="monospace" font-size="10" fill="#10b981">Store x_0 in Secure Enclave</text>

				<rect x="430" y="285" width="240" height="50" rx="0" fill="#10b98120" stroke="#10b981" stroke-width="3" />
				<text x="550" y="305" text-anchor="middle" font-family="monospace" font-size="11" fill="#10b981" font-weight="700">4. Compute Q = Q_0 + Q_1</text>
				<text x="550" y="323" text-anchor="middle" font-family="monospace" font-size="10" fill="#10b981">Store x_1 in HSM/TEE</text>

				<!-- Result -->
				<rect x="200" y="360" width="320" height="35" rx="0" fill="#10b981" stroke="#10b981" stroke-width="3" />
				<text x="360" y="383" text-anchor="middle" font-family="monospace" font-size="12" fill="white" font-weight="800">PUBLIC KEY Q -- SHARED BY BOTH PARTIES</text>

				<!-- Arrow markers -->
				<defs>
					<marker id="arrow-indigo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
					</marker>
					<marker id="arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
					</marker>
					<marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
					</marker>
					<marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
					</marker>
				</defs>
			</svg>
			<div class="diagram-callout callout-danger">
				<i class="fat fa-triangle-exclamation"></i>
				The private key x = x_0 + x_1 is <strong>never computed anywhere</strong>. Each party only knows its own share.
			</div>
		</div>
	</section>

	<!-- ============================================ -->
	<!-- SECTION: Collaborative Signing -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">03</span> Collaborative Signing</h2>
		<p class="section-desc">Both parties contribute nonces and partial signatures. The output is a standard DER-encoded ECDSA signature -- indistinguishable from single-signer.</p>

		<div class="diagram-container">
			<svg viewBox="0 0 720 380" class="flow-diagram" aria-label="ECDSA-2PC Signing Flow">
				<!-- Party columns -->
				<rect x="30" y="20" width="280" height="340" rx="0" fill="none" stroke="#6366f1" stroke-width="3" />
				<rect x="30" y="20" width="280" height="36" fill="#6366f1" />
				<text x="170" y="44" text-anchor="middle" fill="white" font-family="monospace" font-weight="800" font-size="13">PHONE (Party 0)</text>

				<rect x="410" y="20" width="280" height="340" rx="0" fill="none" stroke="#f59e0b" stroke-width="3" />
				<rect x="410" y="20" width="280" height="36" fill="#f59e0b" />
				<text x="550" y="44" text-anchor="middle" fill="white" font-family="monospace" font-weight="800" font-size="13">SERVER (Party 1)</text>

				<!-- Phase 1: Nonce commitment -->
				<text x="360" y="82" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--color-text-muted)" font-weight="700">PHASE 1: NONCE COMMITMENT</text>

				<rect x="50" y="90" width="240" height="35" rx="0" fill="#6366f120" stroke="#6366f1" stroke-width="2" />
				<text x="170" y="112" text-anchor="middle" font-family="monospace" font-size="10" fill="#6366f1">Pick nonce k_0, commit</text>

				<rect x="430" y="90" width="240" height="35" rx="0" fill="#f59e0b20" stroke="#f59e0b" stroke-width="2" />
				<text x="550" y="112" text-anchor="middle" font-family="monospace" font-size="10" fill="#f59e0b">Pick nonce k_1, commit</text>

				<line x1="290" y1="107" x2="430" y2="107" stroke="#6366f1" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arrow-indigo)" />

				<!-- Phase 2: Partial signatures -->
				<text x="360" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--color-text-muted)" font-weight="700">PHASE 2: PARTIAL SIGNATURES</text>

				<rect x="50" y="163" width="240" height="35" rx="0" fill="#6366f120" stroke="#6366f1" stroke-width="2" />
				<text x="170" y="185" text-anchor="middle" font-family="monospace" font-size="10" fill="#6366f1">Compute partial sig with x_0</text>

				<rect x="430" y="163" width="240" height="35" rx="0" fill="#f59e0b20" stroke="#f59e0b" stroke-width="2" />
				<text x="550" y="185" text-anchor="middle" font-family="monospace" font-size="10" fill="#f59e0b">Compute partial sig with x_1</text>

				<line x1="430" y1="180" x2="290" y2="180" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arrow-amber)" />
				<line x1="290" y1="190" x2="430" y2="190" stroke="#6366f1" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arrow-indigo)" />

				<!-- Phase 3: Assembly -->
				<text x="360" y="228" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--color-text-muted)" font-weight="700">PHASE 3: SIGNATURE ASSEMBLY</text>

				<rect x="50" y="236" width="240" height="45" rx="0" fill="#10b98120" stroke="#10b981" stroke-width="3" />
				<text x="170" y="255" text-anchor="middle" font-family="monospace" font-size="10" fill="#10b981" font-weight="700">Assemble final (r, s)</text>
				<text x="170" y="271" text-anchor="middle" font-family="monospace" font-size="9" fill="#10b981">DER-encoded ECDSA sig</text>

				<!-- Output -->
				<rect x="140" y="305" width="440" height="40" rx="0" fill="#10b981" />
				<text x="360" y="330" text-anchor="middle" font-family="monospace" font-size="12" fill="white" font-weight="800">OUTPUT: Standard ECDSA Signature (r, s)</text>
			</svg>
			<div class="diagram-callout callout-info">
				<i class="fat fa-circle-info"></i>
				The 2PC protocol is invisible to verifiers -- the signature looks like one person signed.
			</div>
		</div>
	</section>

	<!-- ============================================ -->
	<!-- SECTION: Key Refresh -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">04</span> Key Refresh</h2>
		<p class="section-desc">Re-randomize key shares without changing the public key. After refresh, previously leaked shares become cryptographically useless.</p>

		<div class="diagram-container">
			<svg viewBox="0 0 720 280" class="flow-diagram" aria-label="Key Refresh Flow">
				<!-- Before refresh -->
				<text x="180" y="25" text-anchor="middle" font-family="monospace" font-size="12" fill="var(--color-text)" font-weight="800">BEFORE REFRESH</text>

				<rect x="30" y="40" width="140" height="60" rx="0" fill="#6366f120" stroke="#6366f1" stroke-width="3" />
				<text x="100" y="65" text-anchor="middle" font-family="monospace" font-size="11" fill="#6366f1" font-weight="700">Party 0</text>
				<text x="100" y="85" text-anchor="middle" font-family="monospace" font-size="12" fill="#6366f1">x_0</text>

				<text x="220" y="75" text-anchor="middle" font-family="monospace" font-size="16" fill="var(--color-text)">+</text>

				<rect x="260" y="40" width="140" height="60" rx="0" fill="#f59e0b20" stroke="#f59e0b" stroke-width="3" />
				<text x="330" y="65" text-anchor="middle" font-family="monospace" font-size="11" fill="#f59e0b" font-weight="700">Party 1</text>
				<text x="330" y="85" text-anchor="middle" font-family="monospace" font-size="12" fill="#f59e0b">x_1</text>

				<text x="440" y="75" text-anchor="middle" font-family="monospace" font-size="16" fill="var(--color-text)">=</text>

				<rect x="480" y="40" width="210" height="60" rx="0" fill="#10b98120" stroke="#10b981" stroke-width="3" />
				<text x="585" y="65" text-anchor="middle" font-family="monospace" font-size="11" fill="#10b981" font-weight="700">Private Key</text>
				<text x="585" y="85" text-anchor="middle" font-family="monospace" font-size="12" fill="#10b981">x = x_0 + x_1</text>

				<!-- Delta arrow -->
				<rect x="280" y="120" width="160" height="40" rx="0" fill="#ef444420" stroke="#ef4444" stroke-width="2" />
				<text x="360" y="145" text-anchor="middle" font-family="monospace" font-size="11" fill="#ef4444" font-weight="700">random delta</text>

				<line x1="280" y1="140" x2="100" y2="140" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arrow-red)" />
				<text x="180" y="135" text-anchor="middle" font-family="monospace" font-size="9" fill="#ef4444">+ delta</text>

				<line x1="440" y1="140" x2="580" y2="140" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arrow-red)" />
				<text x="520" y="135" text-anchor="middle" font-family="monospace" font-size="9" fill="#ef4444">- delta</text>

				<!-- After refresh -->
				<text x="180" y="190" text-anchor="middle" font-family="monospace" font-size="12" fill="var(--color-text)" font-weight="800">AFTER REFRESH</text>

				<rect x="30" y="205" width="140" height="60" rx="0" fill="#6366f120" stroke="#6366f1" stroke-width="3" />
				<text x="100" y="230" text-anchor="middle" font-family="monospace" font-size="11" fill="#6366f1" font-weight="700">Party 0</text>
				<text x="100" y="250" text-anchor="middle" font-family="monospace" font-size="12" fill="#6366f1">x_0' = x_0 + delta</text>

				<text x="220" y="240" text-anchor="middle" font-family="monospace" font-size="16" fill="var(--color-text)">+</text>

				<rect x="260" y="205" width="140" height="60" rx="0" fill="#f59e0b20" stroke="#f59e0b" stroke-width="3" />
				<text x="330" y="230" text-anchor="middle" font-family="monospace" font-size="11" fill="#f59e0b" font-weight="700">Party 1</text>
				<text x="330" y="250" text-anchor="middle" font-family="monospace" font-size="12" fill="#f59e0b">x_1' = x_1 - delta</text>

				<text x="440" y="240" text-anchor="middle" font-family="monospace" font-size="16" fill="var(--color-text)">=</text>

				<rect x="480" y="205" width="210" height="60" rx="0" fill="#10b98120" stroke="#10b981" stroke-width="3" />
				<text x="585" y="230" text-anchor="middle" font-family="monospace" font-size="11" fill="#10b981" font-weight="700">Same Private Key</text>
				<text x="585" y="250" text-anchor="middle" font-family="monospace" font-size="12" fill="#10b981">x = x_0' + x_1' (unchanged)</text>
			</svg>
			<div class="diagram-callout callout-success">
				<i class="fat fa-shield-check"></i>
				Old shares are invalidated. Any previously leaked or backed-up share values become useless after refresh.
			</div>
		</div>
	</section>

	<!-- ============================================ -->
	<!-- SECTION: Key Share Lifecycle -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">05</span> Key Share Lifecycle</h2>

		<div class="lifecycle-grid">
			{#each lifecycle as step, i}
				<div class="lifecycle-card">
					<div class="lifecycle-number">{i + 1}</div>
					<div class="lifecycle-icon"><i class="fat {step.icon}"></i></div>
					<h3 class="lifecycle-op">{step.op}</h3>
					<p class="lifecycle-detail">{step.detail}</p>
					<div class="lifecycle-prop">
						<i class="fat fa-shield-halved"></i> {step.prop}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- ============================================ -->
	<!-- SECTION: Access Structure -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">06</span> Access Structure</h2>
		<p class="section-desc">Boolean trees encode authorization policies for backup recovery. Combines AND, OR, and THRESHOLD gates.</p>

		<div class="diagram-container">
			<svg viewBox="0 0 720 320" class="flow-diagram" aria-label="Access Structure Tree">
				<!-- Root: AND gate -->
				<rect x="280" y="20" width="160" height="50" rx="0" fill="#6366f1" stroke="#6366f1" stroke-width="3" />
				<text x="360" y="50" text-anchor="middle" font-family="monospace" font-size="14" fill="white" font-weight="800">AND</text>

				<!-- Lines from AND to children -->
				<line x1="330" y1="70" x2="150" y2="120" stroke="var(--color-text)" stroke-width="2" />
				<line x1="390" y1="70" x2="550" y2="120" stroke="var(--color-text)" stroke-width="2" />

				<!-- Left child: LEAF (Device Owner) -->
				<rect x="50" y="120" width="200" height="60" rx="0" fill="#ef444420" stroke="#ef4444" stroke-width="3" />
				<text x="150" y="147" text-anchor="middle" font-family="monospace" font-size="11" fill="#ef4444" font-weight="700">LEAF: Device Owner</text>
				<text x="150" y="167" text-anchor="middle" font-family="monospace" font-size="10" fill="#ef4444">(REQUIRED)</text>

				<!-- Right child: THRESHOLD 2/3 -->
				<rect x="450" y="120" width="200" height="60" rx="0" fill="#f59e0b" stroke="#f59e0b" stroke-width="3" />
				<text x="550" y="147" text-anchor="middle" font-family="monospace" font-size="11" fill="white" font-weight="700">THRESHOLD</text>
				<text x="550" y="167" text-anchor="middle" font-family="monospace" font-size="12" fill="white" font-weight="800">2 of 3</text>

				<!-- Lines from THRESHOLD to leaves -->
				<line x1="490" y1="180" x2="380" y2="230" stroke="var(--color-text)" stroke-width="2" />
				<line x1="550" y1="180" x2="550" y2="230" stroke="var(--color-text)" stroke-width="2" />
				<line x1="610" y1="180" x2="680" y2="230" stroke="var(--color-text)" stroke-width="2" />

				<!-- Threshold leaves -->
				<rect x="290" y="230" width="180" height="50" rx="0" fill="#10b98120" stroke="#10b981" stroke-width="2" />
				<text x="380" y="260" text-anchor="middle" font-family="monospace" font-size="10" fill="#10b981" font-weight="700">Recovery Contact #1</text>

				<rect x="490" y="230" width="120" height="50" rx="0" fill="#10b98120" stroke="#10b981" stroke-width="2" />
				<text x="550" y="260" text-anchor="middle" font-family="monospace" font-size="10" fill="#10b981" font-weight="700">Contact #2</text>

				<rect x="630" y="230" width="80" height="50" rx="0" fill="#10b98120" stroke="#10b981" stroke-width="2" />
				<text x="670" y="260" text-anchor="middle" font-family="monospace" font-size="10" fill="#10b981" font-weight="700">#3</text>

				<!-- Example label -->
				<rect x="30" y="290" width="660" height="25" rx="0" fill="var(--color-bg-secondary)" stroke="var(--color-border)" stroke-width="1" />
				<text x="360" y="308" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--color-text-muted)">To restore: Device Owner (required) AND any 2 of 3 recovery contacts</text>
			</svg>
		</div>

		<div class="code-block">
			<div class="code-label">Access Structure Definition</div>
			<pre><code>AND
  LEAF p0        // Device owner -- always required
  THRESHOLD 2/3  // 2 of 3 recovery contacts
    LEAF p1      // Recovery contact #1
    LEAF p2      // Recovery contact #2
    LEAF p3      // Recovery contact #3</code></pre>
		</div>
	</section>

	<!-- ============================================ -->
	<!-- SECTION: iOS App Screens -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">07</span> iOS App -- Key Management</h2>
		<p class="section-desc">ARM64 iOS implementation with Secure Enclave integration. See <a href="https://github.com/tankbottoms/cb-mpc" target="_blank" rel="noopener">iOS ARM64 branches</a> for source.</p>

		<div class="phone-grid">
			<!-- Screen 1: Key Generation -->
			<div class="phone-mockup">
				<div class="phone-notch"></div>
				<div class="phone-screen">
					<div class="phone-status-bar">
						<span>9:41</span>
						<span><i class="fat fa-signal"></i> <i class="fat fa-wifi"></i> <i class="fat fa-battery-full"></i></span>
					</div>
					<div class="phone-header">Key Share Generation</div>
					<div class="phone-content">
						<div class="phone-card">
							<div class="phone-card-label">STATUS</div>
							<div class="phone-status-badge status-ok">GENERATED</div>
						</div>
						<div class="phone-info-box">
							<p>Your private key is split into shares. This device holds one share. A server holds another.</p>
						</div>
						<div class="phone-params">
							<div class="phone-param-row">
								<span class="param-label">Protocol</span>
								<span class="param-value">ECDSA-2PC KeyGen</span>
							</div>
							<div class="phone-param-row">
								<span class="param-label">Curve</span>
								<span class="param-value">secp256k1</span>
							</div>
							<div class="phone-param-row">
								<span class="param-label">Counterparty</span>
								<span class="param-value">Server</span>
							</div>
							<div class="phone-param-row">
								<span class="param-label">Storage</span>
								<span class="param-value">Secure Enclave</span>
							</div>
						</div>
						<div class="phone-key-display">
							<span class="key-label">Public Key Q</span>
							<span class="key-value">04a1b2c3...f8e9d0</span>
						</div>
					</div>
					<div class="phone-nav-bar">
						<span class="nav-item active"><i class="fat fa-key"></i> Keys</span>
						<span class="nav-item"><i class="fat fa-signature"></i> Sign</span>
						<span class="nav-item"><i class="fat fa-cloud-arrow-up"></i> Backup</span>
						<span class="nav-item"><i class="fat fa-gear"></i> Settings</span>
					</div>
				</div>
			</div>

			<!-- Screen 2: Signing -->
			<div class="phone-mockup">
				<div class="phone-notch"></div>
				<div class="phone-screen">
					<div class="phone-status-bar">
						<span>9:41</span>
						<span><i class="fat fa-signal"></i> <i class="fat fa-wifi"></i> <i class="fat fa-battery-full"></i></span>
					</div>
					<div class="phone-header">Transaction Signing</div>
					<div class="phone-content">
						<div class="phone-card">
							<div class="phone-card-label">BIOMETRIC AUTH</div>
							<div class="phone-status-badge status-ok">VERIFIED</div>
						</div>
						<div class="phone-progress">
							<div class="progress-step done">
								<span class="step-num">1/3</span>
								<span class="step-label">Nonce commitment</span>
								<i class="fat fa-circle-check"></i>
							</div>
							<div class="progress-step done">
								<span class="step-num">2/3</span>
								<span class="step-label">Partial signature</span>
								<i class="fat fa-circle-check"></i>
							</div>
							<div class="progress-step active">
								<span class="step-num">3/3</span>
								<span class="step-label">Signature assembly</span>
								<i class="fat fa-spinner fa-spin"></i>
							</div>
						</div>
						<div class="phone-info-box phone-info-small">
							<p>Neither party sees the full private key during signing.</p>
						</div>
						<div class="phone-key-display">
							<span class="key-label">Output</span>
							<span class="key-value">DER-encoded ECDSA sig</span>
						</div>
					</div>
					<div class="phone-nav-bar">
						<span class="nav-item"><i class="fat fa-key"></i> Keys</span>
						<span class="nav-item active"><i class="fat fa-signature"></i> Sign</span>
						<span class="nav-item"><i class="fat fa-cloud-arrow-up"></i> Backup</span>
						<span class="nav-item"><i class="fat fa-gear"></i> Settings</span>
					</div>
				</div>
			</div>

			<!-- Screen 3: Backup -->
			<div class="phone-mockup">
				<div class="phone-notch"></div>
				<div class="phone-screen">
					<div class="phone-status-bar">
						<span>9:41</span>
						<span><i class="fat fa-signal"></i> <i class="fat fa-wifi"></i> <i class="fat fa-battery-full"></i></span>
					</div>
					<div class="phone-header">Backup to USB-C</div>
					<div class="phone-content">
						<div class="phone-card">
							<div class="phone-card-label">BACKUP METHOD</div>
							<div class="phone-status-badge status-info">USB-C DRIVE</div>
						</div>
						<div class="phone-file-list">
							<div class="file-row">
								<span class="file-icon"><i class="fat fa-lock"></i></span>
								<span class="file-name">encrypted_share.pve</span>
								<span class="file-tag tag-pve">PVE</span>
							</div>
							<div class="file-row">
								<span class="file-icon"><i class="fat fa-key"></i></span>
								<span class="file-name">public_key.json</span>
								<span class="file-tag tag-pub">PUB</span>
							</div>
							<div class="file-row">
								<span class="file-icon"><i class="fat fa-sitemap"></i></span>
								<span class="file-name">access_structure.json</span>
								<span class="file-tag tag-pub">PUB</span>
							</div>
							<div class="file-row">
								<span class="file-icon"><i class="fat fa-certificate"></i></span>
								<span class="file-name">verification_proof.bin</span>
								<span class="file-tag tag-pub">PUB</span>
							</div>
							<div class="file-row">
								<span class="file-icon"><i class="fat fa-file-lines"></i></span>
								<span class="file-name">metadata.json</span>
								<span class="file-tag tag-pub">PUB</span>
							</div>
						</div>
						<div class="phone-info-box phone-info-small">
							<p>Only the encrypted share is private. All other files are publicly verifiable.</p>
						</div>
					</div>
					<div class="phone-nav-bar">
						<span class="nav-item"><i class="fat fa-key"></i> Keys</span>
						<span class="nav-item"><i class="fat fa-signature"></i> Sign</span>
						<span class="nav-item active"><i class="fat fa-cloud-arrow-up"></i> Backup</span>
						<span class="nav-item"><i class="fat fa-gear"></i> Settings</span>
					</div>
				</div>
			</div>

			<!-- Screen 4: Restore -->
			<div class="phone-mockup">
				<div class="phone-notch"></div>
				<div class="phone-screen">
					<div class="phone-status-bar">
						<span>9:41</span>
						<span><i class="fat fa-signal"></i> <i class="fat fa-wifi"></i> <i class="fat fa-battery-full"></i></span>
					</div>
					<div class="phone-header">Restore from Backup</div>
					<div class="phone-content">
						<div class="phone-card">
							<div class="phone-card-label">QUORUM STATUS</div>
							<div class="phone-status-badge status-ok">VERIFIED (3/3)</div>
						</div>
						<div class="phone-verify-list">
							<div class="verify-row">
								<span class="verify-label">x_i matches original</span>
								<span class="verify-status ok"><i class="fat fa-circle-check"></i> OK</span>
							</div>
							<div class="verify-row">
								<span class="verify-label">Q_i = x_i * G matches</span>
								<span class="verify-status ok"><i class="fat fa-circle-check"></i> OK</span>
							</div>
							<div class="verify-row">
								<span class="verify-label">Public key Q unchanged</span>
								<span class="verify-status ok"><i class="fat fa-circle-check"></i> OK</span>
							</div>
						</div>
						<div class="phone-key-display">
							<span class="key-label">Restored Public Key Q</span>
							<span class="key-value">04a1b2c3...f8e9d0</span>
						</div>
						<button class="phone-btn phone-btn-success">Key Share Restored</button>
					</div>
					<div class="phone-nav-bar">
						<span class="nav-item"><i class="fat fa-key"></i> Keys</span>
						<span class="nav-item"><i class="fat fa-signature"></i> Sign</span>
						<span class="nav-item active"><i class="fat fa-cloud-arrow-up"></i> Backup</span>
						<span class="nav-item"><i class="fat fa-gear"></i> Settings</span>
					</div>
				</div>
			</div>

			<!-- Screen 5: Key Refresh -->
			<div class="phone-mockup">
				<div class="phone-notch"></div>
				<div class="phone-screen">
					<div class="phone-status-bar">
						<span>9:41</span>
						<span><i class="fat fa-signal"></i> <i class="fat fa-wifi"></i> <i class="fat fa-battery-full"></i></span>
					</div>
					<div class="phone-header">Key Refresh</div>
					<div class="phone-content">
						<div class="phone-card">
							<div class="phone-card-label">REFRESH STATUS</div>
							<div class="phone-status-badge status-ok">COMPLETE</div>
						</div>
						<div class="phone-params">
							<div class="phone-param-row">
								<span class="param-label">Public Key Q</span>
								<span class="param-value param-ok">(unchanged)</span>
							</div>
							<div class="phone-param-row">
								<span class="param-label">Share x_0</span>
								<span class="param-value param-new">(new value)</span>
							</div>
							<div class="phone-param-row">
								<span class="param-label">Last Refresh</span>
								<span class="param-value">Mar 9, 2026 09:41</span>
							</div>
							<div class="phone-param-row">
								<span class="param-label">Refresh Count</span>
								<span class="param-value">3</span>
							</div>
						</div>
						<div class="phone-info-box phone-info-small">
							<p>After refresh, any previously leaked or backed-up shares become useless.</p>
						</div>
						<button class="phone-btn phone-btn-warning">Refresh Again</button>
					</div>
					<div class="phone-nav-bar">
						<span class="nav-item"><i class="fat fa-key"></i> Keys</span>
						<span class="nav-item"><i class="fat fa-signature"></i> Sign</span>
						<span class="nav-item"><i class="fat fa-cloud-arrow-up"></i> Backup</span>
						<span class="nav-item active"><i class="fat fa-gear"></i> Settings</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ============================================ -->
	<!-- SECTION: Demo Modules -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">08</span> Demo Modules</h2>

		<div class="demo-grid">
			<button class="demo-card" class:active={activeDemo === 'primitives'} onclick={() => toggleDemo('primitives')}>
				<span class="demo-num">2.1</span>
				<span class="demo-title">Basic Primitives</span>
				<span class="demo-lang">C++</span>
			</button>
			<button class="demo-card" class:active={activeDemo === 'zkp-cpp'} onclick={() => toggleDemo('zkp-cpp')}>
				<span class="demo-num">2.2</span>
				<span class="demo-title">Zero-Knowledge Proof</span>
				<span class="demo-lang">C++</span>
			</button>
			<button class="demo-card" class:active={activeDemo === 'agree'} onclick={() => toggleDemo('agree')}>
				<span class="demo-num">2.3</span>
				<span class="demo-title">Agree Random</span>
				<span class="demo-lang">Go</span>
			</button>
			<button class="demo-card" class:active={activeDemo === 'ecdsa2pc'} onclick={() => toggleDemo('ecdsa2pc')}>
				<span class="demo-num">2.4</span>
				<span class="demo-title">ECDSA 2-Party</span>
				<span class="demo-lang">Go</span>
			</button>
			<button class="demo-card" class:active={activeDemo === 'ecdsabackup'} onclick={() => toggleDemo('ecdsabackup')}>
				<span class="demo-num">2.5</span>
				<span class="demo-title">ECDSA MPC + Backup</span>
				<span class="demo-lang">Go</span>
			</button>
			<button class="demo-card" class:active={activeDemo === 'access'} onclick={() => toggleDemo('access')}>
				<span class="demo-num">2.7</span>
				<span class="demo-title">Access Structure</span>
				<span class="demo-lang">Go</span>
			</button>
		</div>

		{#if activeDemo === 'primitives'}
			<div class="demo-detail">
				<h3>Basic Primitives</h3>
				<p>Hash functions (<code>hash_string()</code>, <code>hash_number()</code>, <code>hash_curve()</code>) and commitments (<code>com()</code>). Commitments are the building block of every MPC protocol -- they allow a party to commit to a value without revealing it, then reveal it later with proof of consistency.</p>
			</div>
		{:else if activeDemo === 'zkp-cpp'}
			<div class="demo-detail">
				<h3>Zero-Knowledge Proof</h3>
				<p>Fischlin's transform with 16 parallel repetitions for a non-interactive proof. Output is 2315 bytes. Proves knowledge of a discrete logarithm without revealing the value itself.</p>
			</div>
		{:else if activeDemo === 'agree'}
			<div class="demo-detail">
				<h3>Agree Random</h3>
				<p>Two parties generate random values that neither can bias. Uses commitment exchanges to ensure fairness -- both parties commit before either reveals, preventing the second party from choosing a value that influences the output.</p>
			</div>
		{:else if activeDemo === 'ecdsa2pc'}
			<div class="demo-detail">
				<h3>ECDSA 2-Party Computation</h3>
				<p>Full workflow: KeyGen &#x2192; Sign #1 &#x2192; Refresh &#x2192; Sign #2. Each party gets a key share (x_i), both compute the same public key Q, and the full private key x = x_0 + x_1 is never materialized. After refresh, both parties hold new shares but the public key stays the same.</p>
			</div>
		{:else if activeDemo === 'ecdsabackup'}
			<div class="demo-detail">
				<h3>ECDSA MPC with Backup</h3>
				<p>4-Party DKG &#x2192; PVE Backup &#x2192; Verify Backups &#x2192; Restore &#x2192; Sign. Uses an access structure requiring party 0 AND any 2 of &#123;p1, p2, p3&#125;. Backup uses PVE (Publicly Verifiable Encryption) with RSA-OAEP KEM. Partial decryptions must be routed to the correct party only.</p>
			</div>
		{:else if activeDemo === 'access'}
			<div class="demo-detail">
				<h3>Access Structure</h3>
				<p>Boolean trees encode authorization policies: <code>(Admin OR HR) AND (2 of 3 signers)</code>. Combines AND, OR, and THRESHOLD gates to express complex quorum requirements for key recovery.</p>
			</div>
		{/if}
	</section>

	<!-- ============================================ -->
	<!-- SECTION: Security Guidelines -->
	<!-- ============================================ -->
	<section class="section">
		<h2 class="section-title"><span class="section-label">09</span> Security Guidelines</h2>

		<div class="security-grid">
			{#each securityRules as rule, i}
				<div class="security-card">
					<div class="security-num">{i + 1}</div>
					<div class="security-content">
						<h4 class="security-rule">{rule.rule}</h4>
						<p class="security-why">{rule.why}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Footer -->
	<div class="guide-footer">
		<div class="guide-footer-links">
			<a href="https://github.com/tankbottoms/cb-mpc" target="_blank" rel="noopener"><i class="fat fa-code-branch"></i> tankbottoms/cb-mpc</a>
			<a href="https://github.com/coinbase/cb-mpc" target="_blank" rel="noopener"><i class="fat fa-cube"></i> coinbase/cb-mpc</a>
			<a href="{base}/20260309-cb-mpc-key-management"><i class="fat fa-arrow-left"></i> Back to blog post</a>
		</div>
	</div>
</div>

<style>
	.guide {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	.guide-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.guide-nav a {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		transition: color 0.2s;
	}

	.guide-nav a:hover {
		color: var(--color-text);
	}

	.guide-title {
		font-family: var(--font-mono);
		font-size: 2.4rem;
		font-weight: 900;
		text-transform: uppercase;
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
		letter-spacing: -0.02em;
		border-bottom: 3px solid var(--color-text);
		padding-bottom: 0.75rem;
	}

	.guide-subtitle {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--color-text-muted);
		margin: 0 0 0.5rem 0;
	}

	.guide-source {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0 0 2rem 0;
	}

	.guide-source a {
		color: #6366f1;
		text-decoration: none;
	}

	.guide-source a:hover {
		text-decoration: underline;
	}

	/* Sections */
	.section {
		margin-bottom: 3rem;
	}

	.section-title {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 800;
		text-transform: uppercase;
		margin: 0 0 0.75rem 0;
		display: inline-block;
		background: var(--color-text);
		color: var(--color-bg);
		padding: 0.4rem 0.8rem;
	}

	.section-label {
		opacity: 0.5;
		margin-right: 0.5rem;
	}

	.section-desc {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 0 0 1.5rem 0;
		line-height: 1.6;
	}

	.section-desc a {
		color: #6366f1;
		text-decoration: none;
	}

	.section-desc a:hover {
		text-decoration: underline;
	}

	/* Protocol Grid */
	.protocol-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}

	.protocol-card {
		border: 3px solid var(--card-color);
		padding: 1rem;
		background: color-mix(in srgb, var(--card-color) 5%, var(--color-bg));
		transition: transform 0.15s, box-shadow 0.15s;
	}

	.protocol-card:hover {
		transform: translateY(-2px);
		box-shadow: 5px 5px 0px var(--color-shadow);
	}

	.protocol-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.protocol-name {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--color-text);
	}

	.protocol-parties {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 800;
		text-transform: uppercase;
		padding: 0.15rem 0.5rem;
		border: 2px solid var(--card-color);
		color: var(--card-color);
		letter-spacing: 0.05em;
	}

	.protocol-purpose {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* Diagrams */
	.diagram-container {
		margin: 1.5rem 0;
	}

	.flow-diagram {
		width: 100%;
		height: auto;
		border: 3px solid var(--color-border);
		background: var(--color-bg);
		padding: 0.5rem;
	}

	.diagram-callout {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		padding: 0.75rem 1rem;
		margin-top: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		line-height: 1.5;
	}

	.callout-danger {
		border-left: 4px solid #ef4444;
		background: #ef444410;
		color: var(--color-text);
	}

	.callout-info {
		border-left: 4px solid #3b82f6;
		background: #3b82f610;
		color: var(--color-text);
	}

	.callout-success {
		border-left: 4px solid #22c55e;
		background: #22c55e10;
		color: var(--color-text);
	}

	.callout-warning {
		border-left: 4px solid #f97316;
		background: #f9731610;
		color: var(--color-text);
	}

	/* Lifecycle Grid */
	.lifecycle-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}

	.lifecycle-card {
		border: 3px solid var(--color-border);
		padding: 1.25rem;
		position: relative;
		transition: transform 0.15s, box-shadow 0.15s;
	}

	.lifecycle-card:hover {
		transform: translateY(-2px);
		box-shadow: 5px 5px 0px var(--color-shadow);
	}

	.lifecycle-number {
		position: absolute;
		top: -0.7rem;
		left: 0.75rem;
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 800;
		background: var(--color-bg);
		padding: 0 0.4rem;
		color: var(--color-text-muted);
	}

	.lifecycle-icon {
		font-size: 1.5rem;
		color: #6366f1;
		margin-bottom: 0.5rem;
	}

	.lifecycle-op {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		font-weight: 800;
		text-transform: uppercase;
		margin: 0 0 0.4rem 0;
		color: var(--color-text);
	}

	.lifecycle-detail {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-text-muted);
		margin: 0 0 0.75rem 0;
		line-height: 1.5;
	}

	.lifecycle-prop {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: #10b981;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		border-top: 1px solid var(--color-border);
		padding-top: 0.5rem;
	}

	/* Code block */
	.code-block {
		border: 3px solid var(--color-border);
		margin: 1rem 0;
	}

	.code-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		background: var(--color-text);
		color: var(--color-bg);
		padding: 0.3rem 0.75rem;
	}

	.code-block pre {
		margin: 0;
		padding: 1rem;
		overflow-x: auto;
	}

	.code-block code {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		line-height: 1.6;
		color: var(--color-text);
	}

	/* Phone Mockups */
	.phone-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.5rem;
		justify-items: center;
	}

	.phone-mockup {
		width: 280px;
		border: 3px solid var(--color-text);
		border-radius: 24px;
		overflow: hidden;
		background: var(--color-bg);
		box-shadow: 5px 5px 0px var(--color-shadow);
		position: relative;
	}

	.phone-notch {
		width: 100px;
		height: 24px;
		background: var(--color-text);
		border-radius: 0 0 12px 12px;
		margin: 0 auto;
	}

	.phone-screen {
		min-height: 480px;
		display: flex;
		flex-direction: column;
	}

	.phone-status-bar {
		display: flex;
		justify-content: space-between;
		padding: 0.25rem 1rem;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--color-text-muted);
	}

	.phone-header {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 800;
		text-transform: uppercase;
		text-align: center;
		padding: 0.5rem;
		border-bottom: 2px solid var(--color-border);
		color: var(--color-text);
	}

	.phone-content {
		flex: 1;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.phone-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.6rem;
		border: 2px solid var(--color-border);
	}

	.phone-card-label {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--color-text-muted);
		letter-spacing: 0.05em;
	}

	.phone-status-badge {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		font-weight: 800;
		padding: 0.15rem 0.5rem;
		border: 2px solid;
	}

	.status-ok {
		border-color: #10b981;
		color: #10b981;
		background: #10b98110;
	}

	.status-info {
		border-color: #3b82f6;
		color: #3b82f6;
		background: #3b82f610;
	}

	.phone-info-box {
		border-left: 3px solid #6366f1;
		padding: 0.5rem 0.6rem;
		background: #6366f108;
	}

	.phone-info-box p {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.5;
	}

	.phone-info-small {
		padding: 0.35rem 0.5rem;
	}

	.phone-info-small p {
		font-size: 0.6rem;
	}

	.phone-params {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 2px solid var(--color-border);
	}

	.phone-param-row {
		display: flex;
		justify-content: space-between;
		padding: 0.35rem 0.6rem;
		border-bottom: 1px solid var(--color-border);
	}

	.phone-param-row:last-child {
		border-bottom: none;
	}

	.param-label {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--color-text-muted);
	}

	.param-value {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.param-ok {
		color: #10b981;
	}

	.param-new {
		color: #f59e0b;
	}

	.phone-key-display {
		border: 2px solid #6366f1;
		padding: 0.5rem 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		background: #6366f108;
	}

	.key-label {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		font-weight: 800;
		text-transform: uppercase;
		color: #6366f1;
		letter-spacing: 0.05em;
	}

	.key-value {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-text);
		word-break: break-all;
	}

	.phone-nav-bar {
		display: flex;
		justify-content: space-around;
		padding: 0.5rem 0;
		border-top: 2px solid var(--color-border);
		margin-top: auto;
	}

	.nav-item {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		color: var(--color-text-muted);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}

	.nav-item i {
		font-size: 0.85rem;
	}

	.nav-item.active {
		color: #6366f1;
		border-bottom: 3px solid #6366f1;
		padding-bottom: 0.15rem;
	}

	/* Phone progress steps */
	.phone-progress {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 2px solid var(--color-border);
	}

	.progress-step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.6rem;
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font-mono);
		font-size: 0.65rem;
	}

	.progress-step:last-child {
		border-bottom: none;
	}

	.step-num {
		font-weight: 800;
		min-width: 2rem;
		color: var(--color-text-muted);
	}

	.step-label {
		flex: 1;
		color: var(--color-text);
	}

	.progress-step.done {
		color: #10b981;
	}

	.progress-step.done .step-label {
		color: #10b981;
	}

	.progress-step.active {
		color: #f59e0b;
	}

	.progress-step.active .step-label {
		color: #f59e0b;
		font-weight: 700;
	}

	/* File list */
	.phone-file-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 2px solid var(--color-border);
	}

	.file-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font-mono);
		font-size: 0.6rem;
	}

	.file-row:last-child {
		border-bottom: none;
	}

	.file-icon {
		color: var(--color-text-muted);
		font-size: 0.7rem;
		width: 1rem;
		text-align: center;
	}

	.file-name {
		flex: 1;
		color: var(--color-text);
	}

	.file-tag {
		font-size: 0.5rem;
		font-weight: 800;
		padding: 0.1rem 0.3rem;
		border: 1px solid;
	}

	.tag-pve {
		border-color: #ef4444;
		color: #ef4444;
		background: #ef444410;
	}

	.tag-pub {
		border-color: #3b82f6;
		color: #3b82f6;
		background: #3b82f610;
	}

	/* Verify list */
	.phone-verify-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 2px solid var(--color-border);
	}

	.verify-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 0.6rem;
		border-bottom: 1px solid var(--color-border);
	}

	.verify-row:last-child {
		border-bottom: none;
	}

	.verify-label {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--color-text);
	}

	.verify-status {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.verify-status.ok {
		color: #10b981;
	}

	/* Phone buttons */
	.phone-btn {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		padding: 0.5rem;
		border: 3px solid;
		cursor: default;
		text-align: center;
		letter-spacing: 0.05em;
	}

	.phone-btn-success {
		border-color: #10b981;
		background: #10b981;
		color: white;
	}

	.phone-btn-warning {
		border-color: #f59e0b;
		background: #f59e0b;
		color: white;
	}

	/* Demo modules */
	.demo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.demo-card {
		border: 3px solid var(--color-border);
		padding: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
		background: var(--color-bg);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: left;
	}

	.demo-card:hover {
		border-color: #6366f1;
		transform: translateY(-2px);
		box-shadow: 5px 5px 0px var(--color-shadow);
	}

	.demo-card.active {
		border-color: #6366f1;
		background: #6366f110;
	}

	.demo-num {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-text-muted);
		font-weight: 800;
	}

	.demo-title {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.demo-lang {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		color: #6366f1;
		font-weight: 800;
		text-transform: uppercase;
	}

	.demo-detail {
		border: 3px solid #6366f1;
		border-top: none;
		padding: 1rem;
		background: #6366f108;
	}

	.demo-detail h3 {
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 800;
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
	}

	.demo-detail p {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.6;
	}

	.demo-detail code {
		background: var(--color-bg-secondary);
		padding: 0.1rem 0.3rem;
		border: 1px solid var(--color-border);
		font-size: 0.75rem;
	}

	/* Security Grid */
	.security-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 0.75rem;
	}

	.security-card {
		border: 3px solid var(--color-border);
		padding: 1rem;
		display: flex;
		gap: 0.75rem;
		transition: transform 0.15s, box-shadow 0.15s;
	}

	.security-card:hover {
		transform: translateY(-2px);
		box-shadow: 5px 5px 0px var(--color-shadow);
	}

	.security-num {
		font-family: var(--font-mono);
		font-size: 1.2rem;
		font-weight: 900;
		color: #ef4444;
		min-width: 1.5rem;
	}

	.security-content {
		flex: 1;
	}

	.security-rule {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 800;
		margin: 0 0 0.3rem 0;
		color: var(--color-text);
	}

	.security-why {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* Footer */
	.guide-footer {
		border-top: 3px solid var(--color-text);
		padding-top: 1.5rem;
		margin-top: 2rem;
	}

	.guide-footer-links {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.guide-footer-links a {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		transition: color 0.2s;
	}

	.guide-footer-links a:hover {
		color: #6366f1;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.guide {
			padding: 1rem 0;
		}

		.guide-title {
			font-size: 1.5rem;
		}

		.section-title {
			font-size: 1.1rem;
		}

		.phone-grid {
			grid-template-columns: 1fr;
		}

		.protocol-grid,
		.lifecycle-grid,
		.security-grid {
			grid-template-columns: 1fr;
		}

		.flow-diagram {
			overflow-x: auto;
		}
	}
</style>
