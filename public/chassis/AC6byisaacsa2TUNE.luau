--[[
       ___  _____
      / _ |/ ___/	pointclouded | NVNA
     / __ / /__			  LuaInt | NVNA
    /_/ |_\___/   Build 6C, Version 1.5, Update 2.1
]]

local Tune = {}

--[[Misc]]
Tune.LoadDelay			= 5		-- Delay antes de inicializar o chassi (segundos)
Tune.AutoStart			= false		-- false = usar plugin de ignição manual
Tune.AutoFlip			= true		-- false = usar plugin de flip manual

--[[Wheel Alignment]]
--[Don't physically apply alignment to wheels]
--[Values are in degrees]
Tune.FCamber				= 0		-- Camber dianteiro
Tune.RCamber				= 0		-- Camber traseiro
Tune.FCaster				= 0		-- Caster dianteiro
Tune.RCaster				= 0		-- Caster traseiro
Tune.FToe				= 0		-- Toe dianteiro
Tune.RToe				= 0		-- Toe traseiro

--[[Weight and CG]]
Tune.Weight				= 5200		-- Peso total (libras)
Tune.WeightBSize		= {
	--[[Width]]		10.4	,
	--[[Height]]	11.6	,
	--[[Length]]	47	}
Tune.WeightDist			= 45		-- Distribuição de peso (0=traseiro 100=dianteiro)
Tune.CGHeight			= 1.4		-- Altura do CG (studs, relativo às rodas)
Tune.WBVisible			= false		-- Exibe o weight brick

--Unsprung Weight
Tune.FWheelDensity			= 0.2		-- Densidade das rodas dianteiras
Tune.RWheelDensity			= 0.2		-- Densidade das rodas traseiras

Tune.AxleSize			= 2				-- Tamanho dos membros estruturais
Tune.AxleDensity			= 0.1		-- Densidade dos membros estruturais

Tune.CustomSuspensionDensity	= 0.01		-- Densidade das juntas de suspensão customizada

--[[Suspension]]
Tune.SuspensionEnabled		= true			-- Habilita suspensão

--Front Strut
Tune.FSusStiffness			= 15600		-- Força da mola dianteira
Tune.FSusDamping			= 220		-- Amortecimento dianteiro
Tune.FSusLength			= 2		-- Comprimento base da mola (studs)
Tune.FPreCompress			= 0.6		-- Pré-compressão adicional (studs)
Tune.FExtensionLim			= 0.4		-- Limite de extensão (studs)
Tune.FCompressLim			= 0.1		-- Limite de compressão (studs)

Tune.FGyroDampening		= 50			-- Amortecimento giroscópico dianteiro

--Rear Strut
Tune.RSusStiffness			= 19067		-- Força da mola traseira
Tune.RSusDamping			= 500		-- Amortecimento traseiro
Tune.RSusLength			= 2		-- Comprimento base da mola (studs)
Tune.RPreCompress			= 0.6		-- Pré-compressão adicional (studs)
Tune.RExtensionLim			= 0.4		-- Limite de extensão (studs)
Tune.RCompressLim			= 0.1		-- Limite de compressão (studs)

Tune.RGyroDampening		= 50

--Old Suspension Settings (usado se não houver SuspensionGeometry)
Tune.FSusAngle			= 80
Tune.FWsBoneLen			= 4
Tune.FWsBoneAngle		= 0
Tune.FAnchorOffset		= { -.4, -.5, 0 }
Tune.FSpringOffset		= { 0, 0, 0 }
Tune.RSusAngle			= 80
Tune.RWsBoneLen			= 4
Tune.RWsBoneAngle		= 0
Tune.RAnchorOffset		= { -.4, -.5, 0 }
Tune.RSpringOffset		= { 0, 0, 0 }

--Aesthetics
Tune.SusVisible			= false
Tune.SusRadius			= .2
Tune.SusThickness		= .1
Tune.SusColor			= "Bright red"
Tune.SusCoilCount		= 6

--[[Wheel Stabilizer Gyro]]
Tune.FGyroDamp			= 100			-- Amortecimento não-axial dianteiro
Tune.RGyroDamp			= 100			-- Amortecimento não-axial traseiro

--[[Steering]]
Tune.SteeringType			= "New"		-- "New" = cálculo preciso (LuaInt) | "Old" = versão anterior
-- New Options
Tune.SteerRatio			= 13		-- Relação da caixa de direção
Tune.LockToLock			= 2.6		-- Voltas lock-to-lock
Tune.Ackerman			= 0.9		-- Geometria Ackerman (.7 a 1.2)

-- Old Options
Tune.SteerInner			= 60			-- Ângulo de esterço interno (graus)
Tune.SteerOuter			= 60			-- Ângulo de esterço externo (graus)

-- General Steering
Tune.SteerSpeed			= 0.025		-- Incremento de esterço por tick
Tune.ReturnSpeed			= 0.04		-- Incremento de retorno por tick
Tune.SteerDecay			= 250		-- Velocidade de corte do gradiente (SPS)
Tune.MinSteer			= 10		-- Esterço mínimo no corte máximo (%)
Tune.MSteerExp			= 1				-- Exponencial do mouse steering

-- Steer Gyro
Tune.SteerD				= 1000
Tune.SteerMaxTorque		= 45000
Tune.SteerP				= 100000

--Four Wheel Steering (LuaInt)
Tune.FWSteer				= "None"		-- "Static" | "Speed" | "Both" | "None"
Tune.RSteerOuter			= 10		-- Ângulo externo da roda traseira (graus)
Tune.RSteerInner			= 10		-- Ângulo interno da roda traseira (graus)
Tune.RSteerSpeed			= 60		-- Velocidade de ativação do 4WS (SPS)
Tune.RSteerDecay			= 330		-- Corte do gradiente traseiro (SPS)
Tune.RSteerD			= 1000
Tune.RSteerMaxTorque	= 50000
Tune.RSteerP			= 100000

--[[Engine (pointclouded)]]
-- Naturally Aspirated Engine
Tune.Engine				= true		-- true = tem motor a combustão

Tune.Horsepower			= 264		-- HP atmosférico (sem boost)
Tune.IdleRPM				= 800		-- RPM de marcha lenta
Tune.PeakRPM				= 6400		-- RPM onde a potência é máxima
Tune.Redline				= 6800		-- Limitador de RPM
Tune.PeakSharpness			= 6.5		-- Queda de potência após o pico
Tune.CurveMult			= 0.2		-- Alto = curva mais pontiaguda | Baixo = mais suave
Tune.EqPoint			= 5252			-- Padronizado, não alterar

Tune.CompressionRatio		= 8.5		-- Afeta apenas carros com boost — pesquise o valor real

-- Electric Engine
Tune.Electric			= false		-- true = tem motor elétrico

Tune.E_Redline			= 6800		-- Redline elétrica
Tune.E_Trans1			= 4000		-- RPM de transição 1 da curva elétrica
Tune.E_Trans2			= 7000		-- RPM de transição 2 da curva elétrica
-- Horsepower
Tune.E_Horsepower			= 223		-- HP elétrico
Tune.EH_FrontMult			= 0.15		-- Mult de HP no início da curva
Tune.EH_EndMult			= 2.9		-- Mult de HP no fim da curva
Tune.EH_EndPercent			= 7		-- % da curva onde o EndMult começa a agir
-- Torque
Tune.E_Torque			= 286		-- Torque elétrico base
Tune.ET_EndMult			= 1.505		-- Mult de TQ no fim da curva
Tune.ET_EndPercent			= 27.5		-- % da curva onde o TQ EndMult começa a agir

-- Turbocharger
Tune.Turbochargers			= 1		-- Número de turbos (0 = sem turbo)

Tune.T_Boost				= 6		-- Pressão do turbo (PSI)
Tune.T_BoostLag			= 300		-- Lag do turbo
Tune.T2_BoostLag		= 300				-- Lag do 2º turbo (twin sequencial)

-- Supercharger
Tune.Superchargers			= 0		-- Número de superchargers (0 = sem)
Tune.S_Boost				= 4		-- Pressão do supercharger (PSI)
Tune.S_Sensitivity			= 0.1		-- Responsividade do supercharger por tick (.05 a .1)

--Misc
Tune.ThrotAccel			= 0.025		-- Aceleração do acelerador por tick (.05 a .1)
Tune.ThrotDecel			= 0.15		-- Desaceleração do acelerador por tick (.1 a .3)

Tune.BrakeAccel			= 0.15				-- Aceleração do freio por tick
Tune.BrakeDecel			= 0.25			-- Desaceleração do freio por tick

Tune.RevAccel			= 50		-- Aceleração de RPM (alto = resposta mais rápida)
Tune.RevDecay			= 15		-- Queda de RPM ao soltar o acelerador
Tune.RevBounce			= 50		-- Kickback de RPM no limitador

Tune.IdleThrottle			= 3		-- Acelerador em marcha lenta (%)
Tune.Flywheel			= 250		-- Peso do volante (alto = resposta mais rápida, RPM mais estável)

Tune.InclineComp			= 1		-- Multiplicador de compensação de torque em rampas (0-90°)

--[[Drivetrain]]
Tune.Config				= "RWD"		-- "FWD" | "RWD" | "AWD"
Tune.TorqueVector			= 0.3		-- AWD: -1=100% frente | 0=50:50 | 1=100% trás

-- Differential Settings
Tune.DifferentialType		= "New"		-- "New" = baseado em diferencial real | "Old" = versão anterior AC6

-- Old Options
Tune.FDiffSlipThres		= 50
Tune.FDiffLockThres		= 50
Tune.RDiffSlipThres		= 80
Tune.RDiffLockThres		= 20
Tune.CDiffSlipThres		= 50
Tune.CDiffLockThres		= 50

-- New Options (LuaInt)
Tune.FDiffPower			= 20		-- Trava sob aceleração dianteiro (%)
Tune.FDiffCoast			= 20		-- Trava ao soltar dianteiro (%)
Tune.FDiffPreload			= 20		-- Pré-carga do diferencial dianteiro
Tune.RDiffPower			= 40		-- Trava sob aceleração traseiro (%)
Tune.RDiffCoast			= 30		-- Trava ao soltar traseiro (%)
Tune.RDiffPreload			= 20		-- Pré-carga do diferencial traseiro

-- Traction Control
Tune.TCSEnabled			= true		-- Implementa TCS
Tune.TCSThreshold			= 20		-- Slip permitido antes do TCS agir (SPS)
Tune.TCSGradient		= 10			-- Gradiente de slip (SPS) entre 0 e redução máxima
Tune.TCSLimit			= 10		-- Torque mínimo na redução máxima (%)

--[[Transmission]]
Tune.Clutch				= true		-- true = embreagem realista | false = eixo direto (AC6.81T)

Tune.TransModes			= {"Auto", "Semi"}				-- Modos disponíveis: Auto | Semi | Manual

Tune.ClutchMode			= "New"		-- "New" = velocidade controla engajamento | "Old" = velocidade+RPM

Tune.ClutchType			= "Clutch"		-- "Clutch" = padrão | "TorqueConverter" | "CVT"

--[[Transmission]]
Tune.Stall				= true		-- Afoga o motor — precisa de plugin de ignição
Tune.ClutchRel			= false			-- true = soltar o gás antes de subir marcha
Tune.ClutchEngage			= 10		-- Velocidade de engajamento (0=instantâneo, 99=bem lento)
Tune.SpeedEngage			= 20		-- Velocidade (SPS) de engajamento completo

--Clutch Kick (não alterar se não souber o que é)
Tune.ClutchKick			= false		-- Habilita clutch kick na largada
Tune.KickMult			= 5		-- Multiplicador de torque na largada
Tune.KickSpeedThreshold		= 20		-- Limite de velocidade da largada (SPS)
Tune.KickRPMThreshold		= 2000		-- Janela de RPM abaixo da redline para o kick

--Clutch: "Old" mode
Tune.ClutchRPMMult			= 1		-- Multiplicador de RPM da embreagem (recomendado 1.0)

--Torque Converter:
Tune.TQLock				= false			-- Trava o conversor acima de um certo RPM

--Torque Converter and CVT:
Tune.RPMEngage			= 3500		-- Mantém RPM nesse valor até ser ultrapassado

--Neutral Rev Limiter
Tune.NeutralLimit			= true		-- Limitador de RPM em neutro diferente da redline
Tune.NeutralRevRPM			= 5000		-- RPM máximo em neutro
Tune.LimitClutch		= true				-- Limita RPM com embreagem pressionada também

--Automatic Settings
Tune.AutoShiftMode			= "Speed"		-- "Speed" = por velocidade | "RPM" = por RPM
Tune.AutoShiftType			= "DCT"		-- "DCT" = tempo fixo | "Rev" = sincroniza por RPM
Tune.AutoShiftVers			= "New"		-- "New" = R/N/D disponíveis | "Old" = R ou D ao parar
Tune.AutoUpThresh			= -200		-- Ponto de upshift automático (relativo ao PeakRPM, negativo = antes)
Tune.AutoDownThresh		= 1400		-- Ponto de downshift automático (relativo ao PeakRPM)

--Automatic: Revmatching
Tune.ShiftThrot			= 100		-- Acelerador ao descer marcha para revmatch (0-100%)

--Automatic: DCT
Tune.ShiftUpTime			= 0.5		-- Tempo para subir marcha (s)
Tune.ShiftDnTime			= 0.5		-- Tempo para descer marcha (s)

--Gear Ratios
Tune.FinalDrive			= 13.28		-- Relação final — define velocidade máxima e torque na roda
Tune.Ratios			= {
	--[[Reverse]]	4.84	,
	--[[Neutral]]	0	,
	--[[ 1 ]]			3.43	,
	--[[ 2 ]]			2.01	,
	--[[ 3 ]]			1.42	,
	--[[ 4 ]]			1	,
	--[[ 5 ]]			0.83	,
	--[[ 6 ]]			0.59	,
}
Tune.FDMult				= 1		-- Multiplicador da relação final (manter 1 se não houver problema de torque)

--[[Brakes]]
Tune.ABSEnabled			= true		-- Implementa ABS
Tune.ABSThreshold			= 20		-- Slip permitido antes do ABS agir (SPS)

Tune.BrakeForce			= 14400		-- Força total de frenagem
Tune.BrakeBias			= 0.6		-- Bias pro dianteiro (1=frente, 0=trás, .5=50:50)
Tune.PBrakeForce			= 0		-- Força do freio de mão
Tune.PBrakeBias			= 0		-- Bias do freio de mão
Tune.EBrakeForce			= 800		-- Força do freio motor na redline

--[[Default Controls]]
--Peripheral Deadzones
Tune.Peripherals = {
	MSteerWidth				= 67		,	-- Largura do mouse steering (% da tela)
	MSteerDZone				= 10		,	-- Deadzone do mouse steering (%)
	ControlLDZone			= 5			,	-- Deadzone L do controle (%)
	ControlRDZone			= 5			,	-- Deadzone R do controle (%)
}

--Control Mapping
Tune.Controls = {
	--Mode Toggles
	ToggleTCS				= Enum.KeyCode.T					,
	ToggleABS				= Enum.KeyCode.Y					,
	ToggleTransMode			= Enum.KeyCode.LeftAlt				,
	ToggleMouseDrive		= Enum.KeyCode.Insert				,
	--Primary Controls
	Throttle				= Enum.KeyCode.Up					,
	Brake					= Enum.KeyCode.Down					,
	SteerLeft				= Enum.KeyCode.Left					,
	SteerRight				= Enum.KeyCode.Right				,
	--Secondary Controls (WASD)
	Throttle2				= Enum.KeyCode.W					,
	Brake2					= Enum.KeyCode.S					,
	SteerLeft2				= Enum.KeyCode.A					,
	SteerRight2				= Enum.KeyCode.D					,
	--Manual Transmission
	ShiftUp					= Enum.KeyCode.E					,
	ShiftDown				= Enum.KeyCode.Q					,
	Clutch					= Enum.KeyCode.LeftShift			,
	--Handbrake
	PBrake					= Enum.KeyCode.Asterisk				,
	--Mouse Controls
	MouseThrottle			= Enum.UserInputType.MouseButton1	,
	MouseBrake				= Enum.UserInputType.MouseButton2	,
	MouseClutch				= Enum.KeyCode.W					,
	MouseShiftUp			= Enum.KeyCode.E					,
	MouseShiftDown			= Enum.KeyCode.Q					,
	MousePBrake				= Enum.KeyCode.LeftShift			,
	--Controller Mapping
	ContlrThrottle			= Enum.KeyCode.ButtonR2				,
	ContlrBrake				= Enum.KeyCode.ButtonL2				,
	ContlrSteer				= Enum.KeyCode.Thumbstick1			,
	ContlrShiftUp			= Enum.KeyCode.ButtonY				,
	ContlrShiftDown			= Enum.KeyCode.ButtonX				,
	ContlrClutch			= Enum.KeyCode.ButtonR1				,
	ContlrPBrake			= Enum.KeyCode.ButtonL1				,
	ContlrToggleTMode		= Enum.KeyCode.DPadUp				,
	ContlrToggleTCS			= Enum.KeyCode.DPadDown				,
	ContlrToggleABS			= Enum.KeyCode.DPadRight			,
}

return Tune