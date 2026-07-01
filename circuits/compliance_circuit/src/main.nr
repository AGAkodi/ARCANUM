// Compliance / sanctions check.
//
// Proves the recipient is NOT on the sanctions list without revealing
// the recipient. The list itself is public (its hashes are published by
// the compliance authority); only the recipient hash stays private.
global LIST_SIZE: u32 = 10;

fn main(recipient_hash: Field, sanctions_list: pub [Field; LIST_SIZE]) {
    for i in 0..LIST_SIZE {
        assert(recipient_hash != sanctions_list[i]);
    }
}

#[test]
fn test_clean_recipient_passes() {
    let list = [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010];
    main(42, list);
}

#[test(should_fail)]
fn test_sanctioned_recipient_fails() {
    let list = [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010];
    main(1005, list);
}
