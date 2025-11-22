// --- FIREBASE IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, setDoc, runTransaction, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getDatabase, ref, onValue, runTransaction as rtdbRunTransaction, query, orderByChild } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// --- GAME DATA (Embedded to ensure availability) ---
const GAME_DATA = {
    "changelog": [
        { "version": "v1.7.1", "changes": ["Fixed the lobby loading animation...", "Added review sending option."] },
        { "version": "v1.7.0", "changes": ["Multiplayer Mode added.", "New sounds and visuals.", "5 new achievements."] },
        { "version": "v1.6.4", "changes": ["Achievements section added.", "10 additional achievements."] },
        { "version": "v1.6.3", "changes": ["1000 new questions added.", "Automated leaderboard."] },
        { "version": "v1.6.2", "changes": ["Timed stat added.", "UI tweaks."] },
        { "version": "v1.6.1", "changes": ["Shop tools rebalanced.", "Gauntlet timer fixed."] },
        { "version": "v1.6.0", "changes": ["New tool added.", "Gauntlet and Shopless modes integrated."] },
        { "version": "v1.5.2", "changes": ["Minor glitches fixed.", "New rounded icon."] },
        { "version": "v1.5.1", "changes": ["Feedback feature added.", "New sounds."] },
        { "version": "v1.5.0", "changes": ["New UI introduced.", "Resolution support optimized."] },
        { "version": "v1.4.3", "changes": ["Internet connection required.", "Leaderboard real-time."] },
        { "version": "v1.4.2", "changes": ["Screenshot feature added.", "Unbeatable difficulty added."] },
        { "version": "v1.4.1", "changes": ["Mystery Box added.", "Clickable links."] },
        { "version": "v1.4.0", "changes": ["Keyboard accessibility.", "Difficulty settings functional."] },
        { "version": "v1.3.3", "changes": ["Update notification visual redesign."] },
        { "version": "v1.3.2", "changes": ["Update checker added."] },
        { "version": "v1.3.1", "changes": ["Two new tools.", "500 new questions."] },
        { "version": "v1.3.0", "changes": ["New music track.", "Retro sound effects."] },
        { "version": "v1.2.2", "changes": ["Bug fixes and UI tweaks."] },
        { "version": "v1.2.1", "changes": ["Leaderboard updates."] },
        { "version": "v1.2.0", "changes": ["New font.", "Total coins display."] },
        { "version": "v1.1.0", "changes": ["Bug fixes.", "New tools."] },
        { "version": "v1.0.0", "changes": ["Initial release."] }
    ],
    "tools": [
        { "name": "Health Potion", "price": "10 Coins", "description": "Restores 25 Health points", "cooldown": "Null" },
        { "name": "Coin Boost", "price": "15 Coins", "description": "Gains 10 extra coins (Not a scam)", "cooldown": "Null" },
        { "name": "Skipper", "price": "20 Coins", "description": "Makes you skip any 3 questions", "cooldown": "Null" },
        { "name": "Mystery Box", "price": "30 Coins", "description": "Provides a random item.", "cooldown": "Null" },
        { "name": "Extra Life", "price": "35 Coins", "description": "Grants you a whole new life (100 Health)", "cooldown": "Null" },
        { "name": "Shield", "price": "35 Coins", "description": "Blocks 5 wrong answers", "cooldown": "Null" },
        { "name": "Double Score Boost", "price": "45 Coins", "description": "Doubles score for next 5 questions", "cooldown": "Null" },
        { "name": "50/50", "price": "60 Coins", "description": "Removes two wrong answers", "cooldown": "Null" },
        { "name": "Lucky Triples", "price": "65 Coins", "description": "Try to triple coins/health, or lose a third.", "cooldown": "3 Min / 5 Min*" },
        { "name": "Double Score", "price": "70 Coins", "description": "Doubles current score", "cooldown": "3 Min / 5 Min*" }
    ],
    "mysteryBox": [
        { "item": "More coins", "rarity": "Common", "howItWorks": "Adds 15 coins" },
        { "item": "Health Booster", "rarity": "Common", "howItWorks": "Adds 50 Health points" },
        { "item": "Skips", "rarity": "Uncommon", "howItWorks": "Gives 5 Skips" },
        { "item": "Shield", "rarity": "Uncommon", "howItWorks": "Activates shield once" },
        { "item": "You took my points!", "rarity": "Uncommon", "howItWorks": "Deducts 20% of score" },
        { "item": "Score Booster", "rarity": "Rare", "howItWorks": "Calculates multiplier based on Health/Score" },
        { "item": "Double Score", "rarity": "Super rare", "howItWorks": "Multiplies score by 2" }
    ],
    "luckyTriples": [
        { "item": "Coin Tripler", "chance": "40% Chance", "howItWorks": "Coins tripled" },
        { "item": "Health Tripler", "chance": "40% Chance", "howItWorks": "Health tripled" },
        { "item": "I’m Unlucky", "chance": "20% Chance", "howItWorks": "Lose one-third of coins and health" }
    ],
    "difficulties": [
        { "name": "Unlimited", "score": "0", "description": "Goes on until you lose" },
        { "name": "Easy", "score": "250", "description": "Score 250 to win" },
        { "name": "Hard", "score": "500", "description": "Score 500 to win" },
        { "name": "Extreme", "score": "1000", "description": "Score 1000 to win" },
        { "name": "Unbeatable", "score": "5000", "description": "Score 5000 to win" }
    ],
    "modes": [
        { "name": "Normal", "icon": "fas fa-check-circle", "description": "Standard gameplay" },
        { "name": "Gauntlet", "icon": "fas fa-hourglass-start", "description": "5 minutes to score high" },
        { "name": "Shopless", "icon": "fas fa-ban", "description": "No shop allowed" },
        { "name": "Multiplayer", "icon": "fas fa-users", "description": "Play with friends online" }
    ],
    "achievements": [
        { "name": "Novice Survivor", "subtitle": "Every survivor starts somewhere.", "description": "Beat Easy difficulty", "icon": "fas fa-medal" },
        { "name": "Tough Challenger", "subtitle": "You’ve proven you can handle the pressure.", "description": "Beat Hard difficulty", "icon": "fas fa-shield-alt" },
        { "name": "Fearless Mind", "subtitle": "You thrive where others crumble.", "description": "Beat Extreme difficulty", "icon": "fa-solid fa-skull" },
        { "name": "Unstoppable", "subtitle": "The trivia gods fear you now.", "description": "Beat Unbeatable difficulty", "icon": "fas fa-crown" },
        { "name": "Master of Survival", "subtitle": "From the first match to the final stand.", "description": "Beat all difficulties", "icon": "fas fa-star" },
        { "name": "Shopless Titan", "subtitle": "Who needs items?", "description": "Score 1500+ in Shopless", "icon": "fas fa-shopping-bag" },
        { "name": "Gauntlet Blitzer", "subtitle": "Fast hands, faster mind.", "description": "Score 1500+ in Gauntlet", "icon": "fas fa-running" },
        { "name": "Curiosity Pays", "subtitle": "You clicked where no one dared.", "description": "Find the easter egg", "icon": "fas fa-egg" },
        { "name": "Hall of Fame", "subtitle": "Your name is carved into history.", "description": "Get on leaderboard", "icon": "fas fa-trophy" },
        { "name": "Broken Piggy Bank", "subtitle": "Smashed wide open.", "description": "Earn 200+ coins in a run", "icon": "fa-solid fa-money-bill" },
        { "name": "The Centurion", "subtitle": "True endurance.", "description": "Answer 100 correctly", "icon": "fas fa-fire" },
        { "name": "Score Titan", "subtitle": "Best of the best.", "description": "Score 10,000", "icon": "fas fa-chart-line" },
        { "name": "The Shoplifter", "subtitle": "Spend big to win big.", "description": "Buy 15 items in a run", "icon": "fas fa-cart-arrow-down" },
        { "name": "Perfect Time", "subtitle": "Speed, accuracy, efficiency.", "description": "Score 500 in <2 mins", "icon": "fas fa-stopwatch" },
        { "name": "Godlike Streak", "subtitle": "Uninterrupted knowledge.", "description": "25 correct in a row", "icon": "fas fa-bolt" }
    ]
};

// --- CONFIG ---
const FIRESTORE_DOWNLOAD_CONFIG = {
    apiKey: "AIzaSyCAmYCabtz0apNHmyw9w6Jlr2lPpyXDUKk",
    authDomain: "downlodsqfs.firebaseapp.com",
    projectId: "downlodsqfs",
    storageBucket: "downlodsqfs.firebasestorage.app",
    messagingSenderId: "597637748461",
    appId: "1:597637748461:web:a24eb0794427a38aa11ee4",
    measurementId: "G-1FWDCC5GH4"
};
const RTDB_REVIEW_CONFIG = {
    apiKey: "AIzaSyC46EyePwg6oytVGDOeNg_F1xtHaLLN_KI",
    authDomain: "quizforsurvival.firebaseapp.com",
    databaseURL: "https://quizforsurvival-default-rtdb.firebaseio.com",
    projectId: "quizforsurvival",
    storageBucket: "quizforsurvival.firebasestorage.app",
    messagingSenderId: "493584571443",
    appId: "1:493584571443:web:6438fb679c04699a4dd746",
    measurementId: "G-HN1S70HQHS"
};

let fsDb, fsAuth, downloadCounterRef;
let rtdb, reviewsRef;
const likedReviewsKey = 'qfs_liked_reviews';
const appId = 'default-app-id'; 

// --- INIT FIREBASE ---
const initializeFirebase = async () => {
    try {
        // Firestore (Downloads)
        const fsApp = initializeApp(FIRESTORE_DOWNLOAD_CONFIG, "downloadApp");
        fsDb = getFirestore(fsApp);
        fsAuth = getAuth(fsApp);
        await signInAnonymously(fsAuth);
        downloadCounterRef = doc(fsDb, 'artifacts', appId, 'public', 'data', 'qfs_downloads', 'counter');
        
        // RTDB (Reviews)
        const rtdbApp = initializeApp(RTDB_REVIEW_CONFIG, "reviewApp");
        rtdb = getDatabase(rtdbApp);
        reviewsRef = ref(rtdb, 'reviews');
        
        console.log("Firebase initialized.");
    } catch (error) {
        console.error("Firebase init failed:", error);
    }
};

// --- LOGIC: HOME PAGE ---
const initHome = async () => {
    // 1. Listen for Download Count
    if (downloadCounterRef) {
        onSnapshot(downloadCounterRef, (doc) => {
            const count = doc.exists() ? doc.data().count : 0;
            const el = document.getElementById('download-count-value');
            if(el) el.textContent = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(count);
        });
    }

    // 2. Fetch Version Info
    try {
        const response = await fetch('https://gist.githubusercontent.com/Fillabrona/5a17fe172177f74a4a65196ba1b53c50/raw/523059da8e38714ffd789d6c63c9e2b3f5d1d92b/downloadinfo', { cache: "no-store" });
        const data = await response.json();
        
        // Update DOM
        const versionMatch = data.versionInfo.match(/Game:.*(v[\d.]+)/);
        const versionNumber = versionMatch ? versionMatch[1] : 'Unknown';
        document.getElementById('version-display').textContent = versionNumber;
        document.getElementById('file-size-value').textContent = data.fileSize || 'N/A';
        
        const btn = document.getElementById('download-button');
        if(btn) {
            btn.setAttribute('data-download-url', data.downloadLink);
            btn.innerHTML = '<i class="fas fa-download mr-2"></i> Download Latest Version';
            btn.disabled = false;
            
            btn.addEventListener('click', async () => {
                if(btn.disabled) return;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Starting...';
                await runTransaction(fsDb, async (transaction) => {
                    const sfDoc = await transaction.get(downloadCounterRef);
                    if (!sfDoc.exists()) transaction.set(downloadCounterRef, { count: 1 });
                    else transaction.update(downloadCounterRef, { count: increment(1) });
                });
                window.location.href = data.downloadLink;
                setTimeout(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download mr-2"></i> Download Latest Version'; }, 2000);
            });
        }
        
        // Populate text sections
        const updateText = data.versionInfo.substring(data.versionInfo.indexOf('--- LATEST UPDATE ---') + '--- LATEST UPDATE ---'.length).trim();
        const nextText = data.whatsNext.substring(data.whatsNext.indexOf('--- UPCOMING FEATURES ---') + '--- UPCOMING FEATURES ---'.length).trim();
        
        document.getElementById('latest-version-content').innerHTML = formatText(updateText);
        document.getElementById('whats-next-content').innerHTML = formatText(nextText);
        
        // Reveal stats
        document.getElementById('file-stats-placeholder').classList.add('hidden');
        document.getElementById('file-stats-content').classList.remove('hidden');

    } catch (e) {
        console.error("Fetch error", e);
        document.getElementById('latest-version-heading').innerHTML = 'Error Loading Data';
    }
};

const formatText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let html = '<ul class="list-none space-y-3 pl-0">';
    lines.forEach(line => {
        if (line.startsWith('•')) {
            html += `<li class="flex items-start text-white/90 text-lg"><span class="text-link-primary mr-3">&#9679;</span>${line.substring(1)}</li>`;
        } else if (line.endsWith(':')) {
            html += `<li class="pt-4 pb-1 text-xl font-bold text-button-primary">${line}</li>`;
        } else {
            html += `<li class="text-white/80 pl-6 text-lg">${line}</li>`;
        }
    });
    return html + '</ul>';
};

// --- LOGIC: REVIEWS PAGE ---
const initReviews = () => {
    if (!reviewsRef) return;
    const container = document.getElementById('reviews-container');
    const loader = document.getElementById('reviews-loader');
    
    const q = query(reviewsRef, orderByChild('timestamp'));
    onValue(q, (snapshot) => {
        container.innerHTML = '';
        if (!snapshot.exists()) {
            container.innerHTML = '<p class="text-center text-white/70">No reviews yet.</p>';
            loader.style.display = 'none';
            return;
        }
        
        const reviews = [];
        snapshot.forEach(c => reviews.unshift({id: c.key, ...c.val()}));
        const likedIds = JSON.parse(localStorage.getItem(likedReviewsKey) || '[]');
        
        reviews.forEach(r => {
            const hasLiked = likedIds.includes(r.id);
            const date = new Date(r.timestamp * 1000).toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
            const html = `
                <div class="review-card space-y-4">
                    <div class="flex justify-between items-center border-b border-link-primary/30 pb-3">
                        <h4 class="text-xl font-bold text-link-primary">${r.userName || 'Anonymous'}</h4>
                        <span class="text-sm text-white/60">${date}</span>
                    </div>
                    <p class="review-text-bubble text-white/90 whitespace-pre-wrap">${r.reviewText}</p>
                    <div class="flex justify-between items-center pt-3">
                        <span class="playtime-bubble text-sm">Playtime: ${(r.playtimeHours || 0).toFixed(1)}h</span>
                        <button class="like-button" data-id="${r.id}" ${hasLiked ? 'disabled' : ''}>
                            <i class="fas fa-thumbs-up mr-2"></i> ${hasLiked ? 'Liked' : 'Helpful'} (${r.likes || 0})
                        </button>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', html);
        });
        loader.style.display = 'none';
        
        // Attach click listeners to new buttons
        document.querySelectorAll('.like-button').forEach(btn => {
            btn.addEventListener('click', () => handleLike(btn.dataset.id));
        });
    });
};

const handleLike = (id) => {
    const btn = document.querySelector(`button[data-id="${id}"]`);
    if(!btn || btn.disabled) return;
    btn.disabled = true;
    
    // Optimistic UI + LocalStorage
    const likedIds = JSON.parse(localStorage.getItem(likedReviewsKey) || '[]');
    likedIds.push(id);
    localStorage.setItem(likedReviewsKey, JSON.stringify(likedIds));
    
    const likeRef = ref(rtdb, `reviews/${id}/likes`);
    rtdbRunTransaction(likeRef, (c) => (c || 0) + 1).catch(e => {
        console.error(e);
        // Rollback if needed
    });
};

// --- LOGIC: ABOUT PAGE (Tools) ---
const initAbout = () => {
    const toolsHtml = GAME_DATA.tools.map(t => `
        <div class="info-bubble tool-bubble">
            <h4><span>${t.name}</span><span class="tool-price">${t.price}</span></h4>
            <p class="bubble-description">${t.description}</p>
            <p class="tool-cooldown">Cooldown: ${t.cooldown}</p>
        </div>`).join('');
    document.getElementById('tools-content').innerHTML = toolsHtml;

    let mysteryHtml = '<div class="space-y-4">';
    GAME_DATA.mysteryBox.forEach(i => {
        mysteryHtml += `<div class="info-bubble"><h4>${i.item} <span class="text-sm text-button-primary">[${i.rarity}]</span></h4><p class="bubble-description">${i.howItWorks}</p></div>`;
    });
    document.getElementById('mystery-box-content').innerHTML = mysteryHtml + '</div>';
    
    let tripleHtml = '<div class="space-y-4">';
    GAME_DATA.luckyTriples.forEach(i => {
        tripleHtml += `<div class="info-bubble"><h4>${i.item} <span class="text-sm text-button-primary">[${i.chance}]</span></h4><p class="bubble-description">${i.howItWorks}</p></div>`;
    });
    document.getElementById('lucky-triples-content').innerHTML = tripleHtml + '</div>';
};

// --- LOGIC: GAME INFO (Database) ---
const initDatabase = () => {
    document.getElementById('modes-content').innerHTML = GAME_DATA.modes.map(m => 
        `<div class="info-bubble"><h4><i class="${m.icon} mr-2"></i>${m.name}</h4><p class="bubble-description">${m.description}</p></div>`
    ).join('');

    document.getElementById('difficulties-content').innerHTML = GAME_DATA.difficulties.map(d => 
        `<div class="info-bubble"><h4>${d.name}</h4><p class="text-link-primary font-bold">Score: ${d.score}</p><p class="bubble-description">${d.description}</p></div>`
    ).join('');
    
    document.getElementById('achievements-content').innerHTML = GAME_DATA.achievements.map(a => 
        `<div class="info-bubble"><div class="flex items-center mb-2"><i class="${a.icon} text-link-primary text-2xl mr-3"></i><h4>${a.name}</h4></div><p class="text-xs italic opacity-70 mb-2">${a.subtitle}</p><p class="bubble-description">${a.description}</p></div>`
    ).join('');
};

// --- LOGIC: CHANGELOG ---
const initChangelog = () => {
    const container = document.getElementById('changelog-content');
    let html = '';
    GAME_DATA.changelog.forEach((entry, idx) => {
        const changes = entry.changes.map((c, i) => `
            <div class="changelog-change-block">
                <h5 class="text-link-primary font-bold mb-1">Update ${i+1}:</h5>
                <div class="text-white/80">${c}</div>
            </div>`).join('');
        
        html += `
            <div class="changelog-entry">
                <div class="changelog-header" onclick="this.parentElement.querySelector('.changelog-content').classList.toggle('open'); this.querySelector('i').classList.toggle('rotated'); const c=this.parentElement.querySelector('.changelog-content'); c.style.maxHeight = c.style.maxHeight ? null : c.scrollHeight + 'px';">
                    <span class="text-button-primary text-xl font-bold">${entry.version}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="changelog-content"><div class="p-6">${changes}</div></div>
            </div>`;
    });
    container.innerHTML = html;
};

// --- GLOBAL INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Navbar Toggle
    const menuBtn = document.getElementById('menu-button');
    if(menuBtn) {
        menuBtn.addEventListener('click', () => {
            document.getElementById('nav-menu').classList.toggle('open');
        });
    }

    // 2. Active Link Highlight
    const path = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if ((path === '/' || path === '/index.html') && href === '/') {
            link.classList.add('active');
        } else if (path.includes(href) && href !== '/') {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 3. Initialize Firebase
    await initializeFirebase();

    // 4. Page Specific Loaders
    if(document.getElementById('download-button')) initHome();
    if(document.getElementById('reviews-container')) initReviews();
    if(document.getElementById('tools-content')) initAbout();
    if(document.getElementById('achievements-content')) initDatabase();
    if(document.getElementById('changelog-content')) initChangelog();
});
