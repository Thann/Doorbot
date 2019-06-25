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
    balance INTEGER, -- #TODO: wtf
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
-- Transition to bitwise permissions
UPDATE users SET admin = 0x7fffffff WHERE admin > 0;
UPDATE users SET admin = 0xffffffff WHERE id = 1 AND admin > 0;

-- doors => services
CREATE TABLE services (
    id INTEGER PRIMARY KEY,
    type VARCHAR(255),
    name VARCHAR(255) UNIQUE,
    token VARCHAR(255) UNIQUE,
    deleted_at DATETIME
);
INSERT INTO services
  SELECT id, 'door', name, token, NULL
  FROM doors;

-- entry_logs => service_logs
CREATE TABLE service_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    service_id INTEGER,
    note VARCHAR(255),
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(service_id) REFERENCES services(id)
);
DROP INDEX idx_user_entries;
DROP INDEX idx_door_entries;
CREATE INDEX idx_user_logs on service_logs(user_id);
CREATE INDEX idx_service_logs on service_logs(service_id);
INSERT INTO service_logs
  SELECT id, user_id, door_id, method, time
  FROM entry_logs;
DROP TABLE entry_logs;

-- permissions
ALTER TABLE permissions RENAME TO temp_permissions;
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    service_id INTEGER,
    expiration DATETIME,
    creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    constraints VARCHAR(255),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(service_id) REFERENCES services(id),
    UNIQUE(user_id, service_id)
);
INSERT INTO permissions
  SELECT id, user_id, door_id, expiration, creation, constraints
  FROM temp_permissions;
DROP TABLE temp_permissions;

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

-- services => doors
INSERT INTO doors
  SELECT id, name, token
  FROM services;

-- service_logs => entry_logs
CREATE TABLE entry_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    door_id INTEGER,
    method VARCHAR(255),
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(door_id) REFERENCES doors(id)
);
DROP INDEX idx_user_logs;
DROP INDEX idx_service_logs;
CREATE INDEX idx_user_entries on entry_logs(user_id);
CREATE INDEX idx_door_entries on entry_logs(door_id);
INSERT INTO entry_logs
  SELECT id, user_id, service_id, note, time
  FROM service_logs;

ALTER TABLE permissions RENAME TO temp_permissions;
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    door_id INTEGER,
    expiration DATETIME,
    creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    constraints VARCHAR(255),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(door_id) REFERENCES doors(id),
    UNIQUE(user_id, door_id)
);
INSERT INTO permissions
  SELECT id, user_id, service_id, expiration, creation, constraints
  FROM temp_permissions;

DROP TABLE service_logs;
DROP TABLE temp_permissions;
DROP TABLE services;
DROP TABLE transactions;
