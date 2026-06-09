# Loup Garou Full Stack

This repo now contains the old static role assigner plus a new full-stack setup:

- `server/`: Node.js, Express, MongoDB, and Socket.IO backend.
- `mobile/`: React Native / Expo app for players and narrator.

## Features

- Player profile with name and language.
- Profile editing for name, language, and avatar.
- Create a room or join an existing room by code.
- Room host chooses the role deck and the narrator.
- Narrator is excluded from random role assignment.
- Players get only their own role when the game starts.
- Narrator sees every role, follows the night wake order, marks players alive/dead, and opens day voting.
- Day voting lets alive players vote; the highest voted player dies, their role is revealed, then night starts again.
- Roles and app UI support English, French, and Arabic.
- Realtime room updates with Socket.IO.

## Backend Setup

```powershell
cd server
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Default backend URL:

```text
http://localhost:4000
```

The local `server/.env` can point to MongoDB Atlas or local MongoDB. The current file uses local MongoDB so the backend starts without Atlas auth problems.

If Atlas returns `bad auth`, the database user password is wrong. Reset the password in Atlas Database Access, then update `server/.env`. If Atlas returns an IP whitelist error, open MongoDB Atlas, go to Network Access, and allow your current IP address.

Local MongoDB fallback:

```text
mongodb://127.0.0.1:27017/loup_garou
```

Change `server/.env` if your MongoDB URL is different.

## Mobile Setup

Expo SDK 56 requires Node.js 22.13.x or newer. This machine already has Node.js 22.18.0.

```powershell
cd mobile
npm.cmd install
npm.cmd run start
```

The app default API URL is:

```text
http://10.0.2.2:4000/api
```

Use that for Android Emulator. For iOS simulator, use `http://localhost:4000/api`. For a real phone, replace it with your computer LAN IP, for example `http://192.168.1.20:4000/api`.

## Room Flow

1. Save a profile.
2. Create a room or join with the room code.
3. Host picks the narrator and adjusts role counts.
4. Host or narrator starts the game.
5. Players see their role card.
6. At night, the narrator sees the role to wake. Press once to wake that role, press again to move to the next role.
7. When all night roles are done, morning starts.
8. The narrator opens the vote; alive players vote.
9. The highest voted player dies, their role is revealed, and night starts again.
