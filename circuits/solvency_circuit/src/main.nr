// Solvency proof.
//
// Proves total assets exceed total liabilities without revealing either
// side of the balance sheet. No public inputs — the proof itself is the
// attestation.
fn main(total_assets: u64, total_liabilities: u64) {
    assert(total_assets > total_liabilities);
}

#[test]
fn test_solvent_passes() {
    main(1000000, 250000);
}

#[test(should_fail)]
fn test_insolvent_fails() {
    main(250000, 1000000);
}
