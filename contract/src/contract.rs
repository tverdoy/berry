mod song;

use crate::song::Repository;
use berry_contract_domain::models::prelude::*;
use near_sdk::{env, log, near, AccountId};

#[near(contract_state)]
pub struct Contract {
    song_repo: song::RepositoryImpl,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            song_repo: song::RepositoryImpl::new(),
        }
    }
}

#[near]
impl Contract {
    pub fn count_songs(&self) -> u64 {
        self.song_repo.count()
    }

    pub fn add_song(&mut self, title: String) {
        let song = Song::new(env::signer_account_id(), title);
        self.song_repo.add(song.clone());
        log!("Song added: {}", song);
    }

    pub fn add_many_songs(&mut self, songs: Vec<Song>) {
        for song in songs {
            self.song_repo.add(song.clone());
            log!("Song added: {}", song);
        }
    }

    pub fn get_songs_by_author(&self, author: AccountId) -> Vec<Song> {
        self.song_repo.get_by_author(author)
    }

    pub fn get_recently_added_songs(&self) -> Vec<Song> {
        self.song_repo.get_recently_added()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, VMContext};
    use std::str::FromStr;

    fn get_context(signer_account_id: AccountId) -> VMContext {
        VMContextBuilder::new()
            .signer_account_id(signer_account_id)
            .build()
    }

    #[test]
    fn test_add_song() {
        let singer = AccountId::from_str("alice.near").unwrap();
        let mut contract = Contract::default();
        let context = get_context(singer.clone());
        testing_env!(context);

        contract.add_song("Song 1".to_string());

        assert_eq!(contract.count_songs(), 1);
        assert_eq!(
            contract.get_songs_by_author(singer.clone()),
            vec![Song::new(singer, "Song 1".to_string())]
        );
    }

    #[test]
    fn test_add_many_songs() {
        let singer = AccountId::from_str("alice.near").unwrap();
        let mut contract = Contract::default();
        let context = get_context(singer.clone());
        testing_env!(context);

        contract.add_many_songs(vec![
            Song::new(singer.clone(), "Song many 1".to_string()),
            Song::new(singer.clone(), "Song many 2".to_string()),
        ]);

        assert_eq!(contract.count_songs(), 2);
        assert_eq!(
            contract.get_songs_by_author(singer.clone()),
            vec![
                Song::new(singer.clone(), "Song many 1".to_string()),
                Song::new(singer.clone(), "Song many 2".to_string())
            ]
        );
    }

    #[test]
    fn test_get_songs_by_author() {
        let singer = AccountId::from_str("alice.near").unwrap();
        let mut contract = Contract::default();
        let context = get_context(singer.clone());
        testing_env!(context);

        contract.add_song("Song 1".to_string());
        contract.add_song("Song 2".to_string());

        assert_eq!(contract.count_songs(), 2);
        assert_eq!(
            contract.get_songs_by_author(singer.clone()),
            vec![
                Song::new(singer.clone(), "Song 1".to_string()),
                Song::new(singer.clone(), "Song 2".to_string())
            ]
        );
    }

    #[test]
    fn test_get_recently_added_songs() {
        let singer = AccountId::from_str("alice.near").unwrap();
        let mut contract = Contract::default();
        let context = get_context(singer.clone());
        testing_env!(context);

        contract.add_song("Song 1".to_string());
        contract.add_song("Song 2".to_string());

        assert_eq!(contract.get_recently_added_songs().len(), 10);
    }
}
