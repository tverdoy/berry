mod utils;

use berry_contract_domain::prelude::Song;
use near_sdk::Gas;
use serde_json::json;
use utils::create_env;

const ADD_SONG_GAS: Gas = Gas::from_tgas(3);

#[tokio::test]
async fn test_add_song() {
    let (contract, user_account) = create_env().await;

    let outcome = user_account
        .call(contract.id(), "add_song")
        .args_json(json!({"title": "Song Title"}))
        .transact()
        .await
        .expect("Failed to add song");

    assert!(outcome.is_success());
    assert!(outcome.total_gas_burnt < ADD_SONG_GAS);

    let result = contract
        .view("get_songs_by_author")
        .args_json(json!({"author": user_account.id()}))
        .await
        .expect("Failed to get songs");

    let songs: Vec<Song> = result.json().expect("Failed to decode result");
    assert_eq!(
        songs,
        vec![Song::new(
            user_account.id().clone(),
            "Song Title".to_string()
        )]
    );
}
