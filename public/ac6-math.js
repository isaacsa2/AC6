(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AC6Math = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const MPH_SCALE = (10 / 12) * (60 / 88);

  function finite(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function curveRaw(rpm, horsepower, config) {
    const peak = finite(config.peakRPM, 0) / 1000;
    const sharpness = finite(config.peakSharpness, 0);
    const curveMult = finite(config.curveMult, 0);
    const r = finite(rpm, 0) / 1000;
    const hp = finite(horsepower, 0) / 100;
    if (r <= 0 || peak <= 0 || hp <= 0 || sharpness <= 0 || curveMult <= 0) return 0;

    const curveWidth = Math.min(hp / (peak * peak), Math.pow(curveMult, peak / hp));
    return ((-((r - peak) ** 2)) * curveWidth + hp) *
      (r - (r ** sharpness) / (sharpness * peak ** (sharpness - 1)));
  }

  function normalizedCurveHP(rpm, horsepower, config) {
    const nominal = Math.max(0, finite(horsepower, 0));
    if (!nominal) return 0;
    const peakRaw = curveRaw(config.peakRPM, nominal, config);
    if (!Number.isFinite(peakRaw) || Math.abs(peakRaw) < 1e-12) return 0;
    return Math.max(curveRaw(rpm, nominal, config) / (peakRaw / (nominal / 100)), 0) * 100;
  }

  function boostHorsepower(baseHorsepower, boostPsi, count, compressionRatio) {
    return ((finite(baseHorsepower, 0) * finite(boostPsi, 0) * finite(count, 0) *
      (finite(compressionRatio, 0) / 10)) / 7.5) / 2;
  }

  function electricHP(rpm, config) {
    const r = Math.max(0, finite(rpm, 0)) / 1000;
    const hp = Math.max(0, finite(config.eHorsepower, 0)) / 100;
    const trans1 = Math.max(1e-9, finite(config.eTrans1, 0) / 1000);
    const trans2 = Math.max(trans1, finite(config.eTrans2, 0) / 1000);
    const limit = Math.max(trans2 + 1e-9, finite(config.eRedline, 0) / 1000);
    const frontMult = Math.max(1e-9, finite(config.ehFrontMult, 0));
    let result;

    if (r <= trans1) {
      const progress = r / trans1;
      result = ((progress ** frontMult) / (1 / hp)) * progress +
        ((progress ** (1 / frontMult)) / (1 / hp)) * (1 - progress);
    } else if (r < trans2) {
      result = hp;
    } else {
      const progress = (r - trans2) / (limit - trans2);
      result = hp - (progress ** finite(config.ehEndMult, 1)) /
        (1 / (hp * (finite(config.ehEndPercent, 0) / 100)));
    }
    return Math.max(result * 100, 0);
  }

  function electricTorque(rpm, config) {
    const r = Math.max(0, finite(rpm, 0)) / 1000;
    const torque = Math.max(0, finite(config.eTorque, 0)) / 100;
    const trans1 = Math.max(1e-9, finite(config.eTrans1, 0) / 1000);
    const limit = Math.max(trans1 + 1e-9, finite(config.eRedline, 0) / 1000);
    let result = torque;
    if (r >= trans1) {
      const progress = (r - trans1) / (limit - trans1);
      result = torque - (progress ** finite(config.etEndMult, 1)) /
        (1 / (torque * (finite(config.etEndPercent, 0) / 100)));
    }
    return Math.max(result * 100, 0);
  }

  function simulateAspiration(rpm, config, base) {
    if (config.scenario !== 'transient') {
      return {
        turboMultiplier: config.turboCount > 0 ? 2 : 0,
        superMultiplier: config.superCount > 0 ? Math.max(0, rpm / config.redline) : 0,
        settledThrottle: 1
      };
    }

    const dt = 1 / 60;
    const steps = Math.max(0, Math.round(Math.max(0, config.duration) / dt));
    const throttle = clamp(finite(config.throttle, 1), 0, 1);
    const turboPsi = config.turboBoost * config.turboCount;
    let turboMultiplier = config.turboCount > 0 ? 0.05 : 0;
    let superThrottle = 0;
    let filteredThrottle = 0;
    let currentHP = 0;

    for (let step = 0; step < steps; step++) {
      if (throttle > filteredThrottle) {
        filteredThrottle = Math.min(throttle, filteredThrottle + Math.max(0, config.throttleAccel) * dt);
      } else if (throttle < filteredThrottle) {
        filteredThrottle = Math.max(throttle, filteredThrottle - Math.max(0, config.throttleDecel) * dt);
      }

      if (config.superCount > 0) {
        const delta = Math.max(0, config.superSensitivity) * dt;
        if (filteredThrottle > superThrottle) superThrottle = Math.min(filteredThrottle, superThrottle + delta);
        else if (filteredThrottle < superThrottle) superThrottle = Math.max(filteredThrottle, superThrottle - delta);
      }

      if (config.turboCount > 0 && turboPsi > 0 && config.horsepower > 0) {
        const lag = config.turboCount === 2 && turboMultiplier >= 1
          ? Math.max(1e-9, config.turboLag2)
          : Math.max(1e-9, config.turboLag);
        const spool = (currentHP * (filteredThrottle * 1.2) / config.horsepower) / 8;
        const bleed = turboMultiplier / 15;
        turboMultiplier += ((spool - bleed) * ((8 / (lag / dt)) * 2) / turboPsi) * 15;
        turboMultiplier = clamp(turboMultiplier, 0.05, 2);
      }

      const appliedSuper = Math.max(0, rpm / config.redline) * (0.5 + 1.5 * superThrottle) / 2;
      currentHP = base.naHP + base.turboCurveHP * (turboMultiplier / 2) +
        base.superCurveHP * appliedSuper + base.electricHP;
    }

    return {
      turboMultiplier,
      superMultiplier: config.superCount > 0
        ? Math.max(0, rpm / config.redline) * (0.5 + 1.5 * superThrottle) / 2
        : 0,
      settledThrottle: superThrottle
    };
  }

  function pointAtRpm(rpm, input) {
    const config = Object.assign({
      engine: true, electric: false, horsepower: 0, peakRPM: 1, redline: 1,
      peakSharpness: 1, curveMult: 1, eqPoint: 5252, compressionRatio: 10,
      turboCount: 0, turboBoost: 0, turboLag: 1, turboLag2: 1,
      superCount: 0, superBoost: 0, superSensitivity: 0.1, throttleAccel: 1, throttleDecel: 1,
      eRedline: 1, eTrans1: 1, eTrans2: 1, eHorsepower: 0,
      ehFrontMult: 1, ehEndMult: 1, ehEndPercent: 0, eTorque: 0,
      etEndMult: 1, etEndPercent: 0, ratio: 1, finalDrive: 1, fdMult: 1,
      scenario: 'settled', throttle: 1, duration: 2
    }, input || {});
    const safeRPM = Math.max(0, finite(rpm, 0));
    const turboNominal = boostHorsepower(config.horsepower, config.turboBoost, config.turboCount, config.compressionRatio);
    const superNominal = boostHorsepower(config.horsepower, config.superBoost, config.superCount, config.compressionRatio);
    const base = {
      naHP: config.engine ? normalizedCurveHP(safeRPM, config.horsepower, config) : 0,
      turboCurveHP: config.engine && config.turboCount > 0 ? normalizedCurveHP(safeRPM, turboNominal, config) : 0,
      superCurveHP: config.engine && config.superCount > 0 ? normalizedCurveHP(safeRPM, superNominal, config) : 0,
      electricHP: config.electric ? electricHP(safeRPM, config) : 0
    };
    const aspiration = simulateAspiration(safeRPM, config, base);
    const turboHP = base.turboCurveHP * (aspiration.turboMultiplier / 2);
    const superHP = base.superCurveHP * aspiration.superMultiplier;
    const combustionHP = base.naHP + turboHP + superHP;
    const totalHP = combustionHP + base.electricHP;
    const combustionTorque = safeRPM > 0 ? combustionHP * finite(config.eqPoint, 5252) / safeRPM : 0;
    const eTorque = config.electric && safeRPM > 0 ? electricTorque(safeRPM, config) : 0;
    const engineTorque = combustionTorque + eTorque;
    const driveMultiplier = Math.max(0, finite(config.ratio, 0)) *
      Math.max(0, finite(config.finalDrive, 0)) * Math.max(0, finite(config.fdMult, 0));

    return {
      rpm: safeRPM,
      naHP: base.naHP,
      turboHP,
      superHP,
      combustionHP,
      electricHP: base.electricHP,
      totalHP,
      combustionTorque,
      electricTorque: eTorque,
      engineTorque,
      wheelTorque: engineTorque * driveMultiplier,
      turboMultiplier: aspiration.turboMultiplier,
      superMultiplier: aspiration.superMultiplier,
      superThrottle: aspiration.settledThrottle
    };
  }

  function findPeak(samples, key) {
    return samples.reduce(function(best, sample) {
      return !best || sample[key] > best[key] ? sample : best;
    }, null);
  }

  function buildDyno(input) {
    const config = Object.assign({}, input || {});
    const limit = Math.max(100, config.engine
      ? finite(config.redline, 0)
      : (config.electric ? finite(config.eRedline, 0) : 0));
    const samples = [];
    samples.push(pointAtRpm(0, config));
    for (let rpm = 100; rpm <= Math.ceil(limit / 100) * 100; rpm += 100) {
      samples.push(pointAtRpm(Math.min(rpm, limit), config));
    }
    if (samples[samples.length - 1].rpm !== limit) samples.push(pointAtRpm(limit, config));

    return {
      samples,
      peakTotal: findPeak(samples, 'totalHP'),
      peakNA: findPeak(samples, 'naHP'),
      peakTurbo: findPeak(samples, 'turboHP'),
      peakSuper: findPeak(samples, 'superHP'),
      peakElectric: findPeak(samples, 'electricHP'),
      peakEngineTorque: findPeak(samples, 'engineTorque'),
      peakWheelTorque: findPeak(samples, 'wheelTorque')
    };
  }

  function distributeByAxles(input) {
    const config = Object.assign({
      transmissionTorque: 0,
      torqueVector: 0,
      brakeForce: 0,
      brakeBias: 0.5,
      physicsFPS: 60,
      throttle: 1,
      tcsMultiplier: 1,
      clutchMultiplier: 1,
      engineOn: 1,
      config1: 'RWD',
      config2: null,
      axles: []
    }, input || {});

    const warnings = [];
    const normalized = [];
    const seen = new Set();

    (Array.isArray(config.axles) ? config.axles : []).forEach(function(axle, index) {
      const moduleId = clamp(Math.round(finite(axle.module, 1)), 1, 2);
      const axleId = Math.max(1, Math.round(finite(axle.axle, index + 1)));
      const role = axle.role === 'Front' ? 'Front' : 'Rear';
      const wheels = Math.max(0, Math.round(finite(axle.wheels, 0)));
      const driven = Math.max(0, Math.round(finite(axle.driven, 0)));
      const key = moduleId + ':' + axleId;

      if (seen.has(key)) warnings.push('Eixo ' + axleId + ' duplicado no módulo ' + moduleId + '.');
      seen.add(key);
      if (wheels <= 0) warnings.push('Eixo ' + axleId + ' do módulo ' + moduleId + ' precisa ter rodas.');
      if (driven > wheels) warnings.push('Eixo ' + axleId + ' do módulo ' + moduleId + ' tem mais rodas motrizes que rodas totais.');

      normalized.push({
        module: moduleId,
        axle: axleId,
        role,
        wheels,
        driven: Math.min(driven, wheels)
      });
    });

    if (!normalized.length) warnings.push('Adicione pelo menos um eixo.');
    if (finite(config.torqueVector, 0) < -1 || finite(config.torqueVector, 0) > 1) {
      warnings.push('TorqueVector deve ficar entre -1 e 1.');
    }

    const rows = [];
    let totalAppliedTorque = 0;
    let totalServiceBrake = 0;
    let totalDrivenWheels = 0;

    [1, 2].forEach(function(moduleId) {
      const moduleAxles = normalized.filter(function(axle) { return axle.module === moduleId; });
      if (!moduleAxles.length) return;

      const frontCount = moduleAxles.reduce(function(total, axle) {
        return total + (axle.role === 'Front' ? axle.wheels : 0);
      }, 0);
      const rearCount = moduleAxles.reduce(function(total, axle) {
        return total + (axle.role === 'Rear' ? axle.wheels : 0);
      }, 0);
      const driveCount = moduleAxles.reduce(function(total, axle) { return total + axle.driven; }, 0);
      const driveScale = driveCount > 0 ? 2 / driveCount : 0;
      const frontBrakeScale = frontCount > 0 ? 2 / frontCount : 0;
      const rearBrakeScale = rearCount > 0 ? 2 / rearCount : 0;
      const moduleConfig = moduleId === 2 && config.config2
        ? config.config2
        : config.config1;
      const awdBias = (finite(config.torqueVector, 0) + 1) / 2;

      moduleAxles.forEach(function(axle) {
        let roleTorqueShare = 1;
        if (moduleConfig === 'AWD') roleTorqueShare = axle.role === 'Front' ? 1 - awdBias : awdBias;

        const torquePerDrivenWheel = axle.driven > 0
          ? (finite(config.transmissionTorque, 0) / 1.5) *
            driveScale *
            (60 / Math.max(1, finite(config.physicsFPS, 60))) *
            finite(config.throttle, 1) *
            finite(config.tcsMultiplier, 1) *
            finite(config.engineOn, 1) *
            finite(config.clutchMultiplier, 1) *
            roleTorqueShare
          : 0;
        const axleTorque = torquePerDrivenWheel * axle.driven;

        const groupBrakeForce = axle.role === 'Front'
          ? finite(config.brakeForce, 0) * finite(config.brakeBias, 0.5)
          : finite(config.brakeForce, 0) * (1 - finite(config.brakeBias, 0.5));
        const brakeScale = axle.role === 'Front' ? frontBrakeScale : rearBrakeScale;
        const brakePerWheel = groupBrakeForce * brakeScale;
        const axleBrake = brakePerWheel * axle.wheels;

        totalAppliedTorque += axleTorque;
        totalServiceBrake += axleBrake;
        totalDrivenWheels += axle.driven;
        rows.push({
          module: moduleId,
          axle: axle.axle,
          role: axle.role,
          wheels: axle.wheels,
          driven: axle.driven,
          config: moduleConfig,
          driveScale,
          roleTorqueShare,
          torquePerDrivenWheel,
          axleTorque,
          brakePerWheel,
          axleBrake
        });
      });
    });

    if (totalDrivenWheels === 0) warnings.push('A topologia precisa ter ao menos uma roda motriz.');

    return {
      rows,
      warnings,
      valid: warnings.length === 0,
      totalAppliedTorque,
      totalServiceBrake,
      totalDrivenWheels
    };
  }
  function speedMphFromRedline(redline, ratio, finalDrive, fdMult, wheelDiameter) {
    const wheelRPM = finite(redline, 0) /
      Math.max(1e-9, finite(ratio, 0) * finite(finalDrive, 0) * finite(fdMult, 0));
    const wheelRadS = wheelRPM * 2 * Math.PI / 60;
    return wheelRadS * (finite(wheelDiameter, 0) / 2) * MPH_SCALE;
  }

  return {
    MPH_SCALE,
    curveRaw,
    normalizedCurveHP,
    boostHorsepower,
    electricHP,
    electricTorque,
    pointAtRpm,
    buildDyno,
    distributeByAxles,
    speedMphFromRedline
  };
});
