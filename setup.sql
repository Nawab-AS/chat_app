-- delete all previous data (if exists)
DROP SCHEMA IF EXISTS chat CASCADE;

-- (Re)Create the schema template
CREATE SCHEMA chat;

-- create types
CREATE TYPE chat.USER_TYPES AS ENUM('admin', 'user', 'moderator');

-- create tables
CREATE TABLE chat.USERS (
	user_id				SERIAL			NOT NULL	PRIMARY KEY,
	username			VARCHAR(32)		NOT NULL	UNIQUE,
	password			VARCHAR(32)		NOT NULL,
	user_created_at		TIMESTAMP		NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	user_type			chat.USER_TYPES	NOT NULL	DEFAULT 'user',
	account_locked		BOOLEAN			NOT NULL	DEFAULT False
);

CREATE TABLE chat.MESSAGES (
	message_id		SERIAL			NOT NULL	PRIMARY KEY,
	message_text	varchar(1000)	NOT NULL,
	sent_at			TIMESTAMP		NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	sender_id		INT				NOT NULL	REFERENCES chat.USERS(USER_ID),
	recever_id		INT				NOT NULL	REFERENCES chat.USERS(USER_ID)
);

CREATE TABLE chat.FRIENDS (
-- friend requests are initiated by friend1
	friend1				INT			NOT NULL	REFERENCES chat.USERS(USER_ID),
	friend2				INT			NOT NULL	REFERENCES chat.USERS(USER_ID),
	request_accepted	BOOLEAN		NOT NULL	DEFAULT FALSE
);


-- user procedures


-- SELECT * FROM chat.AUTHENTICATE('<username>', '<password>')
CREATE FUNCTION chat.AUTHENTICATE(p_username VARCHAR, p_password VARCHAR)
RETURNS VARCHAR(32)
LANGUAGE plpgsql
AS $$
DECLARE
		v_stored_password VARCHAR(32);
	is_locked BOOLEAN;
BEGIN
		SELECT u.password, u.account_locked INTO v_stored_password, is_locked
		FROM chat.USERS u
		WHERE username = p_username;

		IF FOUND AND v_stored_password = p_password THEN
				RETURN CASE 
			WHEN is_locked THEN 'locked'
			ELSE 'success' END;
		ELSE
				RETURN 'denied';
		END IF;
END;
$$;


-- CALL chat.ADD_USER('<username>', '<password>')
CREATE PROCEDURE chat.ADD_USER (p_username VARCHAR, p_password VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
	INSERT INTO chat.USERS (username, password)
		VALUES (p_username, p_password);
END;
$$;


-- CALL chat.DEL_USER(<user_id>)
CREATE OR REPLACE PROCEDURE chat.DEL_USER (p_username VARCHAR, p_password VARCHAR)
LANGUAGE plpgsql
AS $$
DECLARE
	p_user_id INT;
BEGIN
	SELECT user_id FROM chat.USERS INTO p_user_id;
	IF (NOT chat.AUTHENTICATE(p_username, p_password)) THEN
		RAISE EXCEPTION 'Could not authenticate';
		RETURN;
	END IF;
		DELETE FROM chat.MESSAGES WHERE (sender_id = p_user_id OR recever_id = p_user_id);
	DELETE FROM chat.FRIENDS WHERE (friend1 = p_user_id OR friend2 = p_user_id);
	DELETE FROM chat.USERS WHERE (user_id = p_user_id);
END;
$$;


-- SELECT * FROM chat.USERDATA( <user_id> )
CREATE FUNCTION chat.USERDATA (p_user_id INT)
RETURNS TABLE (
	user_id				INT,
	username			VARCHAR(32),
	user_created_at		TIMESTAMP,
	user_type			chat.USER_TYPES
)
LANGUAGE plpgsql
AS $$
BEGIN
		RETURN QUERY
	SELECT u.user_id, u.username, u.user_created_at, u.user_type FROM chat.USERS u
		WHERE u.user_id = p_user_id;
END;
$$;

-- message procedures

-- CALL chat.NEW_MESSAGE('<message_text>', sender_id, recever_id)
CREATE PROCEDURE chat.ADD_MESSAGE (p_message_text VARCHAR, p_sender_id INT, p_recever_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	INSERT INTO chat.MESSAGES (message_text, sender_id, recever_id)
		VALUES (p_message_text, p_sender_id, p_recever_id);
END;
$$;


-- CALL chat.DEL_MESSAGE(<message_id>, <sender_id>)
CREATE PROCEDURE chat.DEL_MESSAGE (p_message_id INT, p_user_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	DELETE FROM chat.MESSAGES
		WHERE (sender_id = p_user_id AND message_id = p_message_id);
END;
$$;


-- SELECT * FROM chat.GET_MESSAGES
CREATE FUNCTION chat.GET_MESSAGES (p_user_id INT, p_user_id2 INT, p_message_count INT)
RETURNS SETOF chat.MESSAGES
LANGUAGE plpgsql
AS $$
BEGIN
	RETURN QUERY
	SELECT * FROM chat.MESSAGES m
		WHERE ( (m.sender_id = p_user_id AND m.recever_id = p_user_id2) OR
					(m.sender_id = p_user_id2 AND m.recever_id = p_user_id) )
		ORDER BY m.sent_at DESC LIMIT 50 OFFSET (p_message_count * 50);
END;
$$;


-- SELECT * FROM chat.NUM_MESSAGES(<user_id>, <user_id2>)
CREATE FUNCTION chat.NUM_MESSAGES (p_user_id INT, p_user_id2 INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
		p_message_count INT;
BEGIN
	SELECT count(*) INTO p_message_count FROM chat.MESSAGES m
		WHERE ( (m.sender_id = p_user_id AND m.recever_id = p_user_id2) OR
					(m.sender_id = p_user_id2 AND m.recever_id = p_user_id) );
	RETURN p_message_count;
END;
$$;



-- friend procedures

-- CALL chat.ADD_FRIEND(<friend1_id>, <friend2_id>)
CREATE PROCEDURE chat.ADD_FRIEND (p_friend1_id INT, p_friend2_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	PERFORM * FROM chat.FRIENDS 
	WHERE (friend1 = p_friend1_id AND friend2 = p_friend2_id) OR
		(friend2 = p_friend1_id AND friend1 = p_friend2_id);

	IF FOUND THEN
		RETURN;
	END IF;

	INSERT INTO chat.FRIENDS (friend1, friend2)
		VALUES (p_friend1_id, p_friend2_id);
END;
$$;


-- CALL chat.DEL_FRIEND(<friend1_id>, <friend2_id>)
CREATE PROCEDURE chat.DEL_FRIEND (p_friend1_id INT, p_friend2_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	DELETE FROM chat.FRIENDS
	WHERE (friend1 = p_friend1_id AND friend2 = p_friend2_id) OR
		(friend2 = p_friend1_id AND friend1 = p_friend2_id);
END;
$$;


-- CALL chat.APPROVE_FRIEND(<friend1_id>, <friend2_id>)
CREATE PROCEDURE chat.APPROVE_FRIEND (p_friend1_id INT, p_friend2_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	UPDATE chat.FRIENDS SET request_accepted = True
	WHERE (friend1 = p_friend1_id AND friend2 = p_friend2_id) OR
		(friend2 = p_friend1_id AND friend1 = p_friend2_id);
END;
$$;


-- SELECT * FROM chat.GET_FRIEND_DATA(<user_id>)
CREATE FUNCTION chat.GET_FRIEND_DATA(p_user_id INT)
RETURNS TABLE (
		user_id             INT,
		username            VARCHAR(32),
		created_at          TIMESTAMP,
		request_accepted    BOOLEAN,
		initiated_by_me     BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
		RETURN QUERY
		SELECT u.user_id, u.username, u.user_created_at, f.request_accepted,
				CASE
						WHEN f.friend1 = p_user_id THEN TRUE
						ELSE FALSE
				END AS initiated_by_me
		FROM
				chat.USERS u
		JOIN
				chat.FRIENDS f ON (
						(u.user_id = f.friend2 AND f.friend1 = p_user_id) OR
						(u.user_id = f.friend1 AND f.friend2 = p_user_id)
				);
END;
$$;

