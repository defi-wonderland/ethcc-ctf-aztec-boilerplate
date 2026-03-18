mod test;

use aztec::macros::aztec;

#[aztec]
pub contract EasyFlagCapture {
    use flag_emitter::FlagEmitter;

    use aztec::{
        macros::{functions::{external, initializer}, storage::storage},
        protocol::address::AztecAddress,
        state_vars::PublicImmutable,
    };

    #[storage]
    struct Storage<Context> {
        flag_emitter: PublicImmutable<AztecAddress, Context>,
    }

    #[external("public")]
    #[initializer]
    fn constructor(flag_emitter: AztecAddress) {
        self.storage.flag_emitter.initialize(flag_emitter);
    }

    #[external("private")]
    fn capture_flag() {
        let solver = self.msg_sender();
        self.enqueue(FlagEmitter::at(self.storage.flag_emitter.read()).emit_flag(solver));
    }
}
