'use client';

// Dev harness: exercises all three Noir circuits in the browser without the
// Freighter wallet gate. Not linked from the UI — visit /zk-test directly.
import { useState } from 'react';

interface CircuitRun {
  name: string;
  status: 'idle' | 'proving' | 'verified' | 'failed';
  detail?: string;
  ms?: number;
}

export default function ZkTestPage() {
  const [runs, setRuns] = useState<CircuitRun[]>([
    { name: 'compliance_circuit', status: 'idle' },
    { name: 'amount_circuit', status: 'idle' },
    { name: 'solvency_circuit', status: 'idle' },
    { name: 'compliance_circuit (sanctioned — must fail)', status: 'idle' },
  ]);

  const update = (i: number, patch: Partial<CircuitRun>) =>
    setRuns((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const runAll = async () => {
    const { generateProof, verifyProofLocally, hashToField } = await import('../../lib/zkProver');
    const [compliance, amount, solvency] = await Promise.all([
      import('../../circuits/compliance_circuit.json'),
      import('../../circuits/amount_circuit.json'),
      import('../../circuits/solvency_circuit.json'),
    ]);

    const sanctioned = await hashToField('GBOFAC_SANCTIONED_ADDRESS_TEST_1234567890');
    const clean = await hashToField('GCLEANADDRESSEXAMPLE');
    const list = [sanctioned, ...Array.from({ length: 9 }, (_, i) => `${0xdead0000 + i}`)];

    const cases: { circuit: object; inputs: Record<string, unknown>; mustFail?: boolean }[] = [
      { circuit: compliance.default, inputs: { recipient_hash: clean, sanctions_list: list } },
      { circuit: amount.default, inputs: { amount: '50000000', balance: '100000000', min_amount: '1' } },
      { circuit: solvency.default, inputs: { total_assets: '1000000', total_liabilities: '250000' } },
      { circuit: compliance.default, inputs: { recipient_hash: sanctioned, sanctions_list: list }, mustFail: true },
    ];

    for (let i = 0; i < cases.length; i++) {
      const { circuit, inputs, mustFail } = cases[i];
      update(i, { status: 'proving' });
      const t0 = performance.now();
      try {
        const proof = await generateProof(circuit as never, inputs as never);
        const ok = await verifyProofLocally(circuit as never, proof);
        // Expose results for e2e checks (browser proof -> on-chain verify)
        const w = window as unknown as { __zkResults?: Record<string, unknown> };
        w.__zkResults = { ...w.__zkResults, [`case${i}`]: proof };
        const ms = Math.round(performance.now() - t0);
        if (mustFail) {
          update(i, { status: 'failed', detail: 'Expected constraint failure but proof succeeded', ms });
        } else {
          update(i, {
            status: ok ? 'verified' : 'failed',
            detail: `proof ${proof.proof.length} bytes, ${proof.publicInputs.length} public inputs, vk ${proof.vkHash.slice(0, 18)}…, verify=${ok}`,
            ms,
          });
        }
      } catch (err) {
        const ms = Math.round(performance.now() - t0);
        update(
          i,
          mustFail
            ? { status: 'verified', detail: 'Constraint failed as expected (sanctioned address rejected)', ms }
            : { status: 'failed', detail: String(err), ms }
        );
      }
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#eee', background: '#111', minHeight: '100vh' }}>
      <h1>ZK circuit browser test</h1>
      <button data-testid="run-all" onClick={runAll} style={{ padding: '8px 16px', margin: '1rem 0' }}>
        Run all circuits
      </button>
      <ul>
        {runs.map((r, i) => (
          <li key={i} data-status={r.status} style={{ margin: '0.5rem 0' }}>
            [{r.status}] {r.name} {r.ms !== undefined ? `(${r.ms}ms)` : ''} — {r.detail || ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
