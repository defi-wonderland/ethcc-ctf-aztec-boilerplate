use aztec::macros::aztec;

#[aztec]
pub contract FlagEmitter {
    use aztec::{
        macros::{events::event, functions::{external, initializer, view}, storage::storage},
        protocol::address::AztecAddress,
        state_vars::{Map, PublicImmutable, PublicMutable},
    };

    use compressed_string::FieldCompressedString;

    #[storage]
    struct Storage<Context> {
        owner: PublicImmutable<AztecAddress, Context>,
        whitelisted_challenges: Map<AztecAddress, PublicImmutable<bool, Context>, Context>,
        captured: Map<AztecAddress, Map<AztecAddress, PublicMutable<bool, Context>, Context>, Context>,
    }

    #[event]
    struct FlagCaptured {
        solver: AztecAddress,
        challenge_name: FieldCompressedString,
    }

    #[external("public")]
    #[initializer]
    fn constructor(owner: AztecAddress) {
        self.storage.owner.initialize(owner);
    }

    #[external("public")]
    fn set_challenge(challenge: AztecAddress) {
        assert(self.msg_sender() == self.storage.owner.read(), "not owner");
        self.storage.whitelisted_challenges.at(challenge).initialize(true);
    }

    #[external("public")]
    fn emit_flag(solver: AztecAddress, challenge_name: FieldCompressedString) {
        let challenge = self.msg_sender();
        assert(
            self.storage.whitelisted_challenges.at(challenge).read(),
            "caller is not whitelisted",
        );
        assert(!self.storage.captured.at(challenge).at(solver).read(), "already captured");
        self.storage.captured.at(challenge).at(solver).write(true);
        self.emit(FlagCaptured { solver, challenge_name });
    }

    #[external("public")]
    #[view]
    fn is_whitelisted(challenge: AztecAddress) -> bool {
        self.storage.whitelisted_challenges.at(challenge).read()
    }

    #[external("public")]
    #[view]
    fn is_captured(challenge: AztecAddress, solver: AztecAddress) -> bool {
        self.storage.captured.at(challenge).at(solver).read()
    }
}
