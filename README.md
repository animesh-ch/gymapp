# Gymapp

A workout log for Android and iOS. Search a built-in exercise library, record repetitions, add your own exercises, and keep everything on the device. Export and import that data as one JSON file.

## Run

```bash
npm install
npm start
```

Then press `a` for Android, `i` for iOS, or `w` to open the web build. iOS compilation needs Xcode on a Mac. The web build uses the same screens and stores data in the browser's local storage so the flow can be tried without a phone.

```bash
npm test
npm run typecheck
```

## What is stored

Built-in exercises ship with the app. The original exercises keep ids such as `bench-press`. Exercises added from wger use `wger-<id>`. Custom exercises and rep entries are saved on the device. On Android and iOS that is a JSON file in the app documents folder, with GIF files beside it. A backup looks like this:

```json
{
  "version": 1,
  "exportedAt": "2026-10-03T16:50:00.000Z",
  "exercises": [
    {
      "id": "7c1e",
      "name": "Nordic curl",
      "muscles": ["hamstrings"],
      "category": "legs",
      "gifBase64": null
    }
  ],
  "records": [
    {
      "id": "a91b",
      "exerciseId": "bench-press",
      "reps": 8,
      "recordedAt": "2026-10-03T16:40:00.000Z"
    }
  ]
}
```

Import replaces custom exercises and rep history. The built-in library is unchanged. An invalid file leaves the device data as it is.

The built-in exercises, muscle tags, and demonstration images come from the public wger catalog (`scripts/fetch-wger-exercises.py`, CC BY-SA 4.0). Muscles use wger's muscle ids. Wger publishes an animated GIF or WebP for some exercises and a still image for others. Exercises with no wger image have no demonstration.
