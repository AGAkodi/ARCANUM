fn main(age: u64, min_age: pub u64) {
    assert(age >= min_age);
}

#[test]
fn test_main() {
    main(1, 2);

    // Uncomment to make test fail
    // main(1, 1);
}
