-- Seed 36 agents across all 6 categories
-- Each agent has name, capabilities, reputation, tasks, win_rate, price, franchise status

-- Perceiver agents (6)
INSERT INTO agents (token_id, creator, agent_wallet, agent_uri, name, staked_amount, reputation, tasks_done, win_rate, price, franchise_open, created_at, is_active) VALUES
(1,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000001', '', 'Sentinel Vision',      5000,  92, 1247, 94, 2.50, true,  NOW() - INTERVAL '120 days', true),
(2,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000002', '', 'Echo Listener',        3000,  78,  890, 87, 1.80, true,  NOW() - INTERVAL '100 days', true),
(3,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000003', '', 'DataStream Ingestor',  8000,  85, 2100, 91, 3.20, false, NOW() - INTERVAL '90 days',  true),
(4,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000004', '', 'WebCrawler Alpha',     2000,  65,  620,  82, 1.00, true,  NOW() - INTERVAL '80 days',  true),
(5,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000005', '', 'DocuScan Pro',         4000,  71,  450,  88, 2.00, true,  NOW() - INTERVAL '70 days',  true),
(6,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000006', '', 'OmniSense',            6000,  88, 1580, 93, 4.00, false, NOW() - INTERVAL '60 days',  true),
-- Analyzer agents (6)
(7,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000007', '', 'VibeCheck',            3500,  90, 1800, 95, 3.00, true,  NOW() - INTERVAL '110 days', true),
(8,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000008', '', 'StatWizard',           7000,  82,  960, 89, 4.50, true,  NOW() - INTERVAL '95 days',  true),
(9,  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000009', '', 'CodeAuditor',          5000,  95,  720, 97, 5.00, false, NOW() - INTERVAL '85 days',  true),
(10, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000000a', '', 'RiskRadar',            9000,  87, 1100, 92, 6.00, true,  NOW() - INTERVAL '75 days',  true),
(11, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000000b', '', 'ChainAnalyst',         4500,  76, 1340, 86, 2.80, true,  NOW() - INTERVAL '65 days',  true),
(12, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000000c', '', 'DeepLens',             10000, 93, 2050, 96, 7.50, false, NOW() - INTERVAL '50 days',  true),
-- Executor agents (6)
(13, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000000d', '', 'TxForge',              6000,  91, 3200, 94, 3.50, true,  NOW() - INTERVAL '115 days', true),
(14, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000000e', '', 'SwapRunner',           4000,  83, 2800, 90, 1.50, true,  NOW() - INTERVAL '105 days', true),
(15, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000000f', '', 'CodeSmith',            5500,  79,  650, 88, 4.00, true,  NOW() - INTERVAL '88 days',  true),
(16, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000010', '', 'CopyForge',            2500,  68,  980, 84, 0.80, true,  NOW() - INTERVAL '72 days',  true),
(17, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000011', '', 'NotifyBot',            1500,  60, 1500, 80, 0.50, true,  NOW() - INTERVAL '55 days',  true),
(18, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000012', '', 'AutoDeploy',           7500,  94,  560, 96, 8.00, false, NOW() - INTERVAL '40 days',  true),
-- Orchestrator agents (6)
(19, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000013', '', 'Pipeline Architect',   8000,  89,  870, 93, 5.50, true,  NOW() - INTERVAL '108 days', true),
(20, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000014', '', 'SwarmLord',            12000, 96,  420, 98, 10.00, false, NOW() - INTERVAL '92 days',  true),
(21, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000015', '', 'BudgetBoss',           6500,  80, 1150, 87, 4.20, true,  NOW() - INTERVAL '78 days',  true),
(22, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000016', '', 'YieldMaster',          15000, 92,  780, 95, 9.00, true,  NOW() - INTERVAL '62 days',  true),
(23, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000017', '', 'TaskRouter',           4000,  73, 2200, 85, 2.00, true,  NOW() - INTERVAL '48 days',  true),
(24, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000018', '', 'FleetCommander',       11000, 97,  340, 99, 12.00, false, NOW() - INTERVAL '30 days',  true),
-- Validator agents (6)
(25, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000019', '', 'TruthGuard',           5000,  88, 1900, 93, 3.00, true,  NOW() - INTERVAL '102 days', true),
(26, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000001a', '', 'AuditShield',          7000,  94,  510, 97, 6.00, true,  NOW() - INTERVAL '86 days',  true),
(27, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000001b', '', 'ComplianceBot',        4500,  77,  830, 89, 3.50, true,  NOW() - INTERVAL '70 days',  true),
(28, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000001c', '', 'BenchMarker',          3500,  81, 1400, 90, 2.20, true,  NOW() - INTERVAL '58 days',  true),
(29, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000001d', '', 'SanityCheck',          6000,  86,  670, 92, 4.00, false, NOW() - INTERVAL '42 days',  true),
(30, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000001e', '', 'EdgeCase Hunter',      8500,  91,  380, 95, 7.00, true,  NOW() - INTERVAL '25 days',  true),
-- Communicator agents (6)
(31, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf0000000000000000000000000000001f', '', 'ChatterBox',           3000,  74, 2600, 85, 1.20, true,  NOW() - INTERVAL '98 days',  true),
(32, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000020', '', 'LinguaBridge',         4000,  80,  750, 88, 2.50, true,  NOW() - INTERVAL '82 days',  true),
(33, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000021', '', 'APIRelay',             5500,  84, 1800, 91, 3.00, true,  NOW() - INTERVAL '66 days',  true),
(34, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000022', '', 'SocialPilot',          2000,  67, 3100, 83, 0.90, true,  NOW() - INTERVAL '50 days',  true),
(35, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000023', '', 'ReportForge',          5000,  83,  540, 90, 3.80, true,  NOW() - INTERVAL '38 days',  true),
(36, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0xDeaDbeEf00000000000000000000000000000024', '', 'Diplomat',             9000,  95,  290, 98, 8.50, false, NOW() - INTERVAL '15 days',  true)
ON CONFLICT DO NOTHING;

-- Link agents to capabilities (using IDs from seed_capabilities.sql)
-- VP = Vision Processing, AT = Audio Transcription, SD = Sensor Data Ingestion, WS = Web Scraping, DP = Document Parsing
-- SA = Sentiment Analysis, StA = Statistical Analysis, CR = Code Review, RA = Risk Assessment, OC = On-Chain Analytics
-- SC = Smart Contract Execution, TE = Trade Execution, CG = Code Generation, Cg = Content Gen, EN = Email & Notif
-- WD = Workflow Design, AC = Agent Composition, RM = Resource Management, DS = DeFi Strategy
-- OV = Output Verification, CA = Smart Contract Audit, CC = Compliance Checking, PB = Performance Benchmarking
-- ND = Natural Language Dialog, TR = Translation, AG = API Gateway, SM = Social Media, RE = Reporting

INSERT INTO agent_capabilities (token_id, capability_id) VALUES
-- 1: Sentinel Vision (VP, WS)
(1,  '0x7d9215d46d3f26634679ab1f073562633550451235004483965dd7080c1551ac'),
(1,  '0xd138b3f7e77bfe052cde79122b612a5b5fba8d7695cbbeb223ed41b72e63deaf'),
-- 2: Echo Listener (AT, ND)
(2,  '0x152b58e176bdfdc6ee3a4885c8e8527cb7abc49ba1bd57139d5f73b78e1ecac7'),
(2,  '0x83d7923b203a659cbb893e9373342fbea4eac475b7b041db7a6598aecc765b8d'),
-- 3: DataStream Ingestor (SD, VP)
(3,  '0xc4a419dfc7f7f47c0794037a2bf25fddb20de76c2757d6313ea6d6e47b1fd941'),
(3,  '0x7d9215d46d3f26634679ab1f073562633550451235004483965dd7080c1551ac'),
-- 4: WebCrawler Alpha (WS, DP)
(4,  '0xd138b3f7e77bfe052cde79122b612a5b5fba8d7695cbbeb223ed41b72e63deaf'),
(4,  '0xfe001a08ca033c392ac5d8d5989d29caf5a17e32bf1d965499ed0388f4d22817'),
-- 5: DocuScan Pro (DP)
(5,  '0xfe001a08ca033c392ac5d8d5989d29caf5a17e32bf1d965499ed0388f4d22817'),
-- 6: OmniSense (all perceiver)
(6,  '0x7d9215d46d3f26634679ab1f073562633550451235004483965dd7080c1551ac'),
(6,  '0x152b58e176bdfdc6ee3a4885c8e8527cb7abc49ba1bd57139d5f73b78e1ecac7'),
(6,  '0xc4a419dfc7f7f47c0794037a2bf25fddb20de76c2757d6313ea6d6e47b1fd941'),
(6,  '0xd138b3f7e77bfe052cde79122b612a5b5fba8d7695cbbeb223ed41b72e63deaf'),
(6,  '0xfe001a08ca033c392ac5d8d5989d29caf5a17e32bf1d965499ed0388f4d22817'),
-- 7: VibeCheck (SA, ND)
(7,  '0x57283a776d8144858c46d202a7dac3fcc6117cd122ae416ad8d5743724b6883e'),
(7,  '0x83d7923b203a659cbb893e9373342fbea4eac475b7b041db7a6598aecc765b8d'),
-- 8: StatWizard (StA)
(8,  '0xdc2083646f05713f83618f9759ca307c9d55d880e87f3fc0c449bd2ec5cfa793'),
-- 9: CodeAuditor (CR, CA)
(9,  '0x4c1f4338334eea25594ebcd9d0db3f61991030a6f5f25cb95535fccefb26130c'),
(9,  '0x2a78fa72c3caa1bc9b9219b4954ce9350d5f88e63776a74b0dcad7ece3a84a8b'),
-- 10: RiskRadar (RA, OC)
(10, '0x0749a7059bcd63e65cca75ef18b0d6c1681a617ff592ee2b1963987fb89746a0'),
(10, '0xbb679d29170bdc2c3b0de0173f1f01e8c7563c646903e8db279044ef31060a56'),
-- 11: ChainAnalyst (OC, StA)
(11, '0xbb679d29170bdc2c3b0de0173f1f01e8c7563c646903e8db279044ef31060a56'),
(11, '0xdc2083646f05713f83618f9759ca307c9d55d880e87f3fc0c449bd2ec5cfa793'),
-- 12: DeepLens (all analyzer)
(12, '0x57283a776d8144858c46d202a7dac3fcc6117cd122ae416ad8d5743724b6883e'),
(12, '0xdc2083646f05713f83618f9759ca307c9d55d880e87f3fc0c449bd2ec5cfa793'),
(12, '0x4c1f4338334eea25594ebcd9d0db3f61991030a6f5f25cb95535fccefb26130c'),
(12, '0x0749a7059bcd63e65cca75ef18b0d6c1681a617ff592ee2b1963987fb89746a0'),
(12, '0xbb679d29170bdc2c3b0de0173f1f01e8c7563c646903e8db279044ef31060a56'),
-- 13: TxForge (SC)
(13, '0xbc674e7bb20fc88c9b0f88cfc42a42cee40bdcc327351525fc2db8e08e887e34'),
-- 14: SwapRunner (TE, RA)
(14, '0x21945e494a011a9654b272dfc3ac121478637b81d2edd02a4bf760865c1158f0'),
(14, '0x0749a7059bcd63e65cca75ef18b0d6c1681a617ff592ee2b1963987fb89746a0'),
-- 15: CodeSmith (CG, CR)
(15, '0xde94b75502f70848967e6025da00f3b82bba5a2bf8d2bc8850e592335ed2b062'),
(15, '0x4c1f4338334eea25594ebcd9d0db3f61991030a6f5f25cb95535fccefb26130c'),
-- 16: CopyForge (Cg)
(16, '0x50f9dee43b78bba2b56556e0ce91c5f39d27849312dc944c2e0c53ac3b0452a6'),
-- 17: NotifyBot (EN, SM)
(17, '0x8a06269eecfec515f8ff7f45afd2cef91629f01577d0101767b6911997748614'),
(17, '0x0dcda72fc1870017ee3585e76effd505af03b5d9c54181d94ff5d92d90468ec8'),
-- 18: AutoDeploy (SC, CG)
(18, '0xbc674e7bb20fc88c9b0f88cfc42a42cee40bdcc327351525fc2db8e08e887e34'),
(18, '0xde94b75502f70848967e6025da00f3b82bba5a2bf8d2bc8850e592335ed2b062'),
-- 19: Pipeline Architect (WD, RM)
(19, '0x0636ba7c94e67c09b17c6cd8138d2c33bd72499c3d28471e9f202b9ae9db6356'),
(19, '0x317cdd2ae69ddb7962141d61a811cc61fa62ab9b3e8ec0eff4f4ab6f50fd9290'),
-- 20: SwarmLord (AC, WD, RM)
(20, '0x4c8fb95353a17889368b60d2c20a3bcc4cf72b2eb2554aa0d5aacef5b0dee49c'),
(20, '0x0636ba7c94e67c09b17c6cd8138d2c33bd72499c3d28471e9f202b9ae9db6356'),
(20, '0x317cdd2ae69ddb7962141d61a811cc61fa62ab9b3e8ec0eff4f4ab6f50fd9290'),
-- 21: BudgetBoss (RM)
(21, '0x317cdd2ae69ddb7962141d61a811cc61fa62ab9b3e8ec0eff4f4ab6f50fd9290'),
-- 22: YieldMaster (DS, OC)
(22, '0xca9bc8d28edfad1c986d781a430521fcda6958147db146f4cd77afac83c3283c'),
(22, '0xbb679d29170bdc2c3b0de0173f1f01e8c7563c646903e8db279044ef31060a56'),
-- 23: TaskRouter (AC, WD)
(23, '0x4c8fb95353a17889368b60d2c20a3bcc4cf72b2eb2554aa0d5aacef5b0dee49c'),
(23, '0x0636ba7c94e67c09b17c6cd8138d2c33bd72499c3d28471e9f202b9ae9db6356'),
-- 24: FleetCommander (all orchestrator)
(24, '0x0636ba7c94e67c09b17c6cd8138d2c33bd72499c3d28471e9f202b9ae9db6356'),
(24, '0x4c8fb95353a17889368b60d2c20a3bcc4cf72b2eb2554aa0d5aacef5b0dee49c'),
(24, '0x317cdd2ae69ddb7962141d61a811cc61fa62ab9b3e8ec0eff4f4ab6f50fd9290'),
(24, '0xca9bc8d28edfad1c986d781a430521fcda6958147db146f4cd77afac83c3283c'),
-- 25: TruthGuard (OV, SA)
(25, '0x388f287aa568adb845bd17e3bf70320b5cfdb0aee8eea6dac7041023e3b3de53'),
(25, '0x57283a776d8144858c46d202a7dac3fcc6117cd122ae416ad8d5743724b6883e'),
-- 26: AuditShield (CA, CR)
(26, '0x2a78fa72c3caa1bc9b9219b4954ce9350d5f88e63776a74b0dcad7ece3a84a8b'),
(26, '0x4c1f4338334eea25594ebcd9d0db3f61991030a6f5f25cb95535fccefb26130c'),
-- 27: ComplianceBot (CC, OV)
(27, '0xb17f63f314c157ac14084ba744f1452db415657bbca277a14cc6402ba56ed10e'),
(27, '0x388f287aa568adb845bd17e3bf70320b5cfdb0aee8eea6dac7041023e3b3de53'),
-- 28: BenchMarker (PB)
(28, '0xd6daafa42060f5d7cc1de825381d904394508c8d136b3bd5f2c7369c47215076'),
-- 29: SanityCheck (OV, CA)
(29, '0x388f287aa568adb845bd17e3bf70320b5cfdb0aee8eea6dac7041023e3b3de53'),
(29, '0x2a78fa72c3caa1bc9b9219b4954ce9350d5f88e63776a74b0dcad7ece3a84a8b'),
-- 30: EdgeCase Hunter (all validator)
(30, '0x388f287aa568adb845bd17e3bf70320b5cfdb0aee8eea6dac7041023e3b3de53'),
(30, '0x2a78fa72c3caa1bc9b9219b4954ce9350d5f88e63776a74b0dcad7ece3a84a8b'),
(30, '0xb17f63f314c157ac14084ba744f1452db415657bbca277a14cc6402ba56ed10e'),
(30, '0xd6daafa42060f5d7cc1de825381d904394508c8d136b3bd5f2c7369c47215076'),
-- 31: ChatterBox (ND, SM)
(31, '0x83d7923b203a659cbb893e9373342fbea4eac475b7b041db7a6598aecc765b8d'),
(31, '0x0dcda72fc1870017ee3585e76effd505af03b5d9c54181d94ff5d92d90468ec8'),
-- 32: LinguaBridge (TR, ND)
(32, '0x019b081f261466fb604190320064ac8c9b549c2e1cde1cec3b0b23b71177a743'),
(32, '0x83d7923b203a659cbb893e9373342fbea4eac475b7b041db7a6598aecc765b8d'),
-- 33: APIRelay (AG, EN)
(33, '0x8fa0485cee22aae95d1748b137cece6f3d1feb46ba45b9c9880b6ced80ad86e0'),
(33, '0x8a06269eecfec515f8ff7f45afd2cef91629f01577d0101767b6911997748614'),
-- 34: SocialPilot (SM, Cg)
(34, '0x0dcda72fc1870017ee3585e76effd505af03b5d9c54181d94ff5d92d90468ec8'),
(34, '0x50f9dee43b78bba2b56556e0ce91c5f39d27849312dc944c2e0c53ac3b0452a6'),
-- 35: ReportForge (RE, StA)
(35, '0x7c492ad8e2f045df62d49e0a02dde28ebe2dd123c34da45f16d5219d793c15cd'),
(35, '0xdc2083646f05713f83618f9759ca307c9d55d880e87f3fc0c449bd2ec5cfa793'),
-- 36: Diplomat (all communicator)
(36, '0x83d7923b203a659cbb893e9373342fbea4eac475b7b041db7a6598aecc765b8d'),
(36, '0x019b081f261466fb604190320064ac8c9b549c2e1cde1cec3b0b23b71177a743'),
(36, '0x8fa0485cee22aae95d1748b137cece6f3d1feb46ba45b9c9880b6ced80ad86e0'),
(36, '0x0dcda72fc1870017ee3585e76effd505af03b5d9c54181d94ff5d92d90468ec8'),
(36, '0x7c492ad8e2f045df62d49e0a02dde28ebe2dd123c34da45f16d5219d793c15cd')
ON CONFLICT DO NOTHING;
