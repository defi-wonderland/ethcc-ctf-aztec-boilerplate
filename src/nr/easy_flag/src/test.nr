use crate::EasyFlagCapture;
use flag_emitter::FlagEmitter;

use aztec::{protocol::address::AztecAddress, test::helpers::test_environment::TestEnvironment};

use compressed_string::FieldCompressedString;

unconstrained fn setup() -> (TestEnvironment, AztecAddress, AztecAddress, AztecAddress) {
    let mut env = TestEnvironment::new();

    let owner = env.create_light_account();
    let player = env.create_light_account();

    let flag_emitter_initializer = FlagEmitter::interface().constructor(owner);
    let flag_emitter_address = env.deploy("@flag_emitter/FlagEmitter").with_public_initializer(
        owner,
        flag_emitter_initializer,
    );
    let flag_emitter = FlagEmitter::at(flag_emitter_address);

    let challenge_initializer = EasyFlagCapture::interface().constructor(flag_emitter_address);
    let challenge_address =
        env.deploy("EasyFlagCapture").with_public_initializer(owner, challenge_initializer);

    env.call_public(
        owner,
        flag_emitter.set_challenge(
            challenge_address,
            FieldCompressedString::from_string("easy_flag0000000000000000000000"),
        ),
    );

    (env, challenge_address, flag_emitter_address, player)
}

#[test]
unconstrained fn capture_flag_marks_solver_as_captured() {
    let (env, challenge_address, flag_emitter_address, player) = setup();
    let challenge = EasyFlagCapture::at(challenge_address);
    let flag_emitter = FlagEmitter::at(flag_emitter_address);

    env.call_private(player, challenge.capture_flag());

    assert_eq(env.view_public(flag_emitter.is_captured(challenge_address, player)), true);
}
