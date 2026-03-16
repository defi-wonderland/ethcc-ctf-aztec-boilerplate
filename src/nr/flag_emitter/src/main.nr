use aztec::macros::aztec;

// NOTE: this contract is a simplified version of the deployed FlagEmitter contract
#[aztec]
pub contract FlagEmitter {
    use aztec::{
        macros::{functions::{external, view}, storage::storage},
        protocol::address::AztecAddress,
        state_vars::{Map, PublicImmutable, PublicMutable},
    };

    #[storage]
    struct Storage<Context> {
        // NOTE: keeping a similar storage layout to the original FlagEmitter contract (see #21633)
        owner: PublicImmutable<AztecAddress, Context>,
        challenges: Map<AztecAddress, PublicImmutable<Field, Context>, Context>,
        captured: Map<AztecAddress, Map<AztecAddress, PublicMutable<bool, Context>, Context>, Context>,
    }

    #[external("public")]
    fn emit_flag(solver: AztecAddress) {
        let challenge = self.msg_sender();
        self.storage.captured.at(challenge).at(solver).write(true);
    }

    #[external("public")]
    #[view]
    fn is_captured(challenge: AztecAddress, solver: AztecAddress) -> bool {
        self.storage.captured.at(challenge).at(solver).read()
    }
}
