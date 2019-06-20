-- UP
ALTER TABLE users RENAME TO temp_users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(255) COLLATE NOCASE,
    pw_salt VARCHAR(255),
    password_hash VARCHAR(255),
    admin INTEGER DEFAULT 0, -- bitfield
    keycode INTEGER UNIQUE,
    session_cookie VARCHAR(255) UNIQUE,
    session_created DATETIME,
    email VARCHAR(255) UNIQUE COLLATE NOCASE,
    balance INTEGER,
    -- oauth_id VARCHAR(255),
    -- oauth_token VARCHAR(255),
    -- oauth_domain VARCHAR(255),
    created_by INTEGER REFERENCES id,
    deleted_at DATETIME
);
CREATE UNIQUE INDEX idx_usernames on users (username)
    WHERE deleted_at IS NULL;

INSERT INTO users
SELECT
	id, username, pw_salt, password_hash, admin, keycode,
	session_cookie, session_created, NULL, 0,
	-- NULL, NULL, NULL,
	1, NULL
FROM temp_users;

DROP TABLE temp_users;
UPDATE users SET admin = 0x7fffffff WHERE admin > 0;
UPDATE users SET admin = 0xffffffff WHERE id = 1 AND admin > 0;

CREATE UNIQUE INDEX idx_door_tokens on doors (token);

CREATE TABLE transactions (
	id INTEGER PRIMARY KEY,
	user_to INTEGER REFERENCES users(id),
	user_from INTEGER REFERENCES users(id),
	note VARCHAR(255) NULL,
	amount INTEGER,
	created_at DATETIME
);


-- DOWN
ALTER TABLE users RENAME TO temp_users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    pw_salt VARCHAR(255),
    password_hash VARCHAR(255),
    admin BOOLEAN DEFAULT 0,
    keycode INTEGER UNIQUE,
    session_cookie VARCHAR(255) UNIQUE,
    session_created DATETIME
);

INSERT INTO users
SELECT
	id, username, pw_salt, password_hash, admin, keycode,
	session_cookie, session_created
FROM temp_users WHERE deleted_at IS NULL;

DROP TABLE temp_users;

DROP INDEX idx_door_tokens;

DROP TABLE transactions;
