# Doorbot
Door opening server with user management AKA: "freesee"

Uses a raspberrypi and a solid-state relay to unlock the door

A node server running optionally elseware manages the users and serves the WebUI

# Setup
### Server
`npm install thann/doorbot`

CD into the folder then run the server: `./server`

Navigate to http://localhost:3000 and login with the username and password `admin`
Change your password then add users and doors.

### Door
Setup a raspberrypi with a solid state relay on the GPIO pins, then run:

`./door -k -p 3000 -t <TOKEN>`
