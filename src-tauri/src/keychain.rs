//! Operating-system credential storage for the admin session token.
//!
//! ## Why this exists in Rust rather than `localStorage`
//!
//! The API returns a bearer JWT in the login response body and runs CORS with
//! `credentials: false`, so there is no cookie to rely on — the client has to
//! hold the token itself. In a browser that would mean `localStorage`, which any
//! script on the origin can read.
//!
//! A Tauri app has a better option: the OS credential store (Keychain on macOS,
//! Credential Manager on Windows, Secret Service on Linux). The token is
//! encrypted at rest by the OS, scoped to this application, and never sits in
//! WebView-reachable storage. This is the one place where being a desktop app
//! buys real security, which is why the logic lives here instead of in TS.
//!
//! Tauri is NOT treated as a security boundary: the backend still authorises
//! every request from the bearer token. This only protects the token at rest.

use keyring::Entry;

/// Namespaced so a future second account or a token format change cannot
/// collide with an entry written by an older build.
const SERVICE: &str = "com.halabionline.admin";
const ACCOUNT: &str = "session.v1";

fn entry() -> Result<Entry, String> {
    Entry::new(SERVICE, ACCOUNT).map_err(|error| error.to_string())
}

/// Persists the session JSON. Overwrites any existing entry.
#[tauri::command]
pub fn store_session(session: String) -> Result<(), String> {
    entry()?
        .set_password(&session)
        .map_err(|error| error.to_string())
}

/// Reads the stored session, or `None` when nothing is stored.
///
/// A missing entry is the normal "signed out" case and must not surface as an
/// error, or first launch would look like a failure. Any other error — a locked
/// keychain, a denied prompt — is reported so the UI can say something true.
#[tauri::command]
pub fn load_session() -> Result<Option<String>, String> {
    match entry()?.get_password() {
        Ok(session) => Ok(Some(session)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

/// Removes the stored session. Deleting a non-existent entry succeeds, so that
/// signing out is idempotent and can never fail in a way that strands a user.
#[tauri::command]
pub fn clear_session() -> Result<(), String> {
    match entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}
