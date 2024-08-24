use crate::song::Repository;
use berry_contract_domain::models::prelude::Song;
use near_sdk::store::LookupMap;
use near_sdk::{env, near, AccountId};
use std::str::FromStr;

const MAX_RECENTLY_ADDED: usize = 10;

#[near(serializers = [borsh])]
pub(crate) struct RepositoryImpl {
    count: u64,
    map_by_author: LookupMap<AccountId, Vec<Song>>,
    recently_added: [Song; MAX_RECENTLY_ADDED],
}

impl RepositoryImpl {
    pub fn new() -> Self {
        // TODO: add fill songs with real data
        let default_recently_added: [Song; MAX_RECENTLY_ADDED] = [
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 1".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 2".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 3".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 4".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 5".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 6".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 7".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 8".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 9".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 10".to_string(),
            ),
        ];

        Self {
            count: 0,
            map_by_author: LookupMap::new(b"sba".to_vec()),
            recently_added: default_recently_added,
        }
    }
}

impl Repository for RepositoryImpl {
    fn count(&self) -> u64 {
        self.count
    }

    fn add(&mut self, song: Song) {
        let replace_index = (env::block_height() % MAX_RECENTLY_ADDED as u64) as usize;
        self.recently_added[replace_index] = song.clone();

        match self.map_by_author.get_mut(&song.author()) {
            Some(songs) => songs.push(song),
            None => {
                self.map_by_author.insert(song.author(), vec![song]);
            }
        }

        self.count += 1;
    }

    fn get_by_author(&self, author: AccountId) -> Vec<Song> {
        self.map_by_author
            .get(&author)
            .map(|songs| songs.to_vec())
            .unwrap_or_default()
    }

    fn get_recently_added(&self) -> Vec<Song> {
        self.recently_added.to_vec()
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_add_song() {
        let song = Song::new(
            AccountId::from_str("berry.testnet").unwrap(),
            "Song 1".to_string(),
        );

        let mut repo = RepositoryImpl::new();

        repo.add(song.clone());

        assert_eq!(repo.count(), 1);
        assert_eq!(
            repo.get_by_author(AccountId::from_str("berry.testnet").unwrap()),
            vec![song.clone()]
        );
        assert_eq!(repo.get_recently_added().len(), 10);
        assert!(repo.get_recently_added().contains(&song));
    }

    #[test]
    fn test_many_add_songs() {
        let songs = [
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 1".to_string(),
            ),
            Song::new(
                AccountId::from_str("berry.testnet").unwrap(),
                "Song 2".to_string(),
            ),
            Song::new(
                AccountId::from_str("artist.testnet").unwrap(),
                "Song 3".to_string(),
            ),
        ];

        let mut repo = RepositoryImpl::new();

        for song in songs.iter() {
            repo.add(song.clone());
        }

        assert_eq!(repo.count(), 3);
        assert_eq!(
            repo.get_by_author(AccountId::from_str("berry.testnet").unwrap()),
            vec![songs[0].clone(), songs[1].clone()]
        );
        assert_eq!(
            repo.get_by_author(AccountId::from_str("artist.testnet").unwrap()),
            vec![songs[2].clone()]
        );

        let mut is_found_in_recent = false;
        for song in songs.iter() {
            if repo.get_recently_added().contains(song) {
                is_found_in_recent = true;
                break;
            }
        }

        assert!(is_found_in_recent);
        assert_eq!(repo.get_recently_added().len(), 10);
    }
}
