use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
    #[allow(dead_code)]
    pub database_url: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        let port = env::var("PORT")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(8080);
        let database_url = env::var("DATABASE_URL").ok();
        Ok(Config { port, database_url })
    }
}
