![Hackatime Badge](https://hackatime-badge.hackclub.com/U0857UWECTS/chat_app)

# Chat App

This is a simple chat app that uses websockets, and a postgreSQL database.
The purpose of this project is to allow me to independantly learn how to use websockets and postgres.

## Live Demo

Want to see a live demo? Head on over to [chat.nawab-as.software](https://chat.nawab-as.software)



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

1.  Create a postgreSQL database that is either local or cloud hosted


2.  Run ```setup.sql``` on the database through pgadmin, dbeaver, psql, etc to setup tables, functions and procedures


3. Create a ```.env``` file in the root directory that constains the following.

	> WARNING: The actual valus of the ```.env``` file should never be shared with anyone otherwise it could lead to a security breach
```
SESSION_KEY="<insert your session secret>"
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


## Screenshots

These are some sample screenshots

### Login page
![Login Page](https://hc-cdn.hel1.your-objectstorage.com/s/v3/1ed11d60b380c89bec9b70f72da5c4b8e767cefb_login.png)

### Signup page
![Signup Page](https://hc-cdn.hel1.your-objectstorage.com/s/v3/cd12d5232e41216707b1ddf893f6da61e66ba190_signup.png)

### Chat page
![Chat Page](https://hc-cdn.hel1.your-objectstorage.com/s/v3/453cdc995680335d34c103bbec927ad6163418b5_chat.png)

### Add friend menu
![Add Friend Menu](https://hc-cdn.hel1.your-objectstorage.com/s/v3/3e644f90b3271432da73cfe572585aea479ddd9f_addfriend.png)



## Questions or Concerns

For any questions or concerns please email me at nawab-as@hackclub.app
