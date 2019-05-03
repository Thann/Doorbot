# Portalbot
Whitelable friendly wifi-login portal forked from [doorbot](https://gitlab.com/thann/doorbot)

`docker-compose up -d`

Navigate to http://localhost:3000 and login with the username and password `admin`
Change your password then add users.
When creating a user they are given a random password, that you should email them.

**Alternativly**, if you don't want to use docker, from the cloned repo run:

`npm install` then `./server --build`

### Doors
See the [doorbot](https://gitlab.com/thann/doorbot) docs on setting up the hardware.
Once the PI is setup and you have added a door in the WebUI,
copy the token then paste it into `docker-compose.yml` replacing "abc123",
and uncomment the "door" section.

Then re-run `sudo docker-compose up -d`
After refreshing the WebUI, you should see the "Open" button appear for the door.

**Alternativly**, if you don't want to use docker, from the cloned repo run:

`./door -k -s <SERVER_IP> -t <TOKEN>` and use the `--dummy` flag when not on a PI.

