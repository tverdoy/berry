mod repository;

use berry_contract_domain::models::song::Song;
use near_sdk::AccountId;

pub(crate) use repository::RepositoryImpl;

pub(crate) trait Repository {
    // Return the number of songs
    fn count(&self) -> u64;
    // Add a song to the system
    fn add(&mut self, song: Song);

    fn get_by_author(&self, author: AccountId) -> Vec<Song>;

    fn get_recently_added(&self) -> Vec<Song>;
}
