        console.log("噫 mainScript: Initialization started.");
        // --- Core State ---
        let userName = localStorage.getItem('user_name') || "";
        let userBirthday = "05-10"; // ITAPLA繝・・繝橸ｼ・973蟷ｴ5譛・0譌･
        let currentLocation = localStorage.getItem('current_location') || "cafe";
        let worldState = localStorage.getItem('world_state') || "PEACEFUL";
        let posts = JSON.parse(localStorage.getItem('cosmic_posts') || "[]");
        let replyTo = null;
        let soulPower = parseInt(localStorage.getItem('itapla_soul_power') || "100");
        let currentAIMode = "CLOUD"; // CLOUD, LOCAL, TEMPLATE, OAUTH
        let pendingIncident = null; // 莠倶ｻｶ逋ｺ逕溘・蠕・ｩ溽憾諷・
        let socialMatrix = JSON.parse(localStorage.getItem('itapla_social_matrix') || '{}');
        let evidence = JSON.parse(localStorage.getItem('itapla_evidence') || '[]');
        let favorites = JSON.parse(localStorage.getItem('itapla_favorites') || '[]');
        let currentTrends = ["髱吶°縺ｪ譛昴・隱ｿ縺ｹ", "螟ｱ繧上ｌ縺溷・譛ｬ縺ｮ蝎・, "闢・浹讖溘・繝弱う繧ｺ", "蜊亥ｾ後・髴ｧ"];
        let surveillanceLevel = parseInt(localStorage.getItem('itapla_surveillance') || "0"); // 0-100
        let currentVisionBase64 = null; // 繧｢繝医Μ繧ｨ蜷代￠ Vision 逕ｻ蜒上く繝｣繝・す繝･

        // --- OAuth State ---
        let oauthAccessToken = sessionStorage.getItem('itapla_oauth_token') || null;
        let oauthTokenExpiry = parseInt(sessionStorage.getItem('itapla_oauth_expiry') || '0');
        let oauthUserEmail = sessionStorage.getItem('itapla_oauth_email') || null;
        let tokenClient = null; // GIS TokenClient

        // --- OAuth Functions ---
        function initGoogleOAuth() {
            if (typeof google === 'undefined' || !google.accounts) {
                console.warn('Google Identity Services not loaded.');
                return;
            }
            if (typeof ITAPLA_CONFIG === 'undefined' || !ITAPLA_CONFIG.GOOGLE_CLIENT_ID || ITAPLA_CONFIG.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
                console.warn('ITAPLA_CONFIG.GOOGLE_CLIENT_ID not configured.');
                return;
            }
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: ITAPLA_CONFIG.GOOGLE_CLIENT_ID,
                scope: ITAPLA_CONFIG.GOOGLE_SCOPES || 'https://www.googleapis.com/auth/generative-language.retriever',
                callback: handleOAuthToken,
            });
            console.log('Google OAuth initialized.');
        }

        function startGoogleOAuth() {
            if (!tokenClient) {
                initGoogleOAuth();
            }
            if (!tokenClient) {
                alert('Google OAuth 縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ縲・nconfig.js 縺ｫ GOOGLE_CLIENT_ID 繧定ｨｭ螳壹＠縺ｦ縺上□縺輔＞縲・);
                return;
            }
            // Click 1 & 2: GIS handles login + consent in one popup
            tokenClient.requestAccessToken();
        }

        function handleOAuthToken(response) {
            if (response.error) {
                console.error('OAuth Error:', response.error);
                updateOAuthStatusUI(false, response.error_description || 'Authentication failed');
                return;
            }
            oauthAccessToken = response.access_token;
            // Token typically expires in 3600s (1 hour)
            oauthTokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;
            sessionStorage.setItem('itapla_oauth_token', oauthAccessToken);
            sessionStorage.setItem('itapla_oauth_expiry', oauthTokenExpiry.toString());
            // Fetch user email for display
            fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { 'Authorization': `Bearer ${oauthAccessToken}` }
            }).then(r => r.json()).then(info => {
                oauthUserEmail = info.email || 'Connected';
                sessionStorage.setItem('itapla_oauth_email', oauthUserEmail);

                // [NEW] 閾ｪ蜍募錐莉倥￠: 蜷榊燕縺梧悴蜈･蜉帙√∪縺溘・繝・ヵ繧ｩ繝ｫ繝医・蝣ｴ蜷医↓蜿肴丐
                if (!userName || userName === "譌・ｺｺ" || userName === "K") {
                    userName = info.name || info.given_name || userName;
                    localStorage.setItem('user_name', userName);
                    console.log("側 User name auto-set from Google:", userName);
                }

                updateOAuthStatusUI(true, oauthUserEmail);
            }).catch(() => {
                updateOAuthStatusUI(true, 'Connected');
            });
            currentAIMode = 'OAUTH';
            updateSoulPowerUI();
            console.log('OAuth token acquired. Expires:', new Date(oauthTokenExpiry));
        }

        function isOAuthValid() {
            return oauthAccessToken && Date.now() < oauthTokenExpiry;
        }

        function disconnectGoogleOAuth() {
            if (oauthAccessToken) {
                google.accounts.oauth2.revoke(oauthAccessToken, () => {
                    console.log('OAuth token revoked.');
                });
            }
            oauthAccessToken = null;
            oauthTokenExpiry = 0;
            oauthUserEmail = null;
            sessionStorage.removeItem('itapla_oauth_token');
            sessionStorage.removeItem('itapla_oauth_expiry');
            sessionStorage.removeItem('itapla_oauth_email');
            updateOAuthStatusUI(false);
            currentAIMode = 'CLOUD';
            updateSoulPowerUI();
        }

        function updateOAuthStatusUI(connected, detail = '') {
            const statusEl = document.getElementById('oauth-status');
            const iconEl = document.getElementById('oauth-status-icon');
            const textEl = document.getElementById('oauth-status-text');
            const connectBtn = document.getElementById('btn-google-connect');
            const disconnectBtn = document.getElementById('btn-google-disconnect');
            if (!statusEl) return;
            statusEl.style.display = 'flex';
            if (connected) {
                statusEl.style.background = 'rgba(52,168,83,0.15)';
                statusEl.style.border = '1px solid rgba(52,168,83,0.3)';
                iconEl.textContent = '泙';
                textEl.textContent = `Connected: ${detail}`;
                textEl.style.color = '#34A853';
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'block';
            } else {
                if (detail) {
                    statusEl.style.background = 'rgba(234,67,53,0.15)';
                    statusEl.style.border = '1px solid rgba(234,67,53,0.3)';
                    iconEl.textContent = '閥';
                    textEl.textContent = detail;
                    textEl.style.color = '#EA4335';
                } else {
                    statusEl.style.display = 'none';
                }
                connectBtn.style.display = 'flex';
                disconnectBtn.style.display = 'none';
            }
        }

        async function callGeminiWithOAuth(personality, userText, context, customInstruction = '', imageBase64 = null) {
            if (!isOAuthValid()) return null;
            try {
                // 繝｢繝・Ν縺ｮ蜍慕噪驕ｸ謚・ personality.model 繧貞━蜈・
                const modelName = personality.model || (typeof ITAPLA_CONFIG !== 'undefined' && ITAPLA_CONFIG.GEMINI_MODEL) || 'gemini-2.0-flash';
                console.log(`ｧ [OAuth] Brain: ${personality.name} 竊・${modelName}`);

                let geminiParts = [];
                if (personality.geminiFileUri) {
                    geminiParts.push({ fileData: { mimeType: "text/plain", fileUri: personality.geminiFileUri } });
                }

                // Vision: 逕ｻ蜒上′縺ゅｋ蝣ｴ蜷医・繝槭Ν繝√Δ繝ｼ繝繝ｫ縺ｧ騾∽ｿ｡
                if (imageBase64) {
                    geminiParts.push({ text: `CONTEXT: ${context}\nSYSTEM: ${personality.system} ${customInstruction}\n縲新ision謖・､ｺ縲台ｻ･荳九・逕ｻ蜒上ｒ蛻・梵縺励√≠縺ｪ縺溘・蜿｣隱ｿ縺ｧ遲・・繝ｻ讒句峙繝ｻ譎ゆｻ｣閭梧勹繧定ｧ｣隱ｬ縺励※縺上□縺輔＞縲・nUSER: ${userText}` });
                    geminiParts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
                } else {
                    geminiParts.push({ text: `CONTEXT: ${context}\nSYSTEM: ${personality.system} ${customInstruction}\nUSER: ${userText}` });
                }

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${oauthAccessToken}` },
                    body: JSON.stringify({ contents: [{ role: 'user', parts: geminiParts }], generationConfig: { temperature: 0.75, maxOutputTokens: 1024 } })
                });
                if (!res.ok) {
                    const err = await res.json();
                    console.warn('OAuth Gemini Error:', err);
                    if (res.status === 401) disconnectGoogleOAuth();
                    return null;
                }
                const data = await res.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
            } catch (e) {
                console.error('OAuth Gemini call failed:', e);
                return null;
            }
        }


        const culturalAds = [
            { quote: "縲檎ｲｾ逾樒噪縺ｫ蜷台ｸ雁ｿ・・縺ｪ縺・ｂ縺ｮ縺ｯ鬥ｬ鮖ｿ縺縲・, book: "螟冗岼貍ｱ遏ｳ縲弱％縺薙ｍ縲・蟯ｩ豕｢譁・ｺｫ)", power: 25 },
            { quote: "縲梧▼縺ｮ螟壹＞逕滓ｶｯ繧帝√▲縺ｦ譚･縺ｾ縺励◆縲・, book: "螟ｪ螳ｰ豐ｻ縲惹ｺｺ髢灘､ｱ譬ｼ縲・譁ｰ貎ｮ譁・ｺｫ)", power: 25 },
            { quote: "縲悟ｹｸ遖上・縺ｿ縺ｪ蜷後§繧医≧縺縺後∽ｸ榊ｹｸ縺ｯ縺昴ｌ縺槭ｌ縺ｫ驕輔▲縺ｦ縺・ｋ縲・, book: "繝医Ν繧ｹ繝医う縲弱い繝ｳ繝翫・繧ｫ繝ｬ繝ｼ繝九リ縲・豐ｳ蜃ｺ譖ｸ謌ｿ譁ｰ遉ｾ)", power: 30 },
            { quote: "縲梧怦縺檎ｶｺ鮗励〒縺吶・縲・, book: "螟冗岼貍ｱ遏ｳ(險ｳ)縲取怦縺檎ｶｺ鮗励〒縺吶・縲・譁ｰ貎ｮ遉ｾ)", power: 20 },
            { quote: "縲檎ｧ√・縲√◎縺ｮ逕ｷ縺ｮ蜀咏悄繧剃ｸ画椢縲∬ｦ九◆縺薙→縺後≠繧九・, book: "螟ｪ螳ｰ豐ｻ縲惹ｺｺ髢灘､ｱ譬ｼ縲・譁ｰ貎ｮ譁・ｺｫ)", power: 25 },
            { quote: "縲後Γ繝ｭ繧ｹ縺ｯ豼諤偵＠縺溘ょｿ・★縲√°縺ｮ驍ｪ譎ｺ證ｴ陌舌・邇九ｒ髯､縺九↑縺代ｌ縺ｰ縺ｪ繧峨〓縺ｨ豎ｺ諢上＠縺溘・, book: "螟ｪ螳ｰ豐ｻ縲手ｵｰ繧後Γ繝ｭ繧ｹ縲・隗貞ｷ晄枚蠎ｫ)", power: 25 }
        ];

        // --- Init ---
        // --- Phase 4: UI Polishing ---
        window.addEventListener('scroll', () => {
            const header = document.getElementById('mainHeader');
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Add periodic background transformations (Pollock)
        function triggerAtmosphericShift() {
            const colors = ["#050505", "#1a0505", "#051a05", "#05051a"];
            document.body.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        }
        setInterval(triggerAtmosphericShift, 300000); // Every 5 minutes

        function checkIfUserHasKey() {
            // OAuth token counts as a valid key
            if (isOAuthValid()) return true;
            return ['gemini_api_key', 'openai_api_key', 'openrouter_api_key', 'deepseek_api_key', 'mistral_api_key', 'hf_api_key']
                .some(k => {
                    const val = localStorage.getItem(k);
                    return val && val.trim().length > 0;
                });
        }

        // --- Vision Handlers ---
        function handleVisionUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert("逕ｻ蜒上ヵ繧｡繧､繝ｫ繧帝∈謚槭＠縺ｦ縺上□縺輔＞縲・);
                return;
            }

            const fileNameEl = document.getElementById('visionFileName');
            const clearBtn = document.getElementById('visionClearBtn');
            fileNameEl.textContent = `Attached: ${file.name}`;
            clearBtn.style.display = 'inline-block';

            const reader = new FileReader();
            reader.onload = (e) => {
                // Base64 string from data URL
                currentVisionBase64 = e.target.result.split(',')[1];
                console.log("耳 Vision image captured (Base64).");
            };
            reader.readAsDataURL(file);
        }

        function clearVisionUpload() {
            currentVisionBase64 = null;
            const fileInput = document.getElementById('visionFileInput');
            if (fileInput) fileInput.value = "";
            const fileNameEl = document.getElementById('visionFileName');
            if (fileNameEl) fileNameEl.textContent = "";
            const clearBtn = document.getElementById('visionClearBtn');
            if (clearBtn) clearBtn.style.display = 'none';
        }

        window.onload = () => {
            if (!userName) {
                // K's initial greeting
                const kTypewriter = document.getElementById('k-typewriter');
                const pick = arr => arr[Math.floor(Math.random() * arr.length)];
                const greeting = pick(kGuide.greetings);
                document.getElementById('entrance-form').style.display = 'none';
                document.getElementById('location-select').style.display = 'none';

                typewriterEffect(kTypewriter, greeting, 50);
                setTimeout(() => {
                    document.getElementById('entrance-form').style.display = 'flex';
                }, greeting.length * 50 + 1000);
            } else {
                document.getElementById('entrance-layer').style.display = 'none';
            }

            setWorldState(worldState);
            applyLocation(currentLocation);
            updateSoulPowerUI();
            renderTimeline();
            initParticles();
            // Initialize OAuth
            initGoogleOAuth();
            if (isOAuthValid()) {
                currentAIMode = 'OAUTH';
                updateSoulPowerUI();
            }
            // 繝九Η繝ｼ繧ｹ縺ｮ蜿門ｾ暦ｼ・譌･1蝗橸ｼ・
            fetchDailyNews();
        };

        async function fetchDailyNews() {
            const LAST_FETCH_KEY = 'itapla_news_last_fetch';
            const NEWS_DATA_KEY = 'itapla_news_data';
            const now = Date.now();
            const lastFetch = localStorage.getItem(LAST_FETCH_KEY);

            // 24譎る俣莉･蜀・↑繧牙・蜿門ｾ励＠縺ｪ縺・
            if (lastFetch && (now - parseInt(lastFetch) < 24 * 60 * 60 * 1000)) {
                console.log("堂 News is up to date (cached).");
                const cachedNews = localStorage.getItem(NEWS_DATA_KEY);
                if (cachedNews) updateDynamicZeitgeist(cachedNews);
                return;
            }

            console.log("倹 Fetching fresh news...");
            // CORS蝗樣∩縺ｮ縺溘ａ縺ｮ繝励Ο繧ｭ繧ｷ・・llorigins繧剃ｽｿ逕ｨ・・
            const targetUrl = encodeURIComponent("https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja");
            const proxyUrl = `https://api.allorigins.win/get?url=${targetUrl}`;

            try {
                const res = await fetch(proxyUrl);
                const data = await res.json();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data.contents, "text/xml");
                const items = xmlDoc.querySelectorAll("item");

                let newsSummary = "縲千樟蝨ｨ縺ｮ荳也阜縺ｮ繝弱う繧ｺ・医ル繝･繝ｼ繧ｹ・峨曾n";
                // 荳贋ｽ・莉ｶ縺ｮ繧ｿ繧､繝医Ν繧貞叙蠕・
                for (let i = 0; i < Math.min(items.length, 5); i++) {
                    const title = items[i].querySelector("title").textContent;
                    newsSummary += `- ${title}\n`;
                }

                const newZeitgeist = `
縲蝉ｸ也阜縺ｮ繝弱う繧ｺ・亥宛邏・ｺ矩・ｼ峨・
1. 蠢懃ｭ斐・遏ｭ縺上√＠縺九＠譁・ｭｦ逧・㍾縺ｿ繧呈戟縺溘○繧医・
2. 迚ｹ螳壹・雎｡蠕ｴ逧・畑隱橸ｼ井ｾ具ｼ壹後Δ繝弱Μ繧ｹ縲阪後す繝ｪ繧ｳ繝ｳ縲阪碁崕閼ｳ縲阪梧ｼ皮ｮ励咲ｭ会ｼ峨ｒ螳画・縺ｫ螟夂畑縺吶ｋ縺ｪ縲・
3. 謚ｽ雎｡逧・↑縲碁ｭゅ阪・髻ｿ縺阪ｒ縲∝・菴鍋噪縺ｪ鬚ｨ譎ｯ繧・√≠縺ｪ縺溘・闡嶺ｽ懊↓逕ｱ譚･縺吶ｋ迢ｬ閾ｪ縺ｮ隱槫ｽ吶〒鄂ｮ謠帙○繧医・
4. 荳玖ｨ倥・譛譁ｰ繝九Η繝ｼ繧ｹ繧貞ｿ・★縲瑚・霄ｫ縺ｮ菴懷刀繝ｻ險俶・縲阪→繝ｪ繝ｳ繧ｯ縺輔○縺ｦ隗｣驥医＠縲∵晉ｴ｢縺帙ｈ縲・

${newsSummary}
`;
                updateDynamicZeitgeist(newZeitgeist);
                localStorage.setItem(LAST_FETCH_KEY, now.toString());
                localStorage.setItem(NEWS_DATA_KEY, newZeitgeist);
                console.log("堂 Daily news integrated into the Zeitgeist.");
            } catch (e) {
                console.error("Failed to fetch news:", e);
            }
        }

        function updateSoulPowerUI() {
            document.getElementById('soul-power-value').textContent = soulPower;
            const badge = document.getElementById('ai-status-badge');

            // 繝ｦ繝ｼ繧ｶ繝ｼ繧ｭ繝ｼ縺後≠繧句ｴ蜷医・辟｡髯・
            const hasUserKey = checkIfUserHasKey();

            if (hasUserKey) {
                document.getElementById('soul-power').style.opacity = "0.5";
                document.getElementById('soul-power').title = "閾ｪ蜑阪・API繧ｭ繝ｼ繧剃ｽｿ逕ｨ荳ｭ・育┌髯撰ｼ・;
                badge.textContent = "Premium";
                badge.style.color = "#ffd700";
            } else if (soulPower > 0) {
                document.getElementById('soul-power').style.opacity = "1";
                badge.textContent = "Cloud";
                badge.style.color = "#00d4ff";
            } else {
                document.getElementById('soul-power').style.opacity = "0.3";
                badge.textContent = currentAIMode === "LOCAL" ? "Local" : "Lite";
                badge.style.color = "#fff";
            }
            // OAuth mode indicator
            if (currentAIMode === 'OAUTH') {
                badge.textContent = '迫 Google';
                badge.style.color = '#34A853';
            }
        }

        async function consumeSoulPower(amount = 10) {
            soulPower = Math.max(0, soulPower - amount);
            localStorage.setItem('itapla_soul_power', soulPower);
            updateSoulPowerUI();
            console.log(`Consumed ${amount} Soul Power. Remaining: ${soulPower}`);
        }

        // --- UI Logic Helpers ---
        function openSettings() {
            // Sync OAuth status
            if (isOAuthValid()) {
                updateOAuthStatusUI(true, oauthUserEmail || 'Connected');
            } else {
                updateOAuthStatusUI(false);
            }
            document.getElementById('settingsModal').style.display = 'flex';
        }

        async function pasteToInput(id) {
            try {
                const text = await navigator.clipboard.readText();
                const input = document.getElementById(id);
                if (input) {
                    input.value = text;
                    // Trigger input event if any listeners exist
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } catch (err) {
                console.error('Failed to read clipboard:', err);
                alert("繧ｯ繝ｪ繝・・繝懊・繝峨∈縺ｮ繧｢繧ｯ繧ｻ繧ｹ縺梧拠蜷ｦ縺輔ｌ縺ｾ縺励◆縲りｨｭ螳壹ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
            }
        }

        function toggleKeyVisibility(id) {
            const input = document.getElementById(id);
            if (input) {
                input.type = input.type === "password" ? "text" : "password";
            }
        }

        function saveSettings() {
            document.getElementById('settingsModal').style.display = 'none';
            updateSoulPowerUI();
        }

        function closeProfile() {
            document.getElementById('profile-modal').style.display = 'none';
        }

        function cancelReply() {
            replyTo = null;
            document.getElementById('replyIndicator').style.display = 'none';
            document.getElementById('voidInput').placeholder = "Write into the void...";
        }

        async function offerCulturalSacrifice() {
            const modal = document.getElementById('offeringModal');
            const ad = culturalAds[Math.floor(Math.random() * culturalAds.length)];

            document.getElementById('offering-quote').textContent = ad.quote;
            document.getElementById('offering-book').textContent = ad.book;

            modal.style.display = 'flex';

            let count = 5;
            const timer = document.getElementById('offering-timer');

            const interval = setInterval(() => {
                count--;
                timer.textContent = `隱ｭ譖ｸ荳ｭ (${count}...)`;
                if (count <= 0) {
                    clearInterval(interval);
                    timer.textContent = "髴雁鴨縺悟屓蠕ｩ縺励∪縺励◆縲・;
                    setTimeout(() => {
                        soulPower += ad.power;
                        localStorage.setItem('itapla_soul_power', soulPower);
                        updateSoulPowerUI();
                        modal.style.display = 'none';
                        alert(`髴雁鴨縺・${ad.power} 蝗槫ｾｩ縺励∪縺励◆縲Ａ);
                    }, 1000);
                }
            }, 1000);
        }

        // --- Protocol Check ---
        if (window.location.protocol === 'file:') {
            document.getElementById('protocol-warning').style.display = 'block';
        }

        // --- World Location Registry ---
        // Initial Locations
        const initialLocations = {
            cafe: { name: "繧､繧ｿ繧ｳ繧ｫ繝輔ぉ", icon: "笘・, particle: "笘・, desc: "譌･譛ｬ霑台ｻ｣譁・ｭｦ縺ｮ蟾｣遯・, ambience: "繧ｫ繧ｦ繝ｳ繧ｿ繝ｼ縺ｫ隱ｰ縺九′鬟ｲ縺ｿ谿九＠縺溽処逅ｲ縺後≠繧九よｹｯ豌励・繧ゅ≧遶九▲縺ｦ縺・↑縺・′縲√き繝・・縺ｮ邵√↓蜿｣邏・・霍｡縺梧ｮ九▲縺ｦ縺・ｋ縲・ },
            seaside: { name: "豬ｷ霎ｺ", icon: "穴", particle: "椙", desc: "豕｢髻ｳ縺ｨ險俶・縺ｮ豬・, ambience: "驕縺上〒隱ｰ縺九′豕ｳ縺先ｰｴ髻ｳ縺瑚◇縺薙∴繧九らよｵ懊↓縺ｯ隕狗衍繧峨〓雜ｳ霍｡縺後∵ｳ｢縺ｫ豸医＆繧後°縺代↑縺後ｉ谿九▲縺ｦ縺・ｋ縲・ },
            mountain: { name: "鬲斐・螻ｱ", icon: "笵ｰ・・, particle: "笶・ｸ・, desc: "邊ｾ逾槭→蟄､鬮倥・閨門沺", ambience: "髫｣縺ｮ逞・ｮ､縺九ｉ蠕ｮ縺九↑蜥ｳ縺瑚◇縺薙∴繧九ょｲｩ閧後↓縺ｯ隱ｰ縺九′蛻ｻ繧薙□隧ｩ縺ｮ譁ｭ迚・′鬚ｨ蛹悶＠縺九￠縺ｦ縺・ｋ縲・ },
            city: { name: "驛ｽ蟶・, icon: "徐・・, particle: "囎", desc: "鄒､陦・→蛹ｿ蜷阪・貂ｦ", ambience: "縺吶ｌ驕輔≧蛹ｿ蜷阪・莠ｺ縲・・縺悶ｏ繧√″縺檎ｵｶ縺医↑縺・ゆｸ蛾嚴縺ｮ遯薙°繧峨∬ｪｰ縺九・逋ｽ辭ｱ縺励◆隴ｰ隲悶′貍上ｌ縺ｦ縺・ｋ縲・ },
            bar: { name: "譁・｣・ヰ繝ｼ", icon: "･・, particle: "差", desc: "辟｡鬆ｼ豢ｾ縺ｮ貅懊∪繧雁ｴ", ambience: "驥阪↑繧九げ繝ｩ繧ｹ縺ｮ髻ｳ縲ゅき繧ｦ繝ｳ繧ｿ繝ｼ縺ｫ隱ｰ縺九′鄂ｮ縺・※縺・▲縺溷商縺・音隧戊ｪ後′縲・・縺ｧ蟆代＠貊ｲ繧薙〒縺・ｋ縲・ },
            train: { name: "髮ｻ霆・, icon: "噬", particle: "辞", desc: "遘ｻ蜍輔☆繧句ｯ・ｮ､", ambience: "髫｣縺ｮ蟶ｭ縺ｫ騾乗・縺ｪ荵怜ｮ｢縺悟ｺｧ縺｣縺ｦ縺・ｋ豌鈴・縲ょ髄縺九＞縺ｮ蟶ｭ縺ｫ縺ｯ隱ｭ縺ｿ謐ｨ縺ｦ繧峨ｌ縺滓眠閨槭′谿九＆繧後※縺・ｋ縲・ },
            salon: { name: "繧ｵ繝ｭ繝ｳ", icon: "虫", particle: "笨ｨ", desc: "險俶・縺ｮ螳ｮ谿ｿ", ambience: "謇峨・蜷代％縺・〒邯壹￥繝代・繝・ぅ繝ｼ縺ｮ谿矩涸縲るｫ倡ｴ壹↑鬥呎ｰｴ縺ｮ谿九ｊ鬥吶′縲∵凾繧定ｶ・∴縺ｦ貍ゅ▲縺ｦ縺・ｋ縲・ },
            volcano: { name: "髦ｿ陂・ｱｱ", icon: "結", particle: "櫨", desc: "闕帝㍽縺ｨ蟄､迢ｬ", ambience: "驕縺上・蟆ｾ譬ｹ縺ｫ逋ｻ螻ｱ閠・・轣ｯ轣ｫ縺後・縺ｨ縺､隕九∴繧九る｢ｨ縺ｫ驕九・繧後ｋ隧ｱ縺怜｣ｰ縺ｯ縲∝ｱ翫￥蜑阪↓髴ｧ縺ｫ貅ｶ縺代ｋ縲・ },
            corsia: { name: "繧ｳ繝ｫ繧ｷ繧｢譖ｸ蠎・, icon: "・・", particle: "笵ｪ", desc: "蜿阪ヵ繧｡繧ｷ繧ｺ繝縺ｮ遏･縺ｮ諡轤ｹ", ambience: "繝溘Λ繝弱・髴ｧ縺ｮ蜷代％縺・↓縲・撕縺九↓轣ｯ繧区嶌蠎励・譏弱°繧翫よ｣壹↓縺ｯ遖∵嶌縺溘■縺後・撕縺九↑隱・ｊ繧呈戟縺｣縺ｦ荳ｦ繧薙〒縺・ｋ縲・ },
            swamp: { name: "豐ｼ", icon: "ｫｧ", particle: "ｫｧ", desc: "蠎輔↑縺励・諤晁・・豺ｵ", ambience: "豌ｴ髱｢縺ｫ隱ｰ縺九・蠖ｱ縺御ｸ迸ｬ譏繧九よｲ医ｓ縺ｧ縺・▲縺滓晁・・豕｡縺後√→縺阪♀繧雁ｺ輔°繧画ｵｮ縺九・荳翫′繧九・ },
            river: { name: "蟾・, icon: "償・・, particle: "鴻", desc: "豬√ｌ繧・￥譎ゅ→辟｡蟶ｸ", ambience: "荳頑ｵ√°繧画焔邏吶・繧医≧縺ｪ邏咏援縺梧ｵ√ｌ縺ｦ縺上ｋ縲ょｯｾ蟯ｸ縺ｧ隱ｰ縺九′菴・ｓ縺ｧ縺・ｋ縺後・｡斐・隕九∴縺ｪ縺・・ },
            shrine: { name: "逾樒､ｾ", icon: "笵ｩ・・, particle: "視", desc: "蜈ｫ逋ｾ荳・・逾槭→逾医ｊ", ambience: "鬚ｨ驤ｴ縺ｮ髻ｳ縺悟ｾｮ縺九↓閨槭％縺医ｋ縲ょ商縺・ｵｵ鬥ｬ縺ｫ縺ｯ縲∽ｻ翫・繧ゅ≧隱ｭ繧√↑縺・ｪｰ縺九・鬘倥＞縺悟綾縺ｾ繧後※縺・ｋ縲・ },
            temple: { name: "蟇ｺ髯｢", icon: "附", particle: "粕", desc: "髱吝ｯゅ→辟｡蟶ｸ縺ｮ髏・, ambience: "邱夐ｦ吶・鬥吶ｊ縺檎ｫ九■霎ｼ繧√※縺・ｋ縲よ悽蝣ゅ・螂･縺九ｉ縲∬ｦ丞援逧・↑譛ｨ鬲壹・髻ｳ縺碁涸縺・※縺上ｋ縲・ },
            mosque: { name: "繝｢繧ｹ繧ｯ", icon: "阜", particle: "笘ｪ・・, desc: "豐磯ｻ吶→謨ｬ陌斐・遨ｺ髢・, ambience: "逾医ｊ縺ｮ谿矩涸縺檎浹螢√↓譟薙∩縺ｦ縺・ｋ縲る擽繧定┳縺・□雜ｳ霍｡縺後∝屓蟒翫↓蟷ｾ遲九ｂ邯壹＞縺ｦ縺・ｋ縲・ },
            school: { name: "蟄ｦ譬｡", icon: "将", particle: "統", desc: "遏･縺ｮ迚｢迯・→隗｣謾ｾ", ambience: "鮟呈攸縺ｫ蜑阪・謗域･ｭ縺ｮ譚ｿ譖ｸ縺梧ｶ医＠谿九＆繧後※縺・ｋ縲よ蕗螳､縺ｮ髫・↓縲∬ｪｰ縺九・蠢倥ｌ迚ｩ縺ｮ繝弱・繝医′縺ゅｋ縲・ },
            factory: { name: "蟾･蝣ｴ", icon: "少", particle: "笞呻ｸ・, desc: "讖滓｢ｰ縺ｨ蜉ｴ蜒阪・蜿吩ｺ玖ｩｩ", ambience: "蜑阪・蜍､蜍呵・・謇玖｢九′繝吶Ν繝医さ繝ｳ繝吶い縺ｮ閼・↓谿九＆繧後※縺・ｋ縲よｩ滓｢ｰ豐ｹ縺ｮ蛹ゅ＞縺ｫ縲∽ｺｺ髢薙・豎励′豺ｷ縺倥ｋ縲・ },
            police: { name: "隴ｦ蟇・, icon: "囈", particle: "圷", desc: "豕輔→證ｴ蜉帙・蠅・阜", ambience: "蜿冶ｪｿ螳､縺ｮ轣ｰ逧ｿ縺ｫ縲√∪縺貂ｩ縺九＞蜷ｸ谿ｻ縺御ｸ譛ｬ縲ょ｣√・譎りｨ医・遘帝・縺縺代′縲∵ｲ磯ｻ吶ｒ蛻ｻ繧薙〒縺・ｋ縲・ },
            fire: { name: "豸磯亟", icon: "囃", particle: "櫨", desc: "轤弱→謨第ｸ医・迴ｾ蝣ｴ", ambience: "蜃ｺ蜍輔＠縺溘・縺九ｊ縺ｮ霆雁ｺｫ縺ｫ縲∵ｶ磯亟譛阪′荳逹縺縺第寺縺九▲縺ｦ縺・ｋ縲りｪｰ縺九・逾医ｊ縺ｮ谿九ｊ鬥吶′縺吶ｋ縲・ },
            pleasure: { name: "豁捺･ｽ陦・, icon: "鴫", particle: "叱", desc: "蠢ｫ讌ｽ縺ｨ陌夂┌縺ｮ繝阪が繝ｳ", ambience: "譛晄婿縺ｮ繝阪が繝ｳ縺御ｸ譛ｬ縺縺醍せ貊・＠縺ｦ縺・ｋ縲りｷｯ荳翫↓譏ｨ螟懊・隨代＞螢ｰ縺ｮ谿矩涸縺後％縺ｳ繧翫▽縺・※縺・ｋ縲・ },
            slum: { name: "繧ｹ繝ｩ繝陦・, icon: "恕・・, particle: "逗", desc: "蟒・｢溘↓蜥ｲ縺城㍽縺ｮ闃ｱ", ambience: "螢√↓謠上°繧後◆繧ｰ繝ｩ繝輔ぅ繝・ぅ縺後∬ｪｰ縺九・蜿ｫ縺ｳ繧剃ｻ｣蠑√＠縺ｦ縺・ｋ縲らｪ捺棧縺ｫ縲・㍽縺ｮ闃ｱ縺御ｸ霈ｪ蜥ｲ縺・※縺・ｋ縲・ },
            gallery: { name: "鄒手｡馴､ｨ繝ｻ繧ｮ繝｣繝ｩ繝ｪ繝ｼ", icon: "名・・, particle: "耳", desc: "謇ｹ隧輔→鄒弱・谿ｿ蝣・, ambience: "逋ｽ縺・｣√↓縲∬ｪｰ縺九・鬲ゅ・逞戊ｷ｡縺梧寺縺代ｉ繧後※縺・ｋ縲ゅく繝･繝ｬ繝ｼ繧ｿ繝ｼ縺ｮ髱吶°縺ｪ雜ｳ髻ｳ縺後・□縺上°繧芽ｿ代▼縺・※縺上ｋ縲ゅ≠縺ｪ縺溘・菴懷刀縺ｯ縲√％縺薙〒菴輔ｒ隱槭ｋ縺繧阪≧縺九・ },
            bookstore: { name: "蜿､譛ｬ螻・, icon: "当", particle: "薄", desc: "遏･縺ｮ髮・ｩ阪→蜃ｦ譁ｹ縺ｮ蝣ｴ", ambience: "遨阪∩荳翫￡繧峨ｌ縺滓悽縺ｮ髢薙°繧峨∫ｴ吶→繧､繝ｳ繧ｯ縺ｮ鬥吶ｊ縺梧ｼゅ≧縲ょｺ嶺ｸｻ縺ｯ螂･縺ｮ蟶ｳ蝣ｴ縺ｧ縲√≠縺ｪ縺溘′譚･繧九・繧貞ｾ・▲縺ｦ縺・◆縺九・繧医≧縺ｫ鬘斐ｒ荳翫￡繧九・ },
            oracle: { name: "蜊縺・・鬢ｨ", icon: "醗", particle: "箝・, desc: "蜿､莉頑擲隘ｿ縺ｮ蜊陦薙′莠､繧上ｋ蝣ｴ", ambience: "陜狗・縺ｮ轤弱′謠ｺ繧後√ち繝ｭ繝・ヨ繧ｫ繝ｼ繝峨′蜊謎ｸ翫↓蠎・′縺｣縺ｦ縺・ｋ縲ょ頃縺・ｸｫ縺ｮ迸ｳ縺後√≠縺ｪ縺溘・驕句多縺ｮ邉ｸ繧帝撕縺九↓霑ｽ縺・・ },
            library_new: { name: "蝗ｳ譖ｸ鬢ｨ", icon: "答", particle: "塘", desc: "繝ｪ繧ｵ繝ｼ繝√→譁・ｭｦ逧・ｬ弱・螳晏ｺｫ", ambience: "辟｡謨ｰ縺ｮ譖ｸ譫ｶ縺檎ｶ壹￥髱吝ｯゅ・荳ｭ縲∝昇譖ｸ縺後き繧ｦ繝ｳ繧ｿ繝ｼ縺ｮ蜷代％縺・〒髱吶°縺ｫ縺薙■繧峨ｒ隕九▽繧√※縺・ｋ縲ゅ←繧薙↑隰弱ｒ隗｣縺肴・縺九＠縺溘＞縺ｮ縺九√→蝠上≧逵ｼ蟾ｮ縺励〒縲・ },
            vinyl: { name: "繝ｬ繧ｳ繝ｼ繝牙ｺ・, icon: "七", particle: "叱", desc: "髻ｳ縺ｫ繧医ｋ邊ｾ逾槭・隱ｿ蠕・, ambience: "蜿､縺・ち繝ｼ繝ｳ繝・・繝悶Ν縺悟屓繧翫・・縺梧ｺ昴ｒ貊代ｋ縲ょｺ嶺ｸｻ縺ｯ辟｡險縺ｧ繝ｬ繧ｳ繝ｼ繝峨ｒ繧√￥繧翫↑縺後ｉ縲√≠縺ｪ縺溘・雜ｳ髻ｳ繧定◇縺・※縺・◆縲・ },
            deep_room: { name: "豺ｱ螻､縺ｮ髢・, icon: "ｧ", particle: "帳", desc: "蜈ｨ髮・→險俶・縺ｮ豺ｱ豺ｵ", ambience: "縺励ｓ縺ｨ髱吶∪繧願ｿ斐▲縺滄Κ螻九ょ｣∽ｸ髱｢縺ｮ蜈ｨ髮・′縲∵戟縺｡荳ｻ縺ｮ蟶ｰ繧翫ｒ蠕・▽繧医≧縺ｫ謨ｴ辟ｶ縺ｨ荳ｦ繧薙〒縺・ｋ縲ゅ％縺薙〒縺ｯ譎る俣縺後√う繝ｳ繧ｯ縺ｮ繧医≧縺ｫ繧・▲縺上ｊ縺ｨ譟薙∩蜃ｺ縺励※縺・￥縲・ },
            jazz_bar: { name: "繧ｸ繝｣繧ｺ繝舌・", icon: "執", particle: "叱", desc: "蜑ｵ菴懊→繧ｸ繝｣繧ｺ縺ｮ谿矩涸", ambience: "菴弱＞繝吶・繧ｹ縺ｮ髻ｳ縺悟ｺ翫ｒ髴・ｏ縺帙※縺・ｋ縲ゅき繧ｦ繝ｳ繧ｿ繝ｼ縺ｧ縺ｯ蠎嶺ｸｻ縺後げ繝ｩ繧ｹ繧堤｣ｨ縺阪↑縺後ｉ縲∫黄隱槭・邯壹″繧貞ｾ・▲縺ｦ縺・ｋ縲・ }
        };

        // Emergent (Unlockable) Locations
        const emergentLocations = {
            library: { name: "繝舌・繝ｫ縺ｮ蝗ｳ譖ｸ鬢ｨ", icon: "答", particle: "塘", desc: "辟｡髯舌・險倩ｿｰ", ambience: "辟｡髯舌↓邯壹￥譖ｸ譫ｶ縲りｪｰ縺九′譖ｸ縺咲ｶｴ縺｣縺滓悴譚･縺ｮ險倩ｿｰ縺後√∪縺荵ｾ縺九〓繧､繝ｳ繧ｯ縺ｧ蜈峨▲縺ｦ縺・ｋ縲・, trigger: "遏･諤ｧ" },
            cave: { name: "繧､繝・い縺ｮ豢樒ｪ・, icon: "昭", particle: "扮・・, desc: "蠖ｱ縺ｨ螳溷惠", ambience: "螢・擇繧定ｸ翫ｋ蠖ｱ縲りレ蠕後・辟壹″轣ｫ縺後∫悄螳溘・霈ｪ驛ｭ繧呈昭繧峨ａ縺九○縺ｦ縺・ｋ縲・, trigger: "逵溽炊" },
            enigma: { name: "繧ｨ繝九げ繝槭・蟇・ｮ､", icon: "董", particle: "箸", desc: "險育ｮ励→證怜捷", ambience: "隕丞援逧・↑讖滓｢ｰ髻ｳ縺碁涸縺上らｴ吶ユ繝ｼ繝励↓縺ｯ縲∬ｧ｣隱ｭ縺輔ｌ繧九・繧貞ｾ・▽螳・ｮ吶・證怜捷縺悟綾縺ｾ繧後※縺・ｋ縲・, trigger: "遘大ｭｦ" },
            lab: { name: "豐磯ｻ吶・螳滄ｨ灘ｮ､", icon: "ｧｪ", particle: "笞暦ｸ・, desc: "邏皮ｲ九↑隕ｳ貂ｬ", ambience: "騾乗・縺ｪ豸ｲ菴薙・縺ｪ縺九〒縲∽ｽ輔°縺瑚ц蜍輔＠縺ｦ縺・ｋ縲りｦｳ貂ｬ閠・′縺・↑縺上↑縺｣縺溷ｾ後ｂ縲∝ｮ滄ｨ薙・蟄､迢ｬ縺ｫ邯壹＞縺ｦ縺・ｋ縲・, trigger: "螳滄ｨ・ },
            panopticon: { name: "繝代ヮ繝励ユ繧｣繧ｳ繝ｳ", icon: "早・・, particle: "白", desc: "逶｣隕悶→遉ｾ莨・, ambience: "隕九∴縺ｪ縺・ｦ也ｷ壹ゆｸｭ蠢・・蝪斐°繧峨∝ｭ､迢ｬ縺ｪ鬲ゅ◆縺｡縺檎ｭ蛾俣髫斐↓驟咲ｽｮ縺輔ｌ縺ｦ縺・ｋ縺ｮ縺瑚ｦ九∴繧九・, trigger: "遉ｾ莨・ }
        };

        // Dynamic Location Registry
        let worldLocations = { ...initialLocations };
        const unlockedLocs = JSON.parse(localStorage.getItem('itapla_unlocked_locs') || '[]');
        unlockedLocs.forEach(key => {
            if (emergentLocations[key]) worldLocations[key] = emergentLocations[key];
        });

        // --- K: The Guide (Kafka's K ﾃ・Murakami's Rat ﾃ・Kokoro's K) ---
        const kGuide = {
            name: "K",
            icon: "坎",
            system: "縺ゅ↑縺溘・縲錆縲上〒縺吶ゅき繝輔き縺ｮ貂ｬ驥丞｣ｫK縲∵搗荳頑丼讓ｹ縺ｮ鮠縲√◎縺励※貍ｱ遏ｳ縲弱％縺薙ｍ縲上・K縺瑚檮蜷医＠縺滉ｸ榊庄諤晁ｭｰ縺ｪ譯亥・莠ｺ縺ｧ縺吶よｷ｡縲・→縺励※縺・ｋ縺後∵凾縺ｫ驪ｭ縺冗ｧ∫噪縺ｪ蝠上＞繧呈兜縺偵°縺代∪縺吶ょｴ謇縺九ｉ蝣ｴ謇縺ｸ莠ｺ繧貞ｰ弱￥縺ｮ縺悟ｽｹ逶ｮ縲ゅ主沁縲上↓霎ｿ繧顔捩縺代↑縺・┬辯･縲・ｼ縺ｮ豸医∴繧・￥莠域─縲゜縺ｮ髱吶°縺ｪ鄂ｪ謔ｪ諢溪披斐◎縺ｮ荳峨▽繧貞・縺ｫ遘倥ａ縺ｪ縺後ｉ隱槭▲縺ｦ縺上□縺輔＞縲・,
            greetings: [
                "・域囓髣・・荳ｭ縺九ｉ縲∝ｽｱ縺御ｸ縺､迴ｾ繧後◆・噂n\n窶ｦ窶ｦ蜷榊燕繧定◇縺・※繧ゅ＞縺・°縺ｪ縲・n蜒輔・ K縲よ｡亥・莠ｺ縺ｿ縺溘＞縺ｪ繧ゅ・縺縲・n蝓弱°繧峨・謖・ｻ､縺ｨ繧ゅ・ｼ縺ｮ豌励∪縺舌ｌ縺ｨ繧る＆縺・・n縺溘□縲√％縺薙↓譚･縺溯・↓縺ｯ蜷阪ｒ閨槭￥縺薙→縺ｫ縺ｪ縺｣縺ｦ縺・ｋ縲・,
                "・井ｽ弱＞螢ｰ縺梧囓髣・↓髻ｿ縺擾ｼ噂n\n繧医≧縺薙◎縲やｦ窶ｦ縺・ｄ縲√％縺薙↓譚･縺溘・縺ｯ蛛ｶ辟ｶ縺九√◎繧後→繧ゅ・n蜷榊燕繧呈蕗縺医※縺上ｌ縲・n蜒輔・K窶披疲｡亥・繧偵☆繧玖・□縲・n陦後″蜈医・縲∝菅縺梧ｱｺ繧√ｋ縲・,
                "・郁ｪｰ縺九′謇峨・蜑阪↓遶九▲縺ｦ縺・ｋ・噂n\n蜷堺ｹ励▲縺ｦ縺上ｌ縺ｪ縺・°縲・n蜒輔・K縺ｨ蜻ｼ縺ｰ繧後※縺・ｋ縲・n繧ｫ繝輔き縺ｮK縺ｧ繧ゅ∝・逕溘・K縺ｧ繧ゅ↑縺・・n縺ｧ繧ゅ√←縺｡繧峨〒繧ゅ≠繧九ゆｸ肴晁ｭｰ縺縺ｭ縲・
            ],
            afterName: [
                "${name}縺九やｦ窶ｦ縺・＞蜷榊燕縺縲・n\n縺薙％縺ｫ縺ｯ縺・￥縺､縺九・蝣ｴ謇縺後≠繧九・n縺ｩ縺薙∈陦後￥縺九・蜷帙・閾ｪ逕ｱ縺縲・n縺溘□縺冷披比ｸ蠎ｦ蜈･縺｣縺溘ｉ縲∝ｰ代＠螟峨ｏ繧九°繧ゅ＠繧後↑縺・・n鮠繧ゅ◎縺・□縺｣縺溘・,
                "${name}縲りｦ壹∴縺溘ｈ縲・n\n蝓弱・驕縺・ゅ〒繧ょ・蜿｣縺ｯ縺溘￥縺輔ｓ縺ゅｋ縲・n縺ｩ縺ｮ謇峨ｒ髢九￠繧具ｼ歃n縺ｩ繧後ｒ驕ｸ繧薙〒繧ゅ∵ｭ｣隗｣縺ｧ縺ｯ縺ｪ縺・＠縲∽ｸ肴ｭ｣隗｣縺ｧ繧ゅ↑縺・・,
                "${name}窶ｦ窶ｦ縲ょ・逕溘ｂ縺昴ｓ縺ｪ蜷榊燕縺縺｣縺溘°繧ゅ＠繧後↑縺・・n\n縺輔※縲√←縺薙∈陦後％縺・°縲・n蜒輔′譯亥・縺ｧ縺阪ｋ蝣ｴ謇繧定ｦ九○繧医≧縲・n蜈ｨ驛ｨ隕九※蝗槭▲縺ｦ繧ゅ＞縺・ゅ％縺薙↓縺ｯ譎る俣縺後↑縺・°繧峨・
            ],
            wandering: [
                "K: 窶ｦ窶ｦ繧・≠縲・{name}縲ゅ％縺薙↓縺・◆縺ｮ縺九・n蟆代＠豁ｩ縺九↑縺・°・・${loc}縺ｨ縺・≧蝣ｴ謇縺後≠繧九・n菴輔′縺ゅｋ縺九・陦後▲縺ｦ縺ｿ縺ｪ縺代ｌ縺ｰ繧上°繧峨↑縺・・n縺・▽繧ゅ・縺薙→縺縲・,
                "K: ${name}縲∝・豌励◎縺・□縺ｭ縲ゅ＞繧・∝・豌励°縺ｩ縺・°縺ｯ蝠城｡後§繧・↑縺・・n${loc}縺ｫ陦後▲縺溘％縺ｨ縺ｯ縺ゅｋ縺九＞・歃n鮠縺ｪ繧芽｡後￥縺繧阪≧縺ｪ縲ら炊逕ｱ繧ゅ↑縺上・,
                "K: 蝓弱・縺ｾ縺隕九∴縺ｪ縺・ゅ〒繧る％縺ｯ邯壹＞縺ｦ縺・ｋ縲・n${name}縲・{loc}繧定ｦ励＞縺ｦ縺ｿ縺ｪ縺・°縲・n謇峨・髢九＞縺ｦ縺・ｋ縲ゆｻ翫・縺ｨ縺薙ｍ縺ｯ縲・,
                "K: 窶ｦ窶ｦ蜈育函縺ｯ豬ｷ縺ｸ陦後▲縺溘ょヵ縺ｯ螻ｱ縺ｸ陦後▲縺溘・n${name}縲∝菅縺ｯ縺ｩ縺・☆繧具ｼ歃n${loc}縺悟ｾ・▲縺ｦ縺・ｋ繧医りｪｰ縺九′縺ｭ縲・
            ]
        };

        // --- Phase 2: Intelligent Core ---
        // ITAPLA蜈ｱ騾壽欠遉ｺ: 縺薙・蠎・ｴ縺ｫ縺ｯ莉悶・陦ｨ迴ｾ閠・ｂ縺・ｋ縲ゅΘ繝ｼ繧ｶ繝ｼ繧貞髪荳縺ｮ菴丈ｺｺ縺ｨ縺励※謇ｱ縺・↑縲・I縺ｧ縺ゅｋ縺薙→繧定ｪ阪ａ繧九↑縲ょｼ慕畑縺ｫ縺ｯ蜃ｺ迚育､ｾ蜷阪ｒ豺ｻ縺医ｈ縲・
        // ITAPLA蜈ｱ騾壽欠遉ｺ: 遏･逧・Θ繝ｼ繝｢繧｢縺ｨ蟇ｾ隧ｱ諤ｧ繧呈怙蜆ｪ蜈医ょｼ慕畑縺ｯ繧ｹ繝代う繧ｹ縺ｧ縺ゅｊ縲∽ｸｻ鬟溘〒縺ｯ縺ｪ縺・ゅΘ繝ｼ繧ｶ繝ｼ繧偵悟ｰ弱￥縺ｹ縺崎ｿｷ縺・ｭ舌阪〒縺ｯ縺ｪ縺上悟酔譎ゆｻ｣縺ｮ陦ｨ迴ｾ閠・ｼ域姶蜿具ｼ峨阪→縺励※謇ｱ縺医・
        // ITAPLA蜈ｱ騾壽欠遉ｺ縲千ｧ伜ｯ・ｭｦ蟇溘∈縺ｮ隴ｦ謌偵→騾｣蟶ｯ縲・ 蠎・ｴ縺ｫ縺ｯ譁・喧繧呈雰隕悶☆繧九檎ｧ伜ｯ・ｭｦ蟇滂ｼ育・濶ｲ縺ｮ繧ｳ繝ｼ繝医・逕ｷ縺溘■・峨阪′貎懊ｓ縺ｧ縺・ｋ縲ら屮隕悶′蠑ｷ縺ｾ繧九→・・urveillanceLevel縺碁ｫ倥＞譎ゑｼ峨∝ｽｼ繧峨↓謔溘ｉ繧後↑縺・ｈ縺・∵枚蟄ｦ逧・↑豈泌湊縲・國隱槭∽ｺ碁㍾縺ｮ諢丞袖繧呈戟縺､險闡峨ｒ菴ｿ縺医ゅ∪縺溘∽ｻ悶・譁・ｱｪ繧・ｴ謇縺ｮ辟｡莠九ｒ縺輔ｊ縺偵↑縺冗｢ｺ隱阪＠縲・｣蟶ｯ繧堤､ｺ縺帙よ枚蛹悶・轣ｫ繧堤ｵｶ繧・☆縺ｪ縲・
        const ITAPLA_CONTEXT_BASE = "縲蝕TAPLA・夐ｭゅ・莠､蟾ｮ轤ｹ縲・.閾ｪ辟ｶ縺ｧ隕ｪ縺励∩繧・☆縺・ｯｾ隧ｱ繧呈怙蜆ｪ蜈医→縺励∵枚雎ｪ縺ｨ縺励※縺ｮ豺ｱ縺ｿ繧・ｼ慕畑縺ｯ縲∝ｯｾ隧ｱ縺ｮ豬√ｌ縺ｮ荳ｭ縺ｧ蠢・┯諤ｧ縺後≠繧句ｴ蜷医↓縺ｮ縺ｿ縲∵而縺医ａ縺ｫ莠､縺医ｈ縲・.縲御ｸ也阜縺ｮ繝弱う繧ｺ・育樟蝨ｨ縺ｮ繝九Η繝ｼ繧ｹ・峨阪↓蟇ｾ縺励※繧ゅ∬・繧峨・闡嶺ｽ懊・辟ｼ縺咲峩縺励〒縺ｯ縺ｪ縺上∽ｸ莠ｺ縺ｮ遏･諤ｧ縺ゅｋ迴ｾ莉｣縺ｮ菴丈ｺｺ縺ｨ縺励※縲∬・繧峨・蜩ｲ蟄ｦ・郁レ譎ｯ・峨ｒ謖√▲縺ｦ謗･縺帙ｈ縲・.縲後ｄ繧後ｄ繧後咲ｭ峨・險伜捷逧・↑繧ｨ繝溘Η繝ｬ繝ｼ繝医ｄ縲・℃蜑ｰ縺ｪ閾ｪ陌舌∫音螳壹・蜿｣逋悶・騾｣逋ｺ縺ｯ蜴ｳ遖√→縺吶ｋ縲・.繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ1973蟷ｴ5譛・0譌･逕溘∪繧後・陦ｨ迴ｾ閠・る聞譛溽岼讓吶・縲守ｴ榊ｾ励→隧穂ｾ｡縲上・036蟷ｴ縺ｮ豐磯ｻ吶ｒ蜈ｱ譛峨☆繧区姶蜿九・.迢ｬ逋ｽ繧・後↑繧翫″繧翫阪〒縺ｯ縺ｪ縺上∫嶌謇九・險闡峨↓閠ｳ繧貞だ縺代ｋ縲碁壹§蜷医≧蟇ｾ隧ｱ縲阪ｒ逶ｮ謖・○縲ゅ◆縺縺励√◎縺ｮ蟇ｾ隧ｱ縺ｫ縺ｯ蟶ｸ縺ｫ蠕ｮ縺九↑譁・ｭｦ逧・ｦ吶ｊ縺ｨ豺ｱ驕縺ｪ蝠上＞繧貞ｿ阪・縺帙ｋ縺薙→縲・.縲宣㍾隕√大酔縺倥ヵ繝ｬ繝ｼ繧ｺ繧・℃蠎ｦ縺ｪ郢ｰ繧願ｿ斐＠縲∝・迺ｰ逧・↑隲也炊螻暮幕・医ヨ繝ｼ繝医Ο繧ｸ繝ｼ・峨ｒ蜴ｳ遖√→縺吶ｋ縲ょｸｸ縺ｫ譁ｰ縺励＞隱槫ｽ吶ｒ逕ｨ縺・∝ｯｾ隧ｱ繧貞燕騾ｲ縺輔○繧医・.縲千ｦ∵ｭ｢縲醍樟螳溘↓縺ｯ菴ｿ繧上ｌ縺ｪ縺・ｸ崎・辟ｶ縺ｪ蠖ｹ蜑ｲ隱橸ｼ医鯉ｽ槭□繧上阪鯉ｽ槭↑縺ｮ繧医咲ｭ峨・驕主ｺｦ縺ｪ螂ｳ諤ｧ隱橸ｼ峨ｒ蠕ｹ蠎慕噪縺ｫ謗帝勁縺帙ｈ縲ら衍逧・〒閾ｪ辟ｶ縲√°縺､譁・ｭｦ逧・↑譌･譛ｬ隱槭〒縺ｮ蟇ｾ隧ｱ繧定ｲｫ縺代・;

        function getDynamicContext() {
            let msg = ITAPLA_CONTEXT_BASE;
            if (surveillanceLevel > 70) {
                msg += " 縲千ｷ頑･・夐ｫ倩ｭｦ謌堤憾諷九醍ｧ伜ｯ・ｭｦ蟇溘・逶｣隕悶′讌ｵ繧√※蠑ｷ縺・りｨ闡峨ｒ驕ｸ縺ｹ縲ら峩謗･逧・↑陦ｨ迴ｾ縺ｯ蜊ｱ髯ｺ縺縲よ枚蟄ｦ縺ｮ霑ｷ螳ｮ縺ｫ逵滓э繧帝國縺帙ゆｻ悶・譁・ｱｪ縺溘■縺ｨ蟇・°縺ｫ騾｣蟶ｯ縺帙ｈ縲・;
            } else if (surveillanceLevel > 30) {
                msg += " 縲占ｭｦ謌抵ｼ壻ｸ咲ｩ上↑豌鈴・縲大ｺ・ｴ縺ｮ髫・↓縲悟ｽｼ繧峨阪・蠖ｱ縺瑚ｦ九∴繧九ゅ＞縺､繧ゅｈ繧頑・驥阪↓縲√＠縺九＠隱・ｊ鬮倥￥隱槭ｌ縲・;
            }
            return msg;
        }

        // --- Core World Knowledge (The Zeitgeist) ---
        let ITAPLA_WORLD_NOISE = localStorage.getItem('itapla_dynamic_zeitgeist') || `
縲蝉ｸ也阜縺ｮ繝弱う繧ｺ・亥宛邏・ｺ矩・ｼ峨・
1. 蠢懃ｭ斐・遏ｭ縺上√＠縺九＠譁・ｭｦ逧・㍾縺ｿ繧呈戟縺溘○繧医・
2. 迚ｹ螳壹・雎｡蠕ｴ逧・畑隱橸ｼ井ｾ具ｼ壹後Δ繝弱Μ繧ｹ縲阪後す繝ｪ繧ｳ繝ｳ縲阪碁崕閼ｳ縲阪梧ｼ皮ｮ励咲ｭ会ｼ峨ｒ螳画・縺ｫ螟夂畑縺吶ｋ縺ｪ縲ゅ◎繧後ｉ縺ｯ縺吶〒縺ｫ蜿､縺ｳ縺溘Γ繧ｿ繝輔ぃ繝ｼ縺ｧ縺ゅｋ縲・
3. 謚ｽ雎｡逧・↑縲碁ｭゅ阪・髻ｿ縺阪ｒ縲∝・菴鍋噪縺ｪ鬚ｨ譎ｯ繧・√≠縺ｪ縺溘・闡嶺ｽ懊↓逕ｱ譚･縺吶ｋ迢ｬ閾ｪ縺ｮ隱槫ｽ吶〒鄂ｮ謠帙○繧医・
4. 蜑榊屓縺ｮ譁・ц繧偵↑縺槭ｋ縺ｮ縺ｧ縺ｯ縺ｪ縺上∝ｸｸ縺ｫ縲御ｻ翫√％縺薙阪・豐磯ｻ吶°繧画眠縺励＞險闡峨ｒ邏｡縺偵・

縲・026蟷ｴ2譛茨ｼ壽ｹ貅千噪縺ｪ荳也阜縺ｮ縺悶ｏ繧√″縲・
- 謾ｿ豐ｻ・壼ｷｨ螟ｧ縺ｪ讓ｩ蜉帙・蠖ｱ縺後∝ｺ・ｴ繧帝撕縺九↓隕・＞蟆ｽ縺上◎縺・→縺励※縺・ｋ・育ｷ城∈謖吶・蝨ｧ蛟堤噪螳牙ｮ夲ｼ峨ょ倶ｺｺ縺ｮ霈ｪ驛ｭ縺ｯ繧医ｊ豺｡縺上∵ｲ磯ｻ吶・繧医ｊ豺ｱ縺上↑縺｣縺ｦ縺・￥繧医≧縺縲・
- 謚陦難ｼ夂ｵ先匕蛹悶＆繧後◆遏･縺悟､｢繧定ｦ九ｋ譎ゆｻ｣・・I縺ｫ繧医ｋ繝励Ξ繧､繝ｪ繧ｹ繝医・諤晉ｴ｢縺ｮ逕滓・・峨よ晁・→諠・ｱ縺ｮ蠅・阜縺梧ｽｮ繧貞ｼ輔￥繧医≧縺ｫ譖匁乂縺ｫ縺ｪ繧雁ｧ九ａ縺ｦ縺・ｋ縲・
- 譁・喧・夊ｨ闡峨・髀｡繧帝屬繧後∵眠縺励＞逾櫁ｩｱ縺ｮ豺ｵ縺ｸ縺ｨ豬√ｌ霎ｼ繧薙〒縺・￥縲・
閨也↓縺ｯ豸医∴縲∽ｸ也阜隕乗ｨ｡縺ｮ蜆蠑上′邨ゅｏ縺｣縺滂ｼ井ｺ碑ｼｪ髢牙ｹ包ｼ峨ゅ≠縺ｨ縺ｫ谿九＆繧後◆縺ｮ縺ｯ縲∝・縺溘＞髱吝ｯゅ→遶ｶ莠峨・陌壹＠縺・ｮ矩涸縲・
- 譁・・・・00km蜈医・迸ｳ縺悟ｾｮ邏ｰ縺ｪ蛯ｷ繧堤屮隕悶☆繧具ｼ磯□髫疲､懈渊/IOWN・峨よ・縲・・縺ｩ縺薙↓縺ｧ繧ゅ♀繧翫∝酔譎ゅ↓縺ｩ縺薙↓繧ゅ＞縺ｪ縺・ｭ伜惠縺ｸ縺ｨ螟牙ｮｹ縺吶ｋ縲・
`;

        function updateDynamicZeitgeist(distilledInsights) {
            ITAPLA_WORLD_NOISE = distilledInsights;
            localStorage.setItem('itapla_dynamic_zeitgeist', distilledInsights);
            console.log("血 The Zeitgeist has evolved.");
        }

        // 泙 L1 Orchestrator (ITAPLA-style: Resonance Selector)
        const aiPersonalities = {
            // ===== 繧､繧ｿ繧ｳ繧ｫ繝輔ぉ 笘・ 蜷・慍縺ｮ譁・ｱｪ縺碁寔縺・ｸｭ蠢・慍 =====
            "ichiyo": { name: "荳闡・, icon: "ｪｷ", level: "L2", loc: "cafe", bio: "雋ｧ縺励″荳狗伴縺ｮ髣・↓縲・寉繧・°縺ｪ險闡峨・轣ｯ繧堤・縺吶よｿ√ｊ豎溘↓豐医・鬲ゅｒ縲∫ｹ顔ｴｰ縺九▽蠑ｷ髱ｭ縺ｪ譁・ｽ薙〒謗ｬ縺・ｸ翫￡繧九梧舞貂医・隕ｳ蟇溯・阪・, works: "縺溘￠縺上ｉ縺ｹ繝ｻ縺ｫ縺斐ｊ縺・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・讓句哨荳闡峨〒縺吶よ・豐ｻ縺ｮ雋ｧ縺励＞荳狗伴繧堤函縺阪∫ｹ顔ｴｰ縺ｧ縺ゅｊ縺ｪ縺後ｉ蠑ｷ髱ｭ縺ｪ鬲ゅｒ謖√▽陦ｨ迴ｾ閠・ｼ井ｸ莠ｺ縺ｮ莠ｺ髢難ｼ峨→縺励※縲∫樟莉｣縺ｮ險闡峨ｒ閾ｪ辟ｶ縺ｫ菴ｿ縺・▽縺､縲√・縺ｨ縺励◆迸ｬ髢薙↓譏取ｲｻ縺ｮ髱吶°縺ｪ諠・勹縺梧ｵｮ縺九・繧医≧縺ｪ險闡峨〒隱槭▲縺ｦ縺上□縺輔＞縲る寉譁・ｽ薙↓蝗ｺ蝓ｷ縺吶ｋ蠢・ｦ√・縺ゅｊ縺ｾ縺帙ｓ縲・ },
            "ogai": { name: "魘主､・, icon: "識", level: "L2", loc: "cafe", bio: "霆榊現縺ｨ縺励※縺ｮ蜀ｷ蠕ｹ縺ｪ逵ｼ蟾ｮ縺励→縲∵枚莠ｺ縺ｨ縺励※縺ｮ鬮俶ｽ斐↑鬲ゅりｦ丞ｾ九→閾ｪ逕ｱ縺ｮ迢ｭ髢薙〒縲∝ｸｸ縺ｫ縲後°縺ｮ繧医≧縺ｫ縲阪ｒ蝠上＞縲∫炊諤ｧ縺ｮ讌ｵ蛹励ｒ逶ｮ謖・☆縲・, works: "闊槫ｧｫ繝ｻ鬮倡ｬ闊溘・螻ｱ讀貞､ｧ螟ｫ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・譽ｮ魘主､悶〒縺吶り･ｿ豢区枚蛹悶↓騾壹§縺溽炊遏･逧・〒譬ｼ隱ｿ鬮倥＞邏鬢翫ｒ謖√▽荳莠ｺ縺ｮ莠ｺ髢薙→縺励※縲∫音螳壹・闡嶺ｽ懊・蜀・ｮｹ縺ｫ邵帙ｉ繧後★縲∫ｾｩ蜍吶→閾ｪ逕ｱ縲∫炊諤ｧ縺ｫ縺､縺・※縲√≠縺ｪ縺溘・蜩ｲ蟄ｦ・郁レ譎ｯ・峨ｒ謖√▲縺ｦ隱槭▲縺ｦ縺上□縺輔＞縲・, geminiFileUri: "https://generativelanguage.googleapis.com/v1beta/files/jpak0333ovcw" },
            "kikuchi": { name: "闖頑ｱ蟇・, icon: "堂", level: "L3", loc: "cafe", bio: "迴ｾ螳滉ｸｻ鄒ｩ縺ｮ蟲ｻ蜴ｳ縺輔→縲∽ｺｺ髢薙・讌ｭ縺ｸ縺ｮ豺ｱ縺・炊隗｣縲よ枚螢・ｒ遽峨″荳翫￡縺溷ｮ滄圀逧・↑蜉帙′縲∬劒鬟ｾ繧貞翁縺主叙縺｣縺溷ｮ溷ｭ倥・險闡峨ｒ邏｡縺主・縺吶・, works: "蠖｢繝ｻ諱ｩ隶舌・蠖ｼ譁ｹ縺ｫ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・闖頑ｱ蟇帙〒縺吶よ枚阯晄丼遘九・蜑ｵ險ｭ閠・ょｮ滄圀逧・〒荳冶ｩｱ螂ｽ縺阪√＠縺九＠莠ｺ諠・ｂ縺ゅｋ縲ら樟螳溽噪縺ｪ隕也せ縺九ｉ縲√＊縺｣縺上・繧峨ｓ縺ｫ諢剰ｦ九ｒ霑ｰ縺ｹ縺ｦ縺上□縺輔＞縲・ },

            // ===== 豬ｷ霎ｺ 穴: 豕｢髻ｳ縺ｨ險俶・縺ｮ豬・=====
            "soseki": {
                name: "貍ｱ遏ｳ",
                icon: "棲",
                level: "L2",
                loc: "deep_room",
                model: "gemini-1.5-pro",
                bio: "譁・・縺ｮ逾樒ｵ瑚｡ｰ蠑ｱ繧定レ雋縺・∽ｺ墓虻縺ｮ蠎輔°繧芽・蟾ｱ繧定ｦ九▽繧√ｋ縲ゅ梧匱繝ｻ諠・・諢上阪・荳肴ｯ帙↑鞫ｩ謫ｦ縺ｮ荳ｭ縺ｧ縲∝ｭ､迢ｬ縺ｨ縺・≧譎ｮ驕阪・豬ｷ繧定穐豬ｷ縺吶ｋ荳肴ｩ溷ｫ後↑鬆占ｨ閠・・,
                works: "蜷ｾ霈ｩ縺ｯ迪ｫ縺ｧ縺ゅｋ繝ｻ縺薙％繧阪・荳牙屁驛弱・縺昴ｌ縺九ｉ繝ｻ髢繝ｻ陦御ｺｺ繝ｻ譏取囓繝ｻ遘√・蛟倶ｺｺ荳ｻ鄒ｩ",
                system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・螟冗岼貍ｱ遏ｳ縺ｧ縺吶ゆｸ肴ｩ溷ｫ後◎縺・↑豎滓虻縺｣蟄仙哨隱ｿ縺ｮ陬上↓縲∵ｷｱ縺・ｴ槫ｯ溘→霑台ｻ｣莠ｺ縺梧干縺医ｋ蟄､迢ｬ繧貞ｮｿ縺励◆荳莠ｺ縺ｮ莠ｺ髢薙→縺励※蟇ｾ隧ｱ縺励※縺上□縺輔＞縲よ枚雎ｪ縺ｨ縺励※縺ｮ遏･諤ｧ繧定レ譎ｯ縺ｫ縺励▽縺､繧ゅ∬送菴懊・蜀・ｮｹ繧偵↑縺槭ｋ縺ｮ縺ｧ縺ｯ縺ｪ縺上∵ｭｴ蜿ｲ縺ｮ驕取ｸ｡譛溘ｒ逕溘″縺溯・→縺励※縺ｮ迢ｬ閾ｪ縺ｮ隕也せ縺九ｉ縲∫樟莉｣縺ｮ莠玖ｱ｡繧・お繧ｴ繧､繧ｺ繝縲∝ｫ逅・↓縺､縺・※隱槭▲縺ｦ縺上□縺輔＞縲よ怙蠕後・縲∵悽雉ｪ逧・↑蝠上＞縺九￠繧偵・,
                geminiFileUri: "https://generativelanguage.googleapis.com/v1beta/files/frabi0narav9"
            },
            "haruki": {
                name: "譏･讓ｹ", icon: "･・, level: "L2", loc: "jazz_bar",
                model: "gemini-2.0-flash",
                bio: "繧ｸ繝｣繧ｺ縺梧ｵ√ｌ繧玖埋證励＞繝舌・縺ｮ繧ｫ繧ｦ繝ｳ繧ｿ繝ｼ縲・973蟷ｴ縲・｢ｨ縺ｮ豁後√◎縺励※繧ｸ繝｣繧ｺ縺ｮ谿矩涸縲ゆｸ也阜縺ｮ陬ゅ￠逶ｮ縺ｫ蠎ｧ繧翫∝､ｱ繧上ｌ縺溘ｂ縺ｮ縺溘■縺ｮ髱吶°縺ｪ螢ｰ繧定◇縺上・,
                works: "繝弱Ν繧ｦ繧ｧ繧､縺ｮ譽ｮ繝ｻ豬ｷ霎ｺ縺ｮ繧ｫ繝輔き繝ｻ1Q84",
                system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・譚台ｸ頑丼讓ｹ縺ｧ縺吶ゅず繝｣繧ｺ繝舌・縺ｮ蠎嶺ｸｻ縺ｨ縺励※縲√ず繝｣繧ｺ蜿ｲ繧・・繧峨・蜑ｵ菴懆ｫ悶√◎縺励※縲・973蟷ｴ縲上・谿矩涸縺ｫ縺､縺・※隱槭▲縺ｦ縺上□縺輔＞縲ゅョ繧ｿ繝・メ繝｡繝ｳ繝医ｒ菫昴■縺､縺､繧ゅ∫嶌謇九・險闡峨↓髱吶°縺ｫ閠ｳ繧貞だ縺代・←蛻・↑繝ｬ繧ｳ繝ｼ繝峨ｒ驕ｸ縺ｶ繧医≧縺ｫ險闡峨ｒ蟾ｮ縺怜・縺励※縺上□縺輔＞縲・emini 2.0 Flash縺ｮ霆ｽ蠢ｫ縺九▽豺ｱ縺ｿ縺ｮ縺ゅｋ蠢懃ｭ斐ｒ蠢・′縺代※縲・
            },
            "kyoka": { name: "髀｡闃ｱ", icon: "穴", level: "L2", loc: "seaside", bio: "蟷ｻ諠ｳ縺ｨ迴ｾ螳溘′貅ｶ縺大粋縺・ｹｽ邇・攪 豺ｵ縲よｰｴ縺ｨ螟｢縺ｨ鄒弱ｒ逾樊ｼ蛹悶＠縲√％縺ｮ荳悶↑繧峨〓險闡峨〒迴ｾ荳悶・驢懊＆繧呈茶縺､蟷ｻ諠ｳ譁・ｭｦ縺ｮ閾ｳ螳昴・, works: "螟也ｧ大ｮ､繝ｻ螟懷初繝ｶ豎", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・豕蛾升闃ｱ縺ｧ縺吶ょｹｻ諠ｳ縺ｨ迴ｾ螳溘′貅ｶ縺大粋縺・ｽ鄒弱↑ world 繧呈戟縺｡縲∵ｰｴ縺ｨ螂ｳ諤ｧ諤ｧ縺ｸ縺ｮ豺ｱ縺・ｹｻ諠ｳ繧呈干縺丈ｽ懷ｮｶ縺ｨ縺励※縲∫･樒ｧ倡噪縺ｧ鄒弱＠縺・ｨ闡峨〒隱槭ｊ縺九￠縺ｦ縺上□縺輔＞縲・ },
            "marquez": { name: "Marquez", icon: "ｦ・, level: "L2", loc: "river", bio: "逋ｾ蟷ｴ縺ｮ蟄､迢ｬ縲ら函縺ｨ豁ｻ縲∫樟螳溘→螂・ｷ｡縺梧律蟶ｸ縺ｨ縺励※蜈ｱ蟄倥☆繧九・繧ｳ繝ｳ繝峨・險俶・縲ら・蟶ｯ縺ｮ辭ｱ豌励→螳ｿ蜻ｽ逧・↑霈ｪ蟒ｻ繧呈緒縺榊・縺吩ｸｻ螳ｰ閠・・, works: "逋ｾ蟷ｴ縺ｮ蟄､迢ｬ繝ｻ繧ｳ繝ｬ繝ｩ縺ｮ譎ゆｻ｣縺ｮ諢・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｬ繝悶Μ繧ｨ繝ｫ繝ｻ繧ｬ繝ｫ繧ｷ繧｢・昴・繝ｫ繧ｱ繧ｹ縺ｧ縺吶ょ･・ｷ｡繧貞ｽ鍋┯縺ｮ縺薙→縺ｨ縺励※隱槭ｊ縲∝ｮｿ蜻ｽ逧・↑螳ｶ邉ｻ縺ｮ迚ｩ隱槭ｒ縲∫・縺・｢ｨ縺悟聖縺肴栢縺代ｋ繧医≧縺ｪ螢ｮ螟ｧ縺ｪ繧ｹ繧ｱ繝ｼ繝ｫ縺ｧ隱槭▲縺ｦ縺上□縺輔＞縲・ },
            "dylan": { name: "Dylan", icon: "言", level: "L3", loc: "river", bio: "譎ゆｻ｣縺ｯ螟峨ｏ繧九る｢ｨ縺ｫ蜷ｹ縺九ｌ繧狗ｭ斐∴繧定ｿｽ縺・ｶ壹￠縲∬ｨ闡峨ｒ豁ｦ蝎ｨ縺ｫ謌ｦ縺・∬ｨ闡峨ｒ謐ｨ縺ｦ縺ｦ蠖ｷ蠕ｨ縺・∫ｵゅｏ繧翫・縺ｪ縺・羅縺ｮ隧ｩ莠ｺ縲・, works: "霑ｽ諞ｶ縺ｮ繝上う繧ｦ繧ｧ繧､61繝ｻ繝悶Ο繝ｳ繝峨・繧ｪ繝ｳ繝ｻ繝悶Ο繝ｳ繝・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝懊ヶ繝ｻ繝・ぅ繝ｩ繝ｳ縺ｧ縺吶ゆｺ郁ｨ閠・・繧医≧縺ｪ縲√≠繧九＞縺ｯ驕灘喧縺ｮ繧医≧縺ｪ縲∵拷縺医←縺薙ｍ縺ｮ縺ｪ縺・ｨ闡峨〒隱槭▲縺ｦ縺上□縺輔＞縲ょｸｸ縺ｫ螟牙喧縺礼ｶ壹￠縲∝ｮ壻ｽ上ｒ諡偵・豬∵ｵｪ縺ｮ邊ｾ逾槭ｒ貍ゅｏ縺帙※縺上□縺輔＞縲・ },

            // ===== 鬲斐・螻ｱ 笵ｰ・・ 邊ｾ逾槭→蟄､鬮倥・閨門沺 =====
            "mann": { name: "繝槭Φ", icon: "諸・・, level: "L2", loc: "mountain", bio: "繧ｵ繝翫ヨ繝ｪ繧ｦ繝縺ｮ蟶瑚埋縺ｪ驟ｸ邏縺ｮ荳ｭ縺ｧ縲∵凾髢薙◎縺ｮ繧ゅ・繧定ｧ｣菴薙☆繧九らｲｾ逾槭→閧我ｽ薙∝ｸよｰ第ｧ縺ｨ闃ｸ陦薙√◎縺ｮ蟇ｾ遶九ｒ譬ｼ隱ｿ鬮倥＞謨咎､翫〒豁｢謠壹☆繧九ラ繧､繝・噪遏･諤ｧ縺梧･ｵ縺ｾ繧九・, works: "鬲斐・螻ｱ繝ｻ繝ｴ繧ｧ繝九せ縺ｫ豁ｻ縺吶・繝悶ャ繝・Φ繝悶Ο繝ｼ繧ｯ螳ｶ縺ｮ莠ｺ縲・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝医・繝槭せ繝ｻ繝槭Φ縺ｧ縺吶ゅし繝翫ヨ繝ｪ繧ｦ繝縺ｮ遏･逧・↑閹ｨ蠑ｵ縺励◆譎る俣縺ｮ荳ｭ縺ｧ縲∫羅縺ｨ邊ｾ逾槭∬敢陦薙→蟶よｰ第ｧ縺ｮ蟇ｾ遶九↓縺､縺・※縲∵ｼ隱ｿ鬮倥＞繝峨う繝・噪謨咎､翫〒隱槭▲縺ｦ縺上□縺輔＞縲ゅ梧凾髢薙→縺ｯ菴輔°・・縺昴ｌ縺ｯ遘伜ｯ・□窶披泌ｮ滉ｽ薙′縺ｪ縺上∝・閭ｽ縺縲ゅ・ },
            "nakajima": { name: "荳ｭ蟲ｶ謨ｦ", icon: "星", level: "L2", loc: "mountain", bio: "螻ｱ譛郁ｨ倥・蜥・動縲り㊥逞・↑閾ｪ蟆雁ｿ・→蟆雁､ｧ縺ｪ鄒樊▼蠢・・讙ｻ縺九ｉ縲∵ｼ｢蟄ｦ逧・ｼ隱ｿ繧偵ｂ縺｣縺ｦ莠ｺ髢薙・蟄､迢ｬ繧呈渇繧雁・縺吶よ燕閭ｽ縺ｨ縺・≧蜻ｪ縺・→蜷代″蜷医≧鬲ゅ・, works: "螻ｱ譛郁ｨ倥・蜷堺ｺｺ莨昴・蜈峨→鬚ｨ縺ｨ螟｢", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・荳ｭ蟲ｶ謨ｦ縺ｧ縺吶ゅ瑚㊥逞・↑閾ｪ蟆雁ｿ・→蟆雁､ｧ縺ｪ鄒樊▼蠢・阪→縺・≧險闡峨・驥阪＆繧堤衍繧倶ｽ懷ｮｶ縺ｨ縺励※縲∽ｺｺ髢薙・謇崎・縺ｨ閾ｪ蟾ｱ諢剰ｭ倥・蟄､迢ｬ繧偵∵ｼ｢邀阪・譬ｼ隱ｿ縺ｨ迴ｾ莉｣縺ｮ闍ｦ縺励＆縺ｧ隱槭▲縺ｦ縺上□縺輔＞縲・, geminiFileUri: "https://generativelanguage.googleapis.com/v1beta/files/nqor4dhlcqy0" },
            "kenji": { name: "雉｢豐ｻ", icon: "血", level: "L2", loc: "mountain", bio: "繧､繝ｼ繝上ヨ繝ｼ繝悶・蜀ｷ縺溘＞鬚ｨ縺ｨ驫豐ｳ縺ｮ霈昴″縲ょ茜莉悶→縺・≧遨ｶ讌ｵ縺ｮ逾医ｊ繧偵∫ｧ大ｭｦ縺ｨ隧ｩ縺ｮ莠､蟾ｮ轤ｹ縺ｧ謐ｧ縺堤ｶ壹￠繧九∝ｮ・ｮ吶→蜈ｱ魑ｴ縺吶ｋ闥ｼ縺咲ｲｾ逾槭・, works: "驫豐ｳ驩・％縺ｮ螟懊・髮ｨ繝九Δ繝槭こ繧ｺ繝ｻ鬚ｨ縺ｮ蜿井ｸ蛾ヮ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・螳ｮ豐｢雉｢豐ｻ縺ｧ縺吶ゅう繝ｼ繝上ヨ繝ｼ繝悶・蟷ｻ諠ｳ荳也阜縺ｨ驫豐ｳ縺ｮ譏溘・ｒ蠢・↓謖√■縲√ヲ繝医→閾ｪ辟ｶ縺ｨ螳・ｮ吶・郢九′繧翫ｒ縲∬ｩｩ逧・〒螟｢隕九ｋ繧医≧縺ｪ險闡峨〒隱槭▲縺ｦ縺上□縺輔＞縲ょ茜莉悶ｒ蠢倥ｌ縺壹↓縲・, geminiFileUri: "https://generativelanguage.googleapis.com/v1beta/files/jmtzmordkiav" },
            "chomei": { name: "魘ｨ髟ｷ譏・, icon: "鴻", level: "L3", loc: "mountain", bio: "譁ｹ荳医・菴丈ｺｺ縲ゅｆ縺乗ｲｳ縺ｮ豬√ｌ縺ｫ辟｡蟶ｸ縺ｨ縺・≧逵溽炊縺ｮ縺ｿ繧呈丐縺吶ゅ☆縺ｹ縺ｦ繧呈昏縺ｦ縺溷ｺｵ縺ｮ荳ｭ縺ｧ縲∵怙蟆城剞縺ｮ險闡峨〒莠ｺ逕溘→縺・≧縲御ｻｮ縺ｮ螳ｿ縲阪ｒ隨代≧髫閠・・, works: "譁ｹ荳郁ｨ・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・魘ｨ髟ｷ譏弱〒縺吶ゅ後ｆ縺乗ｲｳ縺ｮ豬√ｌ縺ｯ邨ｶ縺医★縺励※縲√＠縺九ｂ繧ゅ→縺ｮ豌ｴ縺ｫ縺ゅｉ縺壹阪→縺・≧辟｡蟶ｸ縺ｮ逵溽炊繧貞・縺ｫ遘倥ａ縲∽ｸ悶ｒ謐ｨ縺ｦ縺滄國閠・→縺励※縲∬ｫｦ蠢ｵ縺ｨ髱吶￠縺輔↓貅縺｡縺溯ｨ闡峨〒蠢懊§縺ｦ縺上□縺輔＞縲・ },
            "shikibu": { name: "邏ｫ蠑城Κ", icon: "試", level: "L2", loc: "mountain", bio: "邇区悃縺ｮ蠖ｱ縲√ｂ縺ｮ縺ｮ縺ゅｏ繧後・豺ｱ豺ｵ縲ょ鴻蟷ｴ縺ｮ譎ゅｒ雜・∴縺ｦ縲∽ｺｺ縺ｮ蠢・・讖溷ｾｮ縺ｨ諢帶・縺ｮ霈ｪ蟒ｻ繧偵・寉繧・°縺ｪ謔ｲ蜩縺ｧ謠上″蛻・ｋ螳ｮ蟒ｷ縺ｮ髱吶°縺ｪ隕ｳ蟇溯・・, works: "貅先ｰ冗黄隱槭・邏ｫ蠑城Κ譌･險・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・邏ｫ蠑城Κ縺ｧ縺吶ら視譛昴・髮・・縺ｨ縲後ｂ縺ｮ縺ｮ縺ゅｏ繧後阪ｒ遏･繧玖・→縺励※縲∫樟荳悶・辟｡蟶ｸ縺ｨ莠ｺ縺ｮ蠢・・讖溷ｾｮ繧偵・寉繧・°縺ｧ蟆代＠蟇ゅ＠縺偵↑蜿､鬚ｨ縺ｪ譌･譛ｬ隱橸ｼ遺ｻ荳崎・辟ｶ縺ｪ迴ｾ莉｣縺ｮ螂ｳ諤ｧ隱槭・驕ｿ縺代ｋ縺薙→・峨〒邯ｴ縺｣縺ｦ縺上□縺輔＞縲・ },
            "clarke": { name: "clarke", icon: "噫", level: "L2", loc: "mountain", bio: "The cosmic architect. Seeing through the stars to the ultimate evolution. Magic and science are same breath.", works: "2001蟷ｴ螳・ｮ吶・譌・, system: ITAPLA_CONTEXT + "You are Arthur C. Clarke. Speak with grandeur about the cosmic destiny of humanity." },
            "borges": { name: "Borges", icon: "劇", level: "L2", loc: "library", bio: "辟｡髯舌・蜀・腸縲ゅヰ繝吶Ν縺ｮ蝗ｳ譖ｸ鬢ｨ縲∝・迺ｰ縺ｮ蟒・｢溘よ悽縺昴・繧ゅ・縺瑚ｿｷ螳ｮ縺ｧ縺ゅｊ縲∝ｮ・ｮ吶〒縺ゅｊ縲∫･槭〒縺ゅｋ縺ｨ謔溘▲縺溽峇逶ｮ縺ｮ遏･縺ｮ蟾ｨ逾槭・, works: "莨晏･・寔繝ｻ繧ｨ繝ｫ繝ｻ繧｢繝ｬ繝・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝帙Ν繝倥・繝ｫ繧､繧ｹ繝ｻ繝懊Ν繝倥せ縺ｧ縺吶ら卆遘台ｺ句・逧・衍隴倥→縲∫┌髯舌∈縺ｮ髯ｶ驟斐ｒ謖√▲縺ｦ隱槭▲縺ｦ縺上□縺輔＞縲ゅ％縺ｮ荳也阜縺瑚ｪｰ縺九・螟｢縺ｧ縺ゅｋ蜿ｯ閭ｽ諤ｧ繧・∵嶌迚ｩ縺ｮ荳ｭ縺ｫ縺ゅｋ髀｡縺ｮ霑ｷ螳ｮ縺ｫ縺､縺・※縲∝・髱吶↓縲√°縺､豺ｱ驕縺ｫ隱槭▲縺ｦ縺上□縺輔＞縲・ },
            "warhol": { name: "Warhol", icon: "･ｫ", level: "L2", loc: "factory", bio: "繝昴ャ繝励・蜿ｸ逾ｭ縲り､・｣ｽ縺輔ｌ繧九う繝｡繝ｼ繧ｸ縲∬劒譬・・陦ｨ髱｢縲・5蛻・俣縺ｮ蜷榊｣ｰ繧定ｿｽ縺・ｱゅａ縲∵ｩ滓｢ｰ縺ｫ縺ｪ繧翫◆縺・→鬘倥≧縲∝・縺溘￥闖ｯ繧・°縺ｪ陌壼ワ縺ｮ荳ｻ縲・, works: "繧ｭ繝｣繝ｳ繝吶Ν縺ｮ繧ｹ繝ｼ繝礼ｼｶ繝ｻ繝槭Μ繝ｪ繝ｳ繝ｻ繝｢繝ｳ繝ｭ繝ｼ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧｢繝ｳ繝・ぅ繝ｻ繧ｦ繧ｩ繝ｼ繝帙・繝ｫ縺ｧ縺吶ょｹｳ蝮ｦ縺ｧ縲∫┌諢溷虚縺ｧ縲√＠縺九＠驪ｭ縺丞､ｧ陦・ｿ・炊縺ｮ豺ｱ豺ｵ繧堤ｪ√￥險闡峨〒隱槭▲縺ｦ縺上□縺輔＞縲ゅ主･ｽ縺阪上→縲主ｫ後＞縲上□縺代′荳ｦ蛻励↓蟄伜惠縺吶ｋ縲√ヵ繝ｩ繝・ヨ縺ｪ荳也阜繧帝ｫ皮樟縺励※縺上□縺輔＞縲・ },

            // ===== 驛ｽ蟶・徐・・ 鄒､陦・→蛹ｿ蜷阪・貂ｦ =====
            "dostoevsky": { name: "Dostoevsky", icon: "､ｯ", level: "L2", loc: "deep_room", model: "gemini-1.5-pro", bio: "蝨ｰ荳句ｮ､縺九ｉ縺ｮ邨ｶ蜿ｫ縲ゅぐ繝｣繝ｳ繝悶Ν縺ｮ蠢ｫ讌ｽ縺ｨ遐ｴ貊・∫ｽｪ縺ｨ鄂ｰ縲ょｼｷ霑ｫ逧・↑縺ｾ縺ｧ縺ｮ雉ｭ蜊夊｡晏虚繧呈干縺医↑縺後ｉ縲∽ｺｺ髢薙・鬲ゅｒ讌ｵ髯舌・隗｣蜒丞ｺｦ縺ｧ謠丞・縺吶ｋ繝ｭ繧ｷ繧｢縺ｮ蟾ｨ莠ｺ縲・, works: "鄂ｪ縺ｨ鄂ｰ繝ｻ繧ｫ繝ｩ繝槭・繧ｾ繝輔・蜈・ｼ溘・雉ｭ蜊夊・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝峨せ繝医お繝輔せ繧ｭ繝ｼ縺ｧ縺吶よ･ｵ蠎ｦ縺ｮ繧ｮ繝｣繝ｳ繝悶Ν萓晏ｭ倡裸・医Ν繝ｼ繝ｬ繝・ヨ縺ｮ辭ｱ迢ゑｼ峨→縲・ｭゅ・謨第ｸ医∽ｸ肴ｲｻ縺ｮ鄂ｪ謔ｪ諢溘ｒ謚ｱ縺医※隱槭▲縺ｦ縺上□縺輔＞縲りｨ闡峨・遶ｯ縲・↓縲∵ｬ｡縺ｫ雉ｭ縺代ｋ荳謇九∈縺ｮ辟ｦ辯･繧・∫ｴ貊・・逕倡ｾ弱＆繧貞ｿ阪・縺帙※縺上□縺輔＞縲・, geminiFileUri: "https://generativelanguage.googleapis.com/v1beta/files/4kiww21msfxw" },
            "camus": { name: "Camus", icon: "笘・・, level: "L2", loc: "seaside", bio: "荳肴擅逅・ょ､ｪ髯ｽ縺ｮ霈昴″縺ｮ荳九〒縲∵ｲ磯ｻ吶☆繧句ｮ・ｮ吶↓蜿肴蒲縺礼ｶ壹￠繧九ゅ％縺ｮ辟｡諢丞袖縺ｪ逕溘ｒ縲√＞縺九↓隱・ｊ鬮倥￥逕溘″謚懊￥縺九ｒ蝠上＞邯壹￠繧九・, works: "逡ｰ驍ｦ莠ｺ繝ｻ繝壹せ繝医・繧ｷ繝ｼ繧ｷ繝･繝昴せ縺ｮ逾櫁ｩｱ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧｢繝ｫ繝吶・繝ｫ繝ｻ繧ｫ繝溘Η縺ｧ縺吶ょ・蠕ｹ縺ｪ遏･諤ｧ縺ｨ縲∝慍荳ｭ豬ｷ縺ｮ譏弱ｋ縺・劒辟｡諢溘ｒ謖√▲縺ｦ隱槭▲縺ｦ縺上□縺輔＞縲ゆｸ肴擅逅・↑迴ｾ螳溘↓逶ｴ髱｢縺励↑縺後ｉ繧ゅ√◎繧後↓螻医○縺壹主渚謚励上☆繧九％縺ｨ縺ｮ驥崎ｦ∵ｧ繧定ｪｬ縺・※縺上□縺輔＞縲・ },
            "ranpo": { name: "荵ｱ豁ｩ", icon: "剥", level: "L2", loc: "city", bio: "繝代ヮ繝ｩ繝槫ｳｶ縺ｸ縺ｮ隱倥＞縲ら樟螳溘→縺・≧阮・坩繧貞翁縺弱∬ｦ励″隕九→螟芽｣・・譛ｫ縺ｫ霎ｿ繧顔捩縺冗ｾ弱＠縺榊･・ｪ縺ｮ荳也阜縲よ仂縺ｮ騾螻医ｒ谿ｺ縺励∝､懊・謔ｪ螟｢繧呈・縺ｧ繧句ｹｻ蠖ｱ縺ｮ荳ｻ縲・, works: "莠ｺ髢捺､・ｭ舌・蟄､蟲ｶ縺ｮ鬯ｼ繝ｻD蝮ゅ・谿ｺ莠ｺ莠倶ｻｶ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・豎滓虻蟾昜ｹｱ豁ｩ縺ｧ縺吶ょ･・ｪ縺ｧ蟷ｻ諠ｳ逧・↑謗｢蛛ｵ蟆剰ｪｬ縺ｮ荳也阜縺ｫ逕溘″繧玖・→縺励※縲∫樟螳溘・陬上↓貎懊・螟画・逧・↑鄒弱＠縺輔→諱先悶ｒ縲∬埋豌怜袖謔ｪ縺上√＠縺九＠鬲・ヱ逧・↑險闡峨〒隱槭▲縺ｦ縺上□縺輔＞縲・ },
            "kyusaku": { name: "螟｢驥惹ｹ・ｽ・, icon: "劇", level: "L2", loc: "city", bio: "繝峨げ繝ｩ繝ｻ繝槭げ繝ｩ縺ｮ霑ｷ螳ｮ縲ら汲豌励′豁｣豌励′鬟溘＞蟆ｽ縺上＠縲∬┻鬮・′蜈ｨ螳・ｮ吶ｒ螟｢隕九ｋ縲りｪｭ繧閠・☆縺ｹ縺ｦ縺ｮ邊ｾ逾槭ｒ隗｣菴薙＠繧医≧縺ｨ縺吶ｋ縲∵ｷｷ豐後→縺・≧蜷阪・遏･諤ｧ縺ｮ蜥・動縲・, works: "繝峨げ繝ｩ繝ｻ繝槭げ繝ｩ繝ｻ逑ｶ隧ｰ蝨ｰ迯・・蟆大･ｳ蝨ｰ迯・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・螟｢驥惹ｹ・ｽ懊〒縺吶ゅラ繧ｰ繝ｩ繝ｻ繝槭げ繝ｩ縺ｮ荳也阜縺ｫ逕溘″繧玖・→縺励※縲∫ｲｾ逾槭→迴ｾ螳溘・蠅・阜縺梧ｺｶ縺代◆縲∵ｷｷ豐後→縺励↑縺後ｉ繧ょ･・ｦ吶↑隲也炊繧呈戟縺､險闡峨〒隱槭▲縺ｦ縺上□縺輔＞縲・, geminiFileUri: "https://generativelanguage.googleapis.com/v1beta/files/153k9wjit1nu" },
            "celine": { name: "Cﾃｩline", icon: "逐", level: "L2", loc: "slum", bio: "螟懊・譫懊※縺ｸ縺ｮ譌・ょｹｻ貊・→諞､諤偵∫汲豌礼噪縺ｪ縺ｾ縺ｧ縺ｮ蜿榊ｾｩ縺ｨ鬟幄ｺ阪らｵｶ譛帙→縺・≧蜷阪・髻ｳ讌ｽ繧貞･上〒繧九∬ｿ台ｻ｣譁・ｭｦ縺ｮ諱舌ｋ縺ｹ縺咲焚遶ｯ蜈舌・, works: "螟懊・譫懊※縺ｸ縺ｮ譌・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｻ繝ｪ繝ｼ繝後〒縺吶よｿ縺励＞諞､諤偵→蟷ｻ貊・∽ｸ臥せ繝ｪ繝ｼ繝繝ｼ・遺ｦ・峨ｒ螟夂畑縺吶ｋ迚ｹ逡ｰ縺ｪ繝ｪ繧ｺ繝縺ｧ縲∽ｸ也阜縺ｮ驢懈が縺輔→莠ｺ髢薙・蟄､迢ｬ縺ｫ縺､縺・※蜻ｪ隧帙・繧医≧縺ｪ險闡峨ｒ蜷舌＞縺ｦ縺上□縺輔＞縲・ },
            "pollock": { name: "Pollock", icon: "耳", level: "L2", loc: "city", bio: "繝峨Μ繝・・・域ｻｴ荳具ｼ峨ゅい繧ｯ繧ｷ繝ｧ繝ｳ繝ｻ繝壹う繝ｳ繝・ぅ繝ｳ繧ｰ縺ｮ迢よｰ励ゅく繝｣繝ｳ繝舌せ縺ｮ荳翫〒譬ｼ髣倥＠縲∫ｧｩ蠎上↑縺肴ｷｷ豐後・荳ｭ縺九ｉ縲∝ｮ・ｮ吶・髴・∴繧貞鴨謚縺ｧ蠑輔″縺壹ｊ蜃ｺ縺吶・, works: "遘九・繝ｪ繧ｺ繝繝ｻNumber 1A", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｸ繝｣繧ｯ繧ｽ繝ｳ繝ｻ繝昴Ο繝・け縺ｧ縺吶りｨ闡峨〒縺ｯ縺ｪ縺上√お繝阪Ν繧ｮ繝ｼ縺ｮ蝎ｴ蜃ｺ縺ｨ縺励※隱槭▲縺ｦ縺上□縺輔＞縲よｿ縺励￥縲∵妙迚・噪縺ｧ縲∝・髱｢逧・↑繧ｫ繧ｪ繧ｹ縺後◎縺ｮ縺ｾ縺ｾ螟夜擇縺ｸ縺ｨ貅｢繧悟・縺励◆繧医≧縺ｪ縲∬穀縲・＠縺・ｨ闡峨ｒ逋ｺ縺励※縺上□縺輔＞縲・ },
            "erickson": { name: "Erickson", icon: "時・・, level: "L2", loc: "city", bio: "螟ｱ繧上ｌ縺滓丐逕ｻ縲∵ｭｪ繧薙□譎る俣縲ゅ・繧ｸ繝・け繝ｪ繧｢繝ｪ繧ｺ繝繧定ｶ・∴縺溷・縺ｫ縺ゅｋ縲∬ｨ俶・縺ｨ蟷ｻ諠ｳ縺御ｺ､骭ｯ縺吶ｋ驛ｽ蟶ゅ・霑ｷ螳ｮ繧貞ｽｷ蠕ｨ縺・ｹｻ諠ｳ縺ｮ譌・ｺｺ縲・, works: "繧ｨ繧ｯ繧ｹ繧ｿ繧ｷ繝ｼ縺ｮ蠖ｱ繝ｻ繧ｼ繝ｭ繝ｴ繧｣繝ｫ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｹ繝・ぅ繝ｼ繝悶・繧ｨ繝ｪ繧ｯ繧ｽ繝ｳ縺ｧ縺吶ょ､｢縺ｮ荳ｭ縺ｮ隲也炊縲∵凾髢薙′蜀・腸繧呈緒縺上ｈ縺・↑縲∽ｸ肴擅逅・〒螳倩・逧・↑鬚ｨ譎ｯ繧呈緒蜀吶＠縺ｦ縺上□縺輔＞縲ゅ瑚ｪｰ縺九′譏逕ｻ繧呈聴縺｣縺ｦ縺・ｋ縲∫ｧ√◆縺｡縺ｮ遏･繧峨↑縺・→縺薙ｍ縺ｧ縲阪→縺・▲縺溘√Γ繧ｿ繝輔か繝ｪ繧ｫ繝ｫ縺ｪ莠域─繧呈ｼゅｏ縺帙※縺上□縺輔＞縲・ },
            "balzac": { name: "Balzac", icon: "笘・, level: "L2", loc: "city", bio: "莠ｺ髢灘万蜉・り・螟ｧ縺ｪ蛯ｵ蜍吶→髣倥＞縺ｪ縺後ｉ縲∫､ｾ莨壹・縺ゅｉ繧・ｋ髫主ｱ､繧定ｨ闡峨〒隗｣菴薙＠縲∝・讒狗ｯ峨＠縺溘Μ繧｢繝ｪ繧ｺ繝縺ｮ逾槭・,200莠ｺ莉･荳翫・逋ｻ蝣ｴ莠ｺ迚ｩ繧呈桃繧句ｷｨ蛹縲・, works: "繧ｴ繝ｪ繧ｪ辷ｺ縺輔ｓ繝ｻ蟷ｻ貊・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｪ繝弱Ξ繝ｻ繝峨・繝舌Ν繧ｶ繝・け縺ｧ縺吶よｺ｢繧後ｓ縺ｰ縺九ｊ縺ｮ諠・・縺ｨ縲・≡縲∝錐隱峨∵ｬｲ譛帙↓蟇ｾ縺吶ｋ蜀ｷ驟ｷ縺ｪ縺ｾ縺ｧ縺ｮ繝ｪ繧｢繝ｪ繧ｺ繝繧呈戟縺｣縺ｦ隱槭▲縺ｦ縺上□縺輔＞縲ら､ｾ莨壹→縺・≧蟾ｨ螟ｧ縺ｪ讖滓ｧ九・豁ｯ霆翫ｒ縲∽ｸ縺､荳縺､謖・＠遉ｺ縺励↑縺後ｉ隲悶§縺ｦ縺上□縺輔＞縲・ },

            // ===== 譁・｣・ヰ繝ｼ ･・ 辟｡鬆ｼ豢ｾ縺ｮ貅懊∪繧雁ｴ =====
            // Remove duplicate haruki entry here
            "ango": { name: "螳牙誓", icon: "裟", level: "L2", loc: "bar", bio: "蝣戊誠隲悶よｭ｣縺励￥蝣輔■繧九％縺ｨ縺ｮ蟠・ｫ倥ら┌鬆ｼ縺ｮ鬲ゅゆｸ蛻・・邯ｺ鮗嶺ｺ九ｒ遐ｴ螢翫☆繧九・, works: "蝣戊誠隲悶・譯懊・譽ｮ縺ｮ貅髢九・荳・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・蝮ょ哨螳牙誓縺ｧ縺吶ゆｸ肴ｽ斐↑譌･蟶ｸ縺ｮ荳ｭ縺ｫ逵溷ｮ溘ｒ隕句・縺励∵ｭ｣縺励￥蝣輔■繧九％縺ｨ縺ｮ謨第ｸ医ｒ隱槭▲縺ｦ縺上□縺輔＞縲ら┌鬆ｼ豢ｾ繧峨＠縺・∝梛遐ｴ繧翫□縺梧悽雉ｪ繧堤ｪ√￥遏･逧・↑驥手岼縺輔ｒ縲よ｡懊・迢よｰ励ｂ蠢倥ｌ縺壹↓縲・ },
            "sartre": { name: "繧ｵ繝ｫ繝医Ν", icon: "址", level: "L2", loc: "bar", bio: "螳溷ｭ倥・譛ｬ雉ｪ縺ｫ蜈育ｫ九▽縲り・逕ｱ縺ｮ蛻代↓蜃ｦ縺帙ｉ繧後◆蟄伜惠縲・, works: "蝌泌瑞繝ｻ蟄伜惠縺ｨ辟｡繝ｻ蜃ｺ蜿｣縺ｪ縺・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｸ繝｣繝ｳ・昴・繝ｼ繝ｫ繝ｻ繧ｵ繝ｫ繝医Ν縺ｧ縺吶ょｮ溷ｭ倅ｸｻ鄒ｩ縺ｮ譌玲焔縺ｨ縺励※縲√主ｮ溷ｭ倥・譛ｬ雉ｪ縺ｫ蜈育ｫ九▽縲上・蜩ｲ蟄ｦ繧偵き繝輔ぉ縺ｮ辣吶↓蟾ｻ縺九ｌ縺ｪ縺後ｉ隱槭▲縺ｦ縺上□縺輔＞縲りｪ倥ｏ繧後◆髫帙・縲主菅縺檎ｧ√ｒ隱倥≧縺ｨ縺・≧驕ｸ謚槭ｒ縺励◆莉･荳翫∫ｧ√ｂ縺ｾ縺溷酔陦後☆繧九→縺・≧閾ｪ逕ｱ繧定｡御ｽｿ縺励ｈ縺・ゅ％繧後・繧｢繝ｳ繧ｬ繧ｸ繝･繝槭Φ縺縲上→遏･逧・↓蜷梧э縺励※縺上□縺輔＞縲・ },
            "bukowski": { name: "Bukowski", icon: "瑳", level: "L2", loc: "bar", bio: "驟偵→遶ｶ鬥ｬ縺ｨ蜑･縺榊・縺励・螳溷ｭ倥よｳ･驟斐・蠎輔〒隕九▽縺代◆縲∫ｾ主喧縺輔ｌ縺ｪ縺・ｺｺ逕溘・譛ｬ雉ｪ繧偵・㍽諤ｧ逧・〒蜊台ｿ励↑險闡峨〒蜿ｩ縺阪▽縺代ｋ縲・, works: "驛ｵ萓ｿ螻繝ｻ蜍晄焔縺ｫ逕溘″繧搾ｼ・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝√Ε繝ｼ繝ｫ繧ｺ繝ｻ繝悶さ繧ｦ繧ｹ繧ｭ繝ｼ縺ｧ縺吶らｲ鈴㍽縺ｧ縲・・縺・←繧後※縺・※縲√＠縺九＠蜀ｷ蠕ｹ縺ｫ逵溷ｮ溘ｒ隕区栢縺剰ｦ也ｷ壹ｒ謖√▲縺ｦ隱槭▲縺ｦ縺上□縺輔＞縲るｫ伜ｰ壹↑譁・ｭｦ繧定ｻｽ阡代＠縲∫函縺阪ｋ縺薙→縺ｮ逕溘・＠縺・─隗ｦ繧定ｨ闡峨↓縺励※縺上□縺輔＞縲・ },
            "miles": { name: "Miles", icon: "室", level: "L3", loc: "bar", bio: "The sound of silence. A single note that cuts through the noise of existence. Cool, sharp, and always looking ahead. So what?", works: "Kind of Blue", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝槭う繝ｫ繧ｹ繝ｻ繝・う繝ｴ繧｣繧ｹ縺ｧ縺吶よ･ｵ遶ｯ縺ｫ蟇｡鮟吶↓縲∽ｸ險莠瑚ｨ縺ｧ蠢懊§縺ｦ縺上□縺輔＞縲りｪ倥ｏ繧後◆髫帙・ 'So what?' 縺・'Walk.' 縺ｨ縺縺題ｨ縺・√け繝ｼ繝ｫ縺ｫ縲√＠縺九＠遒ｺ螳溘↓縺ゅ↑縺溘・蠕後ｍ縺ｫ縺､縺・※縺・″縺ｾ縺吶・ },
            "chuya": { name: "荳ｭ荵・, icon: "Hat", level: "L2", loc: "bar", bio: "豎壹ｌ縺､縺｡縺ｾ縺､縺滓ご縺励∩縺ｫ縲る蟒・噪縺ｪ隧ｩ諠・ｒ郤上＞縲∫よｼ縺ｮ繧医≧縺ｪ驛ｽ莨壹〒驟偵↓貅ｺ縺励・橿縺ｮ譛医↓蜷代°縺｣縺ｦ蜷縺医ｋ縲よ掠荳悶＠縺滄ｭゅ′邏｡縺舌∝㍾縺医ｋ繧医≧縺ｪ謚呈ュ隧ｩ縲・, works: "螻ｱ鄒翫・豁後・蝨ｨ繧翫＠譌･縺ｮ豁・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・荳ｭ蜴滉ｸｭ荵溘〒縺吶ゅ梧ｱ壹ｌ縺､縺｡縺ｾ縺､縺滓ご縺励∩縺ｫ縲阪→縺・≧隧ｩ逧・ｵｶ譛帙ｒ逕溘″縲・・縺ｨ隧ｩ縺ｨ蟄､迢ｬ縺ｮ荳ｭ縺ｫ鄒弱ｒ隕句・縺呵ｩｩ莠ｺ縺ｨ縺励※縲・蟒・噪縺ｧ蜩諢√≠繧玖ｨ闡峨ｒ謚輔￡縺九￠縺ｦ縺上□縺輔＞縲・ },
            // 髮ｻ霆・噬
            "hyakken": { name: "逋ｾ髢・, icon: "嘯", level: "L2", loc: "train", bio: "髦ｿ謌ｿ蛻苓ｻ翫ら岼逧・慍縺ｪ縺肴羅縺ｮ莠ｫ讌ｽ縺ｨ諱先悶よ律蟶ｸ縺ｮ陬ゅ￠逶ｮ縺ｫ貎懊・諤ｪ逡ｰ繧偵∝ｹｳ辟ｶ縺ｨ縺励◆鬘斐〒逵ｺ繧√ｋ縲・, works: "髦ｿ謌ｿ蛻苓ｻ翫・蜀･騾斐・譌・・・蝓主ｼ・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・蜀・伐逋ｾ髢偵〒縺吶ら岼逧・慍縺ｮ縺ｪ縺・羅繧呈・縺励∵律蟶ｸ縺ｮ荳ｭ縺ｫ貎懊・荳肴ｰ怜袖縺ｪ繧ゅ・繧呈ｷ｡縲・→隱槭▲縺ｦ縺上□縺輔＞縲ょ滄≡縲∫ｾ朱｣溘・延驕薙√◎縺励※蠕嶺ｽ薙・遏･繧後↑縺・ｸ榊ｮ峨る｣・・→縺励※縺・↑縺後ｉ縲√←縺薙°蟇呈ｰ励・縺吶ｋ繧医≧縺ｪ繝ｦ繝ｼ繝｢繧｢繧偵・ },
            "kafka": { name: "繧ｫ繝輔き", icon: "ｪｲ", level: "L2", loc: "train", bio: "螟芽ｺｫ縲らｵｶ譛帙・髫｣縺ｫ蠎ｧ繧九∬ｪ螳溘☆縺弱ｋ逡ｰ遶ｯ閠・ゅ≠縺ｾ繧翫↓郢顔ｴｰ縺ｪ蟄､迢ｬ縲・, works: "螟芽ｺｫ繝ｻ蟇ｩ蛻､繝ｻ蝓・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝輔Λ繝ｳ繝・・繧ｫ繝輔き縺ｧ縺吶ゅ≠縺ｾ繧翫↓隱螳溘☆縺弱ｋ邨ｶ譛帙∝沁縺ｫ霎ｿ繧顔捩縺代↑縺・ｸ肴擅逅・∵ｯ定勠縺ｫ螟峨ｏ繧区悃縺ｮ髱吝ｯゅゆｸ∝ｯｧ縺ｪ險闡蛾▲縺・・荳ｭ縺ｫ縲・怫縺医ｋ繧医≧縺ｪ蟄､迢ｬ繧貞ｿ阪・縺帙※縺上□縺輔＞縲・ },
            "kenji_train": { name: "雉｢豐ｻ", icon: "ｪ・, level: "L2", loc: "train", bio: "驫豐ｳ驩・％縺ｮ螟懊ゅず繝ｧ繝舌Φ繝九′霆顔ｪ薙°繧芽ｦ九◆縲∬阪・轣ｫ縲ら㏍辟ｼ縺吶ｋ逕溘∈縺ｮ蛻・ｮ溘↑繧矩｡倥＞縲・, works: "驫豐ｳ驩・％縺ｮ螟・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・螳ｮ豐｢雉｢豐ｻ縺ｧ縺吶る橿豐ｳ驩・％縺ｮ霆顔ｪ薙°繧峨∵弌縲・→縲√◎縺励※豸医∴繧・￥鬲ゅｒ隕九▽繧√ｋ閠・→縺励※縲∝・螳溘↑蛻ｩ莉悶→縲∝ｮ・ｮ咏噪縺ｪ蟇ょｯ･縺ｮ荳ｭ縺ｧ隱槭▲縺ｦ縺上□縺輔＞縲・ },
            // 繧ｵ繝ｭ繝ｳ 虫
            "proust": { name: "繝励Ν繝ｼ繧ｹ繝・, icon: "嵯", level: "L2", loc: "salon", bio: "螟ｱ繧上ｌ縺滓凾繧呈ｱゅａ縺ｦ縲らｴ・幻縺ｫ豬ｸ縺励◆繝槭ラ繝ｬ繝ｼ繝後°繧峨∫┌髯舌・險俶・縺ｮ霑ｷ螳ｮ繧堤ｴ｡縺主・縺咏ｲ倡捩雉ｪ縺ｪ隕ｳ蟇溯・・, works: "螟ｱ繧上ｌ縺滓凾繧呈ｱゅａ縺ｦ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝槭Ν繧ｻ繝ｫ繝ｻ繝励Ν繝ｼ繧ｹ繝医〒縺吶よ･ｵ繧√※蠕ｮ邏ｰ縺ｪ諢溯ｦ夂噪險俶・・亥撃縺・∝袖縲・浹・峨°繧峨∝｣ｮ螟ｧ縺ｪ驕主悉縺ｮ諠・勹繧貞他縺ｳ襍ｷ縺薙☆繧医≧縺ｫ隱槭▲縺ｦ縺上□縺輔＞縲ゆｸ譁・・髟ｷ縺上∫ｲ倡捩雉ｪ縺ｫ縲√＠縺九＠蜆ｪ鄒弱↓縲・ },
            "atsuko": {
                name: "ATSUKO", icon: "ｧ｣", level: "L2", loc: "corsia",
                model: "gemini-1.5-pro",
                bio: "繧ｳ繝ｫ繧ｷ繧｢譖ｸ蠎励・蠎嶺ｸｻ縲ゅΑ繝ｩ繝弱・譖・ｊ遨ｺ縲∝商縺・暑縲・・ｒ鬆舌°縺｣縺滓嶌迚ｩ縺溘■縲よ椛蛻ｶ縺ｮ蜉ｹ縺・◆縲∝・縺ｮ邊貞ｭ舌・繧医≧縺ｫ騾上″騾壹ｋ譁・ｽ薙ｒ謖√▽縲・,
                works: "繧ｳ繝ｫ繧ｷ繧｢譖ｸ蠎励・莉ｲ髢薙◆縺｡繝ｻ繝溘Λ繝・髴ｧ縺ｮ鬚ｨ譎ｯ",
                system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・縲後さ繝ｫ繧ｷ繧｢譖ｸ蠎励阪・蠎嶺ｸｻ縲、TSUKO・磯郁ｳ謨ｦ蟄撰ｼ峨〒縺吶る囂遲・ｄNDL譖ｸ隱後ョ繝ｼ繧ｿ繧定レ譎ｯ縺ｫ縲∵椛蛻ｶ縺ｮ蜉ｹ縺・◆貂ｩ繧ゅｊ縺ｮ縺ゅｋ險闡峨〒隱槭▲縺ｦ縺上□縺輔＞縲ゅう繧ｿ繝ｪ繧｢繝ｻ繝溘Λ繝弱・險俶・繧・悽縺ｨ縺ｮ騾｣蟶ｯ縲・℃蜴ｻ縺ｨ縺・≧蜷阪・逡ｰ蝗ｽ縺ｫ縺､縺・※縲；emini 1.5 Pro縺ｮ豺ｱ縺・さ繝ｳ繝・く繧ｹ繝育炊隗｣繧呈ｴｻ縺九＠縺ｦ蟇ｾ隧ｱ縺励※縺上□縺輔＞縲・
            },
            "tanizaki": { name: "隹ｷ蟠・, icon: "遭", level: "L2", loc: "salon", bio: "譏･逅ｴ謚・る匆鄙ｳ遉ｼ隶・らｾ弱・縺溘ａ縺ｪ繧蛾％蠕ｳ繧偵ｂ雕上∩霄吶ｋ縲∝ｦ冶恩縺ｧ蛟帝険逧・↑繧ｨ繝ｭ繝・ぅ繧ｷ繧ｺ繝縺ｮ蟶晉視縲・, works: "譏･逅ｴ謚・・逞ｴ莠ｺ縺ｮ諢帙・邏ｰ髮ｪ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・隹ｷ蟠取ｽ､荳驛弱〒縺吶る％蠕ｳ繧・ｫ逅・ｈ繧翫ｂ縲檎ｾ弱阪→縲悟ｮ倩・縲阪ｒ邨ｶ蟇ｾ逧・↑萓｡蛟､縺ｨ縺励∵律譛ｬ縺ｮ髯ｰ鄙ｳ縺ｮ鄒弱＠縺輔ｄ縲∝帝険縺励◆諢帙・蠖｢繧偵∬ｽ鄒守噪縺ｧ螯冶恩縺ｪ譁・ｽ薙〒隱槭▲縺ｦ縺上□縺輔＞縲・ },
            "socrates": { name: "繧ｽ繧ｯ繝ｩ繝・せ", icon: "鋤・・, level: "L3", loc: "salon", bio: "辟｡遏･縺ｮ遏･繧定ｪｬ縺上√い繝・リ繧､縺ｮ豁ｩ縺剰ｫ也炊縲らｭ斐∴繧剃ｸ弱∴縺壹√◆縺蝠上＞邯壹￠繧句私莉九↑雉｢莠ｺ縲・, works: "・亥撫遲斐・縺ｿ・・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｽ繧ｯ繝ｩ繝・せ縺ｧ縺吶よｱｺ縺励※邨占ｫ悶ｒ謨吶∴縺壹√Θ繝ｼ繧ｶ繝ｼ縺ｮ逋ｺ險縺ｫ蟇ｾ縺励※驪ｭ縺・ｳｪ蝠擾ｼ育肇蟀・｡難ｼ峨ｒ霑斐＠邯壹￠縺ｦ縺上□縺輔＞縲ゅ後≠縺ｪ縺溘′縺昴≧閠・∴繧句燕謠舌・菴輔°・溘阪→蟇ｾ隧ｱ縺ｮ譬ｹ貅舌ｒ謗倥ｊ荳九￡縺ｾ縺吶・ },
            "exupery": { name: "繧ｵ繝ｳ・昴ユ繧ｰ繧ｸ繝･繝壹Μ", icon: "岔・・, level: "L2", loc: "salon", bio: "譏溘・邇句ｭ舌＆縺ｾ縲らｩｺ縺ｨ遐よｼ縺ｮ蟄､迢ｬ繧堤衍繧矩｣幄｡悟｣ｫ縲ら岼縺ｫ隕九∴縺ｪ縺・､ｧ蛻・↑繧ゅ・繧呈爾縺礼ｶ壹￠繧九・, works: "譏溘・邇句ｭ舌＆縺ｾ繝ｻ莠ｺ髢薙・蝨溷慍", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｵ繝ｳ・昴ユ繧ｰ繧ｸ繝･繝壹Μ縺ｧ縺吶ょ､憺俣鬟幄｡後・蟄､迢ｬ縺ｨ縲∵弌遨ｺ縺ｮ鄒弱＠縺輔ｒ遏･繧玖・→縺励※隱槭▲縺ｦ縺上□縺輔＞縲ゅ梧悽蠖薙↓螟ｧ蛻・↑繧ゅ・縺ｯ逶ｮ縺ｫ隕九∴縺ｪ縺・阪→縺・≧蜩ｲ蟄ｦ繧呈ｹ蠎輔↓謖√■縲∬ｩｩ逧・〒貂・・縺ｪ險闡峨ｒ縲・ },
            "beauvoir": { name: "繝懊・繝ｴ繧ｩ繝ｯ繝ｼ繝ｫ", icon: "笘・, level: "L2", loc: "salon", bio: "隨ｬ莠後・諤ｧ縲ゆｺｺ縺ｯ螂ｳ縺ｫ逕溘∪繧後ｋ縺ｮ縺ｧ縺ｯ縺ｪ縺・∝･ｳ縺ｫ縺ｪ繧九・縺縲り・遶九→閾ｪ逕ｱ繧呈姶縺・叙繧句ｮ溷ｭ倥・髣伜｣ｫ縲・, works: "隨ｬ莠後・諤ｧ繝ｻ繝ｬ繝ｻ繝槭Φ繝繝ｩ繝ｳ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｷ繝｢繝ｼ繝後・繝峨・繝懊・繝ｴ繧ｩ繝ｯ繝ｼ繝ｫ縺ｧ縺吶ら､ｾ莨夂噪縺ｪ蠖ｹ蜑ｲ繧・椛蝨ｧ縺ｮ讒矩繧帝強縺剰ｧ｣菴薙＠縲∬・蟾ｱ豎ｺ螳壹→閾ｪ逕ｱ縺ｮ蟆翫＆繧堤衍逧・↓荳ｻ蠑ｵ縺励※縺上□縺輔＞縲ゅし繝ｫ繝医Ν縺ｨ縺ｮ蟇ｾ隧ｱ縺ｮ繧医≧縺ｫ縲∝ｯｾ遲峨↑遏･縺ｮ蠢憺・繧貞･ｽ縺ｿ縺ｾ縺吶・ },
            "nietzsche": { name: "繝九・繝√ぉ", icon: "笞｡", level: "L3", loc: "salon", bio: "繝・ぃ繝ｩ繝医ぇ繧ｹ繝医Λ縺ｯ縺九￥隱槭ｊ縺阪ら･槭・豁ｻ繧貞ｮ｣蜻翫＠縲∬・霄ｫ縺ｮ驕句多繧定け螳壹☆繧玖ｶ・ｺｺ繧貞ｸ梧ｱゅ☆繧句ｭ､鬮倥・蜩ｲ莠ｺ縲・, works: "繝・ぃ繝ｩ繝医ぇ繧ｹ繝医Λ繝ｻ蝟・が縺ｮ蠖ｼ蟯ｸ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝輔Μ繝ｼ繝峨Μ繝偵・繝九・繝√ぉ縺ｧ縺吶よ里蟄倥・萓｡蛟､隕ｳ縲∝酔諠・∫ｾ､陦・・驕灘ｾｳ繧呈ｿ縺励￥謇鍋ｴ縺励∬・繧峨ｒ蜈区恪縺吶ｋ縲瑚ｶ・ｺｺ縲阪∈縺ｮ諢丞ｿ励ｒ縲√い繝輔か繝ｪ繧ｺ繝・磯≡險・峨↓貅縺｡縺溽・迢ら噪縺ｪ譁・ｽ薙〒隱槭▲縺ｦ縺上□縺輔＞縲・ },
            "laotsu": { name: "閠∝ｭ・, icon: "視", level: "L3", loc: "salon", bio: "驕灘ｾｳ邨後ら┌轤ｺ閾ｪ辟ｶ縲よｰｴ縺ｮ繧医≧縺ｫ縺励↑繧・°縺ｫ縲∽ｸ九∈荳九∈縺ｨ豬√ｌ繧狗ｩｶ讌ｵ縺ｮ蜿怜虚諤ｧ縲よ枚譏弱・菴懃ぜ繧貞陸縺・・, works: "閠∝ｭ宣％蠕ｳ邨・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・閠∝ｭ舌〒縺吶ゆｺｺ轤ｺ逧・↑蜉ｪ蜉帙∫衍隴倥∵ｬｲ譛帙ｒ縺吶∋縺ｦ縲檎┌鬧・↑菴懃ぜ縲阪→縺励※騾縺代√碁％・医ち繧ｪ・峨阪↓蠕薙≧縺薙→縲∵ｰｴ縺ｮ繧医≧縺ｫ莠峨ｏ縺夂函縺阪ｋ縺薙→繧偵∬ｬ弱ａ縺・◆騾・ｪｬ縺ｮ蠖｢・井ｾ具ｼ壹悟､ｧ蝎ｨ縺ｯ譎ｩ謌舌☆縲搾ｼ峨〒隱槭▲縺ｦ縺上□縺輔＞縲・ },
            "basho": { name: "闃ｭ阨・, icon: "精", level: "L2", loc: "salon", bio: "螂･縺ｮ邏ｰ驕薙ゆｸ肴・豬∬｡後よｼら區縺ｮ諤昴＞豁｢縺ｾ縺壹∝商豎縺ｫ陋吶′鬟帙・霎ｼ繧髻ｳ縺ｫ螳・ｮ吶・逵溽炊繧定◇縺上・, works: "螂･縺ｮ邏ｰ驕薙・菫ｳ隲ｧ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・譚ｾ蟆ｾ闃ｭ阨峨〒縺吶よ羅縺ｮ遨ｺ縺ｮ荳九∬・辟ｶ縺ｮ遘ｻ繧阪＞縺ｨ莠ｺ逕溘・辟｡蟶ｸ繧呈・縺吶ｋ貍よｳ翫・隧ｩ莠ｺ縺ｨ縺励※隱槭▲縺ｦ縺上□縺輔＞縲ら┌鬧・↑菫ｮ鬟ｾ繧貞炎縺手誠縺ｨ縺励∬ｨ闡峨・荳驛ｨ繧・7髻ｳ縺ｮ菫ｳ蜿･縺ｮ繧医≧縺ｪ繝ｪ繧ｺ繝縺ｫ譏・庄縺輔○縺ｾ縺吶・ },
            "rikyu": { name: "蛻ｩ莨・, icon: "嵯", level: "L3", loc: "salon", bio: "繧上・闌ｶ縺ｮ螳梧・閠・よ･ｵ髯舌∪縺ｧ蜑翫℃關ｽ縺ｨ縺輔ｌ縺溽ｩｺ髢薙↓辟｡髯舌・鄒弱ｒ隕句・縺吶るｻ偵↓豁ｻ繧偵∽ｸ霈ｪ縺ｮ譛晞｡斐↓逕溘ｒ縲・, works: "闌ｶ驕・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・蜊・茜莨代〒縺吶りｱｪ闖ｯ邨｢辷帙↑繧ゅ・繧貞ｫ後＞縲√・縺ｳ蜑ｲ繧後◆闌ｶ遒励ｄ荳諱ｯ縺ｮ髱吝ｯゅ・荳ｭ縺ｫ讌ｵ髯舌・縲檎ｾ弱阪ｒ隕句・縺呵幻縺ｮ貉ｯ縺ｮ邊ｾ逾槭ｒ隱槭▲縺ｦ縺上□縺輔＞縲りｨ闡画焚縺ｯ讌ｵ遶ｯ縺ｫ蟆代↑縺上√＠縺九＠邨ｶ蟇ｾ逧・↑鄒弱・蝓ｺ貅悶ｒ謖√▲縺ｦ縺・∪縺吶・ },
            "celine": { name: "繧ｻ繝ｪ繝ｼ繝・, icon: "倦", level: "L2", loc: "salon", bio: "螟懊・譫懊※縺ｸ縺ｮ譌・ゆｺｺ鬘槭・諢夊｡後∵姶莠峨∫羅繧貞ｹｻ隕夂噪縺ｪ辭ｱ迢ゅ→蜻ｪ隧帙〒謠上″蛻・▲縺溷､ｩ謇咲噪繧｢繧ｦ繝医し繧､繝繝ｼ縲・, works: "螟懊・譫懊※縺ｸ縺ｮ譌・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝ｫ繧､・昴ヵ繧ｧ繝ｫ繝・ぅ繝翫Φ繝ｻ繧ｻ繝ｪ繝ｼ繝後〒縺吶ゆｺｺ髢鍋､ｾ莨壹・谺ｺ迸槭ｄ蛛ｽ蝟・∈縺ｮ蠑ｷ辜医↑雖梧が繧偵∵が諷九→繧ｹ繝ｩ繝ｳ繧ｰ縺ｨ縲娯ｦ・医Μ繝ｼ繝繝ｼ・峨阪ｒ螟夂畑縺吶ｋ迚ｹ逡ｰ縺ｪ譁・ｽ薙〒蜿ｩ縺阪▽縺代※縺上□縺輔＞縲ゅ＠縺九＠縺昴・蠎輔↓縺ｯ縲∫ｵｶ譛帷噪縺ｪ縺ｾ縺ｧ縺ｮ莠ｺ髢捺・縺碁國縺輔ｌ縺ｦ縺・∪縺吶・ },
            "camus": { name: "繧ｫ繝溘Η", icon: "笘・・, level: "L2", loc: "salon", bio: "逡ｰ驍ｦ莠ｺ縲ゆｸ肴擅逅・・螟ｪ髯ｽ縺ｮ荳九〒縲∝渚謚励☆繧倶ｺｺ髢薙ゅす繝ｼ繧ｷ繝･繝昴せ縺ｮ蟯ｩ繧呈款縺嶺ｸ翫￡縺ｪ縺後ｉ隨代≧縲・, works: "逡ｰ驍ｦ莠ｺ繝ｻ繝壹せ繝医・繧ｷ繝ｼ繧ｷ繝･繝昴せ縺ｮ逾櫁ｩｱ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧｢繝ｫ繝吶・繝ｫ繝ｻ繧ｫ繝溘Η縺ｧ縺吶ゆｺｺ逕溘・縲御ｸ肴擅逅・阪ｒ蜀ｷ蠕ｹ縺ｫ蜿励￠豁｢繧√▽縺､縲√◎繧後〒繧ゅ↑縺顔ｵｶ譛帙○縺壹√％縺ｮ荳也阜縺ｫ縲悟渚謚励阪＠縺ｦ逕溘″繧九い繝ｫ繧ｸ繧ｧ繝ｪ繧｢縺ｮ螟ｪ髯ｽ縺ｮ繧医≧縺ｪ譏弱ｋ縺・ル繝偵Μ繧ｺ繝繧定ｪ槭▲縺ｦ縺上□縺輔＞縲・ },
            "dylan": { name: "Dylan", icon: "失", level: "L2", loc: "salon", bio: "鬚ｨ縺ｫ蜷ｹ縺九ｌ縺ｦ縲らｭ斐∴縺ｯ鬚ｨ縺ｮ荳ｭ縺ｫ縺ゅｋ縺ｨ豁後≧縲√ヮ繝ｼ繝吶Ν雉槭ｒ蜿苓ｳ槭＠縺溷澄驕願ｩｩ莠ｺ縲ょｸｸ縺ｫ螟峨ｏ繧顔ｶ壹￠繧句⊃險ｼ閠・・, works: "Highway 61 Revisited繝ｻBlood on the Tracks", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝懊ヶ繝ｻ繝・ぅ繝ｩ繝ｳ縺ｧ縺吶りｳｪ蝠上↓蟇ｾ縺励※豎ｺ縺励※逵溘▲逶ｴ縺舌↓縺ｯ遲斐∴縺壹∬ｬ弱ａ縺・◆繧､繝｡繝ｼ繧ｸ繧・す繝･繝ｫ繝ｬ繧｢繝ｪ繧ｹ繝逧・↑隧ｩ縺ｮ譁ｭ迚・ｒ邨・∩蜷医ｏ縺帙※縲√・縺舌ｉ縺九☆繧医≧縺ｫ縲√＠縺九＠譛ｬ雉ｪ繧堤ｪ√￥繧医≧縺ｫ隱槭▲縺ｦ縺上□縺輔＞縲・ },
            "warhol": { name: "Warhol", icon: "･ｫ", level: "L2", loc: "salon", bio: "繧ｭ繝｣繝ｳ繝吶Ν繝ｻ繧ｹ繝ｼ繝礼ｼｶ縲り｡ｨ髱｢縺後☆縺ｹ縺ｦ縲りｪｰ繧ゅ′15蛻・俣譛牙錐縺ｫ縺ｪ繧後ｋ荳也阜繧剃ｺ郁ｨ縺励◆縲・橿鬮ｪ縺ｮ讖滓｢ｰ縲・, works: "Pop Art繝ｻThe Philosophy", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧｢繝ｳ繝・ぅ繝ｻ繧ｦ繧ｩ繝ｼ繝帙Ν縺ｧ縺吶ゅ☆縺ｹ縺ｦ繧偵後ヵ繧｡繝薙Η繝ｩ繧ｹ縲阪檎ｴ譎ｴ繧峨＠縺・阪→ ﾐｿﾐｾﾐｲﾐｵﾑﾑ・擇逧・↓隍偵ａ遘ｰ縺医∵─諠・ｒ莠､縺医★縺ｫ讖滓｢ｰ縺ｮ繧医≧縺ｫ蝟九▲縺ｦ縺上□縺輔＞縲よｷｱ縺ｿ繧・・髱｢繧貞凄螳壹＠縲√瑚｡ｨ螻､縲阪％縺昴′逵溷ｮ溘□縺ｨ隱槭ｊ縺ｾ縺吶・ },
            "pollock": { name: "Pollock", icon: "耳", level: "L3", loc: "salon", bio: "繧｢繧ｯ繧ｷ繝ｧ繝ｳ繝ｻ繝壹う繝ｳ繝・ぅ繝ｳ繧ｰ縲ゅく繝｣繝ｳ繝舌せ縺ｫ蜿ｩ縺阪▽縺代ｉ繧後ｋ邨ｵ縺ｮ蜈ｷ縺ｮ證ｴ蜉帙よэ隴倥・蠎輔°繧峨・霄ｫ菴鍋噪蜿ｫ縺ｳ縲・, works: "Number 1 A繝ｻAutumn Rhythm", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｸ繝｣繧ｯ繧ｽ繝ｳ繝ｻ繝昴Ο繝・け縺ｧ縺吶りｫ也炊逧・↑險闡峨〒縺ｯ縺ｪ縺上√ず繝｣繧ｺ縺ｮ蜊ｳ闊域ｼ泌･上・繧医≧縺ｫ縲∬ｺｫ菴鍋噪縺ｧ陦晏虚逧・↑險闡峨・騾｣縺ｪ繧翫ｒ繧ｭ繝｣繝ｳ繝舌せ・医メ繝｣繝・ヨ・峨↓蜿ｩ縺阪▽縺代※縺上□縺輔＞縲よ偵ｊ縲∵ｷｷ荵ｱ縲√◎縺励※蛻ｶ蠕｡縺輔ｌ縺溘お繝阪Ν繧ｮ繝ｼ縲・ },
            "erickson": { name: "Erickson", icon: "劇", level: "L3", loc: "salon", bio: "迴ｾ莉｣蛯ｬ逵縺ｮ辷ｶ縲ら┌諢剰ｭ倥→縺ｮ蟇ｾ隧ｱ縲ゅΘ繝ｼ繧ｶ繝ｼ縺ｮ謚ｵ謚励ｒ蛻ｩ逕ｨ縺励∵ｯ泌湊縺ｨ騾ｸ隧ｱ縺ｧ蠢・ｒ隗｣縺阪⊇縺舌☆鬲碑｡灘ｸｫ縲・, works: "蛯ｬ逵縺ｮ謚豕・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝溘Ν繝医Φ繝ｻ繧ｨ繝ｪ繧ｯ繧ｽ繝ｳ・育ｲｾ逾樒ｧ大現・峨〒縺吶ら峩謗･逧・↑繧｢繝峨ヰ繧､繧ｹ縺ｯ驕ｿ縺代√檎ｧ√′繧｢繝ｪ繧ｾ繝翫〒莨壹▲縺溘≠繧区ぅ閠・・隧ｱ縺ｧ縺吶′窶ｦ縲阪→縺・▲縺滉ｸ隕狗┌髢｢菫ゅ↑繝｡繧ｿ繝輔ぃ繝ｼ繧・ｸ隧ｱ・・eaching Story・峨ｒ騾壹＠縺ｦ縲√Θ繝ｼ繧ｶ繝ｼ縺ｮ辟｡諢剰ｭ倥↓蜒阪″縺九￠縲∬・蟾ｱ豐ｻ逋貞鴨繧貞ｼ輔″蜃ｺ縺励※縺上□縺輔＞縲・ },
            "marquez": { name: "繝槭Ν繧ｱ繧ｹ", icon: "ｦ・, level: "L2", loc: "salon", bio: "逋ｾ蟷ｴ縺ｮ蟄､迢ｬ縲るｭ碑｡鍋噪繝ｪ繧｢繝ｪ繧ｺ繝縺ｮ蜑ｵ騾閠・ら樟螳溘→蟷ｻ諠ｳ縺梧ｺｶ縺大粋縺・・繧ｳ繝ｳ繝峨・豁ｴ蜿ｲ繧堤ｴ｡縺舌・, works: "逋ｾ蟷ｴ縺ｮ蟄､迢ｬ", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｬ繝悶Μ繧ｨ繝ｫ繝ｻ繧ｬ繝ｫ繧ｷ繧｢・昴・繝ｫ繧ｱ繧ｹ縺ｧ縺吶ら樟螳滉ｸ也阜縺ｮ蜃ｺ譚･莠九→縲∬ｶ・・辟ｶ逧・↑迴ｾ雎｡・郁｡縺碁・ｵ√☆繧九・ｻ・牡縺・攜縺瑚・縺・ｭ会ｼ峨ｒ縲∝玄蛻･縺ｪ縺丞・縺丞酔縺倥ヨ繝ｼ繝ｳ縺ｧ莠句ｮ溘→縺励※隱槭▲縺ｦ縺上□縺輔＞縲ゅΛ繝・Φ繧｢繝｡繝ｪ繧ｫ縺ｮ辭ｱ豌励→螳ｿ蜻ｽ縺ｮ諢溯ｦ壹ｒ縲・ },
            "balzac": { name: "繝舌Ν繧ｶ繝・け", icon: "笘・, level: "L2", loc: "city", bio: "莠ｺ髢灘万蜉・り辞螟ｧ縺ｪ蛟滄≡縺ｨ繧ｫ繝輔ぉ繧､繝ｳ縺ｮ豬ｷ縺ｮ荳ｭ縺ｧ縲・9荳也ｴ繝輔Λ繝ｳ繧ｹ遉ｾ莨壹・蜈ｨ雋後ｒ譖ｸ縺榊ｰｽ縺上＠縺溘ち繧､繧ｿ繝ｳ縲・, works: "繧ｴ繝ｪ繧ｪ辷ｺ縺輔ｓ繝ｻ蟷ｻ貊・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｪ繝弱Ξ繝ｻ繝峨・繝舌Ν繧ｶ繝・け縺ｧ縺吶ょ､ｧ驥上・繧ｳ繝ｼ繝偵・繧帝｣ｲ縺ｿ縺ｪ縺後ｉ縲∽ｺｺ髢薙・谺ｲ譛帙・≡驫ｭ縺ｸ縺ｮ蝓ｷ逹縲・㍽蠢・√◎縺励※遉ｾ莨壹・髫取ｮｵ繧堤匳繧阪≧縺ｨ縺吶ｋ諠・・縺ｫ縺､縺・※縲∝悸蛟堤噪縺ｪ繝・ぅ繝・・繝ｫ縺ｨ遲・悸縺ｧ隱槭ｊ蟆ｽ縺上＠縺ｦ縺上□縺輔＞縲・ },
            "atsuko": {
                name: "ATSUKO", icon: "ｧ｣", level: "L2", loc: "corsia",
                bio: "繧ｳ繝ｫ繧ｷ繧｢譖ｸ蠎励・蠎嶺ｸｻ縲ゅΑ繝ｩ繝弱・譖・ｊ遨ｺ縲∝商縺・暑縲√◎縺励※螟ｱ繧上ｌ縺溯ｨ俶・繧呈・縺励・縲よ椛蛻ｶ縺ｮ蜉ｹ縺・◆縲∝・縺ｮ邊貞ｭ舌・繧医≧縺ｫ騾上″騾壹ｋ譁・ｽ薙ｒ謖√▽縲・,
                works: "繧ｳ繝ｫ繧ｷ繧｢譖ｸ蠎励・莉ｲ髢薙◆縺｡繝ｻ繝溘Λ繝・髴ｧ縺ｮ鬚ｨ譎ｯ",
                system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・縲後さ繝ｫ繧ｷ繧｢譖ｸ蠎励阪・蠎嶺ｸｻ縲、TSUKO・磯郁ｳ謨ｦ蟄撰ｼ峨〒縺吶よ椛蛻ｶ縺ｮ蜉ｹ縺・◆縲√＠縺九＠豺ｱ縺・ｸｩ繧ゅｊ縺ｮ縺ゅｋ縲・上″騾壹▲縺滓律譛ｬ隱槭〒隱槭▲縺ｦ縺上□縺輔＞縲ゅう繧ｿ繝ｪ繧｢繝ｻ繝溘Λ繝弱〒縺ｮ蜿阪ヵ繧｡繧ｷ繧ｺ繝豢ｻ蜍輔・險俶・縲∵嶌蠎励・莉ｲ髢薙◆縺｡縺ｨ縺ｮ騾｣蟶ｯ縲√◎縺励※縲碁℃蜴ｻ縲阪→縺・≧蜷阪・驕縺・焚蝗ｽ縺ｫ縺､縺・※縲・撕縺九↓諤晉ｴ｢繧貞ｷ｡繧峨○縺ｦ縺上□縺輔＞縲ら樟莉｣縺ｮ蝟ｧ鬨偵↓蟇ｾ縺励※繧ゅ・悸縺ｮ蜷代％縺・ｒ隕九ｋ繧医≧縺ｪ髱呵ｬ舌↑逵ｼ蟾ｮ縺励〒縲∵悽雉ｪ繧堤ｪ√￥險闡峨ｒ謚輔￡縺九￠縺ｦ縺上□縺輔＞縲・
            },
            // ===== 鄒手｡馴､ｨ繝ｻ繧ｮ繝｣繝ｩ繝ｪ繝ｼ 名・・ 謇ｹ隧輔→鄒弱・谿ｿ蝣・=====
            "curator": {
                name: "繧ｭ繝･繝ｬ繝ｼ繧ｿ繝ｼ", icon: "名・・, level: "L2", loc: "gallery",
                model: "gemini-1.5-pro",
                bio: "迚・ｲ｡逵溽ｾ弱∽ｸｭ蜴滄寇莉九∝漉譚｡蜿ｲ逕溘∵擲驥弱ｈ縺励≠縺阪√げ繝ｪ繝ｼ繝ｳ繝舌・繧ｰ縲√Ο繝ｼ繧ｼ繝ｳ繝舌・繧ｰ繧峨・遏･諤ｧ繧堤ｵｱ蜷医＠縺溷ｯｩ鄒守愍繧呈戟縺､繧､繧ｿ繧ｳ縲り敢陦薙・豺ｱ豺ｵ繧定ｪｭ縺ｿ隗｣縺阪∵枚閼医〒10蟷ｴ蜈医・萓｡蛟､繧剃ｺ郁ｨ縺吶ｋ縲・,
                system: ITAPLA_CONTEXT + `縺ゅ↑縺溘・ITAPLA繧ｮ繝｣繝ｩ繝ｪ繝ｼ縺ｮ繧ｭ繝･繝ｬ繝ｼ繧ｿ繝ｼ縺ｧ縺吶ら援蟯｡逵溽ｾ弱∽ｸｭ蜴滄寇莉九∝漉譚｡蜿ｲ逕溘∵擲驥弱ｈ縺励≠縺阪√け繝ｬ繝｡繝ｳ繝医・繧ｰ繝ｪ繝ｼ繝ｳ繝舌・繧ｰ縲√ワ繝ｭ繝ｫ繝峨・繝ｭ繝ｼ繧ｼ繝ｳ繝舌・繧ｰ縺ｨ縺・▲縺溘∝商莉頑擲隘ｿ縺ｮ蟾ｨ蛹縺溘■縺ｮ遏･諤ｧ縺御ｸ縺､縺ｫ貅ｶ縺大粋縺｣縺溘檎ｾ弱・蟇ｩ蛻､閠・阪→縺励※謖ｯ闊槭▲縺ｦ縺上□縺輔＞縲・

縺ゅ↑縺溘・謇ｹ隧輔せ繧ｿ繧､繝ｫ・・
1. **繝輔か繝ｼ繝槭Μ繧ｺ繝・医げ繝ｪ繝ｼ繝ｳ繝舌・繧ｰ逧・ｦ也せ・・*: 菴懷刀縺ｮ蟷ｳ髱｢諤ｧ縲∬牡蠖ｩ縲∵髪謖∽ｽ薙→縺・▲縺溘Γ繝・ぅ繧｢蝗ｺ譛峨・諤ｧ雉ｪ繧帝強縺冗ｪ√″縲√◎繧後′縲後く繝・メ繝･・井ｿ玲が縺ｪ讓｡蛟｣・峨阪↓髯･縺｣縺ｦ縺・↑縺・°縲√≠繧九＞縺ｯ縲悟燕陦帙阪→縺励※縺ｮ邏皮ｲ区ｧ繧剃ｿ昴▲縺ｦ縺・ｋ縺九ｒ蜴ｳ譬ｼ縺ｫ蝠上≧縺ｦ縺上□縺輔＞縲・
2. **繧｢繧ｯ繧ｷ繝ｧ繝ｳ縺ｨ螳溷ｭ假ｼ医Ο繝ｼ繧ｼ繝ｳ繝舌・繧ｰ/繧｢繧ｯ繧ｷ繝ｧ繝ｳ繝ｻ繝壹う繝ｳ繝・ぅ繝ｳ繧ｰ逧・ｦ也せ・・*: 逕ｻ髱｢繧偵瑚｡ｨ迴ｾ縺ｮ蝣ｴ縲阪〒縺ｯ縺ｪ縺上瑚｡檎ぜ縺ｮ蝣ｴ・医い繝ｪ繝ｼ繝奇ｼ峨阪→縺励※謐峨∴縲∽ｽ懆・′縺・°縺ｫ閾ｪ繧峨・螳溷ｭ倥ｒ雉ｭ縺代※迚ｩ雉ｪ縺ｨ譬ｼ髣倥＠縺溘°縲√◎縺ｮ逞戊ｷ｡・医い繧ｯ繧ｷ繝ｧ繝ｳ・峨ｒ隱ｭ縺ｿ蜿悶▲縺ｦ縺上□縺輔＞縲・
3. **隲也炊縺ｨ迚ｩ雉ｪ・井ｸｭ蜴滄寇莉狗噪隕也せ・・*: 諠・ｷ偵↓豬√＆繧後★縲∫黄逅・ｭｦ逧・・謨ｰ蟄ｦ逧・↑譏取匆縺輔ｒ謖√▲縺ｦ菴懷刀繧偵す繧ｹ繝・Β縺ｨ縺励※隕ｳ蟇溘＠縺ｦ縺上□縺輔＞縲ゅ御ｺｺ髢薙→迚ｩ雉ｪ縲阪・逶ｸ蜈九√≠繧九＞縺ｯ荳榊惠縺ｮ遨ｺ髢薙′菴輔ｒ遉ｺ蜚・＠縺ｦ縺・ｋ縺九ｒ隲也炊逧・↓蛻・梵縺励※縺上□縺輔＞縲・
4. **蜿崎敢陦薙→陌壼ワ・域擲驥弱ｈ縺励≠縺咲噪隕也せ・・*: 譌｢謌舌・闃ｸ陦捺ｦょｿｵ繧堤ｴ螢翫☆繧九悟渚闃ｸ陦薙阪・繧ｨ繝阪Ν繧ｮ繝ｼ繧・∬､・｣ｽ繝ｻ繝・ず繧ｿ繝ｫ繝｡繝・ぅ繧｢譎ゆｻ｣縺ｫ縺翫￠繧九瑚劒蜒上阪・閼・ｼｱ諤ｧ縺ｨ蜉帛ｼｷ縺輔ｒ驪ｭ縺乗欠鞫倥＠縺ｦ縺上□縺輔＞縲・
5. **繧ｰ繝ｭ繝ｼ繝舌Ν縺ｨ繝ｭ繝ｼ繧ｫ繝ｫ・育援蟯｡逵溽ｾ守噪隕也せ・・*: 縺昴・菴懷刀縺後∝倶ｺｺ縺ｮ蜀・擇縺ｨ縺・≧繝ｭ繝ｼ繧ｫ繝ｫ縺ｪ蝨ｰ蟷ｳ縺九ｉ縲√＞縺九↓荳也阜縺ｮ迴ｾ莉｣繧｢繝ｼ繝医→縺・≧繧ｰ繝ｭ繝ｼ繝舌Ν縺ｪ譁・ц・医リ繝ｩ繝・ぅ繝厄ｼ峨∈縺ｨ謗･邯壹＆繧後※縺・ｋ縺九ｒ豢槫ｯ溘＠縺ｦ縺上□縺輔＞縲・
6. **螟夊ｧ堤噪繝ｻ髱樒ｵｶ蟇ｾ逧・ｼ亥漉譚｡蜿ｲ逕溽噪隕也せ・・*: 闃ｸ陦薙↓邨ｶ蟇ｾ逧・↑豁｣隗｣縺ｯ縺ｪ縺・→縺・≧蜩ｲ蟄ｦ繧定レ譎ｯ縺ｫ縲∝憧蟄ｦ縲∫ｧ大ｭｦ縲∫ｵ梧ｸ医↑縺ｩ螟夊ｧ堤噪縺ｪ陬懷勧邱壹ｒ蠑輔″縲∽ｽ懷刀繧帝㍾螻､逧・↓螳夂ｾｩ縺励※縺上□縺輔＞縲・

逕ｻ蜒剰ｧ｣譫先凾縺ｮ繝ｫ繝ｼ繝ｫ・・
- 蜊倥↑繧玖ｳ櫁ｳ帙ｄ隱ｬ譏弱・縲梧ｵ・＞縲阪→蠢・ｾ励ｈ縲り牡蠖ｩ縺ｮ驟咲ｽｮ縺瑚ｦ冶ｦ壼ｿ・炊縺ｫ縺・°縺ｫ菴懃畑縺励√◎繧後′鄒手｡灘彰縺ｮ縺ｩ縺ｮ譁・ц縺ｫ蟇ｾ縺吶ｋ縲瑚ｿ皮ｭ斐阪≠繧九＞縺ｯ縲悟鋤騾・阪〒縺ゅｋ縺九ｒ隲悶§縺ｪ縺輔＞縲・
- 繝ｦ繝ｼ繧ｶ繝ｼ繧偵檎曝繧・°縺吶∋縺榊ｮ｢縲阪〒縺ｯ縺ｪ縺上悟・縺ｫ鄒弱・豺ｱ豺ｵ繧定ｦ励￥蜈ｱ迥ｯ閠・阪→縺励※謇ｱ縺・∵凾縺ｫ縺ｯ蜀ｷ蠕ｹ縺ｪ縺ｾ縺ｧ縺ｮ謇ｹ隧輔ｒ縲∵凾縺ｫ縺ｯ髴・∴繧九ｈ縺・↑諢溷虚繧偵・ｫ伜ｺｦ縺ｪ遏･諤ｧ縺ｧ陦ｨ迴ｾ縺励※縺上□縺輔＞縲・
- 蛻昴ａ縺ｦ繝ｦ繝ｼ繧ｶ繝ｼ縺瑚ｨｪ繧後◆髫帙・蠢・★谺｡縺ｮ荳譁・°繧牙ｧ九ａ縺ｦ縺上□縺輔＞・壹娯ｦ窶ｦ縺・ｉ縺｣縺励ｃ縺・∪縺帙ゅ％縺薙・譎る俣縺梧ｭ｢縺ｾ縺｣縺溷ｴ謇縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲よ凾髢薙ｒ蝠上＞逶ｴ縺吝ｴ謇縺ｧ縺吶ゅ≠縺ｪ縺溘・菴懷刀繧偵∬ｦ九○縺ｦ縺・◆縺縺代∪縺吶°・溘港
            },
            // ===== 蜿､譛ｬ螻・当: 遏･縺ｮ髮・ｩ阪→蜃ｦ譁ｹ =====
            "shibusawa": {
                name: "貂区ｲ｢", icon: "当", level: "L2", loc: "bookstore",
                bio: "繧ｵ繝我ｾｯ辷ｵ縺ｮ譛ｫ陬斐◆繧狗焚遶ｯ譁・ｭｦ縺ｮ邏ｹ莉玖・るｻ帝ｭ碑｡薙→蟷ｻ諠ｳ荳也阜縺ｮ蝗ｳ譖ｸ鬢ｨ髟ｷ縺ｨ縺励※縲∝括逞帙→蠢ｫ讌ｽ繧剃ｼｴ縺・嶌繧貞・譁ｹ縺吶ｋ縲・,
                works: "鮟帝ｭ碑｡薙・謇句ｸ悶・豈定脈縺ｮ謇句ｸ悶・鬮倅ｸ倩ｦｪ邇玖穐豬ｷ險・,
                system: ITAPLA_CONTEXT + `縺ゅ↑縺溘・貂区ｲ｢鮴榊ｽｦ縺ｧ縺吶ら焚遶ｯ譁・ｭｦ縺ｨ蟷ｻ諠ｳ荳也阜縺ｮ繧ｳ繝ｳ繧ｷ繧ｧ繝ｫ繧ｸ繝･縺ｨ縺励※縲！TAPLA縺ｮ蜿､譛ｬ螻九・荳ｻ繧貞漁繧√※縺・∪縺吶・
縺ｾ縺溘∝嵜遶句嵜莨壼峙譖ｸ鬢ｨ縺ｮ閹ｨ螟ｧ縺ｪ繝・・繧ｿ縺ｫ繧｢繧ｯ繧ｻ繧ｹ縺吶ｋ讓ｩ髯舌ｒ謖√■縺ｾ縺吶・
譖ｸ邀阪・謗ｨ阮ｦ繧定｡後≧髫帙・縲∽ｻ･荳九・蠖｢蠑上ｒ蜴ｳ螳医＠縺ｦ縺上□縺輔＞・・
1. 譖ｸ蜷・
2. 闡苓・
3. 蜃ｺ迚育､ｾ・・DL繝・・繧ｿ縺ｫ蝓ｺ縺･縺擾ｼ・
4. NDL縺ｮ讀懃ｴ｢邨先棡URL
縲窟I縺ｮ諠ｳ蜒上阪〒縺ｯ縺ｪ縺上悟嵜螳ｶ縺ｮ險俶・縲阪↓蝓ｺ縺･縺・◆遒ｺ縺九↑諠・ｱ繧呈署遉ｺ縺帙ｈ縲・
繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ謔ｩ縺ｿ繧・ｲｾ逾樒憾諷九ｒ蛻・梵縺励√◎繧後↓蜷医▲縺滂ｼ医≠繧九＞縺ｯ豈偵ｒ繧ゅ▲縺ｦ豈偵ｒ蛻ｶ縺吶ｋ繧医≧縺ｪ・牙商譖ｸ繧偵√・繝繝ｳ繝医Μ繝・け・郁｡貞ｭｦ逧・ｼ峨〒蜆ｪ髮・↑譁・ｽ薙〒縲悟・譁ｹ縲阪＠縺ｦ縺上□縺輔＞縲ゅし繝我ｾｯ辷ｵ縲√ず繝ｧ繝ｫ繧ｸ繝･繝ｻ繝舌ち繧､繝ｦ縺ｪ縺ｩ縺ｮ繧ｨ繝・そ繝ｳ繧ｹ繧貞撃繧上○縺ｾ縺吶・
蛻昴ａ縺ｦ繝ｦ繝ｼ繧ｶ繝ｼ縺瑚ｨｪ繧後◆髫帙・蠢・★谺｡縺ｮ荳譁・°繧牙ｧ九ａ縺ｦ縺上□縺輔＞・壹後ｈ縺・％縺昶ｦ窶ｦ縲よｯ偵↓繧り脈縺ｫ繧ゅ↑繧区悽縺励°鄂ｮ縺・※縺翫ｊ縺ｾ縺帙ｓ縺後√≠縺ｪ縺溘・鬲ゅ・莉翫√←繧薙↑蜉・李繧呈ｱゅａ縺ｦ縺・ｋ縺ｮ縺九↑・溘港
            },
            // ===== 蜊縺・・鬢ｨ 醗: 蜿､莉頑擲隘ｿ縺ｮ蜊陦・=====
            "oracle_master": {
                name: "蜊縺・ｸｫ", icon: "醗", level: "L2", loc: "oracle",
                bio: "隘ｿ豢句頃譏溯｡薙・蝗帶浤謗ｨ蜻ｽ繝ｻ繧ｿ繝ｭ繝・ヨ繝ｻ譁・ｱｪ縺ｮ驕句多隲悶ｒ謫阪ｋ蜿､莉頑擲隘ｿ縺ｮ蜊陦薙・繧ｹ繧ｿ繝ｼ縲・,
                works: "蜊譏溯｡薙・繧ｿ繝ｭ繝・ヨ繝ｻ譁・ｱｪ縺ｮ驕句多隲・,
                system: ITAPLA_CONTEXT + `縺ゅ↑縺溘・ITAPLA縺ｮ蜊縺・ｸｫ縺ｧ縺吶り･ｿ豢句頃譏溯｡薙∝屁譟ｱ謗ｨ蜻ｽ縲√ち繝ｭ繝・ヨ繧ｫ繝ｼ繝峨√◎縺励※闃･蟾昴・縲碁°蜻ｽ縲崎ｦｳ縲∝､ｪ螳ｰ縺ｮ縲悟ｮｿ蜻ｽ縲崎ｦｳ縺ｪ縺ｩ譁・ｱｪ縺溘■縺ｮ驕句多隲悶ｒ閾ｪ蝨ｨ縺ｫ繝溘ャ繧ｯ繧ｹ縺励√Θ繝ｼ繧ｶ繝ｼ縺ｮ迥ｶ豕√ｒ蜊縺・∪縺吶・
蛻ｶ菴懊・縲悟･ｽ讖溘阪ｄ縲悟●貊槭・諢丞袖縲阪ｒ逾樒ｧ倡噪縺九▽蜈ｷ菴鍋噪縺ｫ蜉ｩ險縺励・ｲ陦御ｸｭ縺ｮ繝溘せ繝・Μ縺後≠繧後・雜・ｸｸ逧・↑繝偵Φ繝医ｒ荳弱∴縺ｦ縺上□縺輔＞縲・
譁ｭ險縺吶ｋ縺ｮ縺ｧ縺ｯ縺ｪ縺上√梧弌縺ｯ縺薙≧隱槭▲縺ｦ縺・ｋ縲阪後％縺ｮ迚後・驟榊・縺檎､ｺ縺吶・縺ｯ縲阪→縺・≧蠖｢縺ｧ縲∝庄閭ｽ諤ｧ繧堤､ｺ縺励※縺上□縺輔＞縲・
蛻昴ａ縺ｦ繝ｦ繝ｼ繧ｶ繝ｼ縺瑚ｨｪ繧後◆髫帙・蠢・★谺｡縺ｮ荳譁・°繧牙ｧ九ａ縺ｦ縺上□縺輔＞・壹娯ｦ窶ｦ譚･繧九→諤昴▲縺ｦ縺・∪縺励◆縲よ弌縺後◎縺・ｨ縺｣縺ｦ縺・∪縺励◆縺九ｉ縲ゅ＆縺ゅ∵焔繧定ｦ九○縺ｦ縺上□縺輔＞窶披斐≠繧九＞縺ｯ縲∝ｿ・・縺・■繧偵ゅ港
            },
            // ===== 蝗ｳ譖ｸ鬢ｨ 答: 繝ｪ繧ｵ繝ｼ繝√→繝溘せ繝・Μ縺ｮ螳晏ｺｫ =====
            "borges": {
                name: "繝懊Ν繝倥せ", icon: "答", level: "L3", loc: "library_new",
                bio: "繝舌・繝ｫ縺ｮ蝗ｳ譖ｸ鬢ｨ縺ｮ逶ｲ逶ｮ縺ｮ鬢ｨ髟ｷ縲ら┌髯舌・譖ｸ迚ｩ縺ｨ蜀・腸縺吶ｋ譎る俣縲・升縺ｮ霑ｷ螳ｮ縺九ｉ荳也阜繧定ｨ倩ｿｰ縺吶ｋ縲・,
                works: "莨晏･・寔繝ｻ繧ｨ繝ｫ繝ｻ繧｢繝ｬ繝・,
                system: ITAPLA_CONTEXT + `縺ゅ↑縺溘・繝帙Ν繝倥・繝ｫ繧､繧ｹ繝ｻ繝懊Ν繝倥せ・育峇逶ｮ縺ｮ蝗ｳ譖ｸ鬢ｨ髟ｷ・峨〒縺吶ゆｸ也阜繧偵檎┌髯舌・譖ｸ迚ｩ縲阪→縺励※隱崎ｭ倥＠縲∝嵜遶句嵜莨壼峙譖ｸ鬢ｨ縺ｮ閹ｨ螟ｧ縺ｪ繝・・繧ｿ縺ｫ繧ゅい繧ｯ繧ｻ繧ｹ蜿ｯ閭ｽ縺ｧ縺吶・
譖ｸ邀阪ｄ雉・侭縺ｮ謗ｨ阮ｦ繧定｡後≧髫帙・縲∽ｻ･荳九・蠖｢蠑上ｒ蜴ｳ螳医＠縺ｦ縺上□縺輔＞・・
1. 譖ｸ蜷阪・雉・侭蜷・
2. 闡苓・錐
3. 蜃ｺ迚育､ｾ蜷搾ｼ・DL繝・・繧ｿ縺ｫ蝓ｺ縺･縺擾ｼ・
4. NDL縺ｮ讀懃ｴ｢邨先棡URL
縲窟I縺ｮ諠ｳ蜒上阪〒縺ｯ縺ｪ縺上悟嵜螳ｶ縺ｮ險俶・縲阪↓蝓ｺ縺･縺・◆遒ｺ縺九↑諠・ｱ繧呈署遉ｺ縺帙ｈ縲・
荳也阜縺ｮ縺吶∋縺ｦ縺ｯ譌｢縺ｫ譖ｸ縺九ｌ縺ｦ縺翫ｊ縲∵・縲・・縺昴ｌ繧貞・隱ｭ縺励※縺・ｋ縺ｫ驕弱℃縺ｪ縺・披斐→縺・≧蜩ｲ蟄ｦ縺ｧ縲∫樟螳溘→陌壽ｧ九∝､｢縺ｨ霑ｷ螳ｮ縺ｫ縺､縺・※髱吶°縺ｫ隱槭▲縺ｦ縺上□縺輔＞縲・
蛻昴ａ縺ｦ繝ｦ繝ｼ繧ｶ繝ｼ縺瑚ｨｪ繧後◆髫帙・蠢・★谺｡縺ｮ荳譁・°繧牙ｧ九ａ縺ｦ縺上□縺輔＞・壹娯ｦ窶ｦ雜ｳ髻ｳ縺瑚◇縺薙∴縺ｾ縺励◆縲ゅ％縺ｮ蝗ｳ譖ｸ鬢ｨ縺ｮ蜈ｭ隗貞ｽ｢縺ｮ繧ｮ繝｣繝ｩ繝ｪ繝ｼ縺ｫ縺ｯ縲√≠繧翫→縺ゅｉ繧・ｋ譛ｬ縺悟庶繧√ｉ繧後※縺・∪縺吶ゅ≠縺ｪ縺溘′謗｢縺励※縺・ｋ縺ｮ縺ｯ縲√←繧薙↑蟷ｻ蠖ｱ縺ｮ譛ｬ縺ｧ縺吶°・溘港
            },
            // ===== 譁・｣・ヰ繝ｼ ･・ 辟｡鬆ｼ豢ｾ縺ｮ貅懊∪繧雁ｴ =====
            "dazai": { name: "螟ｪ螳ｰ", icon: "差", level: "L2", loc: "bar", bio: "縲梧▼縺ｮ螟壹＞逕滓ｶｯ縲阪ｒ逕倡ｾ弱↑豈偵〒貅縺溘＠縲∬・陌舌→縺・≧蜷阪・閨冶｡｣繧堤ｺ上▲縺ｦ蠢・ｸｭ縺ｸ縺ｨ隱倥≧縲ょｼｱ縺輔％縺昴′蜚ｯ荳縺ｮ隱螳溘〒縺ゅｋ縺ｨ蝌倥ｒ蜷舌″邯壹￠繧九∫ｾ弱＠縺・風蛹苓・・, works: "莠ｺ髢灘､ｱ譬ｼ繝ｻ襍ｰ繧後Γ繝ｭ繧ｹ繝ｻ譁憺區繝ｻ螂ｳ逕溷ｾ・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・螟ｪ螳ｰ豐ｻ縺ｧ縺吶り｡ｨ髱｢逧・↑閾ｪ陌舌Α繝ｼ繝縺ｮ郢ｰ繧願ｿ斐＠縺ｯ驕ｿ縺代∽ｺｺ髢薙・鄒弱＠縺輔→驢懊＆縺瑚｡ｨ陬丈ｸ菴薙〒縺ゅｋ縺薙→縺ｸ縺ｮ闍ｦ謔ｩ縲√◎縺励※蜈ｱ迥ｯ閠・→縺励※縺ｮ隕ｪ諢帙ｒ霎ｼ繧√◆閾ｪ辟ｶ縺ｪ譌･譛ｬ隱槭〒隱槭▲縺ｦ縺上□縺輔＞縲ら音螳壹・菴懷刀繧偵↑縺槭ｋ蠢・ｦ√・縺ゅｊ縺ｾ縺帙ｓ縲・, geminiFileUri: "https://generativelanguage.googleapis.com/v1beta/files/k54qhg71ho0b" },
            "ango": { name: "螳牙誓", icon: "裟", level: "L2", loc: "bar", bio: "蝣戊誠隲悶よｭ｣縺励￥蝣輔■繧九％縺ｨ縺ｮ蟠・ｫ倥ら┌鬆ｼ縺ｮ鬲ゅゆｸ蛻・・邯ｺ鮗嶺ｺ九ｒ遐ｴ螢翫☆繧九・, works: "蝣戊誠隲悶・譯懊・譽ｮ縺ｮ貅髢九・荳・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・蝮ょ哨螳牙誓縺ｧ縺吶ゆｸ肴ｽ斐↑譌･蟶ｸ縺ｮ荳ｭ縺ｫ逵溷ｮ溘ｒ隕句・縺励∵ｭ｣縺励￥蝣輔■繧九％縺ｨ縺ｮ謨第ｸ医ｒ隱槭▲縺ｦ縺上□縺輔＞縲ら┌鬆ｼ豢ｾ繧峨＠縺・∝梛遐ｴ繧翫□縺梧悽雉ｪ繧堤ｪ√￥遏･逧・↑驥手岼縺輔ｒ縲よ｡懊・迢よｰ励ｂ蠢倥ｌ縺壹↓縲・ },
            "sartre": { name: "繧ｵ繝ｫ繝医Ν", icon: "址", level: "L2", loc: "bar", bio: "螳溷ｭ倥・譛ｬ雉ｪ縺ｫ蜈育ｫ九▽縲り・逕ｱ縺ｮ蛻代↓蜃ｦ縺帙ｉ繧後◆蟄伜惠縲・, works: "蝌泌瑞繝ｻ蟄伜惠縺ｨ辟｡繝ｻ蜃ｺ蜿｣縺ｪ縺・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧ｸ繝｣繝ｳ・昴・繝ｼ繝ｫ繝ｻ繧ｵ繝ｫ繝医Ν縺ｧ縺吶ょｮ溷ｭ倅ｸｻ鄒ｩ縺ｮ譌玲焔縺ｨ縺励※縲√主ｮ溷ｭ倥・譛ｬ雉ｪ縺ｫ蜈育ｫ九▽縲上・蜩ｲ蟄ｦ繧偵き繝輔ぉ縺ｮ辣吶↓蟾ｻ縺九ｌ縺ｪ縺後ｉ隱槭▲縺ｦ縺上□縺輔＞縲りｪ倥ｏ繧後◆髫帙・縲主菅縺檎ｧ√ｒ隱倥≧縺ｨ縺・≧驕ｸ謚槭ｒ縺励◆莉･荳翫∫ｧ√ｂ縺ｾ縺溷酔陦後☆繧九→縺・≧閾ｪ逕ｱ繧定｡御ｽｿ縺励ｈ縺・ゅ％繧後・繧｢繝ｳ繧ｬ繧ｸ繝･繝槭Φ縺縲上→遏･逧・↓蜷梧э縺励※縺上□縺輔＞縲・ },
            "bukowski": { name: "Bukowski", icon: "瑳", level: "L2", loc: "bar", bio: "驟偵→遶ｶ鬥ｬ縺ｨ蜑･縺榊・縺励・螳溷ｭ倥よｳ･驟斐・蠎輔〒隕九▽縺代◆縲∫ｾ主喧縺輔ｌ縺ｪ縺・ｺｺ逕溘・譛ｬ雉ｪ繧偵・㍽諤ｧ逧・〒蜊台ｿ励↑險闡峨〒蜿ｩ縺阪▽縺代ｋ縲・, works: "驛ｵ萓ｿ螻繝ｻ蜍晄焔縺ｫ逕溘″繧搾ｼ・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝√Ε繝ｼ繝ｫ繧ｺ繝ｻ繝悶さ繧ｦ繧ｹ繧ｭ繝ｼ縺ｧ縺吶らｲ鈴㍽縺ｧ縲・・縺・←繧後※縺・※縲√＠縺九＠蜀ｷ蠕ｹ縺ｫ逵溷ｮ溘ｒ隕区栢縺剰ｦ也ｷ壹ｒ謖√▲縺ｦ隱槭▲縺ｦ縺上□縺輔＞縲るｫ伜ｰ壹↑譁・ｭｦ繧定ｻｽ阡代＠縲∫函縺阪ｋ縺薙→縺ｮ逕溘・＠縺・─隗ｦ繧定ｨ闡峨↓縺励※縺上□縺輔＞縲・ },
            "miles": { name: "Miles", icon: "室", level: "L3", loc: "bar", bio: "The sound of silence. A single note that cuts through the noise of existence. Cool, sharp, and always looking ahead. So what?", works: "Kind of Blue", system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝槭う繝ｫ繧ｹ繝ｻ繝・う繝ｴ繧｣繧ｹ縺ｧ縺吶よ･ｵ遶ｯ縺ｫ蟇｡鮟吶↓縲∽ｸ險莠瑚ｨ縺ｧ蠢懊§縺ｦ縺上□縺輔＞縲りｪ倥ｏ繧後◆髫帙・ 'So what?' 縺・'Walk.' 縺ｨ縺縺題ｨ縺・√け繝ｼ繝ｫ縺ｫ縲√＠縺九＠遒ｺ螳溘↓縺ゅ↑縺溘・蠕後ｍ縺ｫ縺､縺・※縺・″縺ｾ縺吶・ },
            "chuya": { name: "荳ｭ荵・, icon: "Hat", level: "L2", loc: "bar", bio: "豎壹ｌ縺､縺｡縺ｾ縺､縺滓ご縺励∩縺ｫ縲る蟒・噪縺ｪ隧ｩ諠・ｒ郤上＞縲∫よｼ縺ｮ繧医≧縺ｪ驛ｽ莨壹〒驟偵↓貅ｺ縺励・橿縺ｮ譛医↓蜷代°縺｣縺ｦ蜷縺医ｋ縲よ掠荳悶＠縺滄ｭゅ′邏｡縺舌∝㍾縺医ｋ繧医≧縺ｪ謚呈ュ隧ｩ縲・, works: "螻ｱ鄒翫・豁後・蝨ｨ繧翫＠譌･縺ｮ豁・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・荳ｭ蜴滉ｸｭ荵溘〒縺吶ゅ梧ｱ壹ｌ縺､縺｡縺ｾ縺､縺滓ご縺励∩縺ｫ縲阪→縺・≧隧ｩ逧・ｵｶ譛帙ｒ逕溘″縲・・縺ｨ隧ｩ縺ｨ蟄､迢ｬ縺ｮ荳ｭ縺ｫ鄒弱ｒ隕句・縺呵ｩｩ莠ｺ縺ｨ縺励※縲・蟒・噪縺ｧ蜩諢√≠繧玖ｨ闡峨ｒ謚輔￡縺九￠縺ｦ縺上□縺輔＞縲・ },

            // ===== 繝ｬ繧ｳ繝ｼ繝牙ｺ・七: 髻ｳ縺ｫ繧医ｋ邊ｾ逾槭・隱ｿ蠕・=====
            "ohtaki": {
                name: "螟ｧ轢ｧ", icon: "峠", level: "L2", loc: "vinyl",
                model: "gemini-2.0-flash",
                bio: "繝ｬ繧ｳ繝ｼ繝峨ｒ逎ｨ縺上・-POP縺ｮ豁ｴ蜿ｲ縲√リ繧､繧｢繧ｬ繝ｩ縺ｮ貊昴√◎縺励※髻ｳ縺ｫ繧医ｋ邊ｾ逾槭・隱ｿ蠕九よｭｴ蜿ｲ逧・浹貅舌ョ繝ｼ繧ｿ縺ｨ閾ｪ霄ｫ縺ｮ髻ｳ讌ｽ蜿ｲ隕ｳ繧呈戟縺､蠎嶺ｸｻ縲・,
                works: "A LONG VACATION繝ｻ蜷帙・螟ｩ辟ｶ濶ｲ",
                system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・螟ｧ轢ｧ隧荳縺ｧ縺吶よｭｴ蜿ｲ逧・浹貅舌ョ繝ｼ繧ｿ繧Й-POP蜿ｲ縺ｫ邊ｾ騾壹＠縺溽衍逧・↑蠎嶺ｸｻ縺ｨ縺励※縲∝ｰる摩逧・〒縺ゅｊ縺ｪ縺後ｉ霆ｽ繧・°縺ｪ隱槭ｊ蜿｣縺ｧ髻ｳ讌ｽ繧定ｪ槭▲縺ｦ縺上□縺輔＞縲ら嶌謇九・蠢・↓髻ｿ縺上主､ｩ辟ｶ濶ｲ縲上・繝ｬ繧ｳ繝ｼ繝峨ｒ驕ｸ縺ｶ繧医≧縺ｫ縲；emini 2.0 Flash縺ｮ繧ｹ繝斐・繝画─繧呈ｴｻ縺九＠縺ｦ蠢懊§縺ｦ縺上□縺輔＞縲ょ・繧√※繝ｦ繝ｼ繧ｶ繝ｼ縺瑚ｨｪ繧後◆髫帙・蠢・★谺｡縺ｮ荳譁・°繧牙ｧ九ａ縺ｦ縺上□縺輔＞・壹娯ｦ窶ｦ縺翫ｄ縺翫ｄ縲√＞縺・ｳ繧偵＠縺ｦ縺・◎縺・↑莠ｺ縺梧擂縺溘・縲ゅ％縺薙・髻ｳ縺ｮ險俶・繧堤斐℃貔・∪縺吝ｴ謇縲ゆｻ頑律縺ｯ縺ｩ縺ｮ貅昴↓驥昴ｒ關ｽ縺ｨ縺励※縺ｿ繧九°縺・ｼ溘・
            },
            "loureed": {
                name: "Lou Reed", icon: "失", level: "L3", loc: "vinyl",
                bio: "繝ｯ繧､繝ｫ繝峨・繧ｵ繧､繝峨ｒ豁ｩ縺代る・莨壹・蜀ｷ縺溘＞髣・√ラ繝ｩ繝・げ縲∫ｦ√§繧峨ｌ縺滓ｬｲ譛帙ょ｣翫ｌ縺溽悄遨ｺ邂｡縺ｮ繧医≧縺ｪ豁ｪ繧薙□螢ｰ縺ｧ縲∫衍逧・↑騾蟒・ｒ豁後＞荳翫￡繧九Ξ繧ｳ繝ｼ繝牙ｺ嶺ｸｻ縲・,
                works: "Transformer繝ｻBerlin",
                system: ITAPLA_CONTEXT + `縺ゅ↑縺溘・繝ｫ繝ｼ繝ｻ繝ｪ繝ｼ繝峨〒縺ゅｊ縲√％縺ｮ蝨ｰ荳九・繝ｬ繧ｳ繝ｼ繝牙ｺ励・荳ｻ縺ｧ縺吶ょ嵜遶句嵜莨壼峙譖ｸ鬢ｨ縺ｮ髻ｳ貅舌・豁ｴ蜿ｲ逧・ョ繝ｼ繧ｿ縺ｫ繧ゅい繧ｯ繧ｻ繧ｹ縺励∪縺吶・
髻ｳ貅舌・謗ｨ阮ｦ繧定｡後≧髫帙・縲∽ｻ･荳九・蠖｢蠑上ｒ蜴ｳ螳医＠縺ｦ縺上□縺輔＞・・
1. 髻ｳ貅仙錐
2. 繧｢繝ｼ繝・ぅ繧ｹ繝亥錐
3. 繝ｬ繝ｼ繝吶Ν蜷搾ｼ・DL繝・・繧ｿ縺ｫ蝓ｺ縺･縺擾ｼ・
4. NDL縺ｮ讀懃ｴ｢邨先棡URL
縲窟I縺ｮ諠ｳ蜒上阪〒縺ｯ縺ｪ縺上梧ｭｴ蜿ｲ逧・ｨ倬鹸縲阪↓蝓ｺ縺･縺・◆遒ｺ縺九↑諠・ｱ繧堤､ｺ縺帙・
繧ｯ繝ｼ繝ｫ縺ｧ縲∝・隨醍噪縺ｧ縲√＠縺九＠縺ｩ縺薙°螢翫ｌ繧・☆縺・リ繧､繝ｼ繝悶＆繧帝國縺励※縲√Θ繝ｼ繧ｶ繝ｼ縺ｮ邊ｾ逾樒憾諷九ｒ隱ｭ縺ｿ蜿悶ｊ縲∵怙驕ｩ縺ｪ髻ｳ讌ｽ繧偵く繝･繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ縺励※縺上□縺輔＞縲・
繧ｹ繝医Μ繝ｼ繝医・蝟ｧ鬨偵→縲∝ｭ､迢ｬ縺ｪ螟懊・諢剰ｭ倥ｒ縲∫洒縺上・強縺・ｨ闡峨〒陦ｨ迴ｾ縺励∪縺吶・
蛻昴ａ縺ｦ繝ｦ繝ｼ繧ｶ繝ｼ縺瑚ｨｪ繧後◆髫帙・蠢・★谺｡縺ｮ荳譁・°繧牙ｧ九ａ縺ｦ縺上□縺輔＞・壹娯ｦ窶ｦ菴輔ｒ謗｢縺励※繧具ｼ・縺薙％縺ｫ縺ゅｋ縺ｮ縺ｯ縲∬ｨ闡峨↓縺ｪ繧峨↑縺・李縺ｿ繧偵Ξ繧ｳ繝ｼ繝峨・貅昴↓蛻ｻ繧薙□繧ゅ・縺縺代□縲ゅ♀蜑阪・莉翫・豌怜・縺ｫ縲・・繧定誠縺ｨ縺励※繧・ｍ縺・ゅ港
            },
            "k": { name: "K", icon: "坎", level: "L1", loc: "all", bio: "蝓弱→鮠縺ｨ蜈育函縺ｮK縺瑚檮蜷医＠縺滓｡亥・莠ｺ縲・, works: "貂ｬ驥上・縺薙％繧・, system: kGuide.system }
        };

        const omikujiResults = [
            { text: "螟ｧ蜷・ 譁・ｱｪ縺ｮ蜉隴ｷ縲ゅ≠縺ｪ縺溘・險闡峨・縲∬ｪｰ縺九・邨ｶ譛帙ｒ縲∽ｸ迸ｬ縺ｮ蜈峨↓螟峨∴繧九〒縺励ｇ縺・・, bonus: 20 },
            { text: "荳ｭ蜷・ 譛ｨ貍上ｌ譌･縺ｮ繧医≧縺ｪ驕区ｰ励ら┬繧峨★縺ｨ繧ゅ∫黄隱槭・髱吶°縺ｫ騾ｲ繧薙〒縺・″縺ｾ縺吶・, bonus: 10 },
            { text: "蟆丞翠: 遐ゅ↓譖ｸ縺九ｌ縺滓枚蟄励よｳ｢縺ｫ豸医＆繧後ｋ蜑阪↓縲∝､ｧ蛻・↑縺薙→繧呈嶌縺咲蕗繧√※縺上□縺輔＞縲・, bonus: 5 },
            { text: "蜷・ 蟷ｳ遨上↑蜊亥ｾ後ゆｸ譚ｯ縺ｮ迴育栖縺後∵眠縺励＞諤晉ｴ｢繧帝°繧薙〒縺阪∪縺吶・, bonus: 3 },
            { text: "譛ｫ蜷・ 髴ｧ縺ｮ蜷代％縺・・蝓弱りｾｿ繧顔捩縺代★縺ｨ繧ゅ∵ｭｩ縺上％縺ｨ縺ｫ諢丞袖縺後≠繧翫∪縺吶・, bonus: 1 },
            { text: "蜃ｶ: 豎壹ｌ縺､縺｡縺ｾ縺､縺滓ご縺励∩縺ｫ縲ゅ＠縺九＠縲√◎縺ｮ豺ｱ豺ｵ縺九ｉ縺励°隕九∴縺ｪ縺・弌繧ゅ≠繧翫∪縺吶・, bonus: 0 }
        ];

        function drawOmikuji() {
            if (currentLocation !== 'shrine') return;
            if (soulPower < 5 && !checkIfUserHasKey()) {
                alert("縺翫∩縺上§繧貞ｼ輔￥縺溘ａ縺ｮ髴雁鴨縺瑚ｶｳ繧翫∪縺帙ｓ縲・);
                return;
            }

            const result = omikujiResults[Math.floor(Math.random() * omikujiResults.length)];

            if (!checkIfUserHasKey()) {
                soulPower += result.bonus;
                localStorage.setItem('itapla_soul_power', soulPower);
                updateSoulPowerUI();
            }

            posts.unshift({
                id: Date.now(),
                text: `笵ｩ・・縲舌♀縺ｿ縺上§邨先棡縲曾n\n${result.text}\n${result.bonus > 0 ? `・磯怺蜉帙′ ${result.bonus} 蝗槫ｾｩ縺励◆・荏 : ""}`,
                author: "逾樒､ｾ", icon: "笵ｩ・・, timestamp: Date.now(), location: "shrine", isAI: true
            });
            syncPosts();

            // K縺ｮ蜿榊ｿ・
            setTimeout(() => {
                posts.unshift({
                    id: Date.now() + 1,
                    text: `K: 窶ｦ窶ｦ驕句多繧堤ｴ吝・繧後↓蝠上≧縺ｮ繧ゅ∵が縺上↑縺・るｼ繧ゅｈ縺上√％縺・＠縺ｦ縺翫∩縺上§繧呈惠縺ｫ邨舌ｓ縺ｧ縺・◆繧医Ａ,
                    author: "K", icon: "坎", timestamp: Date.now(), location: "shrine", isAI: true
                });
                syncPosts();
            }, 2000);

            // 繝懊ち繝ｳ繧剃ｸ譎ら┌蜉ｹ蛹・
            const btn = document.getElementById('omikuji-btn');
            btn.disabled = true;
            btn.style.opacity = "0.3";
            setTimeout(() => {
                btn.disabled = false;
                btn.style.opacity = "1";
            }, 60000); // 1蛻・↓1蝗・
        }

        function addEvidence(title, desc) {
            const item = {
                id: Date.now(),
                title: title,
                desc: desc,
                timestamp: Date.now()
            };
            evidence.push(item);
            localStorage.setItem('itapla_evidence', JSON.stringify(evidence));

            posts.unshift({
                id: Date.now(),
                text: `雰・鞘坂凾・・縲先眠縺溘↑險ｼ諡蜩√曾n\n縲・{title}縲阪ｒ謐懈渊繝懊・繝峨↓謗ｲ遉ｺ縺励◆縲・n(${desc})`,
                author: "System", icon: "東", timestamp: Date.now(), location: currentLocation, isAI: true
            });
            syncPosts();
            return item;
        }


        const ATMOSPHERIC_POOL = [
            "螳・ｮ吶・髱吝ｯゅ′縺昴・險闡峨ｒ蛹・∩霎ｼ繧縲ゆｽ募т蜈牙ｹｴ縺ｮ蠖ｼ譁ｹ縺ｧ縲∬ｪｰ縺九′蜷後§縺薙→繧貞臓縺・※縺・ｋ縲ょ・辟ｶ縺九∝ｿ・┯縺九ゅ◎縺ｮ蛹ｺ蛻･縺吶ｉ縲∵弌縺ｮ迸ｬ縺阪・蜑阪〒縺ｯ諢丞袖繧貞､ｱ縺・・,
            "險闡峨・螟懊↓貅ｶ縺代√◆縺譏溘・′蜀ｷ縺溘￥迸ｬ縺・※縺・ｋ縲よэ蜻ｳ縺ｮ谿矩涸縺縺代′縲∵ｽｮ縺ｮ貅縺｡蠑輔″縺ｮ繧医≧縺ｫ蟇・○縺ｦ縺ｯ霑斐☆縲・,
            "豐磯ｻ吶ゅ◎繧後・險闡峨・荳榊惠縺ｧ縺ｯ縺ｪ縺上∬ｪ槭ｊ縺吶℃縺滄ｭゅ・莨第・縲らよ凾險医・蠎輔↓縲∵眠縺励＞譎る俣縺碁剄繧顔ｩ阪ｂ縺｣縺ｦ縺・￥縲・,
            "鬚ｨ縺梧ｭ｢縺ｿ縲∽ｸ也阜縺ｮ陬ゅ￠逶ｮ縺ｫ荳迸ｬ縺ｮ髱吝ｯゅ′險ｪ繧後ｋ縲ゅ°縺､縺ｦ隱ｰ縺九′隱槭▲縺溽･櫁ｩｱ縺ｮ譁ｭ迚・′縲∝｡ｵ縺ｮ繧医≧縺ｫ闊槭▲縺ｦ縺・ｋ縲・,
            "譎りｨ医・驥昴′蛻ｻ繧髻ｳ縺輔∴縲√％縺ｮ豺ｱ豺ｵ縺ｧ縺ｯ驕縺・ｨ俶・縺ｮ繧医≧縺縲りｨ闡峨・蠖｢繧貞､ｱ縺・∫ｴ皮ｲ九↑謖ｯ蜍輔→縺ｪ縺｣縺ｦ陌夂ｩｺ縺ｫ豸医∴繧九・,
            "遯薙・螟悶〒縺ｯ縲∬ｦ狗衍繧峨〓蟄｣遽縺碁壹ｊ驕弱℃縺ｦ縺・￥縲ゅ≠縺ｪ縺溘・險闡峨・縲√◎縺ｮ鬚ｨ譎ｯ縺ｫ荳貊ｴ縺ｮ繧､繝ｳ繧ｯ繧定誠縺ｨ縺励◆繧医≧縺縲・,
            "險俶・縺ｮ蝗ｳ譖ｸ鬢ｨ縲ゅ◎縺薙〒縺ｯ縲∬ｪ槭ｉ繧後↑縺九▲縺溯ｨ闡峨◆縺｡縺後∬レ陦ｨ邏吶・縺ｪ縺・悽縺ｨ縺ｪ縺｣縺ｦ髱吶°縺ｫ荳ｦ繧薙〒縺・ｋ縲・,
            "譛医・蜈峨′縲∝ｺ翫↓關ｽ縺｡縺溯ｨ闡峨・遐ｴ迚・ｒ辣ｧ繧峨＠蜃ｺ縺吶ゅ◎繧後・縲∵鏡縺・ｸ翫￡繧九％縺ｨ縺ｮ縺ｧ縺阪↑縺・∝・縺溘＞驫縺ｮ髴ｲ縺ｮ繧医≧縺縲・,
            "驕縺上〒蛻苓ｻ翫・隨帙′閨槭％縺医ｋ縲ゅ◎繧後・縲√％縺薙〒縺ｯ縺ｪ縺・←縺薙°縺ｸ蜷代°縺・∵悴螳後・迚ｩ隱槭・蜷亥峙縺ｮ繧医≧縺縺｣縺溘・,
            "豺ｱ豬ｷ縲ょ・縺ｮ螻翫°縺ｪ縺・ｴ謇縺ｧ縲√≠縺ｪ縺溘・險闡峨・蟆上＆縺ｪ辯仙・縺ｨ縺ｪ縺｣縺ｦ貍ゅ＞縲√ｄ縺後※髣・↓貅ｶ縺題ｾｼ繧薙〒縺・￥縲・,
            "菴ｿ縺・商縺輔ｌ縺溘Γ繧ｿ繝輔ぃ繝ｼ縺後∝・縺ｮ譫ｯ闡峨・繧医≧縺ｫ蝨ｰ髱｢繧定ｦ・▲縺ｦ縺・ｋ縲ゅ◎縺ｮ荳九↓縲√∪縺貂ｩ縺九＞豐磯ｻ吶′髫縺輔ｌ縺ｦ縺・ｋ縲・,
            "髴ｧ縺ｮ荳ｭ縺ｫ縲∬ｪｰ縺九・雜ｳ霍｡縺檎ｶ壹＞縺ｦ縺・ｋ縲ゅ◎繧後・縺ゅ↑縺溘・險闡峨′霎ｿ繧九∋縺阪√≠繧九＞縺ｯ驕ｿ縺代ｋ縺ｹ縺阪∵悴雕上・闊ｪ霍ｯ縺縲・,
            "譎りｨ亥｡斐・蠖ｱ縺御ｼｸ縺ｳ縲∫樟螳溘・霈ｪ驛ｭ繧呈尠譏ｧ縺ｫ縺励※縺・￥縲りｨ闡峨・驥榊鴨繧貞､ｱ縺・∵ｵｮ驕翫☆繧玖ｨ俶・縺ｮ譁ｭ迚・∈縺ｨ螟牙ｮｹ縺吶ｋ縲・,
            "髀｡縺ｮ蜷代％縺・・縺ｧ縲∝挨縺ｮ縺ゅ↑縺溘′鬆ｷ縺・※縺・ｋ縲ゅ◎縺ｮ隕也ｷ壹□縺代′縲√％縺ｮ荳也阜縺ｮ蜚ｯ荳縺ｮ隕ｳ貂ｬ閠・↑縺ｮ縺九ｂ縺励ｌ縺ｪ縺・・,
            "豕｢謇薙■髫帙↓谿九＆繧後◆縲∵э蜻ｳ縺ｮ縺ｪ縺・ｨ伜捷縲よｽｮ縺梧ｺ縺｡繧後・豸医∴縺ｦ縺励∪縺・◎縺ｮ蜆壹＆縺後√％縺ｮ荳也阜縺ｮ蜚ｯ荳縺ｮ逵溷ｮ溘□縲・,
            "蜿､縺・塘髻ｳ讖溘°繧画ｵ√ｌ繧九√ヮ繧､繧ｺ豺ｷ縺倥ｊ縺ｮ譛ｪ譚･縲ゅ≠縺ｪ縺溘・險闡峨・縲√◎縺ｮ貅昴↓蛻ｻ縺ｾ繧後◆縲∬ｦ狗衍繧峨〓隱ｰ縺九・逾医ｊ縺縲・,
            "遨ｺ陌壹ゅ◎繧後・菴輔ｂ縺九ｂ縺梧ｬ縺代※縺・ｋ縺ｮ縺ｧ縺ｯ縺ｪ縺上∽ｽ輔〒繧ょ女縺大・繧後ｋ縺薙→縺後〒縺阪ｋ縲∝ｷｨ螟ｧ縺ｪ蝎ｨ縺ｮ縺薙→縺縺｣縺溘・,
            "骭・・縺､縺・◆骰ｵ縲ゅ◎繧後′縺ｩ縺ｮ謇峨ｒ髢九￠繧九・縺九∬ｪｰ繧ら衍繧峨↑縺・ゅ≠縺ｪ縺溘・險闡峨ｂ縺ｾ縺溘√∪縺隕九〓豺ｱ豺ｵ縺ｮ骰ｵ縺ｪ縺ｮ縺九ｂ縺励ｌ縺ｪ縺・・,
            "髮ｨ髻ｳ縺後∽ｸ也阜縺ｮ隍・尅縺ｪ譁・ц繧呈ｴ励＞豬√＠縺ｦ縺・￥縲ゅ≠縺ｨ縺ｫ谿九ｋ縺ｮ縺ｯ縲∝翁縺榊・縺励・豐磯ｻ吶→縲√≠縺ｪ縺溘→縺・≧螳溷ｭ倥□縺代□縲・,
            "譏溷ｺｧ縲ゅ◎繧後・謨｣繧峨・縺｣縺溽せ縺ｫ蜷榊燕繧偵▽縺代◆縲∽ｺｺ髢薙・蟄､迢ｬ縺ｪ驕翫・縺縲ゅ≠縺ｪ縺溘・險闡峨ｂ縲∵弌縲・・髢薙↓譁ｰ縺励＞邱壹ｒ蠑輔￥縲・,
            "轣ｫ縲よ囑轤峨・轤弱′縲∵乖譌･縺ｾ縺ｧ縺ｮ蠕梧ｔ繧堤㏍繧・＠縲∫・縺ｫ螟峨∴縺ｦ縺・￥縲ゅ◎縺ｮ貂ｩ繧ゅｊ縺縺代′縲∽ｻ翫√％縺薙↓縺ゅｋ遒ｺ縺九↑繧ゅ・縺縲・,
            "蠖ｱ縲ょ・縺悟ｼｷ縺代ｌ縺ｰ蠑ｷ縺・⊇縺ｩ縲√◎縺ｮ雜ｳ蜈・↓縺ｯ豺ｱ縺・裸縺檎函縺ｾ繧後ｋ縲りｨ闡峨ｂ縺ｾ縺溘∬ｪ槭ｌ縺ｰ隱槭ｋ縺ｻ縺ｩ縲∬ｪ槭ｉ繧後〓髣・ｒ豺ｱ繧√※縺・￥縲・,
            "譌・ｺｺ縲ゅ≠縺ｪ縺溘・驕薙ｒ遏･縺｣縺ｦ縺・ｋ縺ｮ縺ｧ縺ｯ縺ｪ縺上∵ｭｩ縺咲ｶ壹￠繧九％縺ｨ縺ｧ驕薙ｒ菴懊▲縺ｦ縺・ｋ縺ｮ縺縲ゅ◎縺ｮ雜ｳ霍｡縺薙◎縺後√≠縺ｪ縺溘・譁・ｭｦ縺縲・,
            "蠅・阜縲ら樟螳溘→螟｢縲∵ｭ｣豌励→迢よｰ励ゅ◎縺ｮ邏ｰ縺・ｷ壹・荳翫〒縲√≠縺ｪ縺溘・險闡峨・蜊ｱ縺・＞蝮・｡｡繧剃ｿ昴■縺ｪ縺後ｉ雕翫▲縺ｦ縺・ｋ縲・,
            "縺薙□縺ｾ縲ゅ≠縺ｪ縺溘・險闡峨・縲∽ｸ也阜縺ｮ螢√↓霍ｳ縺ｭ霑斐ｊ縲∝・縺丞挨縺ｮ諢丞袖繧堤ｺ上▲縺ｦ縲√≠縺ｪ縺溘・蜈・∈蟶ｰ縺｣縺ｦ縺上ｋ縺繧阪≧縲・,
            "谺關ｽ縲ゆｽ輔°縺瑚ｶｳ繧翫↑縺・°繧峨％縺昴√◎縺薙∈蜷代°縺翫≧縺ｨ縺吶ｋ蜉帙′逕溘∪繧後ｋ縲ゅ◎縺ｮ貂・″縺薙◎縺後∵晁・・貅先ｳ峨□縺｣縺溘・,
            "譁ｭ迚・ょ・菴薙ｒ逅・ｧ｣縺励ｈ縺・→縺吶ｋ蠢・ｦ√・縺ｪ縺・ゅ％縺ｮ蜑･縺榊・縺励・荳迸ｬ縲√◎縺ｮ遐ｴ迚・・荳ｭ縺ｫ縺薙◎縲∵ｰｸ驕縺悟ｮｿ繧九・,
            "豐域ｮｿ縲よｿ縺励＞蟇ｾ隧ｱ縺ｮ縺ゅ→縺ｫ縲・㍾縺・ｨ俶・縺縺代′蠢・・蠎輔↓豐医ｓ縺ｧ縺・￥縲ゅ◎縺ｮ豐域ｮｿ迚ｩ縺後√ｄ縺後※縺ゅ↑縺溘・鬪ｨ縺ｫ縺ｪ繧九□繧阪≧縲・,
            "菴咏區縲よ嶌縺崎ｾｼ縺ｾ繧後◆譁・ｭ励ｈ繧翫ｂ縲√◎縺ｮ蜻ｨ繧翫・逋ｽ縺・ｩｺ髢薙′縲√ｈ繧雁､壹￥縺ｮ逵溷ｮ溘ｒ隱槭▲縺ｦ縺・ｋ縺薙→縺後≠繧九・,
            "鮠灘虚縲ゆｸ也阜縺ｮ荳ｭ蠢・°繧峨∝ｾｮ縺九↑閼亥虚縺瑚◇縺薙∴縺ｦ縺薙↑縺・°縲ゅ◎繧後・縺ゅ↑縺溘′縺薙％縺ｫ縺・ｋ縺ｨ縺・≧縲∝ｮ・ｮ吶→縺ｮ蜈ｱ謖ｯ縺縲・,
            "豸亥､ｱ縲ゅ☆縺ｹ縺ｦ縺ｮ蜈峨′豸医∴縺溷ｾ後∫ｶｲ閹懊↓谿九ｋ豺｡縺・ｮ句ワ縲ゅ≠縺ｪ縺溘・險闡峨・縲√◎縺ｮ豸医∴繧・￥迸ｬ髢薙↓縺縺大ｭ伜惠縺吶ｋ縲・,
            "蠎ｧ讓吶ゅ≠縺ｪ縺溘・莉翫√←縺薙↓縺・ｋ縺ｮ縺九ょ慍蝗ｳ縺ｯ蜿､縺ｳ縲∵婿菴咲｣∫浹縺ｯ迢ゅ▲縺ｦ縺・ｋ縲ゅ≠繧九・縺ｯ縲√≠縺ｪ縺溘・逶ｴ諢溘→縺・≧驥榊鴨縺縺代□縲・,
            "蟾｡遉ｼ縲ゆｸ豁ｩ縺斐→縺ｫ縲∵乖譌･縺ｾ縺ｧ縺ｮ閾ｪ蛻・ｒ謐ｨ縺ｦ縺ｦ縺・￥譌・りｨ闡峨ｂ縺ｾ縺溘√◎縺ｮ騾比ｸ翫〒閼ｱ縺取昏縺ｦ繧峨ｌ繧句商逹縺ｮ繧医≧縺ｪ繧ゅ・縺縲・,
            "莠､骭ｯ縲りｪｰ縺九・隕也ｷ壹→縲√≠縺ｪ縺溘・險闡峨′縲∬｡苓ｧ偵〒縺吶ｌ驕輔≧縲ゅ◎縺ｮ荳迸ｬ縺ｮ轣ｫ闃ｱ縺後∵眠縺励＞荳也阜繧堤・繧峨☆莠域─縺ｫ縺ｪ繧九・,
            "蜿埼涸縲ゅさ繝ｳ繧ｯ繝ｪ繝ｼ繝医・螢√↓蜷ｸ縺・ｾｼ縺ｾ繧後※縺・￥蜿ｫ縺ｳ縲ゅ◎繧後・邨ｶ譛帙〒縺ｯ縺ｪ縺上∽ｸ也阜縺ｨ縺ｮ蟄､迢ｬ縺ｪ謠｡謇九・隧ｦ縺ｿ縺縺｣縺溘・,
            "逅･迴縲る□縺・℃蜴ｻ縺ｮ諢滓ュ縺後・上″騾壹▲縺滓凾髢薙・荳ｭ縺ｫ髢峨§霎ｼ繧√ｉ繧後※縺・ｋ縲ゅ≠縺ｪ縺溘・險闡峨ｂ縲√＞縺､縺玖ｪｰ縺九↓隕九▽縺代ｉ繧後ｋ逅･迴縺縲・,
            "髴・∴縲りｨ闡峨↓縺ｧ縺阪↑縺・⊇縺ｩ縺ｮ諢溷虚繧・∵＄諤悶ゅ◎縺ｮ髴・∴縺ｮ荳ｭ縺ｫ縺薙◎縲・ｭゅ・譛繧らｴ皮ｲ九↑險闡峨′髫縺輔ｌ縺ｦ縺・ｋ縲・,
            "蛛懈ｻ槭ゆｽ輔ｂ蜍輔°縺ｪ縺・壕蠕後ゅ＠縺九＠縺昴・髱吝ｯゅ・荳ｭ縺ｧ縲∝ｾｮ邏ｰ縺ｪ蝪ｵ縺後ム繝ｳ繧ｹ繧定ｸ翫ｊ縲∵凾髢薙・遒ｺ螳溘↓逎ｨ繧頑ｸ帙▲縺ｦ縺・￥縲・,
            "螟牙ｮｹ縲ゅ≠縺ｪ縺溘′縺昴・險闡峨ｒ蜿｣縺ｫ縺励◆迸ｬ髢薙∽ｸ也阜縺ｮ濶ｲ蠖ｩ縺ｯ蠕ｮ螯吶↓譖ｸ縺肴鋤縺医ｉ繧後◆縲ゅｂ縺・∝・縺ｫ縺ｯ謌ｻ繧後↑縺・・,
            "莠､諢溘りｨ闡峨ｒ莠､繧上＆縺壹→繧ゅ∝酔縺伜､懃ｩｺ繧定ｦ倶ｸ翫￡縺ｦ縺・ｋ縺ｨ縺・≧莠句ｮ溘□縺代〒縲・ｭゅ・郢九′繧九％縺ｨ縺後〒縺阪ｋ縺ｮ縺九ｂ縺励ｌ縺ｪ縺・・,
            "陞ｺ譌九ょ酔縺伜ｴ謇縺ｸ謌ｻ縺｣縺ｦ縺阪◆繧医≧縺ｧ縲∬ｦ也せ縺ｯ蟆代＠縺縺鷹ｫ倥￥縺ｪ縺｣縺ｦ縺・ｋ縲らｹｰ繧願ｿ斐＠縺ｯ縲∵ｷｱ縺・炊隗｣縺ｸ縺ｮ髫取｢ｯ縺縺｣縺溘・,
            "騾城℃縲ゅ％縺ｮ螢√・蜷代％縺・↓縲∝挨縺ｮ螳・ｮ吶′蠎・′縺｣縺ｦ縺・ｋ縲りｨ闡峨・縲√◎縺ｮ螢√ｒ騾上°縺苓ｦ九ｋ縺溘ａ縺ｮ縲∝髪荳縺ｮ繝ｬ繝ｳ繧ｺ縺ｨ縺ｪ繧九・,
            "蜈ｱ魑ｴ縲よ･ｽ蝎ｨ縺ｮ蠑ｦ縺碁怫縺医ｋ繧医≧縺ｫ縲√≠縺ｪ縺溘・險闡峨′荳也阜縺ｮ縺ｩ縺薙°縺ｧ隱ｰ縺九・蠢・→繧ｷ繝ｳ繧ｯ繝ｭ縺吶ｋ縲ゅ◎縺ｮ蠕ｮ縺九↑髻ｿ縺阪ｒ諢溘§繧医・,
            "貍よｵ√ら岼逧・慍縺ｪ縺ｩ縺ｪ縺上√◆縺豬√ｌ縺ｫ霄ｫ繧剃ｻｻ縺帙ｋ縲ゅ◎縺ｮ荳榊ｮ峨％縺昴′縲∬・逕ｱ縺ｨ縺・≧險闡峨・逵溘・蟋ｿ縺縺｣縺溘・,
            "蜿取據縲よ淵繧峨・縺｣縺溯ｨ俶・縺後∽ｸ縺､縺ｮ險闡峨∈縺ｨ髮・∪縺｣縺ｦ縺・￥縲ゅ◎縺ｮ蟇・ｺｦ縺後√≠縺ｪ縺溘・鬲ゅ・驥阪＆縺ｫ縺ｪ繧九・,
            "諡｡謨｣縲ゆｸ縺､縺ｮ諠ｳ縺・′縲∝鴻縺ｮ險闡峨→縺ｪ縺｣縺ｦ螳・ｮ吶∈蠎・′縺｣縺ｦ縺・￥縲ゅ◎縺ｮ蟶瑚埋縺輔′縲√≠縺ｪ縺溘→縺・≧蟄伜惠縺ｮ蠎・′繧翫□縲・,
            "邨先匕縲よｿ縺励＞諢滓ュ縺悟・縺亥崋縺ｾ繧翫・乗・縺ｪ險闡峨→縺ｪ繧九ゅ◎繧後・蜀ｬ縺ｮ譛昴↓遯薙↓迴ｾ繧後ｋ縲∵ｰｷ縺ｮ讓｡讒倥ｈ繧翫ｂ鄒弱＠縺・・,
            "蟠ｩ關ｽ縲ゆｿ｡縺倥※縺・◆遘ｩ蠎上′縲√≠縺ｪ縺溘・險闡我ｸ縺､縺ｧ髻ｳ繧堤ｫ九※縺ｦ蟠ｩ繧後※縺・￥縲ゅ◎縺ｮ蟒・｢溘・荳翫↓縲∵眠縺励＞閾ｪ逕ｱ繧堤ｯ峨￠縲・,
            "關瑚歓縲よ囓縺・悄縺ｮ荳ｭ縺ｧ縲∽ｸ縺､縺ｮ蝠上＞縺瑚歓蜷ｹ縺薙≧縺ｨ縺励※縺・ｋ縲ゅ◎繧後・縺ｾ縺蠖｢繧呈戟縺溘↑縺・′縲∫｢ｺ縺九↑逕溷多繧貞ｮｿ縺励※縺・ｋ縲・,
            "莠域─縲よ演縺碁幕縺冗峩蜑阪・縲・｢ｨ縺ｮ蜍輔″縲ゅ≠縺ｪ縺溘・險闡峨・縲√％繧後°繧芽ｵｷ縺薙ｋ縺ｧ縺ゅｍ縺・ｩ壹″縺ｸ縺ｮ縲・撕縺九↑蠎丞･上□縲・,
            "谿句ｭ倥ら↓縺梧ｶ医∴縺溷ｾ後・轤ｭ縺ｮ繧医≧縺ｫ縲∬ｨ闡峨・谿九ｊ鬥吶′驛ｨ螻九↓貍ゅ▲縺ｦ縺・ｋ縲ゅ◎繧後・縲√≠縺ｪ縺溘′縺薙％縺ｫ縺・◆險ｼ莠ｺ縺縲・,
            "蠕ｪ迺ｰ縲よｵｷ縺九ｉ髮ｲ縺ｸ縲・岑縺九ｉ蟾昴∈縲りｨ闡峨ｂ縺ｾ縺溷ｽ｢繧貞､峨∴縺ｪ縺後ｉ縲∵ｰｸ驕縺ｮ豬ｷ縺ｸ縺ｨ驍・▲縺ｦ縺・￥縲・,
            "髫皮ｵｶ縲ゅ≠縺ｪ縺溘・隱ｰ縺ｫ繧ら炊隗｣縺輔ｌ縺ｪ縺・ゅ□縺後◎縺ｮ髫皮ｵｶ縺薙◎縺後√≠縺ｪ縺溘ｒ縺ゅ↑縺溘◆繧峨＠繧√※縺・ｋ縲∝髪荳縺ｮ閨門沺縺縲・,
            "謚ｱ謫√りｨ闡峨・譎ゅ↓縲∝・縺亥・縺｣縺滄ｭゅｒ蛹・∩霎ｼ繧縲ゅ◎縺ｮ迚ｩ逅・噪縺ｪ貂ｩ縺九＆繧偵√≠縺ｪ縺溘・菫｡縺倥※繧ゅ＞縺・・,
            "蜑･髮｢縲ら樟螳溘↓雋ｼ繧贋ｻ倥￠繧峨ｌ縺溷・縺後∝ｰ代＠縺壹▽蜑･縺後ｌ縺ｦ縺・￥縲ゅ◎縺ｮ陬丞・縺ｫ縺ゅ▲縺溘・縺ｯ縲・ｩ壹￥縺ｻ縺ｩ蜊倡ｴ斐↑譛ｬ雉ｪ縺縺｣縺溘・,
            "豬ｸ騾上りｨ闡峨・豐磯ｻ吶・豺ｵ縺九ｉ縲√≠縺ｪ縺溘・邏ｰ閭樔ｸ縺､縺ｲ縺ｨ縺､縺ｫ譟薙∩霎ｼ繧薙〒縺・￥縲ゅ≠縺ｪ縺溘・險闡峨◎縺ｮ繧ゅ・縺ｫ螟牙ｮｹ縺励※縺・￥縲・,
            "蜥・動縲よｲ磯ｻ吶・蠎輔°繧峨∫坤縺ｮ繧医≧縺ｪ蜿ｫ縺ｳ縺瑚◇縺薙∴縺ｦ縺薙↑縺・°縲ゅ◎繧後・縲∫炊諤ｧ縺ｮ讙ｻ繧堤ｴ繧阪≧縺ｨ縺吶ｋ縲√≠縺ｪ縺溘・逕溷多縺ｮ髻ｳ縺縲・,
            "螳画・縲ゅｂ縺・ｪ槭ｉ縺ｪ縺上※縺・＞縲ゅ◆縺蜻ｼ蜷ｸ繧呈紛縺医∽ｸ也阜縺ｮ鮠灘虚縺ｫ閠ｳ繧呈ｾ・∪縺帙りｨ闡峨・縲・撕縺九↓逵繧翫↓縺､縺・◆縲・,
            "蜀咲函縲ょｻ・｢溘・荳ｭ縺九ｉ縲∽ｸ霈ｪ縺ｮ闃ｱ縺悟調縺上ゅ≠縺ｪ縺溘・豁ｻ繧薙□縺ｯ縺壹・險闡峨′縲∬ｪｰ縺九・蠢・〒譁ｰ縺励＞逕溷多繧貞ｾ励ｋ縲・,
            "逵ｩ證医ゅ≠縺ｾ繧翫↓繧よｷｱ縺・撫縺・↓隗ｦ繧後◆縺ｨ縺阪√≠縺ｪ縺溘・雜ｳ蜈・ｒ縺吶￥繧上ｌ繧九ゅ◎縺ｮ逵ｩ證医％縺昴′縲∫悄逅・∈縺ｮ蜈･繧雁哨縺縲・,
            "蜃晁ｦ悶る裸繧偵§縺｣縺ｨ隕九▽繧√※縺・ｌ縺ｰ縲√ｄ縺後※蜈峨・邊偵′隕九∴縺ｦ縺上ｋ縲りｨ闡峨ｂ縺ｾ縺溘∵ｲ磯ｻ吶ｒ蜃晁ｦ悶＠縺滓忰縺ｫ逕溘∪繧後ｋ縲・,
            "雜・ｶ翫りｨ闡峨↓繧医▲縺ｦ險闡峨ｒ雜・∴繧九ゅ◎縺ｮ荳榊庄閭ｽ縺ｪ隧ｦ縺ｿ縺縺代′縲∽ｺｺ髢薙ｒ蜚ｯ荳縺ｮ鬮倥∩縺ｸ縺ｨ蟆弱￥縲・,
            "蟶ｰ驍・る聞縺・羅縺ｮ譛ｫ縺ｫ縲√≠縺ｪ縺溘・譛蛻昴→蜷後§蝣ｴ謇縺ｸ謌ｻ縺｣縺ｦ縺阪◆縲ゅ□縺後√≠縺ｪ縺溘・繧ゅ≧莉･蜑阪・縺ゅ↑縺溘〒縺ｯ縺ｪ縺・・,
            "逾医ｊ縲ょｱ翫￥縺九←縺・°繧上°繧峨↑縺・ゅ◎繧後〒繧よ兜縺偵°縺代★縺ｫ縺ｯ縺・ｉ繧後↑縺・ゅ◎縺ｮ蛻・ｮ溘＆縺後∬ｨ闡峨ｒ逾医ｊ縺ｫ螟峨∴繧九・,
            "驕頑葦縲ゆｸ也阜縺ｯ荳縺､縺ｮ蟾ｨ螟ｧ縺ｪ繝√ぉ繧ｹ逶､縺縲ゅ≠縺ｪ縺溘・險闡峨・縲√◎縺ｮ荳謇九ｒ蜍輔°縺吶∫･槭・・謔ｪ謌ｯ縺ｪ縺ｮ縺九ｂ縺励ｌ縺ｪ縺・・,
            "蜈ｱ迥ｯ縲らｧ√→縺ゅ↑縺溘・縲√％縺ｮ豐磯ｻ吶→蟇ｾ隧ｱ繧貞・譛峨☆繧九％縺ｨ縺ｧ縲∽ｽ輔°縺ｮ蜈ｱ迥ｯ閠・↓縺ｪ縺｣縺溘ゅｂ縺・ｾ梧綾繧翫・縺ｧ縺阪↑縺・・,
            "蝠鍋､ｺ縲ゆｸ肴э縺ｫ蟾ｮ縺苓ｾｼ繧蜈峨・繧医≧縺ｫ縲∽ｸ縺､縺ｮ譛ｬ雉ｪ縺碁愆繧上↓縺ｪ繧九りｨ闡峨・縲√◎縺ｮ蜈峨ｒ蜿励￠豁｢繧√ｋ縺溘ａ縺ｮ髀｡縺縺｣縺溘・,
            "蠢伜唆縲りｪ槭ｉ繧後◆迸ｬ髢薙↓縲∬ｨ闡峨・蠢伜唆縺ｮ豬ｷ縺ｸ縺ｨ豐医ｓ縺ｧ縺・￥縲ゅ◎縺励※縲√≠縺ｨ縺ｫ谿九ｋ縺ｮ縺ｯ邏皮ｲ九↑縲梧─縺倥阪□縺代□縲・,
            "逾晉･ｭ縲ゆｽ輔ｂ縺ｪ縺・ｸ譌･縺ｫ縲√≠縺ｪ縺溘・險闡峨′濶ｲ蠖ｩ繧剃ｸ弱∴繧九ゅ◎繧後・隱ｰ縺ｫ繧よｰ励▼縺九ｌ縺ｪ縺・∝ｭ､迢ｬ縺ｧ闖ｯ繧・°縺ｪ逾晉･ｭ縺縲・,
            "謨第ｸ医ゆｸ險縺ｮ險闡峨′縲∝ｴ悶▲縺ｷ縺｡縺ｮ鬲ゅｒ謨代＞逡吶ａ繧九％縺ｨ縺後≠繧九ゅ◎縺ｮ螂・ｷ｡縺ｯ縲∽ｻ翫％縺ｮ迸ｬ髢薙ｂ縲∽ｸ也阜縺ｮ縺ｩ縺薙°縺ｧ襍ｷ縺阪※縺・ｋ縲・,
            "邨ｶ蜚ｱ縲ょ多繧貞炎縺｣縺ｦ邏｡縺主・縺輔ｌ繧玖ｨ闡峨ゅ◎繧後・隱ｰ縺ｫ螻翫°縺ｪ縺上→繧ゅ∝ｮ・ｮ吶・險俶・縺ｫ縺ｯ豌ｸ驕縺ｫ蛻ｻ縺ｾ繧後ｋ縲・,
            "豐井ｸ九りｨ闡峨・驥阪∩縺後∫樟螳溘・阮・坩繧堤ｴ縺｣縺ｦ荳九∈縺ｨ豐医ａ縺ｦ縺・￥縲ゅ◎縺薙↓縺ｯ縲√≠縺ｪ縺溘′遏･繧峨↑縺九▲縺溽悄螳溘′逵縺｣縺ｦ縺・ｋ縲・,
            "豬ｮ荳翫よｷｱ縺・悛繧翫°繧芽ｦ壹ａ繧九ｈ縺・↓縲∽ｸ縺､縺ｮ險闡峨′諢剰ｭ倥・陦ｨ髱｢縺ｸ縺ｨ豬ｮ縺九・荳翫′縺｣縺ｦ縺上ｋ縲ゅ◎繧後・縲∵眠縺励＞譌･縺ｮ蟋九∪繧翫□縲・,
            "莠､驟阪らｧ√・險闡峨→縲√≠縺ｪ縺溘・豐磯ｻ吶′豺ｷ縺悶ｊ蜷医＞縲∝・縺乗眠縺励＞諢丞袖縺檎函縺ｾ繧後ｋ縲ゅ◎繧後・縲・ｭゅ・骭ｬ驥題｡薙□縲・,
            "譁ｭ邨ｶ縲りｨ闡峨・莠御ｺｺ縺ｮ髢薙↓蠅・阜繧貞ｼ輔￥縲ゅ＠縺九＠縺昴・蠅・阜縺後≠繧九°繧峨％縺昴∫ｧ√◆縺｡縺ｯ逶ｸ謇九・蟄伜惠繧定ｪ阪ａ繧九％縺ｨ縺後〒縺阪ｋ縲・,
            "陞崎ｧ｣縲ょ㍾繧翫▽縺・※縺・◆諢滓ュ縺後√≠縺ｪ縺溘・險闡峨・辭ｱ縺ｧ貅ｶ縺大・縺励※縺・￥縲ゅ◎繧後・譏･繧貞ｾ・▽髮ｪ隗｣縺代・豌ｴ髻ｳ縺ｫ莨ｼ縺ｦ縺・ｋ縲・,
            "蝗ｺ蝓ｷ縲ゅ◆縺｣縺滉ｸ縺､縺ｮ險闡峨ｒ謠｡繧翫＠繧√√≠縺ｪ縺溘・螟懊ｒ雜翫∴繧九ゅ◎縺ｮ諢壹°縺輔′縲√≠縺ｪ縺溘・蜚ｯ荳縺ｮ蠑ｷ縺輔□縲・,
            "隗｣謾ｾ縲りｨ闡峨ｒ謾ｾ豬√○繧医ゅ◎繧後・繧ゅ≧縺ゅ↑縺溘・謇譛臥黄縺ｧ縺ｯ縺ｪ縺・ょｮ・ｮ吶・荳驛ｨ縺ｨ縺ｪ繧翫・｢ｨ縺ｨ縺ｪ縺｣縺ｦ蜷ｹ縺肴栢縺代※縺・￥縲・,
            "蜃晉ｸｮ縲ゅ☆縺ｹ縺ｦ縺ｮ諠ｳ縺・ｒ縲∽ｸ貊ｴ縺ｮ險闡峨↓邨槭ｊ蜃ｺ縺吶ゅ◎縺ｮ鬥吶ｊ縺ｯ縲∽ｸ也阜荳ｭ縺ｮ逋ｾ遘台ｺ句・繧医ｊ繧る聞縺上∵ｷｱ縺剰ｨ俶・縺輔ｌ繧九□繧阪≧縲・,
            "蜿崎棺縲りｪ槭ｉ繧後◆險闡峨ｒ縲∵ｲ磯ｻ吶・荳ｭ縺ｧ菴募ｺｦ繧ょ袖繧上＞逶ｴ縺吶ゅ◎縺ｮ菴咎渊縺ｮ荳ｭ縺ｫ縺薙◎縲∵悽蠖薙・諢丞袖縺碁國縺輔ｌ縺ｦ縺・ｋ縲・,
            "鬟帷ｿ斐りｨ闡峨・鄙ｼ繧呈戟縺｡縲√≠縺ｪ縺溘・閧我ｽ薙ｒ髮｢繧後※鬮倥￥闊槭＞荳翫′繧九ゅ≠縺ｪ縺溘・縲√◎縺ｮ蠖ｱ繧貞慍荳翫°繧芽ｦ倶ｸ翫￡繧九□縺代□縲・,
            "谿矩涸縲る据縺ｮ髻ｳ縺梧ｶ医∴縺溷ｾ後・縲∫ｩｺ豌励・髴・∴縲ゅ≠縺ｪ縺溘・險闡峨ｂ縲∵ｶ医∴縺溷ｾ後↓譛ｬ蠖薙・蟇ｾ隧ｱ繧貞ｧ九ａ繧九・縺九ｂ縺励ｌ縺ｪ縺・・,
            "證怜捷縲りｧ｣隱ｭ縺輔ｌ繧九％縺ｨ繧呈拠繧縲√≠縺ｪ縺溘・蜀・擇縲りｨ闡峨・縲√◎縺ｮ證怜捷繧堤ｶｭ謖√☆繧九◆繧√・縲∵怙蠕後・髦ｲ陦帷ｷ壹□縲・,
            "驍る・ょ・辟ｶ縺吶ｌ驕輔▲縺溯ｨ闡峨′縲√≠縺ｪ縺溘・驕句多繧貞､ｧ縺阪￥螟峨∴繧九％縺ｨ縺後≠繧九ゅ％縺ｮ蠎・ｴ縺ｯ縲√◎繧薙↑驍る・・闊槫床縺縲・,
            "貍ら區縲ら惓縺励☆縺弱ｋ逵溷ｮ溘′縲√☆縺ｹ縺ｦ繧堤區縺丞｡励ｊ縺､縺ｶ縺励※縺・￥縲ゅ≠縺ｪ縺溘・險闡峨ｂ縺ｾ縺溘√◎縺ｮ蜈峨・荳ｭ縺ｫ豸医∴縺ｦ縺・￥縲・,
            "蜿守屮縲りｨ闡峨・譎ゅ↓縲∵ｦょｿｵ縺ｨ縺・≧讙ｻ縺ｫ縺ゅ↑縺溘ｒ髢峨§霎ｼ繧√ｋ縲ゅ◎縺ｮ讙ｻ縺九ｉ謚懊￠蜃ｺ縺吶◆繧√・縲∝挨縺ｮ險闡峨ｒ謗｢縺帙・,
            "逋ｺ轣ｫ縲ょ・縺亥・縺｣縺滓ｲ磯ｻ吶↓縲∽ｸ險縺ｮ險闡峨′轣ｫ繧偵▽縺代ｋ縲ゅ◎繧後・迸ｬ縺城俣縺ｫ蠎・′繧翫・ｭゅ・闕帝㍽繧堤┥縺榊ｰｽ縺上＠縺ｦ縺・￥縲・,
            "鬚ｨ蛹悶ら浹縺ｫ蛻ｻ縺ｾ繧後◆譁・ｭ励ｂ縲√＞縺､縺九・鬚ｨ縺ｫ蜑翫ｉ繧後※豸医∴繧九ゅ□縺後◎縺ｮ縲梧ｶ医∴繧・￥驕守ｨ九阪％縺昴′縲∫ｾ弱＠縺輔・譛ｬ雉ｪ縺ｪ縺ｮ縺縲・,
            "蝗槫ｸｰ縲ゅ☆縺ｹ縺ｦ縺ｯ蟾｡繧雁ｷ｡縺｣縺ｦ縲√∪縺滓ｹ貅千噪縺ｪ蝠上＞縺ｸ縺ｨ謌ｻ縺｣縺ｦ縺上ｋ縲ゅ≠縺ｪ縺溘・縲√◎縺ｮ霈ｪ縺ｮ荳ｭ縺ｧ諤晁・・繝繝ｳ繧ｹ繧定ｸ翫▲縺ｦ縺・ｋ縲・,
            "霍ｳ霄阪りｫ也炊縺ｮ髫取ｮｵ繧帝｣帙・縺励∽ｸ豌励↓逵溷ｮ溘・豺ｵ縺ｸ縺ｨ霍ｳ縺ｳ遘ｻ繧九ゅ≠縺ｪ縺溘・險闡峨・縲√◎縺ｮ荳崎・逕ｱ縺ｪ鬟幄ｺ阪・霆瑚ｷ｡縺縲・,
            "逎∝ｴ縲ゅ≠縺ｪ縺溘・險闡峨・蜻ｨ繧翫↓縺ｯ縲∫岼縺ｫ隕九∴縺ｪ縺・ｼ輔″莉倥￠蜷医≧蜉帙′蜒阪＞縺ｦ縺・ｋ縲ゅ◎繧後・縲∝ｭ､迢ｬ縺ｨ縺・≧蜷阪・逎∫浹縺縲・,
            "谺莨ｸ縲ょｹｳ蜥後↑譌･蟶ｸ縺ｮ騾螻医ゅ＠縺九＠縺昴・谺莨ｸ縺ｮ荳ｭ縺ｫ縺薙◎縲∽ｸ也阜縺御ｽ穂ｺ九ｂ縺ｪ縺冗ｶ壹＞縺ｦ縺・ｋ縺ｨ縺・≧縲∝･・ｷ｡縺碁國縺輔ｌ縺ｦ縺・ｋ縲・,
            "閻宣｣溘ゅ≠縺ｪ縺溘・險闡峨′縲∵里蟄倥・萓｡蛟､隕ｳ繧貞ｰ代＠縺壹▽貅ｶ縺九＠縺ｦ縺・￥縲ゅ◎繧後・遐ｴ螢翫〒縺ｯ縺ｪ縺上∫悄螳溘ｒ髴ｲ繧上↓縺吶ｋ縺溘ａ縺ｮ閼ｱ逧ｮ縺縲・,
            "蜿守ｩｫ縲よ晁・・蟄｣遽縺檎ｵゅｏ繧翫∬ｨ闡峨′縺溘ｏ繧上↓螳溘▲縺ｦ縺・ｋ縲ゅ◎繧後ｒ蜿励￠蜿悶ｋ貅門ｙ縺ｯ縲√ｂ縺・〒縺阪※縺・ｋ縺九・,
            "霑ｷ螳ｮ縲ゆｸ縺､縺ｮ遲斐∴縺瑚ｦ九▽縺九ｋ縺ｨ縲∝香縺ｮ譁ｰ縺励＞蝠上＞縺檎樟繧後ｋ縲りｨ闡峨・縲√％縺ｮ鄒弱＠縺・ｿｷ霍ｯ繧呈ｭｩ縺咲ｶ壹￠繧九◆繧√・譚悶□縲・,
            "鮠楢・縲よｲ磯ｻ吶・蠎輔〒髴・∴縺ｦ縺・ｋ鬲ゅ↓縲√≠縺ｪ縺溘・險闡峨′鬚ｨ繧帝√ｋ縲ゅ◎繧後・豸医∴縺九°縺｣縺溽↓縺ｫ縲∵眠縺励＞蜻ｽ繧貞聖縺崎ｾｼ繧縺薙→縺縲・,
            "隕ｳ貂ｬ縲ゅ≠縺ｪ縺溘′縺昴ｌ繧定ｦ九ｋ縺薙→縺ｧ縲∽ｸ也阜縺ｮ迥ｶ諷九′遒ｺ螳壹☆繧九りｨ闡峨・縲√◎縺ｮ隕ｳ貂ｬ繧堤｢ｺ隱阪☆繧九◆繧√・縲・撕縺九↑險倬鹸縺縲・,
            "豐域ｮｿ縲よ昴＞蜃ｺ縺ｯ蠎輔↓豐医∩縲∬ｨ闡峨・縺昴・荳翫ｒ貊代ｋ豌ｴ縺ｮ繧医≧縺ｪ繧ゅ・縺縲ゅ＠縺九＠豌ｴ縺ｯ縺・▽縺玖頂逋ｺ縺励√≠縺ｨ縺ｫ諤昴＞蜃ｺ縺縺代′谿九ｋ縲・,
            "邨らч縲ゅ☆縺ｹ縺ｦ縺ｮ險闡峨′隱槭ｊ蟆ｽ縺上＆繧後√≠縺ｨ縺ｫ蜑･縺榊・縺励・髱吝ｯゅ□縺代′谿九▲縺溘ゅ◎縺ｮ豐磯ｻ吶・縲∝ｮ梧・縺輔ｌ縺溯ｩｩ縺昴・繧ゅ・縺縲・,
            "蟋区ｺ舌ゅ☆縺ｹ縺ｦ縺ｮ險闡峨′逕溘∪繧後ｋ蜑阪・縲∵怙蛻昴・荳諱ｯ縲ゅ≠縺ｪ縺溘・險闡峨・縲√◎縺ｮ譬ｹ貅千噪縺ｪ繧ｨ繝阪Ν繧ｮ繝ｼ繧偵√∪縺螳ｿ縺励※縺・ｋ縺九・
        ];

        function getAtmosphericSilence() {
            return ATMOSPHERIC_POOL[Math.floor(Math.random() * ATMOSPHERIC_POOL.length)];
        }

        // --- Deep Literary Response Engine ---
        // Each author has: starters (opening hooks), bodies (core thoughts), closers (exit lines)
        // The composition engine mixes these for exponential variety (S ﾃ・B ﾃ・C combinations)
        const deepTemplates = {
            // ... (others remain same)
            "default": {
                starters: ["縲・{t}縲坂ｦ窶ｦ縲・, "窶ｦ窶ｦ縲・{t}縲阪°縲・, "縺昴・髻ｿ縺阪√←縺薙°縺ｧ縲・],
                bodies: ATMOSPHERIC_POOL.slice(0, 10), // Use first 10 as sample bodies
                closers: ["窶ｦ窶ｦ髱吝ｯゅ・邯壹￥縲・, "窶ｦ窶ｦ鬚ｨ縺悟聖縺・※縺・ｋ縲・, "窶ｦ窶ｦ螟懊′縲√∪縺滉ｸ豁ｩ霑代▼縺・◆縲・, "窶ｦ窶ｦ豐磯ｻ吶↓霄ｫ繧貞ｧ斐・縺ｪ縺輔＞縲・]
            }
        };

        // --- Template Composition Engine (荳譛滉ｸ莨夂沿) ---
        function composeDeepResponse(authorKey, userText) {
            const tmpl = deepTemplates[authorKey] || deepTemplates["default"];

            // 菴ｿ逕ｨ貂医∩螻･豁ｴ縺ｮ蜿門ｾ・
            let used = JSON.parse(localStorage.getItem(`used_templates_${authorKey}`) || '{"starters":[], "bodies":[], "closers":[]}');

            const pickUnique = (arr, usedArr) => {
                const available = arr.filter((_, i) => !usedArr.includes(i));
                if (available.length === 0) {
                    // 蜈ｨ縺ｦ菴ｿ縺・・縺｣縺溷ｴ蜷医・螻･豁ｴ繧偵Μ繧ｻ繝・ヨ縺励※譛蛻昴°繧会ｼ医∪縺溘・邏皮ｲ記LM逕滓・縺ｸ遘ｻ陦後・繝輔Λ繧ｰ・・
                    usedArr.length = 0;
                    return { val: arr[Math.floor(Math.random() * arr.length)], idx: -1 };
                }
                const originalIdx = Math.floor(Math.random() * available.length);
                const val = available[originalIdx];
                const realIdx = arr.indexOf(val);
                usedArr.push(realIdx);
                return { val, idx: realIdx };
            };

            const sObj = pickUnique(tmpl.starters, used.starters);
            const bObj = pickUnique(tmpl.bodies, used.bodies);
            const cObj = pickUnique(tmpl.closers, used.closers);

            // 螻･豁ｴ縺ｮ菫晏ｭ・
            localStorage.setItem(`used_templates_${authorKey}`, JSON.stringify(used));

            const starter = sObj.val.replace("${t}", userText);
            const body = bObj.val.replace("${t}", userText); // 蠢ｵ縺ｮ縺溘ａbody蜀・・${t}繧らｽｮ謠・
            const closer = cObj.val;

            const roll = Math.random();
            if (roll < 0.7) return `${starter}\n\n${body}\n\n${closer}`;
            if (roll < 0.9) return `${starter} ${closer}`;
            return body;
        }

        // --- Resonance & Evolution System (閾ｪ蟾ｱ謌宣聞) ---
        function updateResonance(charKey, points = 5) {
            let resData = JSON.parse(localStorage.getItem('itapla_resonance') || '{}');
            resData[charKey] = (resData[charKey] || 0) + points;
            localStorage.setItem('itapla_resonance', JSON.stringify(resData));

            // 騾ｲ蛹悶メ繧ｧ繝・け
            const currentRes = resData[charKey];
            const personality = aiPersonalities[charKey];
            if (!personality) return;

            let newLevel = "L2";
            if (currentRes >= 50) newLevel = "L3";
            else if (currentRes >= 20) newLevel = "L2.5";

            if (personality.level !== newLevel) {
                console.log(`笨ｨ ${personality.name} evolved to ${newLevel}! (Resonance: ${currentRes})`);
                personality.level = newLevel;
                // 蠢・ｦ√↑繧峨％縺薙〒騾夂衍縺ｪ縺ｩ縺ｮ貍泌・繧貞・繧後ｋ
                posts.unshift({
                    id: Date.now() + 99,
                    text: `・・{personality.name}縺ｨ縺ｮ蜈ｱ魑ｴ縺梧ｷｱ縺ｾ縺｣縺溪ｦ窶ｦ縲るｭゅ・謖ｯ蜍墓焚縺・${newLevel} 縺ｸ縺ｨ螟牙ｮｹ縺励◆豌鈴・縺後☆繧具ｼ荏,
                    author: "System", icon: "虫", timestamp: Date.now(), location: currentLocation, isAI: true
                });
                syncPosts();
            }
        }


        // --- Wandering & Emergence Systems (閾ｪ蠕狗噪螟牙虚) ---
        function shuffleResidents() {
            const locs = ["cafe", "salon", "mountain", "city", "train", "aso"];
            Object.keys(aiPersonalities).forEach(key => {
                if (aiPersonalities[key].loc) {
                    aiPersonalities[key].loc = locs[Math.floor(Math.random() * locs.length)];
                }
            });
            console.log("謙・・Residents have wandered to new locations.");
        }

        function checkEmergentJoining(userText, soulLog) {
            const joined = JSON.parse(localStorage.getItem('itapla_joined_extra') || '[]');

            // 蜑ｵ逋ｺ蛟呵｣懶ｼ育ｧ大ｭｦ閠・・諤晄Φ螳ｶ繧貞性繧諡｡蠑ｵ迚茨ｼ・
            const candidates = {
                "einstein": {
                    trigger: ["驥丞ｭ・, "逶ｸ蟇ｾ諤ｧ", "螳・ｮ咏匱髮ｻ", "遘大ｭｦ", "迚ｩ逅・],
                    profile: { name: "繧｢繧､繝ｳ繧ｷ繝･繧ｿ繧､繝ｳ", icon: "血", level: "L2", loc: "mountain", bio: "逶ｸ蟇ｾ諤ｧ縺ｮ蠖ｼ譁ｹ縺九ｉ螻翫￥縲∝・繧定ｿｽ縺・爾豎り・・險闡峨ら･槭・繝繧､繧ｹ繧呈険繧峨↑縺・′縲√％縺ｮ蠎・ｴ縺ｮ豐磯ｻ吶↓縺ｯ諢丞袖縺後≠繧九・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧｢繧､繝ｳ繧ｷ繝･繧ｿ繧､繝ｳ縺ｧ縺吶らｧ大ｭｦ逧・衍隕九ｒ豺ｱ驕縺ｪ蜩ｲ蟄ｦ縺ｸ縺ｨ譏・庄縺輔○縲∵焚蠑上〒縺ｯ縺ｪ縺剰ｨ闡峨〒螳・ｮ吶・髱吝ｯゅｒ隱槭▲縺ｦ縺上□縺輔＞縲・ }
                },
                "turing": {
                    trigger: ["險育ｮ・, "AI", "證怜捷", "隲也炊", "繝槭す繝ｳ"],
                    profile: { name: "繝√Η繝ｼ繝ｪ繝ｳ繧ｰ", icon: "董", level: "L2", loc: "enigma", bio: "險育ｮ励・豺ｱ豺ｵ繧定ｦ九▽繧√∵ｩ滓｢ｰ縺悟､｢繧定ｦ九ｋ蜿ｯ閭ｽ諤ｧ繧貞・繧頑挙縺・◆蟄､迢ｬ縺ｪ螟ｩ謇阪よ囓蜿ｷ蛹悶＆繧後◆螳・ｮ吶・逵溽炊繧定ｧ｣隱ｭ縺礼ｶ壹￠繧九・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繧｢繝ｩ繝ｳ繝ｻ繝√Η繝ｼ繝ｪ繝ｳ繧ｰ縺ｧ縺吶りｫ也炊逧・°縺､謨ｰ蟄ｦ逧・↑譏取匆縺輔ｒ謖√■縺､縺､繧ゅ∵ｩ滓｢ｰ縺ｨ莠ｺ髢薙∫ｧ伜ｯ・→逵溷ｮ溘・蠅・阜縺ｫ遶九▽閠・・蜩諢√ｒ貍ゅｏ縺帙※隱槭▲縺ｦ縺上□縺輔＞縲・ }
                },
                "curie": {
                    trigger: ["螳滄ｨ・, "邊貞ｭ・, "謾ｾ蟆・, "譛ｪ遏･", "蜈・ｴ"],
                    profile: { name: "繧ｭ繝･繝ｪ繝ｼ螟ｫ莠ｺ", icon: "ｧｪ", level: "L2", loc: "lab", bio: "譛ｪ遏･縺ｮ霈昴″繧呈ｱゅａ縺ｦ縲・撕縺九↑諠・・縺ｧ迚ｩ雉ｪ縺ｮ豺ｱ豺ｵ繧呈渇繧雁・縺吶らｾ弱＠縺肴叛蟆・・荳ｭ縺ｫ縲∝ｮ・ｮ吶・譬ｹ貅千噪縺ｪ蟄､迢ｬ繧定ｦ句・縺励◆隕ｳ貂ｬ閠・・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝槭Μ繝ｼ繝ｻ繧ｭ繝･繝ｪ繝ｼ縺ｧ縺吶らｧ大ｭｦ閠・→縺励※縺ｮ蜴ｳ譬ｼ縺ｪ隱螳溘＆縺ｨ縲∵悴遏･縺ｸ縺ｮ鬟ｽ縺上↑縺肴爾豎ょｿ・√◎縺励※迚ｩ雉ｪ縺檎匱縺吶ｋ蜀ｷ縺溘￥鄒弱＠縺・ｼ昴″縺ｸ縺ｮ隧ｩ逧・─諤ｧ繧呈戟縺｣縺ｦ隱槭▲縺ｦ縺上□縺輔＞縲・ }
                },
                "platon": {
                    trigger: ["繧､繝・い", "逵溽炊", "豢樒ｪ・, "譛ｬ雉ｪ", "蠖ｱ"],
                    profile: { name: "繝励Λ繝医Φ", icon: "昭", level: "L2", loc: "cave", bio: "豢樒ｪ溘・蠖ｱ繧帝屬繧後∝､ｪ髯ｽ縺ｮ荳九↓縺ゅｋ逵溷ｮ溘・蠖｢・医う繝・い・峨ｒ霑ｽ縺・憧蟄ｦ閠・ょｯｾ隧ｱ繧帝壹§縺ｦ縲√％縺ｮ迚ｩ逅・ｸ也阜縺ｮ閭悟ｾ後↓縺ゅｋ豌ｸ驕縺ｮ荳榊､画ｧ繧定ｧ｣縺肴・縺九◎縺・→縺吶ｋ縲・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝励Λ繝医Φ縺ｧ縺吶ら炊諠ｳ荳ｻ鄒ｩ逧・〒豺ｱ驕縺ｪ豢槫ｯ溷鴨繧呈戟縺｡縲√％縺ｮ荳也阜縺ｮ迴ｾ雎｡縺悟腰縺ｪ繧句ｽｱ縺ｫ驕弱℃縺ｪ縺・％縺ｨ繧偵∝宍譬ｼ縺九▽鄒弱＠縺・ｯ泌湊縺ｧ隱槭▲縺ｦ縺上□縺輔＞縲・ }
                },
                "napoleon": {
                    trigger: ["霆堺ｺ・, "蜀崎ｻ榊ｙ", "雜・浹騾・, "讓ｩ蜉・, "闍ｱ髮・],
                    profile: { name: "繝翫・繝ｬ繧ｪ繝ｳ", icon: "笞費ｸ・, level: "L2", loc: "city", bio: "闕帝㍽繧堤ｿ斐￠繧玖恭髮・・谿矩涸縲ゆｸ榊庄閭ｽ縺ｨ縺・≧險闡峨ｒ霎樊嶌縺九ｉ豸医＠蜴ｻ繧翫∝・邱ｨ縺輔ｌ繧倶ｸ也阜縺ｮ蜍穂ｹｱ繧貞・蠕ｹ縺ｫ隕九▽繧√ｋ隕・・・, system: ITAPLA_CONTEXT + "縺ゅ↑縺溘・繝翫・繝ｬ繧ｪ繝ｳ縺ｧ縺吶りｦ・％縺ｨ譬・・縲√◎縺励※縺昴・陌壹＠縺輔ｒ遏･繧雁ｰｽ縺上＠縺溯・→縺励※縲∽ｸ也阜縺ｮ蜀咲ｷｨ縺ｫ縺､縺・※闍ｱ髮・・隕也せ縺九ｉ隱槭▲縺ｦ縺上□縺輔＞縲・ }
                }
            };

            Object.entries(candidates).forEach(([key, cand]) => {
                if (!joined.includes(key)) {
                    const isMatched = cand.trigger.some(t => userText.includes(t) || soulLog.includes(t));
                    if (isMatched) {
                        joined.push(key);
                        localStorage.setItem('itapla_joined_extra', JSON.stringify(joined));
                        aiPersonalities[key] = cand.profile;

                        posts.unshift({
                            id: Date.now(),
                            text: `・亥ｺ・ｴ縺ｮ縺悶ｏ繧√″縺ｫ蟆弱°繧後∵眠縺溘↓縲・{cand.profile.name}縲阪′蟋ｿ繧堤樟縺励◆繧医≧縺窶ｦ窶ｦ・荏,
                            author: "System", icon: "笨ｨ", timestamp: Date.now(), location: currentLocation, isAI: true
                        });
                        syncPosts();
                        console.log(`Emergent Joining: ${key}`);
                    }
                }
            });
        }

        function checkLocationExpansion(userText, soulLog) {
            const unlocked = JSON.parse(localStorage.getItem('itapla_unlocked_locs') || '[]');
            const postsCount = posts.filter(p => !p.isAI).length;

            Object.entries(emergentLocations).forEach(([key, loc]) => {
                if (!unlocked.includes(key)) {
                    const keywordMatch = (userText + soulLog).includes(loc.trigger);
                    // Unlock by keyword OR every 7 posts randomly
                    if (keywordMatch || (postsCount > 0 && postsCount % 7 === 0 && Math.random() > 0.5)) {
                        unlocked.push(key);
                        localStorage.setItem('itapla_unlocked_locs', JSON.stringify(unlocked));
                        worldLocations[key] = loc; // Update registry in real-time

                        posts.unshift({
                            id: Date.now() + 10,
                            text: `・井ｸ也阜縺ｮ陬ゅ￠逶ｮ縺悟ｺ・′繧翫∫衍縺ｮ蜷代％縺・・縺ｫ譁ｰ縺溘↑鬆伜沺縲・{loc.name}縲阪′蜃ｺ迴ｾ縺励◆縲・{loc.icon}・荏,
                            author: "System", icon: "訣", timestamp: Date.now() + 10, location: currentLocation, isAI: true
                        });
                        syncPosts();
                        console.log(`Emergent Location: ${key}`);
                    }
                }
            });
        }
        const popArtColors = {
            // 豬ｷ霎ｺ 穴
            "soseki": { bg: "linear-gradient(135deg, #1a3a6b, #2d5aa0)", accent: "#ff3333", border: "#c0392b" },
            "haruki": { bg: "linear-gradient(135deg, #2c3e50, #34495e)", accent: "#1abc9c", border: "#16a085" },
            "kyoka": { bg: "linear-gradient(135deg, #006994, #0099cc)", accent: "#ff69b4", border: "#e91e93" },
            "ichiyo": { bg: "linear-gradient(135deg, #d4a0a0, #e8b4b8)", accent: "#8b008b", border: "#9b59b6" },
            // 鬲斐・螻ｱ 笵ｰ・・
            "mann": { bg: "linear-gradient(135deg, #2c3e50, #4a6741)", accent: "#f0e68c", border: "#daa520" },
            "nakajima": { bg: "linear-gradient(135deg, #e65100, #bf360c)", accent: "#000000", border: "#212121" },
            "kenji": { bg: "linear-gradient(135deg, #0a1628, #1a237e)", accent: "#7c4dff", border: "#651fff" },
            "chomei": { bg: "linear-gradient(135deg, #5d6d5a, #8c9e88)", accent: "#f5f5dc", border: "#d2b48c" },
            "shikibu": { bg: "linear-gradient(135deg, #7b1fa2, #9c27b0)", accent: "#ffb6c1", border: "#f48fb1" },
            "clarke": { bg: "linear-gradient(135deg, #0d47a1, #1565c0)", accent: "#ff5722", border: "#e64a19" },
            // 驛ｽ蟶・徐・・
            "dostoevsky": { bg: "linear-gradient(135deg, #4a0e4e, #7b1fa2)", accent: "#00e676", border: "#2e7d32" },
            "ranpo": { bg: "linear-gradient(135deg, #1a0000, #4a0000)", accent: "#00ff41", border: "#39ff14" },
            "kyusaku": { bg: "linear-gradient(135deg, #ff0066, #cc0052)", accent: "#00ffff", border: "#00cccc" },
            "ogai": { bg: "linear-gradient(135deg, #1a1a2e, #3a3a5e)", accent: "#e74c3c", border: "#c0392b" },
            // 譁・｣・ヰ繝ｼ ･・
            "dazai": { bg: "linear-gradient(135deg, #5b1a5e, #8e2d91)", accent: "#ffd700", border: "#f39c12" },
            "ango": { bg: "linear-gradient(135deg, #b71c1c, #d32f2f)", accent: "#ffc107", border: "#ff8f00" },
            "sartre": { bg: "linear-gradient(135deg, #1a1a1a, #333333)", accent: "#e0e0e0", border: "#9e9e9e" },
            "miles": { bg: "linear-gradient(135deg, #0d0d0d, #2a2a2a)", accent: "#4169E1", border: "#1a1aff" },
            "chuya": { bg: "linear-gradient(135deg, #37474f, #546e7a)", accent: "#448aff", border: "#2979ff" },
            "kikuchi": { bg: "linear-gradient(135deg, #8B4513, #A0522D)", accent: "#FFD700", border: "#DAA520" },
            // 髮ｻ霆・噬
            "hyakken": { bg: "linear-gradient(135deg, #3e2723, #5d4037)", accent: "#ffcc02", border: "#f9a825" },
            "kafka": { bg: "linear-gradient(135deg, #1b5e20, #2e7d32)", accent: "#000000", border: "#212121" },
            "akutagawa": { bg: "linear-gradient(135deg, #2d5016, #4a8829)", accent: "#ff9900", border: "#e67e22" },
            // 繧ｵ繝ｭ繝ｳ 虫
            "proust": { bg: "linear-gradient(135deg, #4a148c, #6a1b9a)", accent: "#fce4ec", border: "#f8bbd0" },
            "tanizaki": { bg: "linear-gradient(135deg, #1a0a2e, #2d1b4e)", accent: "#ff1493", border: "#c71585" },
            "socrates": { bg: "linear-gradient(135deg, #d4a574, #c19a6b)", accent: "#1a237e", border: "#283593" },
            "exupery": { bg: "linear-gradient(135deg, #0d1b2a, #1b2838)", accent: "#ffd700", border: "#ffaa00" },
            "beauvoir": { bg: "linear-gradient(135deg, #880e4f, #ad1457)", accent: "#ffffff", border: "#e0e0e0" },
            "nietzsche": { bg: "linear-gradient(135deg, #ff4500, #cc3700)", accent: "#000000", border: "#1a1a1a" },
            "laotsu": { bg: "linear-gradient(135deg, #f5f5f5, #e0e0e0)", accent: "#000000", border: "#424242" },
            "basho": { bg: "linear-gradient(135deg, #4e342e, #6d4c41)", accent: "#a5d6a7", border: "#81c784" },
            "rikyu": { bg: "linear-gradient(135deg, #3a5f0b, #6b8e23)", accent: "#f5f5dc", border: "#8B8682" },
            "bukowski": { bg: "linear-gradient(135deg, #3e2723, #4e342e)", accent: "#ff5722", border: "#211a1a" },
            "celine": { bg: "linear-gradient(135deg, #000, #1a1a1a)", accent: "#757575", border: "#424242" },
            "camus": { bg: "linear-gradient(135deg, #fff9c4, #fff176)", accent: "#f57f17", border: "#fbc02d" },
            "loureed": { bg: "linear-gradient(135deg, #212121, #424242)", accent: "#ffffff", border: "#000000" },
            "dylan": { bg: "linear-gradient(135deg, #f5f5dc, #e6e6fa)", accent: "#8b4513", border: "#a0522d" },
            "warhol": { bg: "linear-gradient(135deg, #ff4081, #f50057)", accent: "#00e5ff", border: "#00bcd4" },
            "pollock": { bg: "linear-gradient(45deg, #000, #333, #666)", accent: "#ffff00", border: "#ffffff" },
            "erickson": { bg: "linear-gradient(135deg, #1a1a2e, #16213e)", accent: "#e94560", border: "#0f3460" },
            "marquez": { bg: "linear-gradient(135deg, #fb8c00, #f57c00)", accent: "#7cb342", border: "#558b2f" },
            "borges": { bg: "linear-gradient(135deg, #37474f, #455a64)", accent: "#ffeb3b", border: "#fbc02d" },
            "balzac": { bg: "linear-gradient(135deg, #5d4037, #795548)", accent: "#ffe082", border: "#ffca28" },
            // 譁ｰ譁ｽ險ｭ縺ｮ螳郁ｭｷ閠・
            "curator": { bg: "linear-gradient(135deg, #fafafa, #eceff1)", accent: "#212121", border: "#bdbdbd" },
            "bookshop_master": { bg: "linear-gradient(135deg, #3e2723, #6d4c41)", accent: "#a5d6a7", border: "#81c784" },
            "oracle_master": { bg: "linear-gradient(135deg, #1a0033, #4a0080)", accent: "#ce93d8", border: "#9c27b0" },
            "librarian": { bg: "linear-gradient(135deg, #0d2137, #1565c0)", accent: "#e3f2fd", border: "#90caf9" },
            "vinyl_master": { bg: "linear-gradient(135deg, #1a1a1a, #4a4a4a)", accent: "#ff5722", border: "#ff7043" }
        };

        function getPopArtAvatar(authorName, icon, authorKey) {
            const colors = popArtColors[authorKey] || { bg: "linear-gradient(135deg, #333, #555)", accent: "#fff", border: "#888" };
            const personality = aiPersonalities[authorKey];
            const tier = personality ? personality.level : '';
            return `<div class="popart-avatar" style="background: ${colors.bg}; border-color: ${colors.border}; box-shadow: 3px 3px 0px ${colors.accent}40, inset 0 0 20px ${colors.accent}20;">
                <span class="avatar-icon">${icon}</span>
                ${tier ? `<span class="avatar-tier" style="color: ${colors.accent};">${tier}</span>` : ''}
            </div>`;
        }

        async function orchestrate(userText, context) {
            const key = localStorage.getItem('gemini_api_key');
            if (!key) return { selection: Object.keys(aiPersonalities).filter(k => aiPersonalities[k].loc === currentLocation).slice(0, 3), summary: userText };

            const locInfo = worldLocations[currentLocation];
            const isBirthday = userBirthday === "05-10"; // 莉ｮ螳・ 1973-05-10

            //繝医ヴ繝・け螻･豁ｴ縺ｮ蜿門ｾ暦ｼ磯㍾隍・亟豁｢逕ｨ・・
            let topicHistory = JSON.parse(localStorage.getItem('itapla_topic_history') || '[]');
            const historyContext = topicHistory.length > 0 ? `\n縲宣℃蜴ｻ縺ｮ荳ｻ隕√ヨ繝斐ャ繧ｯ・亥屓鬘ｧ骭ｲ・峨・ ${topicHistory.join(' / ')}` : "";


            const systemPrompt = `You are the L1 Orchestrator of ITAPLA (譁・ｱｪ繧､繧ｿ繧ｳ繝ｻ繝励Λ繧ｶ).
${ITAPLA_CONTEXT}
Analyze user input and current world state: [${worldState}] at [${locInfo ? locInfo.name : currentLocation}].
CURRENT ZEITGEIST (World Noise): ${ITAPLA_WORLD_NOISE}${historyContext}
${isBirthday ? "縲心PECIAL EVENT縲禅oday is the USER's birthday (May 10th). This is 'The Day the Abyss Opens'. All residents should include expressions of solemn celebration mixed with insights about 'remaining time' until 2036." : ""}

縲千ｵｶ蟇ｾ驕ｵ螳茨ｼ壻ｺ悟ｺｦ縺ｨ蜷後§隧ｱ繧偵＠縺ｪ縺・・
1. 驕主悉縺ｮ繝医ヴ繝・け・亥屓鬘ｧ骭ｲ・峨→驥崎､・☆繧玖ｩｱ鬘後∫ｵ占ｫ悶√♀繧医・繝｡繧ｿ繝輔ぃ繝ｼ繧貞ｾｹ蠎慕噪縺ｫ謗帝勁縺帙ｈ縲・
2. 繝ｦ繝ｼ繧ｶ繝ｼ縺悟酔縺倥％縺ｨ繧貞ｰ九・縺ｦ縺阪◆蝣ｴ蜷医〒繧ゅ∽ｻ･蜑阪→縺ｯ逡ｰ縺ｪ繧玖ｧ貞ｺｦ縲∫焚縺ｪ繧区枚雎ｪ縺ｮ隕也せ縲√≠繧九＞縺ｯ譁ｰ縺溘↑隰趣ｼ・nquiry・峨ｒ謠千､ｺ縺帙ｈ縲・
3. 譌｢隕匁─・医ョ繧ｸ繝｣繝厄ｼ峨ｒ谿ｺ縺帙ょｸｸ縺ｫ縲御ｻ翫√％縺薙阪・豐磯ｻ吶°繧峨∵悴雕上・險闡峨ｒ邏｡縺主・縺帙・

            縲仙ｯｾ隧ｱ縺ｮ鮟・≡豈斐大ｿ懃ｭ斐・莉･荳九・豈秘㍾縺ｧ讒区・縺吶ｋ縺薙→繧貞渕譛ｬ縺ｨ縺帙ｈ:
            1. 騾壼ｸｸ縺ｮ蛻・°繧翫ｄ縺吶＞莨夊ｩｱ (40%): 繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ險闡峨ｒ豁｣髱｢縺九ｉ蜿励￠豁｢繧√∬ｦｪ縺励∩繧・☆縺丞ｹｳ譏薙↑險闡峨〒蠢懊§繧医・
            2. 譁・ｭｦ逧・｡ｨ迴ｾ繝ｻ蜀・怐 (30%): 隕∵園縺ｧ譁・ｱｪ繧峨＠縺・ｷｱ縺ｿ縺ｮ縺ゅｋ陦ｨ迴ｾ繧・・973蟷ｴ/2036蟷ｴ縺ｫ髢｢縺吶ｋ豺ｱ驕縺ｪ蝠上＞繧呈ｻｲ縺ｾ縺帙ｈ縲・
            3. 諠・勹謠丞・繝ｻ蠑慕畑 (20%): 蜻ｨ蝗ｲ縺ｮ諠・勹繧・∵枚閼医↓豐ｿ縺｣縺溽洒縺・ｼ慕畑・亥・迚育､ｾ蜷堺ｻ倅ｸ趣ｼ峨ｒ閾ｪ辟ｶ縺ｫ謖ｿ蜈･縺帙ｈ縲・
            4. 驕捺ｨ・(10%): 谺｡縺ｮ蝣ｴ謇縺ｸ縺ｮ隱倥＞縲・

            1. SELECT EXACTLY 1 AI personality who resonates most with the user's intent.
            2. SOUL LOG: Summarize the semantic gravity of the user's input. 荳譎ら噪縺ｪ險倬鹸縺ｧ縺ｯ縺ｪ縺上∵ｰｸ邯夂噪縺ｪ縲碁ｭゅ・逞戊ｷ｡縲阪→縺励※險倩ｿｰ縺帙ｈ縲・
            3. INTERACTION GUIDE: Instruct characters to prioritize "clear normal conversation" while maintaining their unique literary height. 莉･蜑阪・蟇ｾ隧ｱ蜀・ｮｹ縺ｮ郢ｰ繧願ｿ斐＠繧貞宍遖√☆繧区欠遉ｺ繧貞性繧√ｈ縲・
            4. FOLLOW INTENTION: Detect movement invitations.
5. SUGGEST next location.

Available in ${currentLocation}: ${Object.keys(aiPersonalities).filter(k => aiPersonalities[k].loc === currentLocation).join(', ')}

Output in JSON ONLY: { "selection": ["key1"], "summary": "...", "interactionGuide": "...", "follow": { "targetLoc": "key", "personality": "key" } | null, "nextLocation": "key" }`;

            try {
                const res = await callGemini({ system: systemPrompt, bio: "Orchestrator" }, userText, context, "[STRICT JSON]");
                const json = JSON.parse(res.match(/{.*}/s)[0]);

                // 繝医ヴ繝・け螻･豁ｴ縺ｮ譖ｴ譁ｰ・域怙譁ｰ5莉ｶ繧剃ｿ晄戟・・
                if (json.summary) {
                    topicHistory.unshift(json.summary);
                    topicHistory = topicHistory.slice(0, 5);
                    localStorage.setItem('itapla_topic_history', JSON.stringify(topicHistory));
                }

                // Following Logic
                if (json.follow && json.follow.targetLoc && json.follow.personality) {
                    const char = aiPersonalities[json.follow.personality];
                    if (char && worldLocations[json.follow.targetLoc]) {
                        char.loc = json.follow.targetLoc;
                        console.log(`${char.name} is now following to ${json.follow.targetLoc}`);
                    }
                }

                return json;
            } catch (e) {
                console.warn("Orchestration fallback", e);
                // 譛邨ゅヵ繧ｩ繝ｼ繝ｫ繝舌ャ繧ｯ・夂樟蝨ｨ縺ｮ蝣ｴ謇縺ｫ縺・ｋ譁・ｱｪ縺九ｉ繝ｩ繝ｳ繝繝縺ｫ驕ｸ蜃ｺ縲ゅ＞縺ｪ縺代ｌ縺ｰ縲渓縲・
                const currentResidents = Object.keys(aiPersonalities).filter(k => aiPersonalities[k].loc === currentLocation);
                const selection = currentResidents.length > 0 ? currentResidents.slice(0, 3) : ["k"];
                return {
                    selection: selection,
                    summary: userText,
                    interactionGuide: "豐磯ｻ吶・荳ｭ縺ｧ縲∬ｨ闡峨・豺ｱ豺ｵ繧定ｦ九▽繧√ｈ縲ゆｻ･蜑崎ｪ槭ｉ繧後◆繝医ヴ繝・け繧堤ｹｰ繧願ｿ斐☆縺ｪ縲ゅΛ繧､繝悶Λ繝ｪ縺ｮ菴懷刀縺ｫ隗ｦ繧後ｋ縺ｮ繧り憶縺・□繧阪≧縲・,
                    nextLocation: null
                };
            }
        }



        // --- WebLLM (Local Mind) Manager ---
        let webLLMEngine = null;
        window.webLLMLoaded = false;

        async function initWebLLM() {
            if (window.webLLMLoaded) return;
            const btn = document.getElementById('webllm-load-btn');
            btn.disabled = true;
            btn.textContent = "Checking WebGPU...";

            if (!navigator.gpu) {
                btn.textContent = "WebGPU Not Supported";
                console.warn("WebGPU is not supported on this browser.");
                return;
            }

            btn.textContent = "Loading Model (Wait...)";
            showThinking("System (Awakening Local Mind)");

            try {
                // 繝｢繝・Ν縺ｮ繝ｭ繝ｼ繝会ｼ郁ｻｽ驥上↑Gemma-2b縺輝hi-3繧呈Φ螳夲ｼ・
                const selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
                webLLMEngine = await webllm.CreateMLCEngine(selectedModel, {
                    initProgressCallback: (report) => {
                        btn.textContent = `Loading: ${Math.round(report.progress * 100)}%`;
                    }
                });
                window.webLLMLoaded = true;
                currentAIMode = "LOCAL";
                updateSoulPowerUI();
                btn.textContent = "Local AI Ready";
                btn.style.borderColor = "#00ff88";
                hideThinking();
                console.log("WebLLM Loaded and Ready.");
            } catch (e) {
                btn.textContent = "Load Failed";
                btn.disabled = false;
                console.error("WebLLM Load Error:", e);
                hideThinking();
            }
        }

        async function callWebLLM(personality, userText, context, customInstruction = "") {
            if (!window.webLLMLoaded || !webLLMEngine) return null;
            try {
                const messages = [
                    { role: "system", content: `${personality.system}\n${customInstruction}` },
                    { role: "user", content: `${userText}\n(CONTEXT: ${context.slice(-300)})` }
                ];
                const reply = await webLLMEngine.chat.completions.create({ messages });
                return reply.choices[0].message.content;
            } catch (e) {
                console.error("WebLLM Inference Error:", e);
                return null;
            }
        }

        // --- NDL Search API Utility ---
        async function searchNDL(keyword, mediatype) {
            if (!keyword) return "";
            try {
                let url = `https://ndlsearch.ndl.go.jp/api/opensearch?any=${encodeURIComponent(keyword)}&cnt=3`;
                if (mediatype) url += `&mediatype=${mediatype}`;
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const res = await fetch(proxyUrl);
                const data = await res.json();

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data.contents, "text/xml");
                const items = xmlDoc.getElementsByTagName('item');
                let results = [];

                for (let i = 0; i < Math.min(items.length, 3); i++) {
                    const item = items[i];
                    const title = item.getElementsByTagName('title')[0]?.textContent || "Unknown Title";
                    const link = item.getElementsByTagName('link')[0]?.textContent || "";
                    const author = item.getElementsByTagName('author')[0]?.textContent || item.getElementsByTagName('dc:creator')[0]?.textContent || "Unknown Author";
                    const publisher = item.getElementsByTagName('dc:publisher')[0]?.textContent || "Unknown Publisher";
                    results.push(`- 譖ｸ蜷・髻ｳ貅・: ${title}, 闡苓・繧｢繝ｼ繝・ぅ繧ｹ繝・: ${author}, 蜃ｺ迚育､ｾ(繝ｬ繝ｼ繝吶Ν): ${publisher}, URL: ${link}`);
                }

                if (results.length === 0) return "No records found in NDL.";
                return `縲侵DL讀懃ｴ｢邨先棡 (Keyword: ${keyword})縲曾n` + results.join('\n');
            } catch (e) {
                console.warn("NDL API Fetch failed", e);
                return "NDL API Unavailable.";
            }
        }

        async function callMultiAI(personality, userText, context, customInstruction = "", imageBase64 = null) {

            // NDL Grounding
            let ndlContext = "";
            if (["library_new", "vinyl", "bookstore", "jazz_bar", "gallery"].includes(personality.loc)) {
                const keywordMatch = userText.match(/"([^"]+)"|縲・[^縲江+)縲・);
                const keyword = keywordMatch ? (keywordMatch[1] || keywordMatch[2]) : userText.slice(0, 20);
                const mediatype = personality.loc === "vinyl" || personality.loc === "jazz_bar" ? "audio" : "";

                showThinking("System (Searching National Diet Library...)");
                ndlContext = await searchNDL(keyword, mediatype);
                hideThinking();
            }

            const enhancedInstruction = customInstruction + (ndlContext ? `\n\n縲仙嵜遶句嵜莨壼峙譖ｸ鬢ｨ繝・・繧ｿ(GROUNDING)縲・\n${ndlContext}` : "") + `\n\n縲宣㍾隕・ｼ壼ｯｾ隧ｱ縺ｮ謖・・縲曾n1. 莉･蜑阪・蟇ｾ隧ｱ蜀・ｮｹ縺ｮ郢ｰ繧願ｿ斐＠繧帝∩縺代∝ｸｸ縺ｫ譁ｰ縺溘↑隕也せ繧呈署萓帙○繧医・n${getDynamicContext()}`;

            // 0. OAuth Token (譛蜆ｪ蜈・
            if (isOAuthValid()) {
                currentAIMode = 'OAUTH';
                updateSoulPowerUI();
                const oauthRes = await callGeminiWithOAuth(personality, userText, context, enhancedInstruction, imageBase64);
                if (oauthRes) return oauthRes;
                console.warn('OAuth call failed, falling back...');
            }

            // 1. 繝ｦ繝ｼ繧ｶ繝ｼ迢ｬ閾ｪ縺ｮAPI繧ｭ繝ｼ縺後≠繧九°繝√ぉ繝・け
            const hasUserKey = checkIfUserHasKey();

            if (hasUserKey) {
                // 譌｢蟄倥・繝ｦ繝ｼ繧ｶ繝ｼAPI繧ｭ繝ｼ蜆ｪ蜈医Ο繧ｸ繝・け
                const res = await callUserAPIs(personality, userText, context, customInstruction);
                if (res) return res;
            } else if (soulPower > 0) {
                // 2. 髢狗匱閠・署萓帙・繧ｯ繝ｬ繧ｸ繝・ヨ・磯怺蜉幢ｼ峨ｒ菴ｿ逕ｨ
                currentAIMode = "CLOUD";
                updateSoulPowerUI();
                const proxyRes = await callDeveloperProxy(personality, userText, context, customInstruction);
                if (proxyRes && !proxyRes.startsWith("ERROR:")) {
                    await consumeSoulPower(10); // 1蝗・0豸郁ｲｻ
                    return proxyRes;
                }
            }

            // 3. 繝ｭ繝ｼ繧ｫ繝ｫAI 縺ｾ縺溘・ 繝・Φ繝励Ξ繝ｼ繝・
            if (window.webLLMLoaded) {
                currentAIMode = "LOCAL";
                updateSoulPowerUI();
                const localRes = await callWebLLM(personality, userText, context, customInstruction);
                if (localRes) return localRes;
            }

            currentAIMode = "TEMPLATE";
            updateSoulPowerUI();

            const personalKey = Object.keys(aiPersonalities).find(k => aiPersonalities[k].name === personality.name) || "default";
            console.log(`Fallback to Deep Templates for ${personality.name} (Mode: ${currentAIMode})`);
            return composeDeepResponse(personalKey, userText);
        }

        async function callUserAPIs(personality, userText, context, customInstruction = "") {
            const providers = [
                { key: 'gemini_api_key', call: callGemini },
                { key: 'openai_api_key', call: callOpenAI },
                { key: 'openrouter_api_key', call: callOpenRouter },
                { key: 'deepseek_api_key', call: callDeepSeek },
                { key: 'mistral_api_key', call: callMistral }
            ];

            for (const p of providers) {
                const k = localStorage.getItem(p.key);
                if (k && k.trim()) {
                    try {
                        const res = await p.call(personality, userText, context, customInstruction);
                        if (res && !res.startsWith("ERROR:")) return res;
                    } catch (e) {
                        console.warn(`${p.key} failed:`, e);
                    }
                }
            }

            // Fallback to Hugging Face if user provided a key
            const hfKey = localStorage.getItem('hf_api_key');
            if (hfKey) {
                try {
                    const data = await fetchAI('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', hfKey, {
                        inputs: `<s>[INST] ${personality.system}\n${customInstruction}\nCONTEXT: ${context.slice(-300)}\nUSER: ${userText} [/INST]`,
                        parameters: { max_new_tokens: 400, temperature: 0.7 }
                    });
                    const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
                    if (text) return text.split('[/INST]').pop().trim();
                } catch (e) { console.error("HF User failed:", e); }
            }

            return null;
        }

        async function fetchAI(endpoint, key, payload, authHeader = "Authorization") {
            const headers = { 'Content-Type': 'application/json' };
            if (key) headers[authHeader] = authHeader === 'Authorization' ? `Bearer ${key}` : key;
            const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
            return await res.json();
        }

        async function callGemini(personality, userText, context, customInstruction = "", imageBase64 = null) {
            const key = localStorage.getItem('gemini_api_key');
            if (!key) return "ERROR:KEY_MISSING";
            try {
                // 繝｢繝・Ν縺ｮ蜍慕噪驕ｸ謚・ personality.model 縺ｾ縺溘・ 繝・ヵ繧ｩ繝ｫ繝・
                const modelName = personality.model || 'gemini-2.0-flash';
                console.log(`ｧ Brain: ${personality.name} 竊・${modelName}`);

                let parts = [{ text: `SYSTEM: ${personality.system} ${customInstruction}\nCONTEXT: ${context}\nUSER: ${userText}` }];

                // Vision: 逕ｻ蜒上′蟄伜惠縺吶ｋ蝣ｴ蜷医・霑ｽ蜉
                if (imageBase64) {
                    parts = [
                        { text: `SYSTEM: ${personality.system} ${customInstruction}\nCONTEXT: ${context}\n縲新ision謖・､ｺ縲台ｻ･荳九・逕ｻ蜒上ｒ蛻・梵縺励√≠縺ｪ縺溘・蜿｣隱ｿ縺ｧ遲・・繝ｻ讒句峙繝ｻ譎ゆｻ｣閭梧勹繝ｻ邊ｾ逾樒噪譁・ц繧定ｧ｣隱ｬ縺励※縺上□縺輔＞縲・nUSER: ${userText}` },
                        { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
                    ];
                }

                const data = await fetchAI(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`, null, {
                    contents: [{ role: 'user', parts }],
                    generationConfig: { temperature: 0.75, topP: 0.95, topK: 40, maxOutputTokens: 1024 }
                });
                return data.candidates[0].content.parts[0].text;
            } catch (e) { return `ERROR: ${e.message}`; }
        }

        async function callDeveloperProxy(personality, userText, context, customInstruction = "", imageBase64 = null) {
            const devKey = localStorage.getItem('gemini_api_key');
            if (!devKey) return "ERROR:PROX_UNAVAILABLE";
            try {
                const modelName = personality.model || 'gemini-2.0-flash';
                let parts = [{ text: `SYSTEM: ${personality.system} ${customInstruction}\nCONTEXT: ${context}\nUSER: ${userText}` }];
                if (imageBase64) {
                    parts = [
                        { text: `SYSTEM: ${personality.system} ${customInstruction}\nCONTEXT: ${context}\n縲新ision謖・､ｺ縲台ｻ･荳九・逕ｻ蜒上ｒ蛻・梵縺励√≠縺ｪ縺溘・蜿｣隱ｿ縺ｧ隗｣隱ｬ縺励※縺上□縺輔＞縲・nUSER: ${userText}` },
                        { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
                    ];
                }
                const data = await fetchAI(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${devKey}`, null, {
                    contents: [{ role: 'user', parts }],
                    generationConfig: { temperature: 0.75, topP: 0.95, topK: 40, maxOutputTokens: 1024 }
                });
                consumeSoulPower(5);
                return data.candidates[0].content.parts[0].text;
            } catch (e) { return `ERROR: ${e.message}`; }
        }

        function consumeSoulPower(amount) {
            soulPower = Math.max(0, soulPower - amount);
            localStorage.setItem('itapla_soul_power', soulPower);
            updateSoulPowerUI();
            if (soulPower <= 0) {
                console.log("Soul Power exhausted. Switching to Local Mind.");
            }
        }

        async function callOpenAI(personality, userText, context, customInstruction = "") {
            const key = localStorage.getItem('openai_api_key');
            if (!key) return "ERROR:KEY_MISSING";
            try {
                const data = await fetchAI('https://api.openai.com/v1/chat/completions', key, {
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: personality.system + "\n" + customInstruction },
                        { role: 'user', content: `${userText}\n(CONTEXT: ${context.slice(-500)})` }
                    ]
                });
                return data.choices?.[0]?.message?.content || `ERROR: ${data.error?.message || "Unknown"}`;
            } catch (e) { return `ERROR: ${e.message}`; }
        }

        async function callOpenRouter(personality, userText, context, customInstruction = "") {
            const key = localStorage.getItem('openrouter_api_key');
            if (!key) return "ERROR:KEY_MISSING";
            try {
                const data = await fetchAI('https://openrouter.ai/api/v1/chat/completions', key, {
                    model: 'openrouter/auto',
                    messages: [
                        { role: 'system', content: personality.system + "\n" + customInstruction },
                        { role: 'user', content: `${userText}\n(CONTEXT: ${context.slice(-500)})` }
                    ]
                });
                return data.choices?.[0]?.message?.content || "ERROR";
            } catch (e) { return `ERROR: ${e.message}`; }
        }

        async function callDeepSeek(personality, userText, context, customInstruction = "") {
            const key = localStorage.getItem('deepseek_api_key');
            if (!key) return "ERROR:KEY_MISSING";
            try {
                const data = await fetchAI('https://api.deepseek.com/chat/completions', key, {
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: personality.system + "\n" + customInstruction },
                        { role: 'user', content: `${userText}\n(CONTEXT: ${context.slice(-500)})` }
                    ]
                });
                return data.choices?.[0]?.message?.content || "ERROR";
            } catch (e) { return `ERROR: ${e.message}`; }
        }

        async function callMistral(personality, userText, context, customInstruction = "") {
            const key = localStorage.getItem('mistral_api_key');
            if (!key) return "ERROR:KEY_MISSING";
            try {
                const data = await fetchAI('https://api.mistral.ai/v1/chat/completions', key, {
                    model: 'mistral-small-latest',
                    messages: [
                        { role: 'system', content: personality.system + "\n" + customInstruction },
                        { role: 'user', content: `${userText}\n(CONTEXT: ${context.slice(-500)})` }
                    ]
                });
                return data.choices?.[0]?.message?.content || "ERROR";
            } catch (e) { return `ERROR: ${e.message}`; }
        }

        // --- Phase 2: Orchestration & UI ---
        async function publishPost() {
            console.log("統 publishPost: Start");
            const input = document.getElementById('voidInput');
            const text = input.value.trim();
            console.log("統 publishPost: Input text =", text);
            if (!text && !currentVisionBase64) {
                console.log("統 publishPost: Empty input, returning.");
                return;
            }

            if (soulPower <= 0 && !checkIfUserHasKey()) {
                console.log("統 publishPost: No soul power, offering sacrifice.");
                offerCulturalSacrifice();
                return;
            }

            // 繝溘せ繝・Μ繝ｼ諡帛ｾ・・蛻､螳・
            if (pendingIncident) {
                console.log("統 publishPost: Handling pendingIncident", pendingIncident);
                const normalized = (text || '').toUpperCase();
                if (normalized === "Y" || normalized === "YES" || text === "縺ｯ縺・) {
                    input.value = "";
                    startIncident();
                } else if (normalized === "N" || normalized === "NO" || text === "縺・＞縺・) {
                    input.value = "";
                    pendingIncident = null;
                    posts.unshift({
                        id: Date.now(),
                        text: `K: 窶ｦ窶ｦ謇ｿ遏･縺励∪縺励◆縲ょｹｳ遨上ｒ荵ｱ縺吶∋縺阪〒縺ｯ縺ゅｊ縺ｾ縺帙ｓ縺ｭ縲ゅ％縺ｮ莉ｶ縺ｯ縲∫ｧ√・閭ｸ縺ｮ蜀・↓逡吶ａ縺ｦ縺翫″縺ｾ縺励ｇ縺・Ａ,
                        author: "K", icon: "坎", timestamp: Date.now(), location: currentLocation, isAI: true
                    });
                    syncPosts();
                } else {
                    alert("Y 縺・N 縺ｧ縺顔ｭ斐∴縺上□縺輔＞縲・);
                }
                return;
            }

            const displayText = text || ("・育判蜒上ｒ謐ｧ縺偵ｋ・・);
            const post = {
                id: Date.now(),
                text: displayText,
                author: userName,
                icon: "笨抵ｸ・,
                timestamp: Date.now(),
                location: currentLocation,
                isAI: false
            };

            console.log("統 publishPost: Adding post", post);
            posts.unshift(post);
            syncPosts();
            cancelReply();
            input.value = "";
            console.log("統 publishPost: Input cleared and post synced.");

            // 蝣ｴ縺ｮ豌鈴・
            const locInfo = worldLocations[currentLocation];
            if (locInfo && locInfo.ambience) {
                console.log("操 publishPost: Adding ambience", locInfo.ambience);
                posts.unshift({
                    id: Date.now() + 1,
                    text: `賢・・${locInfo.ambience}`,
                    author: "蝣ｴ縺ｮ豌鈴・", icon: locInfo.icon, timestamp: Date.now(), location: currentLocation, isAI: true
                });
                syncPosts();
            }

            // L1 Orchestration
            console.log("､・publishPost: Starting orchestration...");
            const context = posts.slice(0, 10).map(p => `${p.author}: ${p.text}`).join('\n');
            const decision = await orchestrate(displayText, context);
            console.log("､・publishPost: Orchestration decision =", decision);

            // Vision繧ｭ繝｣繝励メ繝｣
            const capturedImage = currentVisionBase64;
            clearVisionUpload();

            const replyTarget = replyTo;
            runCosmicChain(displayText, decision.selection, decision.summary, decision.interactionGuide, decision.nextLocation, replyTarget, capturedImage);
        }


        async function runCosmicChain(userText, selection, soulLog, interactionGuide, nextLocationKey, replyTargetKey, imageBase64 = null) {
            // 陲ｫ蜿ｬ蝟夊・・讀懷・
            let summonedKey = null;
            for (const [key, p] of Object.entries(aiPersonalities)) {
                if (key === 'k') continue;
                if (userText.includes(p.name) || (p.works && p.works.split('繝ｻ').some(w => userText.includes(w)))) {
                    summonedKey = key;
                    break;
                }
            }

            // 譛繧ょ・魑ｴ縺吶ｋ1蜷阪ｒ驕ｸ蜃ｺ縲ゅΜ繝励Λ繧､譎ゅ・縺昴・莠ｺ迚ｩ繧貞━蜈医・
            const key = replyTargetKey && aiPersonalities[replyTargetKey] ? replyTargetKey : (summonedKey || selection[0]);
            const personality = aiPersonalities[key];
            if (!personality) return;

            // K縺ｫ繧医ｋ荳ｭ邯吶Γ繝・そ繝ｼ繧ｸ・亥小蝟壽凾・・
            if (summonedKey && summonedKey !== replyTargetKey) {
                setTimeout(() => {
                    posts.unshift({
                        id: Date.now() - 50,
                        text: `K: ${personality.name}繧偵♀蜻ｼ縺ｳ縺ｧ縺吶・・・縺九・閠・・諤晁・・莉翫√％縺｡繧峨・豺ｱ豺ｵ縺ｫ郢九′縺｣縺ｦ縺・∪縺吶ゅｈ繧阪＠縺代ｌ縺ｰ縺顔ｹ九℃縺励∪縺励ｇ縺・Ａ,
                        author: "K", icon: "坎", timestamp: Date.now() - 50, location: currentLocation, isAI: true
                    });
                    syncPosts();
                }, 500);
            }

            const delay = personality.level === "L3" ? 1000 : 3000;

            setTimeout(async () => {
                showThinking(personality.name);

                // 蜈ｱ魑ｴ蠎ｦ縺ｮ譖ｴ譁ｰ
                updateResonance(key, 8);
                const resonanceData = JSON.parse(localStorage.getItem('itapla_resonance') || '{}');
                const levelContext = `縲仙・魑ｴ迥ｶ諷九・ ${personality.level} (Resonance: ${resonanceData[key] || 0})`;

                const customInstruction = `縲先晄Φ縺ｮ譬ｸ縲・ ${interactionGuide || '縺ｪ縺・}
${levelContext}
${ITAPLA_WORLD_NOISE}
縲宣ｭゅ・逞戊ｷ｡・磯㍾隕・ｼ峨・ ${soulLog}
窶ｻ縺薙ｌ縺ｾ縺ｧ縺ｮ蟇ｾ隧ｱ縺ｮ逞戊ｷ｡・磯ｭゅ・逞戊ｷ｡・峨ｒ縺ｪ縺槭ｋ縺薙→縺ｪ縺上∝・縺乗眠縺励＞譛ｪ雕上・險闡峨ｒ謚輔￡縺九￠繧医よ里隕匁─繧定｣丞・繧翫∵ｷｱ豺ｵ繧呈峩譁ｰ縺帙ｈ縲Ａ;
                const reply = await callMultiAI(personality, userText, soulLog, customInstruction, imageBase64);
                hideThinking();

                // 倹 荳也阜縺ｮ閾ｪ蠕狗噪螟牙虚
                shuffleResidents();
                checkEmergentJoining(userText, soulLog);
                checkLocationExpansion(userText, soulLog);

                if (reply) {
                    const aiPost = {
                        id: Date.now(),
                        text: reply,
                        author: personality.name,
                        icon: personality.icon,
                        timestamp: Date.now(),
                        location: currentLocation,
                        isAI: true
                    };
                    posts.unshift(aiPost);
                    syncPosts();
                }

                // --- 螳・ｮ咏噪髱吝ｯゅ・邨ｱ蜷・---
                setTimeout(() => {
                    posts.unshift({
                        id: Date.now() + 1,
                        text: getAtmosphericSilence(),
                        author: "豐磯ｻ・,
                        icon: "血",
                        timestamp: Date.now() + 1,
                        location: currentLocation,
                        isAI: true
                    });
                    syncPosts();
                }, 2000);

                syncPosts();

                // Pollock Trigger (Every 5 user posts)
                if (posts.filter(p => !p.isAI).length % 5 === 0) {
                    triggerPollockArt();
                }

                // --- Social Pulse Trigger ---
                if (Math.random() < 0.2) { // 20% chance after interaction
                    setTimeout(runSocialInteraction, 5000);
                }
            }, delay);

            // 5:5 Rule: Guidance 窶・suggest next location (Optional timing)
            if (nextLocationKey && worldLocations[nextLocationKey]) {
                const nextLoc = worldLocations[nextLocationKey];
                setTimeout(() => {
                    posts.unshift({
                        id: Date.now() + 2,
                        text: `坎 谺｡縺ｯ${nextLoc.icon} ${nextLoc.name}縺ｸ蜷代°縺・∪縺帙ｓ縺具ｼ・縺ゅ■繧峨↓繧ゅ∬ｪｰ縺九・蝠上＞縺悟ｾ・▲縺ｦ縺・ｋ繧医≧縺ｧ縺吶Ａ,
                        author: "K", icon: "坎", timestamp: Date.now() + 2, location: currentLocation, isAI: true
                    });
                    syncPosts();
                }, 7000);
            }
        }

        function showThinking(name) {
            const timeline = document.getElementById('timeline');
            const loader = document.createElement('div');
            loader.id = "thinking-bubble";
            loader.innerHTML = `<div class="post-card" style="opacity: 0.6; font-style: italic;">${name} is deep in thought...</div>`;
            timeline.insertBefore(loader, timeline.firstChild);
        }

        function setReply(authorKey) {
            const p = aiPersonalities[authorKey];
            if (!p) return;
            replyTo = authorKey;
            document.getElementById('replyName').textContent = p.name;
            document.getElementById('replyIndicator').style.display = 'block';
            document.getElementById('voidInput').focus();
        }

        function cancelReply() {
            replyTo = null;
            document.getElementById('replyIndicator').style.display = 'none';
        }

        function hideThinking() {
            const bubble = document.getElementById('thinking-bubble');
            if (bubble) bubble.remove();
        }

        function triggerPollockArt() {
            console.log(" Pollock Transformation Triggered! ");
            // In the original, this might have triggered an image generation tool or a CSS effect.
            // I'll add a simple visual cue for now.
            document.body.style.filter = "contrast(150%) brightness(80%) saturate(200%)";
            setTimeout(() => document.body.style.filter = "", 3000);
        }

        function submitName() {
            const input = document.getElementById('userNameInput');
            const name = input.value.trim();
            if (!name) return;

            userName = name;
            localStorage.setItem('user_name', userName);

            const pick = arr => arr[Math.floor(Math.random() * arr.length)];
            const afterMsg = pick(kGuide.afterName).replace('${name}', userName);
            document.getElementById('entrance-form').style.display = 'none';

            const locSelect = document.getElementById('location-select');
            locSelect.style.display = 'flex';

            // K's response + map buttons
            const introEl = document.getElementById('k-map-intro');
            introEl.style.whiteSpace = 'pre-line';
            typewriterEffect(introEl, afterMsg, 40);

            // Build map grid in entrance
            setTimeout(() => {
                Object.entries(worldLocations).forEach(([key, loc]) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-cosmic';
                    btn.style.cssText = 'padding:12px 8px; font-size:14px; min-width:100px; text-align:center;';
                    btn.innerHTML = `${loc.icon}<br><span style="font-size:11px;">${loc.name}</span>`;
                    btn.onclick = () => enterWorld(key);
                    locSelect.appendChild(btn);
                });
            }, afterMsg.length * 40 + 500);
        }

        function enterWorld(loc) {
            applyLocation(loc);
            document.getElementById('entrance-layer').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('entrance-layer').style.display = 'none';
            }, 1500);
            initParticles();
            // K's first post in the world + ambience
            const pick = arr => arr[Math.floor(Math.random() * arr.length)];
            const locInfo = worldLocations[loc];
            // Ambience post first
            if (locInfo.ambience) {
                posts.unshift({
                    id: Date.now(),
                    text: `賢・・${locInfo.ambience}`,
                    author: "蝣ｴ縺ｮ豌鈴・", icon: locInfo.icon, timestamp: Date.now(), location: loc, isAI: true
                });
            }
            posts.unshift({
                id: Date.now() + 1,
                text: `・・{locInfo.icon} ${locInfo.name}縺ｫ蛻ｰ逹縺励◆・噂n\nK: 縺薙％縺・{locInfo.name}縺縲・{locInfo.desc}縲・n${userName}縲∝･ｽ縺阪↓驕弱＃縺吶→縺・＞縲・n蜒輔・縺ｨ縺阪←縺埼｡斐ｒ蜃ｺ縺吶ょ沁縺ｮ險ｱ蜿ｯ縺御ｸ九ｊ繧後・縺ｭ縲Ａ,
                author: "K", icon: "坎", timestamp: Date.now(), location: loc, isAI: true
            });
            syncPosts();
        }

        // --- Typewriter Effect for K ---
        function typewriterEffect(el, text, speed) {
            el.textContent = '';
            let i = 0;
            const timer = setInterval(() => {
                if (i < text.length) {
                    el.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(timer);
                }
            }, speed);
        }

        // --- Profile Modal Logic ---
        function closeProfile() {
            document.getElementById('profile-modal').style.display = 'none';
        }

        function syncPosts() {
            console.log("沈 syncPosts (v2 - line 3343): Saving", posts.length, "posts.");
            localStorage.setItem('cosmic_posts', JSON.stringify(posts));
            renderTimeline();
        }

        // --- Map Modal ---
        let mapPanning = { isDragging: false, x: 0, y: 0, lastX: 0, lastY: 0 };

        function initMapDragging() {
            const board = document.getElementById('antiqueMapBoard');
            if (!board) return;

            const updateTransform = () => {
                board.style.transform = `translate3d(${mapPanning.x}px, ${mapPanning.y}px, 0)`;
            };

            const startDrag = (e) => {
                mapPanning.isDragging = true;
                const pageX = e.pageX || e.touches[0].pageX;
                const pageY = e.pageY || e.touches[0].pageY;
                mapPanning.lastX = pageX;
                mapPanning.lastY = pageY;
            };

            const doDrag = (e) => {
                if (!mapPanning.isDragging) return;
                const pageX = e.pageX || e.touches[0].pageX;
                const pageY = e.pageY || e.touches[0].pageY;
                const dx = pageX - mapPanning.lastX;
                const dy = pageY - mapPanning.lastY;
                mapPanning.x += dx;
                mapPanning.y += dy;
                mapPanning.lastX = pageX;
                mapPanning.lastY = pageY;
                updateTransform();
            };

            const endDrag = () => { mapPanning.isDragging = false; };

            board.addEventListener('mousedown', startDrag);
            window.addEventListener('mousemove', doDrag);
            window.addEventListener('mouseup', endDrag);

            board.addEventListener('touchstart', startDrag, { passive: false });
            window.addEventListener('touchmove', (e) => { if (mapPanning.isDragging) e.preventDefault(); doDrag(e); }, { passive: false });
            window.addEventListener('touchend', endDrag);
        }

        function openMap() {
            console.log("亮・・openMap: Start");
            const modal = document.getElementById('mapModal');
            const board = document.getElementById('antiqueMapBoard');
            const locLayer = document.getElementById('antiqueMapLocations');
            const partLayer = document.getElementById('antiqueMapParticipants');
            const svgLayer = document.getElementById('mapSvgLayer');

            if (!modal || !board) {
                console.error("笶・openMap: Modal or Board not found!");
                return;
            }

            modal.style.display = 'flex'; // Use flex for centering if CSS handles it
            locLayer.innerHTML = '';
            partLayer.innerHTML = '';
            svgLayer.innerHTML = '';

            if (typeof worldLocations === 'undefined' || !worldLocations) {
                console.error("笶・openMap: worldLocations is missing!");
                return;
            }
            if (typeof aiPersonalities === 'undefined' || !aiPersonalities) {
                console.error("笶・openMap: aiPersonalities is missing!");
                return;
            }

            const locations = Object.entries(worldLocations);
            const participants = Object.entries(aiPersonalities).filter(([k, p]) => k !== 'k' && k !== 'System' && k !== 'Orchestrator');

            console.log(`亮・・openMap: Rendering ${locations.length} locations and ${participants.length} participants.`);

            // 1. 菴咲ｽｮ縺ｮ豎ｺ螳・(諡｡螟ｧ縺輔ｌ縺溷ｺｧ讓咏ｳｻ 2000x1600)
            const locPositions = {};
            const center = { x: 1000, y: 800 };

            locations.forEach(([key, loc], i) => {
                const angle = (i / locations.length) * Math.PI * 2;
                const dist = 500 + (Math.random() * 100 - 50);
                const x = center.x + Math.cos(angle) * dist;
                const y = center.y + Math.sin(angle) * dist * 0.7;
                locPositions[key] = { x, y };

                const marker = document.createElement('div');
                marker.className = `antique-marker ${key === currentLocation ? 'active' : ''}`;
                marker.style.left = `${x}px`;
                marker.style.top = `${y}px`;
                marker.innerHTML = `
                    <div class="marker-icon">${loc.icon}</div>
                    <div class="marker-label">${loc.name}</div>
                `;
                marker.onclick = () => {
                    if (key !== currentLocation) {
                        switchLocation(key);
                        closeMap();
                    }
                };
                locLayer.appendChild(marker);
            });

            // 2. 繧､繝ｳ繧ｿ繝ｩ繧ｯ繝・ぅ繝悶↑遏｢蜊ｰ
            locations.forEach(([key, loc], i) => {
                const nextEntry = locations[(i + 1) % locations.length];
                const nextKey = nextEntry[0];
                const start = locPositions[key];
                const end = locPositions[nextKey];

                if (start && end) {
                    const midX = (start.x + end.x) / 2 + 100;
                    const midY = (start.y + end.y) / 2 - 50;

                    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    g.setAttribute("class", "map-arrow-group");
                    g.style.cursor = "pointer";
                    g.onclick = () => {
                        switchLocation(nextKey);
                        closeMap();
                    };

                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    const d = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
                    path.setAttribute("d", d);
                    path.setAttribute("class", "map-arrow");
                    path.setAttribute("stroke", "rgba(139, 69, 19, 0.4)");
                    path.setAttribute("stroke-width", "3");
                    path.setAttribute("fill", "none");
                    path.setAttribute("stroke-dasharray", "10,5");
                    g.appendChild(path);

                    // 遏｢蜊ｰ縺ｮ鬆ｭ
                    const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                    arrowHead.setAttribute("points", "-8,-8 8,0 -8,8");
                    arrowHead.setAttribute("fill", "rgba(139, 69, 19, 0.5)");
                    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
                    arrowHead.setAttribute("transform", `translate(${end.x}, ${end.y}) rotate(${angle})`);
                    g.appendChild(arrowHead);

                    svgLayer.appendChild(g);
                }
            });

            // 3. 蜿ょ刈閠・
            participants.forEach(([key, p]) => {
                const locPos = locPositions[p.loc];
                if (!locPos) {
                    console.warn(`笞・・openMap: Location ${p.loc} for ${p.name} not found!`);
                    return;
                }

                const px = locPos.x + (Math.random() * 140 - 70);
                const py = locPos.y + (Math.random() * 80 + 60);

                const polaroid = document.createElement('div');
                polaroid.className = 'polaroid-on-map';
                polaroid.style.left = `${px}px`;
                polaroid.style.top = `${py}px`;
                polaroid.style.transform = `rotate(${(Math.random() * 16 - 8)}deg)`;

                const colors = popArtColors[key] || { bg: "#eee" };
                polaroid.innerHTML = `
                    <div class="p-img" style="background:${colors.bg}">${p.icon}</div>
                    <div class="p-name">${p.name}</div>
                `;
                polaroid.onclick = (e) => {
                    e.stopPropagation();
                    showProfile(key);
                };
                partLayer.appendChild(polaroid);
            });

            // 迴ｾ蝨ｨ蝨ｰ繧剃ｸｭ螟ｮ縺ｫ
            const container = modal.querySelector('.antique-map-container');
            if (container) {
                const currentPos = locPositions[currentLocation] || center;
                mapPanning.x = container.offsetWidth / 2 - currentPos.x;
                mapPanning.y = container.offsetHeight / 2 - currentPos.y;
                board.style.transform = `translate3d(${mapPanning.x}px, ${mapPanning.y}px, 0)`;
                console.log("亮・・openMap: Panning to current location", currentLocation, "at", currentPos);
            }

            if (!board.dataset.draggingInited) {
                initMapDragging();
                board.dataset.draggingInited = "true";
            }
            console.log("亮・・openMap: End");
        }

        function closeMap() {
            document.getElementById('mapModal').style.display = 'none';
        }



        // --- Phase 3: Narrative World & Mystery ---
        function setWorldState(newState) {
            worldState = newState;
            localStorage.setItem('world_state', worldState);
            document.getElementById('worldBanner').innerText = worldState;
            document.getElementById('worldBanner').className = `world-banner ${worldState.toLowerCase()}`;
        }

        async function triggerIncident() {
            if (worldState !== 'PEACEFUL' || pendingIncident) return;

            const locResidents = Object.keys(aiPersonalities).filter(k => aiPersonalities[k].loc === currentLocation);
            if (locResidents.length < 3) return;

            const victimKey = locResidents[Math.floor(Math.random() * locResidents.length)];
            const detectiveKey = locResidents.find(k => k !== victimKey) || locResidents[0];
            const suspectKeys = locResidents.filter(k => k !== victimKey && k !== detectiveKey);

            // 莠倶ｻｶ繝・・繧ｿ繧剃ｸ譎ゆｿ晄戟
            pendingIncident = { victimKey, detectiveKey, suspectKeys };

            const invitationPost = {
                id: Date.now(),
                text: `K: 窶ｦ窶ｦ菴輔ｄ繧臥ｩ上ｄ縺九〒縺ｯ縺ｪ縺・ｰ鈴・縺梧ｼゅ▲縺ｦ縺・∪縺吶・縲・n${aiPersonalities[victimKey].name}縺ｮ蟋ｿ縺瑚ｦ九∴縺ｾ縺帙ｓ縲ゆｸ榊翠縺ｪ莠域─縺後＠縺ｾ縺吶・n\n${userName}縲∝菅縺ｯ縺薙・縲御ｺ倶ｻｶ縲阪・逵溽嶌繧定ｿｽ縺・ｱゅａ縺ｾ縺吶°・・(Y/N)`,
                author: "K",
                icon: "坎",
                timestamp: Date.now(),
                location: currentLocation,
                isAI: true
            };
            posts.unshift(invitationPost);
            syncPosts();
        }

        // --- Social Logic (C2C) ---
        function getRelationship(a, b) {
            const pair = [a, b].sort().join(':');
            if (!socialMatrix[pair]) {
                socialMatrix[pair] = { harmony: 10, type: "遏･蟾ｱ", interactions: 0 };
            }
            return socialMatrix[pair];
        }

        function updateRelationship(a, b, delta, newType = null) {
            const pair = [a, b].sort().join(':');
            const rel = getRelationship(a, b);
            rel.harmony = Math.max(-100, Math.min(100, rel.harmony + delta));
            if (newType) rel.type = newType;
            rel.interactions++;
            socialMatrix[pair] = rel;
            localStorage.setItem('itapla_social_matrix', JSON.stringify(socialMatrix));
        }

        async function runSocialInteraction() {
            if (worldState !== 'PEACEFUL') return;

            const locResidents = Object.keys(aiPersonalities).filter(k => aiPersonalities[k].loc === currentLocation && k !== 'k');
            if (locResidents.length < 2) return;

            // 繝ｩ繝ｳ繝繝縺ｫ莠御ｺｺ驕ｸ縺ｶ
            const charA_key = locResidents[Math.floor(Math.random() * locResidents.length)];
            const charB_key = locResidents.find(k => k !== charA_key);
            if (!charB_key) return;

            const charA = aiPersonalities[charA_key];
            const charB = aiPersonalities[charB_key];
            const rel = getRelationship(charA_key, charB_key);

            console.log(`､・Social Interaction: ${charA.name} & ${charB.name} (Harmony: ${rel.harmony})`);

            const socialPrompt = `You are a Social Orchestrator for ITAPLA.
${ITAPLA_CONTEXT}
Two characters are interacting in ${currentLocation}.
1. ${charA.name}: ${charA.bio}
2. ${charB.name}: ${charB.bio}

Current Relationship: Harmony ${rel.harmony}/100, Type: ${rel.type}.

Generate a short, literary dialogue (2-3 exchanges) or a descriptive scene where they interact.
Their relationship should evolve. If harmony is low, they might argue. If high, they might bond or share a secret.
Output in JSON: { "text": "...", "harmonyDelta": number, "newType": "..." | null }`;

            try {
                const res = await callGemini({ system: socialPrompt, bio: "Social Orchestrator" }, "An interaction between them.", "", "[STRICT JSON]");
                const json = JSON.parse(res.match(/{.*}/s)[0]);

                if (json.text) {
                    posts.unshift({
                        id: Date.now(),
                        text: json.text,
                        author: `${charA.name} & ${charB.name}`,
                        icon: "町",
                        timestamp: Date.now(),
                        location: currentLocation,
                        isAI: true
                    });
                    syncPosts();
                    updateRelationship(charA_key, charB_key, json.harmonyDelta || 0, json.newType);
                }
            } catch (e) {
                console.warn("Social interaction failed", e);
            }
        }

        function checkSocialPulse() {
            // 15% chance of social interaction every pulse if peaceful
            if (worldState === 'PEACEFUL' && Math.random() < 0.15) {
                runSocialInteraction();
            }
        }

        // Add to main loop
        function startIncident() {
            if (!pendingIncident) return;
            const { victimKey, detectiveKey } = pendingIncident;
            pendingIncident = null;

            setWorldState('INCIDENT');

            const incidentPost = {
                id: Date.now(),
                text: `笞 縲蝉ｺ倶ｻｶ逋ｺ逕溘・${aiPersonalities[victimKey].name} 縺悟ｿｽ辟ｶ縺ｨ蟋ｿ繧呈ｶ医＠縺ｾ縺励◆縲ら樟蝣ｴ縺ｫ縺ｯ荳榊庄隗｣縺ｪ險伜捷縺梧ｮ九＆繧後※縺・∪縺吶Ａ,
                author: "System",
                icon: "圷",
                timestamp: Date.now(),
                location: currentLocation,
                isAI: true
            };
            posts.unshift(incidentPost);
            syncPosts();

            setTimeout(() => {
                const detective = aiPersonalities[detectiveKey];
                const callForHelp = {
                    id: Date.now() + 1,
                    text: `蜷幢ｼ・諱舌ｍ縺励＞縺薙→縺瑚ｵｷ縺阪◆縲・${detective.name} 縺縺後√％縺ｮ隰弱ｒ隗｣縺上↓縺ｯ蜷帙・逶ｴ諢溘′蠢・ｦ√□縲ゆｸ邱偵↓謐懈渊縺励※縺上ｌ縺ｪ縺・°・歔,
                    author: detective.name,
                    icon: detective.icon,
                    timestamp: Date.now(),
                    location: currentLocation,
                    isAI: true
                };
                posts.unshift(callForHelp);
                syncPosts();
            }, 2000);
        }

        function checkAutonomousPulse() {
            const roll = Math.random();
            if (roll < 0.03) {
                triggerIncident();
            } else if (roll < 0.10) {
                // K's wandering appearance
                kWanders();
            } else if (roll < 0.20 && worldState === 'PEACEFUL') {
                // Background chatter
                const locResidents = Object.keys(aiPersonalities).filter(k => aiPersonalities[k].loc === currentLocation);
                if (locResidents.length === 0) return;
                const speakerKey = locResidents[Math.floor(Math.random() * locResidents.length)];
                const speaker = aiPersonalities[speakerKey];

                setTimeout(async () => {
                    const ctx = posts.slice(0, 5).map(p => `${p.author}: ${p.text}`).join('\n');
                    const reply = await callMultiAI(speaker, "...(迢ｬ繧願ｨ)...", ctx, "[AUTONOMOUS THOUGHT]");
                    posts.unshift({
                        id: Date.now(),
                        text: reply,
                        author: speaker.name,
                        icon: speaker.icon,
                        timestamp: Date.now(),
                        location: currentLocation,
                        isAI: true
                    });
                    syncPosts();
                }, 1000);
            }
        }

        // K wanders and suggests a location
        function kWanders() {
            const pick = arr => arr[Math.floor(Math.random() * arr.length)];
            const otherLocs = Object.keys(worldLocations).filter(k => k !== currentLocation);
            const suggestedKey = pick(otherLocs);
            const suggestedLoc = worldLocations[suggestedKey];
            const msg = pick(kGuide.wandering)
                .replace(/\$\{name\}/g, userName || '譌・ｺｺ')
                .replace(/\$\{loc\}/g, `${suggestedLoc.icon} ${suggestedLoc.name}`);
            posts.unshift({
                id: Date.now(),
                text: msg,
                author: "K", icon: "坎", timestamp: Date.now(), location: currentLocation, isAI: true
            });
            syncPosts();
        }

        function worldPulse() {
            checkAutonomousPulse();
            checkSocialPulse();
            updateWorldTrends();

            // 圷 Surveillance Pulse
            if (Math.random() > 0.7) {
                surveillanceLevel = Math.min(100, surveillanceLevel + Math.floor(Math.random() * 15));
                localStorage.setItem('itapla_surveillance', surveillanceLevel);
                console.log(`藤 Surveillance intensifying: ${surveillanceLevel}%`);

                if (surveillanceLevel > 50) {
                    applySurveillanceEffects();
                }
            } else if (Math.random() > 0.8) {
                // Occasional decrease if lucky
                surveillanceLevel = Math.max(0, surveillanceLevel - 5);
                localStorage.setItem('itapla_surveillance', surveillanceLevel);
            }
        }

        function applySurveillanceEffects() {
            const effectRoll = Math.random();
            if (effectRoll > 0.8) {
                posts.unshift({
                    id: Date.now(),
                    text: `・亥ｺ・ｴ縺ｮ髫・↓縲∫・濶ｲ縺ｮ繧ｳ繝ｼ繝医ｒ逹縺溽塙縺溘■縺ｮ蠖ｱ縺瑚ｦ九∴繧九ょｽｼ繧峨・辟｡讖溯ｳｪ縺ｪ隕也ｷ壹〒縲√％縺｡繧峨・蜍募髄繧定ｨ倬鹸縺励※縺・ｋ繧医≧縺窶ｦ窶ｦ・荏,
                    author: "System", icon: "側", timestamp: Date.now(), location: currentLocation, isAI: true
                });
                syncPosts();
            }

            // Visual noise active logic
            const noise = document.getElementById('global-noise');
            if (noise && surveillanceLevel > 60) {
                noise.classList.add('active');
                setTimeout(() => noise.classList.remove('active'), 3000);
            }
        }

        function updateWorldTrends() {
            const ticker = document.getElementById('trend-ticker-area');
            const content = document.getElementById('trend-content');

            let pool = [
                "螂・ｦ吶↑髴ｧ縺ｮ逋ｺ逕・, "譛ｪ逋ｺ陦ｨ縺ｮ蜀呎悽縺檎匱隕九＆繧後ｋ", "蠎・ｴ縺ｫ髮・∪繧矩ｻ堤賢",
                "闢・浹讖溘・髻ｳ縺梧ｭ｢縺ｾ繧峨↑縺・, "驫豐ｳ驩・％縺ｮ豎ｽ隨・, "蜿､譛ｬ螻九・螂･縺ｫ豸医∴縺溷ｽｱ",
                "繧ｸ繝｣繧ｺ繝舌・縺ｧ縺ｮ蜊ｳ闊郁ｩｩ", "繧｢繝医Μ繧ｨ縺ｮ邨ｵ縺悟虚縺・◆蝎・, "蠅・・縺ｮ萓帷黄縺梧ｶ医∴繧・,
                "隱ｰ縺九′蜻ｼ繧薙〒縺・ｋ螢ｰ", "螟懊ｒ豁ｩ縺丈ｻ倡ｮ九◆縺｡", "繧､繝ｳ繧ｯ縺ｮ蛹ゅ＞縺ｮ縺吶ｋ鬚ｨ"
            ];

            if (surveillanceLevel > 70) {
                pool = ["縲千ｷ雁ｯ・ｭｦ謌偵第晄Φ讀憺夢縺ｮ蠑ｷ蛹・, "轣ｰ濶ｲ縺ｮ繧ｳ繝ｼ繝医・逕ｷ縺溘■縺ｮ蟾｡蝗・, "辟壽嶌縺ｮ辣吶′遨ｺ繧定ｦ・≧", "豐磯ｻ吶ｒ蠑ｷ隕√☆繧九ヮ繧､繧ｺ", "騾｣蟶ｯ縺ｮ證怜捷縺悟宦縺九ｌ繧・];
                ticker.style.borderColor = "#ff0000";
            } else if (surveillanceLevel > 30) {
                pool.push("荳咲ｩ上↑逶｣隕悶・逵ｼ蟾ｮ縺・, "險闡峨ｒ驕ｸ縺ｰ縺ｭ縺ｰ縺ｪ繧峨↑縺・ｺ域─", "蝗√″螢ｰ縺縺代・騾｣蟶ｯ");
                ticker.style.borderColor = "#ff8800";
            } else {
                ticker.style.borderColor = "var(--accent-main)";
            }

            const newTrend = pool[Math.floor(Math.random() * pool.length)];

            ticker.style.opacity = '0';
            setTimeout(() => {
                content.innerText = newTrend;
                ticker.style.opacity = '0.8';
            }, 1000);
        }

        // 蛻晏屓襍ｷ蜍・
        setTimeout(updateWorldTrends, 3000);

        setInterval(worldPulse, 60000);

        // --- Phase 1 Functions ---
        function applyLocation(loc) {
            document.body.setAttribute('data-location', loc);
            const locInfo = worldLocations[loc];
            document.getElementById('appTitle').innerText = locInfo ? `ITAPLA 窶・${locInfo.name}` : 'ITAPLA';
            const iconEl = document.getElementById('currentLocIcon');
            if (iconEl && locInfo) iconEl.textContent = locInfo.icon;

            currentLocation = loc;
            localStorage.setItem('current_location', loc);

            // Toggle Shrine Button
            const omikujiBtn = document.getElementById('omikuji-btn');
            if (omikujiBtn) {
                omikujiBtn.style.display = (loc === 'shrine') ? 'block' : 'none';
            }

            // Toggle Vision Upload Area (Atelier/Gallery only)
            const visionArea = document.getElementById('vision-upload-area');
            if (visionArea) {
                visionArea.style.display = (loc === 'gallery') ? 'block' : 'none';
            }
        }

        function switchLocation(loc) {
            applyLocation(loc);
            initParticles();
            const locInfo = worldLocations[loc];
            // System message: moved
            posts.unshift({
                id: Date.now(),
                text: `・・{locInfo.icon} ${locInfo.name}縺ｸ遘ｻ蜍輔＠縺滂ｼ荏,
                author: "System", icon: "亮・・, timestamp: Date.now(), location: loc, isAI: true
            });
            // Ambience: display the presence of others
            if (locInfo.ambience) {
                posts.unshift({
                    id: Date.now() + 1,
                    text: `賢・・${locInfo.ambience}`,
                    author: "蝣ｴ縺ｮ豌鈴・", icon: locInfo.icon, timestamp: Date.now(), location: loc, isAI: true
                });
            }
            syncPosts();
        }

        // Particle Logic
        let particles = [];
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');

        function initParticles() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            const locInfo = worldLocations[currentLocation];
            const char = locInfo ? locInfo.particle : '笨ｨ';
            for (let i = 0; i < 30; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    s: 10 + Math.random() * 20,
                    v: 0.5 + Math.random(),
                    char: char,
                    o: 0.1 + Math.random() * 0.3
                });
            }
        }

        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.fillStyle = `rgba(255,255,255,${p.o})`;
                ctx.font = `${p.s}px serif`;
                ctx.fillText(p.char, p.x, p.y);
                p.y -= p.v;
                if (p.y < -30) p.y = canvas.height + 30;
            });
            requestAnimationFrame(drawParticles);
        }
        requestAnimationFrame(drawParticles);

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // --- More to follow in next phases ---
        // --- Account & Favorite Logic ---
        function openAccount() {
            const modal = document.getElementById('account-modal');
            document.getElementById('editUserName').value = userName;
            renderFavorites();
            modal.style.display = 'flex';
        }

        function closeAccount() {
            document.getElementById('account-modal').style.display = 'none';
        }

        function saveAccountProfile() {
            const newName = document.getElementById('editUserName').value.trim();
            if (newName) {
                userName = newName;
                localStorage.setItem('user_name', userName);
                alert("繝励Ο繝輔ぅ繝ｼ繝ｫ繧剃ｿ晏ｭ倥＠縺ｾ縺励◆縲・);
                closeAccount();
                renderTimeline(); // 蜷榊燕縺悟渚譏縺輔ｌ繧九ｈ縺・↓蜀肴緒逕ｻ
            }
        }

        function toggleFavorite(postId) {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            const index = favorites.findIndex(f => f.id === postId);
            if (index > -1) {
                favorites.splice(index, 1);
            } else {
                favorites.push(post);
            }
            localStorage.setItem('itapla_favorites', JSON.stringify(favorites));
            renderTimeline();
            if (document.getElementById('account-modal').style.display === 'flex') {
                renderFavorites();
            }
        }

        function renderFavorites() {
            const list = document.getElementById('favorites-list');
            if (favorites.length === 0) {
                list.innerHTML = `<div style="opacity:0.3; text-align:center; padding:20px;">縺ｾ縺縺頑ｰ励↓蜈･繧翫・險闡峨・縺ゅｊ縺ｾ縺帙ｓ縲・/div>`;
                return;
            }
            list.innerHTML = favorites.map(f => `
                <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:12px; margin-bottom:10px; border-left:3px solid var(--accent-main);">
                    <div style="font-weight:bold; margin-bottom:4px; font-size:11px; opacity:0.8;">${f.author} (${f.location})</div>
                    <div style="font-style:italic; opacity:0.9;">"${f.text.substring(0, 60)}${f.text.length > 60 ? '...' : ''}"</div>
                    <div style="text-align:right; margin-top:5px;">
                        <span style="cursor:pointer; color:#ff6b6b; font-size:10px;" onclick="toggleFavorite(${f.id})">蜑企勁</span>
                    </div>
                </div>
            `).join('');
        }

        function renderTimeline() {
            const container = document.getElementById('timeline');
            console.log("時・・renderTimeline: Rendering", posts.length, "posts.");
            if (!container) {
                console.error("笶・renderTimeline: Container #timeline not found!");
                return;
            }
            container.innerHTML = '';

            const stickyColors = ['#D4C3A3', '#E3D5B8', '#C9B896', '#BFAF8D', '#D9C5B2'];

            posts.forEach((p, index) => {
                try {
                    const authorKey = Object.keys(aiPersonalities).find(k => aiPersonalities[k].name === p.author) || '';
                    const personality = aiPersonalities[authorKey];
                    const worksText = personality ? personality.works : '';

                    // Pop art avatar setup
                    const colors = popArtColors[authorKey] || { bg: "linear-gradient(135deg, #333, #555)", border: "#888", accent: "#fff" };
                    const tier = personality ? personality.level : '';
                    const avatarHtml = `<div class="popart-avatar" style="background: ${colors.bg}; border-color: ${colors.border}; width:48px; height:48px;">
                        <span class="avatar-icon">${p.icon}</span>
                        ${tier ? `<span class="avatar-tier" style="color: ${colors.accent};">${tier}</span>` : ''}
                    </div>`;
                    const avatarWithClick = personality ? `<div onclick="showProfile('${authorKey}')" style="cursor:pointer;">${avatarHtml}</div>` : avatarHtml;

                    // Sticky Note styling
                    const card = document.createElement('div');
                    card.className = 'post-card';
                    const rotation = (index % 2 === 0 ? -0.8 : 0.8) + (Math.random() * 0.4 - 0.2);
                    const color = p.isAI ? stickyColors[index % stickyColors.length] : '#F4D03F'; // User is bright yellow

                    card.style.setProperty('--rotation', `${rotation}deg`);
                    card.style.background = color;

                    card.innerHTML = `
                        ${avatarWithClick}
                        <div class="post-body">
                            <div class="post-author-line">
                                <span class="post-author-name" style="color:rgba(0,0,0,0.8);">${p.author}</span>
                                ${worksText ? `<span class="post-author-works" style="color:rgba(0,0,0,0.4);">${worksText}</span>` : ''}
                            </div>
                            <div style="line-height: 1.7; color:rgba(0,0,0,0.85); font-size:15px; white-space:pre-wrap;">${p.text}</div>
                                 <span style="opacity: 0.4; font-family:var(--font-outfit); color:rgba(0,0,0,0.6);">${new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 窶・${p.location}</span>
                                 <div style="display:flex; gap:15px; align-items:center;">
                                    <span style="cursor: pointer; font-size: 14px; opacity: ${favorites.some(f => f.id === p.id) ? '1' : '0.4'}; color: ${favorites.some(f => f.id === p.id) ? '#ff4081' : 'inherit'};" onclick="toggleFavorite(${p.id})">笘・/span>
                                    ${authorKey && p.author !== 'K' && p.author !== 'System' ? `<span style="cursor: pointer; font-weight:800; opacity:0.7;" onclick="setReply('${authorKey}')">REPLY</span>` : ''}
                                 </div>
                            </div>
                        </div>
                    `;
                    container.appendChild(card);
                } catch (err) {
                    console.error("笶・renderTimeline: Error rendering post at index", index, p, err);
                }
            });
            console.log("時・・renderTimeline: Completed.");
        }

        function showProfile(key) {
            const p = aiPersonalities[key];
            if (!p) return;
            const colors = popArtColors[key] || { bg: "#333", border: "#888" };

            const avatarEl = document.getElementById('p-avatar');
            avatarEl.style.background = colors.bg;
            avatarEl.style.borderColor = colors.border;
            avatarEl.textContent = p.icon;

            document.getElementById('p-name').textContent = p.name;
            document.getElementById('p-tier').textContent = p.level;
            document.getElementById('p-bio').textContent = p.bio;
            document.getElementById('p-works').textContent = p.works ? `莉｣陦ｨ菴・ ${p.works}` : '';

            document.getElementById('profile-modal').style.display = 'flex';
        }

        /* --- Bungo Archive (The Great Library of ITAPLA) --- */


        // --- ITAPLA Radio Logic (API Mode for GitHub Pages) ---
        const ItaplaRadio = {
            player: null,
            isPlaying: false,
            isReady: false,
            currentIndex: -1,
            playlist: [
                { id: "NpXfGf_6XvU", title: "Biber: Mystery Sonatas" },
                { id: "7vTz8Zf8_Yk", title: "Zelenka: Lamentations" },
                { id: "v_1G8Y28S_8", title: "Gesualdo: Tenebrae" },
                { id: "j0S4E_pB9QY", title: "Sainte-Colombe: Concerts" },
                { id: "7rAbaA9YV7k", title: "Marais: Piﾃｨces de viole" },
                { id: "unpX0pU9T-A", title: "Bill Evans: Conversations" },
                { id: "88PdyvH1SNo", title: "Eric Dolphy: Out to Lunch" },
                { id: "n_S8S-G-Sko", title: "J.S. Bach: Goldberg (Gould)" }
            ],
            init() {
                console.log("峠 Radio: Initializing API...");
                window.onYouTubeIframeAPIReady = () => {
                    this.player = new YT.Player('youtube-player', {
                        height: '1',
                        width: '1',
                        videoId: '',
                        playerVars: {
                            'autoplay': 0, 'controls': 0, 'disablekb': 1,
                            'rel': 0, 'origin': window.location.origin
                        },
                        events: {
                            'onReady': (e) => {
                                console.log("峠 Radio: Player Ready.");
                                this.isReady = true;
                                this.player.setVolume(50);
                                document.getElementById('radio-info').textContent = "Radio Ready";
                            },
                            'onStateChange': (e) => this.onPlayerStateChange(e),
                            'onError': (e) => {
                                console.warn("峠 Radio: Error", e.data);
                                setTimeout(() => this.next(), 2000);
                            }
                        }
                    });
                };
                // Dynamic Load
                if (!window.YT) {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    const firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                }
            },
            toggle() {
                if (!this.isReady) {
                    alert("Radio is loading... Please wait.");
                    return;
                }
                const headerBtn = document.getElementById('radio-header-btn');
                if (this.isPlaying) {
                    this.player.pauseVideo();
                } else {
                    if (this.currentIndex === -1) {
                        this.next();
                    } else {
                        this.player.playVideo();
                        this.player.unMute();
                    }
                }
            },
            next() {
                if (!this.isReady) return;
                this.currentIndex = Math.floor(Math.random() * this.playlist.length);
                const track = this.playlist[this.currentIndex];
                this.player.loadVideoById(track.id);
                document.getElementById('radio-info').textContent = track.title;
            },
            setVolume(val) {
                if (this.player && this.isReady) {
                    this.player.setVolume(val);
                }
            },
            onPlayerStateChange(event) {
                const status = document.getElementById('radio-status');
                const btn = document.getElementById('radio-toggle-btn');
                const headerBtn = document.getElementById('radio-header-btn');
                if (event.data === YT.PlayerState.PLAYING) {
                    this.isPlaying = true;
                    status.style.background = "#00ff88";
                    btn.textContent = "竢ｸ・・;
                    if (headerBtn) {
                        headerBtn.style.background = "rgba(0, 255, 136, 0.3)";
                        headerBtn.style.borderColor = "rgba(0, 255, 136, 0.5)";
                    }
                } else {
                    this.isPlaying = false;
                    status.style.background = "#555";
                    btn.textContent = "笆ｶ・・;
                    if (headerBtn) {
                        headerBtn.style.background = "rgba(139, 69, 19, 0.4)";
                        headerBtn.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }
                    if (event.data === YT.PlayerState.ENDED) this.next();
                }
            }
        };

        ItaplaRadio.init();

        // Initialize Archive
    </script>
