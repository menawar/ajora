#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    YieldAdapter,
    SponsorPool,
    CurrentPeriod,
    Period(u32),                 // period ID -> Period struct
    Tickets(Address, u32),       // User, Period -> i128
    Principal(Address, u32),     // User, Period -> i128
    Streak(Address),             // User -> u32
    Crew(Address),               // User -> u32
    CrewSavings(u32, u32),       // Crew ID, Period -> i128
    SpraysLeft(Address),         // User -> u32
    Multiplier(Address),         // User -> u32
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Period {
    pub id: u32,               // e.g., YYYYMMDD
    pub total_principal: i128,
    pub jara_pot: i128,        // bonus pool (yield + sponsor + rake)
    pub total_tickets: i128,
    pub resolved: bool,
    pub vrf_seed: u64,
}

// -----------------------------------------------------------------------------
// Traits
// -----------------------------------------------------------------------------

pub trait PotVaultTrait {
    fn contribute(env: Env, user: Address, amount: i128, token: Address) -> i128;
    fn claim_principal(env: Env, user: Address, period_id: u32) -> i128;
    fn claim_winnings(env: Env, user: Address, period_id: u32) -> i128;
    fn current_period(env: Env) -> u32;
    fn tickets_of(env: Env, user: Address, period_id: u32) -> i128;
    fn principal_of(env: Env, user: Address, period_id: u32) -> i128;
}

pub trait DrawManagerTrait {
    fn pick_number(env: Env, user: Address, number: u32);
    fn resolve_draw(env: Env, period_id: u32, prng_seed: u64);
    fn claim_prize(env: Env, user: Address, period_id: u32) -> i128;
    fn is_winner(env: Env, user: Address, period_id: u32) -> bool;
}

pub trait SprayFaucetTrait {
    fn fund_sponsor_pool(env: Env, sponsor: Address, amount: i128, campaign_id: u32);
    fn welcome_ticket(env: Env, user: Address);
    fn spray(env: Env, from: Address, to: Address);
    fn daily_sprays_left(env: Env, user: Address) -> u32;
}

pub trait CrewRegistryTrait {
    fn create_crew(env: Env, owner: Address, ref_code: u32) -> u32;
    fn join_crew(env: Env, member: Address, ref_code: u32) -> u32;
    fn vest_referral(env: Env, referred: Address);
    fn crew_of(env: Env, user: Address) -> u32;
    fn crew_savings(env: Env, crew_id: u32, period_id: u32) -> i128;
}

pub trait StreakSBTTrait {
    fn check_in(env: Env, user: Address);
    fn multiplier_of(env: Env, user: Address) -> u32;
    fn streak_of(env: Env, user: Address) -> u32;
}

pub trait YieldAdapterTrait {
    fn deposit(env: Env, amount: i128);
    fn withdraw(env: Env, amount: i128);
    fn harvest(env: Env, period_id: u32);
    fn total_deployed(env: Env) -> i128;
}

pub trait TreasuryTrait {
    fn collect_rake(env: Env, amount: i128, period_id: u32);
    fn sweep_unclaimed(env: Env, period_id: u32);
}

// -----------------------------------------------------------------------------
// Contract Implementation
// -----------------------------------------------------------------------------

#[contract]
pub struct AjoraContract;

#[contractimpl]
impl AjoraContract {
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::CurrentPeriod, &0u32);
    }
}

#[contractimpl]
impl PotVaultTrait for AjoraContract {
    fn contribute(env: Env, user: Address, amount: i128, _token: Address) -> i128 {
        user.require_auth();
        // TODO: Transfer USDC from user to contract
        // TODO: Apply streak multiplier
        let tickets_minted = amount; // simplified
        tickets_minted
    }

    fn claim_principal(env: Env, user: Address, period_id: u32) -> i128 {
        user.require_auth();
        // TODO: Transfer USDC back to user
        0
    }

    fn claim_winnings(env: Env, user: Address, period_id: u32) -> i128 {
        user.require_auth();
        // TODO: Transfer winnings back to user
        0
    }

    fn current_period(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::CurrentPeriod).unwrap_or(0)
    }

    fn tickets_of(env: Env, user: Address, period_id: u32) -> i128 {
        env.storage().persistent().get(&DataKey::Tickets(user, period_id)).unwrap_or(0)
    }

    fn principal_of(env: Env, user: Address, period_id: u32) -> i128 {
        env.storage().persistent().get(&DataKey::Principal(user, period_id)).unwrap_or(0)
    }
}

#[contractimpl]
impl DrawManagerTrait for AjoraContract {
    fn pick_number(env: Env, user: Address, _number: u32) {
        user.require_auth();
        // TODO: Record pick
    }

    fn resolve_draw(env: Env, _period_id: u32, _prng_seed: u64) {
        // TODO: Requires keeper auth, resolve period logic
    }

    fn claim_prize(env: Env, user: Address, _period_id: u32) -> i128 {
        user.require_auth();
        0
    }

    fn is_winner(_env: Env, _user: Address, _period_id: u32) -> bool {
        false
    }
}

#[contractimpl]
impl SprayFaucetTrait for AjoraContract {
    fn fund_sponsor_pool(env: Env, sponsor: Address, amount: i128, _campaign_id: u32) {
        sponsor.require_auth();
        // TODO: Add amount to SponsorPool
    }

    fn welcome_ticket(env: Env, _user: Address) {
        // TODO: Mint welcome ticket using sponsor pool
    }

    fn spray(env: Env, from: Address, to: Address) {
        from.require_auth();
        // TODO: Deduct daily spray quota, mint ticket for 'to'
    }

    fn daily_sprays_left(_env: Env, _user: Address) -> u32 {
        3 // Default
    }
}

#[contractimpl]
impl CrewRegistryTrait for AjoraContract {
    fn create_crew(env: Env, owner: Address, ref_code: u32) -> u32 {
        owner.require_auth();
        ref_code
    }

    fn join_crew(env: Env, member: Address, ref_code: u32) -> u32 {
        member.require_auth();
        ref_code
    }

    fn vest_referral(_env: Env, _referred: Address) {
        // TODO: Vest reward to referrer
    }

    fn crew_of(env: Env, user: Address) -> u32 {
        env.storage().persistent().get(&DataKey::Crew(user)).unwrap_or(0)
    }

    fn crew_savings(env: Env, crew_id: u32, period_id: u32) -> i128 {
        env.storage().persistent().get(&DataKey::CrewSavings(crew_id, period_id)).unwrap_or(0)
    }
}

#[contractimpl]
impl StreakSBTTrait for AjoraContract {
    fn check_in(env: Env, user: Address) {
        user.require_auth();
        // TODO: Update streak logic
    }

    fn multiplier_of(env: Env, user: Address) -> u32 {
        env.storage().persistent().get(&DataKey::Multiplier(user)).unwrap_or(1)
    }

    fn streak_of(env: Env, user: Address) -> u32 {
        env.storage().persistent().get(&DataKey::Streak(user)).unwrap_or(0)
    }
}

#[contractimpl]
impl YieldAdapterTrait for AjoraContract {
    fn deposit(_env: Env, _amount: i128) {
        // TODO: Interface with Stellar DeFi (e.g. Blend)
    }

    fn withdraw(_env: Env, _amount: i128) {
        // TODO: Interface with Stellar DeFi
    }

    fn harvest(_env: Env, _period_id: u32) {
        // TODO: Harvest yields into jara pot
    }

    fn total_deployed(_env: Env) -> i128 {
        0
    }
}

#[contractimpl]
impl TreasuryTrait for AjoraContract {
    fn collect_rake(_env: Env, _amount: i128, _period_id: u32) {
        // TODO: Transfer rake to treasury
    }

    fn sweep_unclaimed(_env: Env, _period_id: u32) {
        // TODO: Sweep unclaimed winnings after N days
    }
}


