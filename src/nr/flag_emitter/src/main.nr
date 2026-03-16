use aztec::macros::aztec;

#[aztec]
pub contract FlagEmitter {
    use aztec::{
        macros::{events::event, functions::{external, initializer, view}, storage::storage},
        protocol::{address::AztecAddress, traits::Packable},
        state_vars::{Map, PublicImmutable, PublicMutable},
    };

    use compressed_string::FieldCompressedString;
    use std::meta::derive;

    #[derive(Eq, Packable)]
    struct FlagMetadata {
        allowlisted: bool,
        challenge_name: FieldCompressedString,
    }

    #[storage]
    struct Storage<Context> {
        owner: PublicImmutable<AztecAddress, Context>,
        challenges: Map<AztecAddress, PublicImmutable<FlagMetadata, Context>, Context>,
        captured: Map<AztecAddress, Map<AztecAddress, PublicMutable<bool, Context>, Context>, Context>,
    }

    #[event]
    struct FlagCaptured {
        challenge: AztecAddress,
        solver: AztecAddress,
        challenge_name: FieldCompressedString,
    }

    #[external("public")]
    #[initializer]
    fn constructor(owner: AztecAddress) {
        self.storage.owner.initialize(owner);
    }

    #[external("public")]
    fn set_challenge(challenge: AztecAddress, challenge_name: FieldCompressedString) {
        assert(self.msg_sender() == self.storage.owner.read(), "not owner");
        self.storage.challenges.at(challenge).initialize(
            FlagMetadata { allowlisted: true, challenge_name: challenge_name },
        );
    }

    #[external("public")]
    fn emit_flag(solver: AztecAddress) {
        let challenge = self.msg_sender();

        let challenge_data = self.storage.challenges.at(challenge).read();
        assert(challenge_data.allowlisted, "caller is not allowlisted");
        assert(!self.storage.captured.at(challenge).at(solver).read(), "already captured");

        self.storage.captured.at(challenge).at(solver).write(true);

        self.emit(FlagCaptured { challenge, solver, challenge_name: challenge_data.challenge_name });
    }

    #[external("public")]
    #[view]
    fn get_challenge_name(challenge: AztecAddress) -> FieldCompressedString {
        self.storage.challenges.at(challenge).read().challenge_name
    }

    #[external("public")]
    #[view]
    fn is_allowlisted(challenge: AztecAddress) -> bool {
        self.storage.challenges.at(challenge).read().allowlisted
    }

    #[external("public")]
    #[view]
    fn is_captured(challenge: AztecAddress, solver: AztecAddress) -> bool {
        self.storage.captured.at(challenge).at(solver).read()
    }
}
