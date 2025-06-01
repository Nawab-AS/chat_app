-- delete al previous data
DROP SCHEMA IF EXISTS chat CASCADE;

-- (Re)Create the schema template
CREATE SCHEMA chat;

-- create tables
CREATE TABLE chat.USERS (
	user_id				SERIAL			NOT NULL	PRIMARY KEY,
	username			VARCHAR(32)		NOT NULL	UNIQUE,
	password			VARCHAR(32)		NOT NULL,
	user_created_at		TIMESTAMP		NOT NULL	DEFAULT CURRENT_TIMESTAMP
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


-- SELECT * FROM chat.AUTHENTICATE('<unsername>', '<password>')
CREATE FUNCTION chat.AUTHENTICATE(p_username VARCHAR, p_password VARCHAR)
RETURNS BOOL
LANGUAGE plpgsql
AS $$
DECLARE
    v_stored_password VARCHAR(32);
BEGIN
    SELECT password INTO v_stored_password
    FROM chat.USERS
    WHERE username = p_username;

    IF FOUND AND v_stored_password = p_password THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
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
CREATE PROCEDURE chat.DEL_USER (p_user_id INT, p_password VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM chat.USERS
    WHERE (user_id = p_user_id AND password = p_password);
END;
$$;


-- SELECT * FROM chat.USERDATA( <user_id> )
CREATE FUNCTION chat.USERDATA (p_user_id INT)
RETURNS TABLE (
	user_id				INT,
	username			VARCHAR(32),
	user_created_at		TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
	SELECT u.user_id, u.username, u.user_created_at FROM chat.USERS u
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


-- friend procedures

-- CALL chat.ADD_FRIEND(<friend1_id>, <friend2_id>)
CREATE PROCEDURE chat.ADD_FRIEND (p_friend1_id INT, p_friend2_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
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
	UPDATE
	chat.FRIENDS SET request_accepted = True
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

