![Hackatime Badge](https://hackatime-badge.hackclub.com/U0857UWECTS/text_share?aliases=chat_app)

# Chat App

This is a simple chat app that uses websockets, and a postgreSQL database.
The purpose of this project is to allow me to independantly learn how to use websockets and postgres.



## Installation 

1. Install this repository through git by
```
git clone https://github.com/Nawab-AS/chat_app.git
cd ./chat_app
```

2. install node modules by
```
npm i
```



## Usage

1.  Create a postgreSQL database


2.  Run ```setup.sql``` on the database through pgadmin, dbeaver, psql, etc to setup tables, functions and procedures


3. Create a ```.env``` file in the root directory that constains the following
```
SESSION_SECRET="<insert your session secret>"
DATABASE_URI="postgres://<username>:<password>@<host>:<port>/<database name>"
```

Optionaly, you can use cloudflare turnstiles (similar to captcha).
Simply create a site and secret [here](https://developers.cloudflare.com/turnstile/get-started/) and add the following to your ```.env``` file
```
CAPTCHA_SITE_KEY="<insert your site key>"
CAPTCHA_SECRET_KEY="<insert your secret key>"
```
Now captcha will be require during login and sign up.


4. Run the following command in terminal
```
npm run start
```

optionally you can also use the heroku cli as well with
```
heroku local
```



## Questions or Concerns

For any questions or concerns please email me at nawab-as@hackclub.app
