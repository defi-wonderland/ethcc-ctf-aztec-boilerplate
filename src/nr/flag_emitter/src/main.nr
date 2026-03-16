use aztec::macros::aztec;

#[aztec]
pub contract FlagEmitter {
    use aztec::{
        macros::{functions::{external, view}, storage::storage},
        protocol::address::AztecAddress,
        state_vars::{Map, PublicMutable},
    };

    #[storage]
    struct Storage<Context> {
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
