# Self Protocol Integration Spike (Issue #86)

## Context
Currently, the Ajora `SprayFaucet` relies on an EOA Verifier to sign a payload confirming that the user is a unique human (using phone numbers within MiniPay). To mitigate the risk of the Verifier becoming a trusted central point of failure, we will integrate [Self Protocol](https://docs.selfprotocol.com) for decentralized proof-of-personhood.

## Proposed Attestation Flow

1. **Mini App Handshake**: 
   When a user clicks "Connect" inside the Ajora MiniPay app, the Ajora frontend queries the Self Protocol API to check if the user's wallet address has a valid Proof-of-Personhood (PoP) attestation.

2. **Self Protocol Redirection (If not verified)**:
   If no PoP is found, the user is temporarily redirected to the Self Protocol MiniPay flow to complete phone verification. Once verified, Self Protocol issues an on-chain or verifiable off-chain attestation for that address.

3. **Ajora Verifier Bridge (Backend)**:
   Instead of just signing blindly, the Ajora Verifier Service backend intercepts the `/verify` call. It takes the user's address, queries the Self Protocol registry (or decodes the user-provided attestation proof), and strictly verifies it against Self's public key.

4. **Faucet Unlocking (`setVerified`)**:
   Once the Verifier service confirms the Self PoP is valid, it issues the Ajora-specific signature required by `SprayFaucet.claimWelcomeTicket()`. In v6, this can be moved entirely on-chain by having `SprayFaucet` natively verify the Self Protocol attestation, eliminating the backend Verifier entirely.

## Onboarding Drop-off Measurement
We will track the drop-off rate by logging:
- `connect_clicked`
- `self_protocol_redirected`
- `self_protocol_success`
- `welcome_ticket_claimed`

If the drop-off between `redirected` and `success` exceeds 15% (Spec §17 Q7), we will need to reconsider the friction of the external attestation flow.
