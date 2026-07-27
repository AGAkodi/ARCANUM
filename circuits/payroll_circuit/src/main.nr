// Private payroll proof.
//
// Proves an institution can run a full payroll without revealing any salary,
// any employee identity, or the pool balance:
//   1. the (hidden) salaries sum to no more than the pool can afford, and
//   2. every recipient is on the approved-employee list.
//
// Public inputs: only the approved-employee list (published, like the sanctions
// list in compliance_circuit) and min_balance_after, the floor the institution
// must keep after paying. Everything financial and personal stays private.
//
// Membership mirrors compliance_circuit's public-list approach for consistency
// and to stay within the pinned bb 0.87 proof format; a Merkle root over the
// approved set is the scale-up path once employee counts grow.
global N_EMP: u32 = 4;
global LIST_SIZE: u32 = 10;

fn main(
    salaries: [u64; N_EMP],
    employee_hashes: [Field; N_EMP],
    pool_balance: u64,
    approved_employees: pub [Field; LIST_SIZE],
    min_balance_after: pub u64,
) {
    // 1) the pool covers the whole run plus the required floor
    let mut total: u64 = 0;
    for i in 0..N_EMP {
        total += salaries[i];
    }
    assert(pool_balance >= total + min_balance_after);

    // 2) every recipient is on the approved-employee list
    for i in 0..N_EMP {
        let mut found: bool = false;
        for j in 0..LIST_SIZE {
            found = found | (employee_hashes[i] == approved_employees[j]);
        }
        assert(found);
    }
}

#[test]
fn test_valid_payroll_passes() {
    let approved = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    main([1000, 1500, 2000, 2500], [202, 205, 208, 210], 10000, approved, 1000);
}

#[test(should_fail)]
fn test_insufficient_balance_fails() {
    let approved = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    // total 7000 + floor 1000 = 8000 > balance 7500
    main([1000, 1500, 2000, 2500], [202, 205, 208, 210], 7500, approved, 1000);
}

#[test(should_fail)]
fn test_unapproved_employee_fails() {
    let approved = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    // 999 is not on the approved list
    main([1000, 1500, 2000, 2500], [202, 205, 208, 999], 10000, approved, 1000);
}
