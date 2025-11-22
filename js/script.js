import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, setDoc, runTransaction, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getDatabase, ref, onValue, runTransaction as rtdbRunTransaction, query, orderByChild } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// --- GAME DATA ---
const GAME_DATA = {
        "changelog": [
			{ "version": "v1.7.1", "changes": ["Fixed the lobby loading animation to run smoothly, improved overall logic, patched several bugs, and added a few extra tweaks for better performance. A new review-sending option was also added, letting you submit your message along with your total hours played directly to the Fillabrona website."] },
            { "version": "v1.7.0", "changes": ["Multiplayer Mode has been added, letting you play and compete with friends, family, or anyone online, along with new sounds, improved visuals, and fixes for bugs and lag. And fixed some achievement logic, also topped it off with animations for victories and more.", "Added 5 new achievements, fixed animation replay issues, and introduced a secret reward for unlocking the 'Curiosity Pays' achievement. Improved the UI and added extra stats to the victory screen, including average performance rating, total correct and wrong answers, and more, along with various other tweaks."] },
            { "version": "v1.6.4", "changes": ["A new Achievements section has been added to the game, featuring new music tracks and 10 additional achievements to unlock. These new additions aim to make the game even more engaging and motivate players to actively pursue and earn achievements."] },
            { "version": "v1.6.3", "changes": ["A total of 1000 new questions have been added to enhance gameplay depth and a fully automated leaderboard has been introduced. Additionally, several new features have been introduced, along with various tweaks and bug fixes to improve overall performance and user experience."] },
            { "version": "v1.6.2", "changes": ["A new timed stat has been added, allowing you to track how long it took to reach the victory screen—a great way to challenge yourself and refine your skills. Minor user interface tweaks have also been implemented to improve readability and consistency across all devices. Additionally, several issues with the logic of certain tools have been fixed, ensuring they work as intended during gameplay."] },
            { "version": "v1.6.1", "changes": ["Tools in the shop were adjusted to be more cost-effective, with some tools receiving buffs while remaining reasonably priced. The Gauntlet Mode timer no longer glitches as frequently as it did in version 1.6.0. Additionally, some logic issues within the game were addressed, including the logic behind the Double Score Booster"] },
            { "version": "v1.6.0", "changes": ["A new tool has been added to the shop, featuring a completely redesigned UI. Two additional game modes have been introduced alongside the existing normal mode, now integrated with the “Gauntlet” and “Shopless” modes. The update also includes new features, extended music and sound options, UI enhancements, and a refresh button to easily reconnect to the internet"] },
            { "version": "v1.5.2", "changes": ["Fixed minor glitches and bugs, including issues with opening new screens and slow performance and newly redesigned rounded icon for a refreshed look"] },
            { "version": "v1.5.1", "changes": ["A feedback and suggestions feature has been added, allowing users to type a message and choose either \"suggestions\" or \"feedback.\" The input is then sent to Discord, where the developer can review it and potentially implement it into the game. New sounds have been added, and various flaws have been fixed"] },
            { "version": "v1.5.0", "changes": ["A new and improved user interface has been introduced, ensuring compatibility with all versions of Windows. Minor bugs, buffer issues, and glitches have been resolved, and resolution support has been optimized across all devices, including monitors and laptops"] },
            { "version": "v1.4.3", "changes": ["The game now requires an active internet connection for full functionality. This enables the leaderboard to update automatically and in real-time. Several flaws and glitches were fixed, and a few UI tweaks and new music implementations were added"] },
            { "version": "v1.4.2", "changes": ["Added a screenshot feature—double-clicking the quiz or victory screen now captures a shot of your wild scores, funny glitches, or memorable moments. Minor glitches were fixed, and a new “Unbeatable” difficulty was introduced, requiring a massive 5000 points to win. A new mystery item, “You Took My Score,” has been added to the Mystery Box, which deducts 20% of your current score if drawn"] },
            { "version": "v1.4.1", "changes": ["Added clickable links and UI tweaks, fixed visual bugs, and introduced the Mystery Box tool in the shop—a purchasable item with cool rewards to be won"] },
            { "version": "v1.4.0", "changes": ["Fully automated keyboard accessibility—no mouse needed—enhanced visuals and sounds, and fully functional difficulty settings (Easy, Hard, and Extreme) that trigger a victory screen when the target score is reached."] },
            { "version": "v1.3.3", "changes": ["The update notification now includes an expanded and more detailed visual design, along with a revamped startup menu that displays helpful tips and additional information"] },
            { "version": "v1.3.2", "changes": ["Added an update checker to notify users of new updates, along with bug fixes and UI adjustments"] },
            { "version": "v1.3.1", "changes": ["Two new tools added to the shop, along with 500 new questions, greatly expanding the depth of gameplay"] },
            { "version": "v1.3.0", "changes": ["A brand-new music track, and sound effects with an 8-bit retro vibe, UI enhancements in the leaderboard, bug fixes, and a new tool added to the shop"] },
            { "version": "v1.2.2", "changes": ["Nothing major, just some bug fixes and UI tweaks"] },
            { "version": "v1.2.1", "changes": ["Not much changed, just new players added to the leaderboard"] },
            { "version": "v1.2.0", "changes": ["New font implemented, leaderboard added, UI and in-game stats fixed, and total coins display updated in the shop"] },
            { "version": "v1.1.0", "changes": ["Resolved bugs, added new features, and introduced new tools for use"] },
            { "version": "v1.0.0", "changes": ["The game’s opening sequence, featuring all core functions and visual elements"] }
        ],
        "tools": [
            { "name": "Health Potion", "price": "10 Coins", "description": "Restores 25 Health points", "cooldown": "Null" },
            { "name": "Coin Boost", "price": "15 Coins", "description": "Gains 10 extra coins (Not a scam)", "cooldown": "Null" },
            { "name": "Skipper", "price": "20 Coins", "description": "Makes you skip any 3 questions you hesitate or don’t know the answer to", "cooldown": "Null" },
            { "name": "Mystery Box", "price": "30 Coins", "description": "Provides a random item. Lower-cost items have a higher chance of appearing, while higher-cost items are less likely to drop due to their rarity", "cooldown": "Null" },
            { "name": "Extra Life", "price": "35 Coins", "description": "Grants you a whole new life (100 Health points)", "cooldown": "Null" },
            { "name": "Shield", "price": "35 Coins", "description": "Blocks 5 wrong answers from losing money", "cooldown": "Null" },
            { "name": "Double Score Boost", "price": "45 Coins", "description": "Doubles the score from correct answers for the next 5 questions", "cooldown": "Null" },
            { "name": "50/50", "price": "60 Coins", "description": "Removes two wrong answers (usable 10 times)", "cooldown": "Null" },
            { "name": "Lucky Triples", "price": "65 Coins", "description": "Try to triple your coins or health, but risk losing a third.", "cooldown": "3 Min / 5 Min*" },
            { "name": "Double Score", "price": "70 Coins", "description": "Doubles your current score", "cooldown": "3 Min / 5 Min*" }
        ],
        "mysteryBox": [
            { "item": "More coins", "rarity": "Common", "howItWorks": "Adds 15 coins to your coins (Not a scam)" },
            { "item": "Health Booster", "rarity": "Common", "howItWorks": "Adds 50 Health points to your current Health points" },
            { "item": "Skips", "rarity": "Uncommon", "howItWorks": "Gives you 5 Skips to use" },
            { "item": "Shield", "rarity": "Uncommon", "howItWorks": "Activates shield once" },
            { "item": "You took my points!", "rarity": "Uncommon", "howItWorks": "Deducts 20% of your current score" },
            { "item": "Score Booster", "rarity": "Rare", "howItWorks": "Uses the formula (Health / Score) * 4 to calculate a multiplier, which is applied to the current Score. Capped and rounded for balance." },
            { "item": "Double Score", "rarity": "Super rare", "howItWorks": "Multiplies your current score by 2" }
        ],
        "luckyTriples": [
            { "item": "Coin Tripler", "chance": "40% Chance", "howItWorks": "Current coins are tripled" },
            { "item": "Health Tripler", "chance": "40% Chance", "howItWorks": "Current health is tripled" },
            { "item": "I’m Unlucky", "chance": "20% Chance", "howItWorks": "Coins and Health are multiplied by two-thirds, effectively losing one-third." }
        ],
        "difficulties": [
            { "name": "Unlimited", "score": "0", "description": "Goes on until you lose" },
            { "name": "Easy", "score": "250", "description": "Score of 250 needed to win" },
            { "name": "Hard", "score": "500", "description": "Score of 500 needed to win" },
            { "name": "Extreme", "score": "1000", "description": "Score of 1000 needed to win" },
            { "name": "Unbeatable", "score": "5000", "description": "Score of 5000 needed to win" }
        ],
        "modes": [
            { "name": "Normal", "icon": "fas fa-check-circle", "description": "Standard gameplay with the default settings" },
            { "name": "Gauntlet", "icon": "fas fa-hourglass-start", "description": "You have only 5 minutes to achieve the highest score you can" },
            { "name": "Shopless", "icon": "fas fa-ban", "description": "Play without a shop, rendering coins essentially worthless" },
            { "name": "Multiplayer", "icon": "fas fa-users", "description": "Play with friends online, and see who finishes first" }
        ],
        "achievements": [
            { "name": "Novice Survivor", "subtitle": "“Every survivor starts somewhere.”", "description": "Beat Easy difficulty", "icon": "fas fa-medal" },
            { "name": "Tough Challenger", "subtitle": "“You’ve proven you can handle the pressure.”", "description": "Beat Hard difficulty", "icon": "fas fa-shield-alt" },
            { "name": "Fearless Mind", "subtitle": "“You thrive where others crumble.”", "description": "Beat Extreme difficulty", "icon": "fa-solid fa-skull" },
            { "name": "Unstoppable", "subtitle": "“The trivia gods fear you now.”", "description": "Beat Unbeatable difficulty", "icon": "fas fa-crown" },
            { "name": "Master of Survival", "subtitle": "“From the first match to the final stand. You’ve done it all.”", "description": "Beat all difficulties at least once", "icon": "fas fa-star" },
            { "name": "Shopless Titan", "subtitle": "“Who needs items when you’ve got skill?”", "description": "Score more than 1,500 points in Shopless Mode", "icon": "fas fa-shopping-bag" },
            { "name": "Gauntlet Blitzer", "subtitle": "“Fast hands, faster mind.”", "description": "Score more than 1,500 points within 5 minutes in Gauntlet Mode", "icon": "fas fa-running" },
            { "name": "Curiosity Pays", "subtitle": "“You clicked where no one dared to click.”", "description": "Find the hidden easter egg", "icon": "fas fa-egg" },
            { "name": "Hall of Fame", "subtitle": "“Your name is now carved into survival history.”", "description": "Get onto the leaderboard", "icon": "fas fa-trophy" },
            { "name": "Broken Piggy Bank", "subtitle": "“You smashed that piggy bank wide open.”", "description": "Earn more than 200 coins in a single run", "icon": "fa-solid fa-money-bill" },
            { "name": "The Centurion", "subtitle": "“True endurance is rare.”", "description": "Answer 100 questions correctly in a single run", "icon": "fas fa-fire" },
            { "name": "Score Titan", "subtitle": "“Only the best of the best reach this level.”", "description": "Achieve a score of 10,000 in a single game", "icon": "fas fa-chart-line" },
            { "name": "The Shoplifter", "subtitle": "“Sometimes you spend big to win big.”", "description": "Purchase at least 15 items at the shop in a single run", "icon": "fas fa-cart-arrow-down" },
            { "name": "Perfect Time", "subtitle": "“Speed, accuracy, and efficiency.”", "description": "Get a score of at least 500 in under 2 minutes", "icon": "fas fa-stopwatch" },
            { "name": "Godlike Streak", "subtitle": "“An uninterrupted display of knowledge.”", "description": "Answer 25 questions in a row correctly", "icon": "fas fa-bolt" }
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
    } catch (error) {
        console.error("Firebase init failed:", error);
    }
};

// --- LOGIC: HOME PAGE ---
const initHome = async () => {
    if (downloadCounterRef) {
        onSnapshot(downloadCounterRef, (doc) => {
            const count = doc.exists() ? doc.data().count : 0;
            const el = document.getElementById('download-count-value');
            if(el) el.textContent = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(count);
        });
    }

    try {
        const response = await fetch('https://gist.githubusercontent.com/Fillabrona/5a17fe172177f74a4a65196ba1b53c50/raw/523059da8e38714ffd789d6c63c9e2b3f5d1d92b/downloadinfo', { cache: "no-store" });
        const data = await response.json();
        
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
        
        const updateText = data.versionInfo.substring(data.versionInfo.indexOf('--- LATEST UPDATE ---') + '--- LATEST UPDATE ---'.length).trim();
        const nextText = data.whatsNext.substring(data.whatsNext.indexOf('--- UPCOMING FEATURES ---') + '--- UPCOMING FEATURES ---'.length).trim();
        
        document.getElementById('latest-version-content').innerHTML = formatText(updateText);
        document.getElementById('whats-next-content').innerHTML = formatText(nextText, 'circle');
        
        document.getElementById('file-stats-placeholder').classList.add('hidden');
        document.getElementById('file-stats-content').classList.remove('hidden');

    } catch (e) {
        console.error("Fetch error", e);
        document.getElementById('latest-version-heading').innerHTML = 'Error Loading Data';
    }
};

const formatText = (text, iconType = 'fa-feather') => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let html = '<ul class="list-none space-y-3 pl-0">';
    lines.forEach(line => {
        if (line.startsWith('•')) {
            let iconHtml = iconType === 'circle' ? `<span class="text-link-primary text-xl mr-3 flex-shrink-0 leading-none pt-[2px]">&#9679;</span>` : `<span class="text-link-primary text-xl mr-3 flex-shrink-0 leading-none pt-0.5"><i class="fas fa-feather"></i></span>`;
            html += `<li class="flex items-start text-white/90 text-lg">${iconHtml}<span class="block">${line.substring(1)}</span></li>`;
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
            if(loader) loader.style.display = 'none';
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
                        <span class="playtime-bubble text-sm italic">Playtime: ${(r.playtimeHours || 0).toFixed(1)}h</span>
                        <button class="like-button" data-id="${r.id}" ${hasLiked ? 'disabled' : ''}>
                            <i class="fas fa-thumbs-up mr-2"></i> ${hasLiked ? 'Liked' : 'Helpful'} (${r.likes || 0})
                        </button>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', html);
        });
        if(loader) loader.style.display = 'none';
        
        document.querySelectorAll('.like-button').forEach(btn => {
            btn.addEventListener('click', () => handleLike(btn.dataset.id));
        });
    });
};

const handleLike = (id) => {
    const btn = document.querySelector(`button[data-id="${id}"]`);
    if(!btn || btn.disabled) return;
    btn.disabled = true;
    
    const likedIds = JSON.parse(localStorage.getItem(likedReviewsKey) || '[]');
    likedIds.push(id);
    localStorage.setItem(likedReviewsKey, JSON.stringify(likedIds));
    
    const likeRef = ref(rtdb, `reviews/${id}/likes`);
    rtdbRunTransaction(likeRef, (c) => (c || 0) + 1);
};

// --- LOGIC: ABOUT PAGE ---
const initAbout = () => {
    const toolsHtml = GAME_DATA.tools.map(t => `
        <div class="info-bubble tool-bubble">
            <h4><span>${t.name}</span><span class="tool-price">${t.price}</span></h4>
            <p class="bubble-description">${t.description}</p>
            <p class="tool-cooldown"><i class="fas fa-hourglass-half mr-1"></i> Cooldown: ${t.cooldown}</p>
        </div>`).join('');
    document.getElementById('tools-content').innerHTML = toolsHtml;

    let mysteryHtml = '<div class="space-y-4">';
    GAME_DATA.mysteryBox.forEach(i => {
        const rarityClass = i.rarity.includes('Super rare') ? 'super-rare' : '';
        mysteryHtml += `<div class="info-bubble reward-bubble"><h4>${i.item} <span class="reward-rarity ${rarityClass}">[${i.rarity}]</span></h4><p class="bubble-description">${i.howItWorks}</p></div>`;
    });
    document.getElementById('mystery-box-content').innerHTML = mysteryHtml + '</div>';
    
    let tripleHtml = '<div class="space-y-4">';
    GAME_DATA.luckyTriples.forEach(i => {
        tripleHtml += `<div class="info-bubble reward-bubble"><h4>${i.item} <span class="reward-rarity">[${i.chance}]</span></h4><p class="bubble-description">${i.howItWorks}</p></div>`;
    });
    document.getElementById('lucky-triples-content').innerHTML = tripleHtml + '</div>';
};

// --- LOGIC: DATABASE PAGE ---
const initDatabase = () => {
    document.getElementById('modes-content').innerHTML = GAME_DATA.modes.map(m => 
        `<div class="info-bubble mode-bubble"><h4><i class="${m.icon}"></i> ${m.name} Mode</h4><p class="bubble-description">${m.description}</p></div>`
    ).join('');

    document.getElementById('difficulties-content').innerHTML = GAME_DATA.difficulties.map(d => 
        `<div class="info-bubble difficulty-bubble"><h4>${d.name}</h4><p class="text-white/80 text-sm"><span class="difficulty-score">Score to Win:</span> ${d.score}</p><p class="bubble-description">${d.description}</p></div>`
    ).join('');
    
    document.getElementById('achievements-content').innerHTML = GAME_DATA.achievements.map(a => 
        `<div class="info-bubble achievement-bubble"><div class="achievement-header"><i class="${a.icon}"></i><h4>${a.name}</h4></div><p class="bubble-subtitle">${a.subtitle}</p><p class="bubble-description">${a.description}</p></div>`
    ).join('');
};

// --- LOGIC: CHANGELOG ---
const initChangelog = () => {
    const container = document.getElementById('changelog-content');
    let html = '';
    GAME_DATA.changelog.forEach((entry, idx) => {
        const changes = entry.changes.map((c, i) => `
            <div class="changelog-change-block p-4 sm:p-6 rounded-lg shadow-md">
                <h5 class="text-link-primary font-bold mb-1">${entry.changes.length > 1 ? `Update ${i+1}:` : 'Update:'}</h5>
                <div class="text-white/80 text-lg leading-relaxed">${c}</div>
            </div>`).join('');
        
        html += `
            <div class="changelog-entry">
                <div class="changelog-header" onclick="this.parentElement.querySelector('.changelog-content').classList.toggle('open'); this.querySelector('i').classList.toggle('rotated'); const c=this.parentElement.querySelector('.changelog-content'); c.style.maxHeight = c.classList.contains('open') ? c.scrollHeight + 50 + 'px' : '0';">
                    <span class="text-button-primary text-xl font-bold">${entry.version}</span>
                    <i class="fas fa-chevron-down text-xl"></i>
                </div>
                <div class="changelog-content" style="max-height:0;"><div class="p-4 sm:p-6 pb-8 space-y-4">${changes}</div></div>
            </div>`;
    });
    container.innerHTML = html;
};

// --- GLOBAL INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    const menuBtn = document.getElementById('menu-button');
    if(menuBtn) {
        menuBtn.addEventListener('click', () => {
            const menu = document.getElementById('nav-menu');
            const icon = document.getElementById('menu-icon');
            menu.classList.toggle('open');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    const path = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if ((path === '/' || path === '/index.html') && href === '/') {
            link.classList.add('active');
        } else if (path.includes(href) && href !== '/') {
            link.classList.add('active');
            link.querySelector('i').classList.remove('text-link-primary'); // Active icon color logic
        }
    });

    await initializeFirebase();

    if(document.getElementById('download-button')) initHome();
    if(document.getElementById('reviews-container')) initReviews();
    if(document.getElementById('tools-content')) initAbout();
    if(document.getElementById('achievements-content')) initDatabase();
    if(document.getElementById('changelog-content')) initChangelog();
});
