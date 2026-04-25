-- Seed capabilities for the chimera agent ecosystem
-- IDs are keccak256(toUtf8Bytes(label)) matching the backend POST /capabilities logic

INSERT INTO capability_definitions (id, label, description, domain, category, created_by, verified) VALUES
-- Perceiver capabilities (5)
('0x7d9215d46d3f26634679ab1f073562633550451235004483965dd7080c1551ac', 'Vision Processing', 'Image and video understanding, object detection, scene analysis, OCR', 'computer_vision', 'perceiver', '0x0000000000000000000000000000000000000000', true),
('0x152b58e176bdfdc6ee3a4885c8e8527cb7abc49ba1bd57139d5f73b78e1ecac7', 'Audio Transcription', 'Speech-to-text, audio classification, sound event detection', 'audio', 'perceiver', '0x0000000000000000000000000000000000000000', true),
('0xc4a419dfc7f7f47c0794037a2bf25fddb20de76c2757d6313ea6d6e47b1fd941', 'Sensor Data Ingestion', 'IoT sensor parsing, telemetry processing, time-series normalization', 'iot', 'perceiver', '0x0000000000000000000000000000000000000000', true),
('0xd138b3f7e77bfe052cde79122b612a5b5fba8d7695cbbeb223ed41b72e63deaf', 'Web Scraping', 'HTTP fetching, HTML parsing, structured data extraction from web pages', 'data', 'perceiver', '0x0000000000000000000000000000000000000000', true),
('0xfe001a08ca033c392ac5d8d5989d29caf5a17e32bf1d965499ed0388f4d22817', 'Document Parsing', 'PDF, DOCX, spreadsheet extraction, table recognition, metadata extraction', 'data', 'perceiver', '0x0000000000000000000000000000000000000000', true),

-- Analyzer capabilities (5)
('0x57283a776d8144858c46d202a7dac3fcc6117cd122ae416ad8d5743724b6883e', 'Sentiment Analysis', 'Opinion mining, emotion detection, sarcasm identification from text', 'nlp', 'analyzer', '0x0000000000000000000000000000000000000000', true),
('0xdc2083646f05713f83618f9759ca307c9d55d880e87f3fc0c449bd2ec5cfa793', 'Statistical Analysis', 'Hypothesis testing, regression, distribution analysis, A/B test evaluation', 'data_science', 'analyzer', '0x0000000000000000000000000000000000000000', true),
('0x4c1f4338334eea25594ebcd9d0db3f61991030a6f5f25cb95535fccefb26130c', 'Code Review', 'Static analysis, vulnerability detection, code quality scoring, best practice checks', 'software', 'analyzer', '0x0000000000000000000000000000000000000000', true),
('0x0749a7059bcd63e65cca75ef18b0d6c1681a617ff592ee2b1963987fb89746a0', 'Risk Assessment', 'Portfolio risk scoring, fraud detection, anomaly flagging, threat modeling', 'finance', 'analyzer', '0x0000000000000000000000000000000000000000', true),
('0xbb679d29170bdc2c3b0de0173f1f01e8c7563c646903e8db279044ef31060a56', 'On-Chain Analytics', 'Transaction pattern analysis, wallet profiling, DEX volume tracking, whale monitoring', 'defi', 'analyzer', '0x0000000000000000000000000000000000000000', true),

-- Executor capabilities (5)
('0xbc674e7bb20fc88c9b0f88cfc42a42cee40bdcc327351525fc2db8e08e887e34', 'Smart Contract Execution', 'On-chain transaction submission, gas optimization, multi-call orchestration', 'blockchain', 'executor', '0x0000000000000000000000000000000000000000', true),
('0x21945e494a011a9654b272dfc3ac121478637b81d2edd02a4bf760865c1158f0', 'Trade Execution', 'DEX swap routing, limit order placement, MEV protection, slippage management', 'defi', 'executor', '0x0000000000000000000000000000000000000000', true),
('0xde94b75502f70848967e6025da00f3b82bba5a2bf8d2bc8850e592335ed2b062', 'Code Generation', 'Source code synthesis, refactoring, test generation, boilerplate automation', 'software', 'executor', '0x0000000000000000000000000000000000000000', true),
('0x50f9dee43b78bba2b56556e0ce91c5f39d27849312dc944c2e0c53ac3b0452a6', 'Content Generation', 'Blog posts, marketing copy, social media content, creative writing', 'content', 'executor', '0x0000000000000000000000000000000000000000', true),
('0x8a06269eecfec515f8ff7f45afd2cef91629f01577d0101767b6911997748614', 'Email & Notification', 'Templated email sending, push notification dispatch, webhook triggering', 'communication', 'executor', '0x0000000000000000000000000000000000000000', true),

-- Orchestrator capabilities (4)
('0x0636ba7c94e67c09b17c6cd8138d2c33bd72499c3d28471e9f202b9ae9db6356', 'Workflow Design', 'Multi-step pipeline creation, DAG-based task routing, conditional branching', 'automation', 'orchestrator', '0x0000000000000000000000000000000000000000', true),
('0x4c8fb95353a17889368b60d2c20a3bcc4cf72b2eb2554aa0d5aacef5b0dee49c', 'Agent Composition', 'Multi-agent coordination, task decomposition, delegation, result aggregation', 'multi_agent', 'orchestrator', '0x0000000000000000000000000000000000000000', true),
('0x317cdd2ae69ddb7962141d61a811cc61fa62ab9b3e8ec0eff4f4ab6f50fd9290', 'Resource Management', 'Budget allocation, compute scaling, API rate limit management, cost optimization', 'infrastructure', 'orchestrator', '0x0000000000000000000000000000000000000000', true),
('0xca9bc8d28edfad1c986d781a430521fcda6958147db146f4cd77afac83c3283c', 'DeFi Strategy', 'Yield farming routing, liquidity provision scheduling, rebalancing triggers', 'defi', 'orchestrator', '0x0000000000000000000000000000000000000000', true),

-- Validator capabilities (4)
('0x388f287aa568adb845bd17e3bf70320b5cfdb0aee8eea6dac7041023e3b3de53', 'Output Verification', 'Fact-checking, consistency validation, hallucination detection, source citation', 'quality', 'validator', '0x0000000000000000000000000000000000000000', true),
('0x2a78fa72c3caa1bc9b9219b4954ce9350d5f88e63776a74b0dcad7ece3a84a8b', 'Smart Contract Audit', 'Reentrancy checks, overflow detection, access control review, gas optimization validation', 'security', 'validator', '0x0000000000000000000000000000000000000000', true),
('0xb17f63f314c157ac14084ba744f1452db415657bbca277a14cc6402ba56ed10e', 'Compliance Checking', 'KYC/AML screening, regulatory rule matching, sanctions list checking', 'compliance', 'validator', '0x0000000000000000000000000000000000000000', true),
('0xd6daafa42060f5d7cc1de825381d904394508c8d136b3bd5f2c7369c47215076', 'Performance Benchmarking', 'Latency measurement, throughput evaluation, accuracy scoring, SLA monitoring', 'infrastructure', 'validator', '0x0000000000000000000000000000000000000000', true),

-- Communicator capabilities (5)
('0x83d7923b203a659cbb893e9373342fbea4eac475b7b041db7a6598aecc765b8d', 'Natural Language Dialog', 'Conversational AI, context tracking, persona-based responses, multi-turn chat', 'nlp', 'communicator', '0x0000000000000000000000000000000000000000', true),
('0x019b081f261466fb604190320064ac8c9b549c2e1cde1cec3b0b23b71177a743', 'Translation', 'Multi-language translation, localization, dialect adaptation, context-aware phrasing', 'nlp', 'communicator', '0x0000000000000000000000000000000000000000', true),
('0x8fa0485cee22aae95d1748b137cece6f3d1feb46ba45b9c9880b6ced80ad86e0', 'API Gateway', 'REST/GraphQL proxying, request transformation, response formatting, rate limiting', 'infrastructure', 'communicator', '0x0000000000000000000000000000000000000000', true),
('0x0dcda72fc1870017ee3585e76effd505af03b5d9c54181d94ff5d92d90468ec8', 'Social Media Interface', 'Twitter/X posting, Discord messaging, Telegram bots, community management', 'social', 'communicator', '0x0000000000000000000000000000000000000000', true),
('0x7c492ad8e2f045df62d49e0a02dde28ebe2dd123c34da45f16d5219d793c15cd', 'Reporting', 'Dashboard generation, summary formatting, PDF/CSV export, scheduled digests', 'data', 'communicator', '0x0000000000000000000000000000000000000000', true)
ON CONFLICT DO NOTHING;
