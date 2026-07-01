// Amount range proof.
//
// Proves the payment amount is at least min_amount and does not exceed
// the sender's balance. Neither the amount nor the balance is revealed;
// only min_amount (the policy floor, normally 1) is public.
fn main(amount: u64, balance: u64, min_amount: pub u64) {
    assert(amount >= min_amount);
    assert(amount <= balance);
}

#[test]
fn test_valid_amount_passes() {
    main(5000, 10000, 1);
}

#[test(should_fail)]
fn test_amount_exceeding_balance_fails() {
    main(15000, 10000, 1);
}

#[test(should_fail)]
fn test_zero_amount_fails() {
    main(0, 10000, 1);
}
