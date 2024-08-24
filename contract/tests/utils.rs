use near_workspaces::{Account, Contract};

pub async fn create_env() -> (Contract, Account) {
    let sandbox = near_workspaces::sandbox()
        .await
        .expect("Failed to create sandbox");
    let contract_wasm = near_workspaces::compile_project("./")
        .await
        .expect("Failed to compile project");
    let contract = sandbox
        .dev_deploy(&contract_wasm)
        .await
        .expect("Failed to deploy contract");
    let user_account = sandbox
        .dev_create_account()
        .await
        .expect("Failed to create account");

    (contract, user_account)
}
