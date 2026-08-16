'use strict';

const assert = require('node:assert/strict');
const AC6 = require('../public/ac6-math.js');
const fs = require('node:fs');

function approx(actual, expected, tolerance = 1e-6, label = 'value') {
  assert.ok(Math.abs(actual - expected) <= tolerance, label + ': expected ' + expected + ', got ' + actual);
}

const template = fs.readFileSync(require.resolve('../public/chassis/AC6byisaacsa2TUNE.luau'), 'utf8');
function tuneNumber(key) {
  const match = template.match(new RegExp('Tune\\.' + key + '\\s*=\\s*([\\d.]+)'));
  assert.ok(match, 'template contains Tune.' + key);
  return Number(match[1]);
}
assert.equal(tuneNumber('Horsepower'), 220);
assert.equal(tuneNumber('EqPoint'), 5252);
assert.equal(tuneNumber('T_BoostLag'), 300);
assert.equal(tuneNumber('T2_BoostLag'), 400);
assert.doesNotMatch(template, /Tune\.TurboZeroStart/);
assert.equal(tuneNumber('FinalDrive'), 8.45);
assert.equal(tuneNumber('BrakeBias'), 0.6);
assert.equal(tuneNumber('Ackerman'), 0.9);

const html = fs.readFileSync(require.resolve('../public/index.html'), 'utf8');
assert.match(html, /data-tune="BrakeBias" data-tune-scale="0\.01"/);
assert.match(html, /data-tune="PBrakeBias" data-tune-scale="0\.01"/);
assert.match(html, /data-tune="Ackerman" data-tune-scale="0\.01"/);
assert.match(html, /id="turbo-zero-curve-btn"/);
const updatedTune = {
  engine: true,
  electric: false,
  horsepower: 220,
  peakRPM: 6400,
  redline: 6800,
  peakSharpness: 3.1,
  curveMult: 0.62,
  eqPoint: 5252,
  compressionRatio: 11.4,
  turboCount: 1,
  turboBoost: 3,
  turboLag: 300,
  turboLag2: 400,
  turboCurveZeroStart: true,
  superCount: 1,
  superBoost: 3,
  superSensitivity: 0.1,
  eRedline: 12700,
  eTrans1: 4000,
  eTrans2: 7000,
  eHorsepower: 223,
  ehFrontMult: 0.15,
  ehEndMult: 2.9,
  ehEndPercent: 7,
  eTorque: 286,
  etEndMult: 1.505,
  etEndPercent: 27.5,
  ratio: 6.7,
  finalDrive: 8.45,
  fdMult: 1,
  scenario: 'settled',
  throttle: 1,
  duration: 2
};

approx(AC6.normalizedCurveHP(6400, 220, updatedTune), 220, 1e-9, 'NA peak');
approx(AC6.boostHorsepower(220, 3, 1, 11.4), 50.16, 1e-9, 'boost nominal');

const peak = AC6.pointAtRpm(6400, updatedTune);
approx(peak.naHP, 220, 1e-9, 'point NA');
approx(peak.turboHP, 50.16, 1e-8, 'point turbo');
approx(peak.superHP, 50.16 * (6400 / 6800), 1e-8, 'point super');
approx(peak.totalHP, 220 + 50.16 + 50.16 * (6400 / 6800), 1e-8, 'point total');
approx(peak.engineTorque, peak.totalHP * 5252 / 6400, 1e-8, 'engine torque');
approx(peak.wheelTorque, peak.engineTorque * 6.7 * 8.45, 1e-7, 'wheel torque');

approx(AC6.electricHP(4000, updatedTune), 223, 1e-8, 'electric HP at Trans1');
approx(AC6.electricTorque(0, updatedTune), 286, 1e-8, 'electric launch torque');
approx(AC6.pointAtRpm(0, { ...updatedTune, engine: false, electric: true }).wheelTorque, 0, 1e-9, 'cache torque at zero RPM');

const hybrid = AC6.buildDyno({ ...updatedTune, electric: true });
assert.equal(hybrid.samples.at(-1).rpm, 6800, 'hybrid uses combustion redline like AC6');

const electricOnly = AC6.buildDyno({ ...updatedTune, engine: false, electric: true });
assert.equal(electricOnly.samples.at(-1).rpm, 12700, 'electric-only uses E_Redline');

const transient = AC6.pointAtRpm(6400, {
  ...updatedTune,
  scenario: 'transient',
  throttle: 1,
  duration: 2
});
assert.ok(transient.turboMultiplier > 0 && transient.turboMultiplier < 2, 'transient turbo spools from zero and remains below settled boost after 2s');

const zeroPsiStart = AC6.pointAtRpm(6400, {
  ...updatedTune,
  scenario: 'transient',
  duration: 0,
  turboCurveZeroStart: true
});
assert.equal(zeroPsiStart.turboMultiplier, 0, 'button mode starts turbo multiplier at zero');
assert.equal(zeroPsiStart.turboHP, 0, 'button mode starts without turbo horsepower');

const originalPsiStart = AC6.pointAtRpm(6400, {
  ...updatedTune,
  scenario: 'transient',
  duration: 0,
  turboCurveZeroStart: false
});
assert.equal(originalPsiStart.turboMultiplier, 0.05, 'original AC6 mode keeps the 0.05 multiplier floor');

const speed = AC6.speedMphFromRedline(6800, 1, 8.45, 1, 4);
const expectedSpeed = (6800 / 8.45) * 2 * Math.PI / 60 * 2 * ((10 / 12) * (60 / 88));
approx(speed, expectedSpeed, 1e-10, 'redline speed');

const rwd4x2 = AC6.distributeByAxles({
  transmissionTorque: 1500,
  torqueVector: 0.3,
  brakeForce: 3000,
  brakeBias: 0.6,
  config1: 'RWD',
  axles: [
    { module: 1, axle: 1, role: 'Front', wheels: 2, driven: 0 },
    { module: 1, axle: 2, role: 'Rear', wheels: 2, driven: 2 }
  ]
});
assert.equal(rwd4x2.valid, true);
assert.equal(rwd4x2.totalDrivenWheels, 2);
approx(rwd4x2.rows[1].torquePerDrivenWheel, 1000, 1e-9, 'RWD torque per driven wheel');
approx(rwd4x2.totalAppliedTorque, 2000, 1e-9, 'RWD total applied torque');
approx(rwd4x2.totalServiceBrake, 6000, 1e-9, 'service brake normalization');

const awd4x4 = AC6.distributeByAxles({
  transmissionTorque: 1500,
  torqueVector: 0.3,
  brakeForce: 3000,
  brakeBias: 0.6,
  config1: 'AWD',
  axles: [
    { module: 1, axle: 1, role: 'Front', wheels: 2, driven: 2 },
    { module: 1, axle: 2, role: 'Rear', wheels: 2, driven: 2 }
  ]
});
approx(awd4x4.rows[0].torquePerDrivenWheel, 175, 1e-9, 'AWD front wheel torque');
approx(awd4x4.rows[1].torquePerDrivenWheel, 325, 1e-9, 'AWD rear wheel torque');
approx(awd4x4.totalAppliedTorque, 1000, 1e-9, 'AWD total after vectoring');

const truck6x4 = AC6.distributeByAxles({
  transmissionTorque: 1500,
  config1: 'RWD',
  axles: [
    { module: 1, axle: 1, role: 'Front', wheels: 2, driven: 0 },
    { module: 1, axle: 2, role: 'Rear', wheels: 2, driven: 2 },
    { module: 1, axle: 3, role: 'Rear', wheels: 2, driven: 2 }
  ]
});
approx(truck6x4.rows[1].torquePerDrivenWheel, 500, 1e-9, '6x4 torque normalization');
approx(truck6x4.totalAppliedTorque, 2000, 1e-9, '6x4 keeps RWD reference torque');

const trailerUnpowered = AC6.distributeByAxles({
  transmissionTorque: 1500,
  config1: 'RWD',
  config2: 'RWD',
  axles: [
    { module: 1, axle: 1, role: 'Rear', wheels: 2, driven: 2 },
    { module: 2, axle: 1, role: 'Rear', wheels: 2, driven: 0 }
  ]
});
assert.equal(trailerUnpowered.valid, true, 'unpowered Wheels2 is valid');

const invalidTopology = AC6.distributeByAxles({
  transmissionTorque: 1500,
  config1: 'RWD',
  axles: [{ module: 1, axle: 1, role: 'Rear', wheels: 2, driven: 4 }]
});
assert.equal(invalidTopology.valid, false);
assert.match(invalidTopology.warnings.join(' '), /mais rodas motrizes/);
console.log('AC6 math regression checks passed');