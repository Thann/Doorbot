# Doorbot
Door-opening server with user management AKA: "freesee"

Uses a raspberrypi and a solid-state relay to unlock the door.
A node server running optionally elsewhere manages the users and serves the WebUI.

## Setup
### Hardware
All you need is a RasberryPi, a Relay, and a lock ([Amazon](http://a.co/jbvnTH0)).
[Install rasbian](https://www.raspberrypi.org/downloads/raspbian/)
then plugin the relay.
It's recommended to use a signal pin above 8, because they will default to Low,
and wont open the door on reboot.
[pin-layout](https://github.com/Thann/Doorbot/blob/master/docs/images/pins.png)

![raspberry-pi](https://github.com/Thann/Doorbot/raw/master/docs/images/raspi.jpg)

### Server
The server can be run on the PI or anywhere else. Docker images exist for ARM and x86.

The `docker-compose.yml` file has been configured for x86.
For other architectures, like on the raspberry pi, uncomment the proper **two** lines like:
`image: thann/doorbot:arm7`.

Then, from the cloned repo, run:

`docker-compose up -d`

Navigate to http://localhost:3000 and login with the username and password `admin`
Change your password then add users and doors.
When creating a user they are given a random password, that you should email them.

**Alternativly**, if you don't want to use docker, from the cloned repo run:

`npm install` then `./server --build`

### Door
Once you have added a door in the WebUI,
copy the token then paste it into `docker-compose.yml` replacing "abc123"

Then re-run `sudo docker-compose up -d`
After refreshing the WebUI, you should see the "Open" button appear for the door.

**Alternativly**, if you don't want to use docker, from the cloned repo run:

`./door -k -s <SERVER_IP> -t <TOKEN>` and use the `--dummy` flag when not on a PI.

