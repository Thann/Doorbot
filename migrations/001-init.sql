-- UP
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    pw_salt VARCHAR(255),
    password_hash VARCHAR(255),
    admin BOOLEAN DEFAULT 0,
    session_cookie VARCHAR(255) UNIQUE,
    session_created DATETIME
);
INSERT into users (username, password_hash, admin) VALUES ('admin', 'admin', 1);

CREATE TABLE doors (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    token VARCHAR(255)
);

CREATE TABLE permissions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    door_id INTEGER,
    expiration DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(door_id) REFERENCES doors(id),
    UNIQUE(user_id, door_id)
);
CREATE UNIQUE INDEX idx_perms on permissions (user_id, door_id);

CREATE TABLE entry_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    door_id INTEGER,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(door_id) REFERENCES doors(id)
);

-- DOWN
DROP TABLE users;
DROP TABLE doors;
DROP TABLE permissions;
DROP TABLE entry_log;
