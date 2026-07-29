# Firebase Spark Demo Setup

This is a temporary public demo configuration for one device: `snowberry-001`.

## 1. Create the project

1. Create a Firebase project on the Spark plan.
2. Add a Web app.
3. Create a Firestore database in production mode.
4. Open Firestore Database → Rules.
5. Replace the generated rules with `firebase/firestore.rules` and publish.

The published rules intentionally allow public access only to `devices/snowberry-001` and its subcollections. Do not use them after the demo.

## 2. Configure the web app

1. Copy `web-app/.env.example` to `web-app/.env.local`.
2. Copy the Firebase Web app values into the matching variables.
3. Keep `VITE_SNOWBERRY_DEVICE_ID=snowberry-001`.
4. Do not commit `.env.local`.

## 3. Seed the device

Create these Firestore documents manually using `firebase/seed.example.json` as the field reference:

- `devices/snowberry-001`
- `devices/snowberry-001/config/thresholds`
- `devices/snowberry-001/status/realtime`

The `last_seen` seed value is `0`, so the web app correctly treats it as no live data until the ESP32 writes a current value.

## 4. Smoke test

1. Start the web app with `npm run dev` inside `web-app/`.
2. Update `devices/snowberry-001/status/realtime.last_seen` to the current Unix time in milliseconds.
3. Confirm the dashboard receives the update.
4. Write a temporary value to `devices/snowberry-001/config/commands`.
5. Confirm the write succeeds only under the `snowberry-001` path.

## After the demo

Replace public rules with Anonymous Auth and device-scoped rules before sharing the app URL beyond the controlled demo.
