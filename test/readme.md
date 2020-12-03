Optional manual tests:


**client.js suite**

# Client closes audio stream automatically
* Use a voice command like !prooh while in a voice channel

# Client survives error 
* admin command: #error

# Client reconnects when disconnected
* disconnect connection


**app.js suite**

# Client backs up stuff after a crash
* admin command: #shutdown
* check for file:

# Client saves logs after a crash
* admin command: #shutdown
* check for file:


**actor.js suite**

# Client can send message
# Client can send image
# Client can play audio
# Client can find user
* admin command: #diagnostics
