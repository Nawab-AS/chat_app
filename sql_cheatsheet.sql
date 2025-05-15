-- create schema
CREATE SCHEMA IF NOT EXISTS MYFIRSTSCHEMA;

-- create table (SERIAL create a unique ID and does not need type)
USING MYFIRSTSCHEMA
CREATE TABLE IF NOT EXISTS MYFIRSTTABLE (
	USER_ID SERIAL NOT NULL PRIMARY KEY,
	USERNAME VARCHAR(32) NOT NULL,
	USER_CREATED_AT TIMESTAMP NOT NULL
);

-- add data (note: USER_ID is not required due to it being SERIAL)
INSERT INTO
	MYFIRSTTABLE(
		USERNAME,
		USER_CREATED_AT
	)
VALUES (
	'MrPotatoHead',
	CURRENT_TIMESTAMP
);

-- update data    WARNING: if you don't use WHERE, all rows will be updated
UPDATE MYFIRSTTABLE
SET
	USERNAME = 'Billy' 
WHERE
	USER_ID = 2;

-- get data
SELECT
	USER_ID,
	USERNAME,
	USER_CREATED_AT
FROM
	MYFIRSTTABLE;

/*
-- order data (if multiple rows returned) [desc is optional]
ORDER BY
	USER_CREATED_AT desc;

-- get specific data
WHERE
	USER_ID = 2;
*/

-- delete data    WARNING: if you don't use WHERE, all rows will be deleted
/*
DELETE FROM
	MYFIRSTTABLE
WHERE
	USER_ID=2;
*/

-- delete table (scary)
/*
DROP TABLE MYFIRSTTABLE;
*/

-- delete all rows of a table (less scary)
/*
TRUNCATE TABLE MYFIRSTTABLE;
*/

-- create custom data types
CREATE TYPE MESSAGES AS (
	messageId SERIAL NOT NULL,
	messageText varchar(1000) NOT NULL,
	sentAt TIMESTAMP NOT NULL,
	sender_id INT NOT NULL,
	recever_id INT NOT NULL
);
/*
-- example usage
INSERT INTO
	MESSAGES(
		MESSAGE
	)
VALUES (
	('text', CURRENT_TIMESTAMP, 1, 3)
);
*/
