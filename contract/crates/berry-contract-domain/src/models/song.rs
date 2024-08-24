use near_sdk::{near, AccountId};
use std::fmt::Display;

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub struct Song {
    author: AccountId,
    title: String,
}

impl Song {
    pub fn new(author: AccountId, title: String) -> Self {
        Self { author, title }
    }

    pub fn author(&self) -> AccountId {
        self.author.clone()
    }

    pub fn title(&self) -> String {
        self.title.clone()
    }
}

impl Display for Song {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "song {} - {}", self.title, self.author)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_song() {
        let song = Song::new(AccountId::from_str("alice").unwrap(), "song".to_string());
        assert_eq!(song.author().as_str(), "alice");
        assert_eq!(song.title(), "song");
    }
}
