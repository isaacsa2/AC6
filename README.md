<div align="center">

# AC6C Tune Maker

**A practical web tool for building, calculating and exporting AC6C / A-Chassis tunes for Roblox.**

[![Live App](https://img.shields.io/badge/Live%20App-ac6.isaacsa2.online-10b981?style=for-the-badge&logo=cloudflare&logoColor=white)](https://ac6.isaacsa2.online/)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?style=for-the-badge&logo=javascript&logoColor=000)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=for-the-badge&logo=cloudflare&logoColor=white)

</div>

---

## About

**AC6C Tune Maker** is a browser-based toolkit for creating and adjusting vehicle tunes for the **AC6C / A-Chassis** ecosystem on Roblox.

Instead of editing a large Tune table by trial and error, the app groups the most important vehicle parameters into focused sections, performs the related calculations and exports the result back to Luau for use in Roblox Studio.

### What it covers

- Engine power, RPM and torque behaviour
- Turbo and supercharger configuration
- Gearbox, clutch and gear ratios
- Differential and drivetrain setup
- Weight, axle layout and suspension
- Brakes and steering
- Electric motor parameters
- Controls and miscellaneous AC6 settings
- Tune import and Luau export
- Local save/load
- Shareable configuration links
- km/h and mph display
- Portuguese and English interface

## Live version

The current deployment is available at:

**https://ac6.isaacsa2.online/**

## Project structure

```text
AC6/
├── public/
│   ├── index.html        # Interface
│   ├── style.css         # Visual design
│   ├── script.js         # UI and Tune handling
│   ├── ac6-math.js       # AC6 calculations
│   └── chassis/          # Chassis-related data/pages
├── tests/                # Calculation tests
├── worker.js             # Cloudflare Worker entrypoint
├── wrangler.toml         # Worker / static assets configuration
└── package.json
```

The application is intentionally lightweight: the frontend is built with vanilla HTML, CSS and JavaScript, while Cloudflare Workers serves the static assets and handles deployment-related routes.

## Development

### Requirements

- Node.js
- npm
- Cloudflare Wrangler

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Deploy

```bash
npm run deploy
```

## Notes

The calculator is focused on AC6C/A-Chassis tuning and aims to make configuration easier to understand and reproduce. Always validate the generated Tune in the target vehicle, since vehicle geometry, mass distribution and custom chassis modifications can affect the final behaviour in Roblox.

---

<div align="center">

Built and maintained by **[Isaac S. (@isaacsa2)](https://github.com/isaacsa2)**

</div>
