// --- FIREBASE IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, setDoc, runTransaction, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getDatabase, ref, onValue, runTransaction as rtdbRunTransaction, query, orderByChild } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// --- FIREBASE CONFIGURATION ---
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
    apiKey: "AIzaSyC46eM54w35r48060875y203875XDUKk",
    authDomain: "fillabrona-reviews.firebaseapp.com",
    databaseURL: "https://fillabrona-reviews-default-rtdb.firebaseio.com",
    projectId: "fillabrona-reviews",
    storageBucket: "fillabrona-reviews.appspot.com",
    messagingSenderId: "14830154881",
    appId: "1:14830154881:web:44e99f0f972322588e0018",
    measurementId: "G-9Q807G7B4G"
};

// --- GLOBAL VARIABLES ---
let downloadDB, reviewDB, auth, rtdb;
let gameData = null; // Stores fetched static game data

// Custom delay function
const delay = ms => new Promise(res => setTimeout(res, ms));

// --- FIREBASE INITIALIZATION & AUTH ---
const initFirebase = async () => {
    try {
        const downloadApp = initializeApp(FIRESTORE_DOWNLOAD_CONFIG, "downloadApp");
        downloadDB = getFirestore(downloadApp);
        
        const reviewApp = initializeApp(RTDB_REVIEW_CONFIG, "reviewApp");
        reviewDB = getFirestore(reviewApp); // Using Firestore for reviews as well, if we use the same structure
        rtdb = getDatabase(reviewApp); // Use Realtime DB for review data

        // Set up Auth (Use downloadApp/Firestore instance for simplicity)
        auth = getAuth(downloadApp);
        
        // Use global variables for Firebase context
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        
        // Initialize the Canvas environment's Firebase if present
        if (Object.keys(firebaseConfig).length > 0) {
            const canvasApp = initializeApp(firebaseConfig, "canvasApp");
            // Set global auth for canvas environment, if needed for other features
            auth = getAuth(canvasApp);
        }

        // Authenticate (Use anonymous login if custom token is not provided or fails)
        if (initialAuthToken) {
            try {
                await signInWithCustomToken(auth, initialAuthToken);
            } catch (error) {
                console.error("Custom token sign-in failed, falling back to anonymous:", error);
                await signInAnonymously(auth);
            }
        } else {
             await signInAnonymously(auth);
        }

        console.log("Firebase initialized and authenticated.");
        
        // Fetch static game data immediately after auth
        await fetchGameData();

    } catch (error) {
        console.error("Error initializing Firebase or fetching game data:", error);
    }
};

const fetchGameData = async () => {
    try {
        // Path to the public, read-only game data document
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const docRef = doc(downloadDB, `artifacts/${appId}/public/data/game-data/latest`);
        
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            gameData = docSnap.data();
            console.log("Game Data fetched successfully:", gameData);
        } else {
            console.log("No game data found.");
            // Fallback: Use mock data if running outside Canvas/no data is found
            gameData = {
                changelog: [
                    { version: "1.7.1", date: "2025-11-20", changes: ["Fixed critical bug preventing question loading.", "Added 50 new 'World History' questions."] },
                    { version: "1.7.0", date: "2025-11-01", changes: ["Introduced 'Survival Mode' with new scoring mechanics.", "Major UI overhaul and performance improvements."] }
                ],
                tools: [
                    { title: "Question Generator Logic", content: "The game uses a tiered system to select questions based on player Elo rating and difficulty. Questions are pulled from a pool of 2500+ items." },
                    { title: "Survival Mode Mechanics", content: "In Survival Mode, players start with 3 lives. Correct answers grant 1 life, incorrect answers lose 1 life. Running out of time also costs a life. The goal is to survive as many rounds as possible." }
                ],
                database: {
                    totalQuestions: "2500+",
                    categories: ["Science", "History", "Literature", "Geography", "Art"],
                    rewards: [{name: "100-Round Survivor", desc: "Complete 100 rounds in Survival Mode.", bonus: "+500 Credits"}, {name: "Trivia Master", desc: "Answer 50 questions correctly in a row.", bonus: "+1,000 Credits"}],
                    difficultyModes: [{name: "Easy", desc: "Slower timer, common questions.", scoreMultiplier: "x1.0"}, {name: "Hard", desc: "Fast timer, obscure questions.", scoreMultiplier: "x2.5"}]
                }
            };
        }
    } catch (error) {
        console.error("Error fetching game data:", error);
    }
};

// --- REVIEW LOGIC ---

// Function to generate the review card HTML
const reviewTemplate = (review, id) => {
    // Determine the base URL for sharing
    const shareUrl = `${window.location.origin}/reviews/?reviewId=${id}`;

    return `
        <div id="review-${id}" class="review-card space-y-4">
            <div class="flex justify-between items-center border-b border-link-primary/30 pb-3">
                <h4 class="text-xl font-bold text-link-primary">${review.user}</h4>
                <span class="text-sm text-white/60">${review.date}</span>
            </div>
            
            <div class="review-text-bubble">
                <p class="text-white/90 text-md leading-relaxed whitespace-pre-wrap">${review.text}</p>
            </div>

            <div class="flex justify-between items-center pt-3">
                <span class="playtime-bubble text-sm italic">${review.playtime}</span>
                <div class="flex items-center space-x-3">
                    <!-- Share Button (Icon only) -->
                    <button class="share-button" data-share-url="${shareUrl}" aria-label="Share this review">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <!-- Like Button -->
                    <button class="like-button" data-review-id="${id}">
                        <i class="fas fa-thumbs-up mr-2"></i> <span id="likes-count-${id}">${review.likes || 0}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
};

// Function to populate the modal with review data
const populateModal = (review, id) => {
    const modal = document.getElementById('review-modal-backdrop');
    const modalContent = document.getElementById('review-modal-content');

    // Update content
    document.getElementById('review-modal-user').textContent = review.user;
    document.getElementById('review-modal-date').textContent = review.date;
    document.getElementById('review-modal-text').textContent = review.text;
    document.getElementById('review-modal-playtime').textContent = review.playtime;
    
    const likeButton = document.getElementById('review-modal-likes');
    likeButton.setAttribute('data-review-id', id);
    likeButton.querySelector('span').textContent = review.likes || 0;
    
    // Show modal
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalContent.classList.remove('scale-90');
    document.body.classList.add('modal-open');
};

// Function to handle showing the modal based on URL parameter
const checkUrlForReview = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reviewId = urlParams.get('reviewId');

    if (reviewId) {
        // Fetch the specific review data from RTDB
        const reviewRef = ref(rtdb, `reviews/${reviewId}`);
        onValue(reviewRef, (snapshot) => {
            const review = snapshot.val();
            if (review) {
                // Ensure the likes are updated in real-time
                const likes = review.likes || 0;
                populateModal({...review, likes: likes}, reviewId);
            } else {
                console.warn(`Review with ID ${reviewId} not found.`);
            }
        }, { onlyOnce: true });
    }
};

// Realtime update function for likes
const incrementReviewLike = async (reviewId) => {
    if (!rtdb || !reviewId) return;

    const likeRef = ref(rtdb, `reviews/${reviewId}/likes`);
    
    // Use Realtime Database Transaction to safely increment the like count
    rtdbRunTransaction(likeRef, (currentLikes) => {
        if (currentLikes === null) {
            return 1;
        }
        return currentLikes + 1;
    }).then((result) => {
        if (result.committed) {
            // Update the UI immediately for both the list and the modal
            const newLikes = result.snapshot.val();
            
            // Update the list card
            const listSpan = document.getElementById(`likes-count-${reviewId}`);
            if (listSpan) listSpan.textContent = newLikes;

            // Update the modal (if open)
            const modalBtn = document.getElementById('review-modal-likes');
            if (modalBtn && modalBtn.getAttribute('data-review-id') === reviewId) {
                 modalBtn.querySelector('span').textContent = newLikes;
            }
        }
    }).catch(error => {
        console.error("Failed to run like transaction:", error);
    });
};

// Main function to listen for reviews and handle interactions
const startReviewListener = () => {
    const reviewsLoader = document.getElementById('reviews-loader');
    const reviewsContainer = document.getElementById('reviews-container');

    if (!rtdb) {
        if (reviewsLoader) reviewsLoader.innerHTML = `<p class="text-red-400">Failed to load reviews service.</p>`;
        return;
    }

    // 1. Listen for all reviews (ordered by latest first)
    // We order by 'timestamp' which is an inverse timestamp (e.g., -Date.now()) to get descending order
    const reviewsQuery = query(ref(rtdb, 'reviews'), orderByChild('timestamp'));
    
    onValue(reviewsQuery, (snapshot) => {
        const reviewsData = snapshot.val();
        let reviewsHtml = '';
        
        if (reviewsData) {
            // Process reviews in the order returned by the query (latest first)
            Object.keys(reviewsData).forEach(id => {
                const review = reviewsData[id];
                // Since the query orders by timestamp (which is a negative number), 
                // we iterate over the keys in that order.
                reviewsHtml += reviewTemplate(review, id);
            });
        }

        if (reviewsContainer) {
            reviewsContainer.innerHTML = reviewsHtml || '<p class="text-white/60 p-6 text-center">No reviews found yet. Be the first to play and submit one!</p>';
        }

        if (reviewsLoader) reviewsLoader.style.display = 'none';

        // 2. Check for URL parameter to show modal after reviews are loaded
        checkUrlForReview();

    }, (error) => {
        console.error("Error fetching reviews from RTDB:", error);
        if (reviewsLoader) reviewsLoader.innerHTML = `<p class="text-red-400">Error loading reviews: ${error.message}</p>`;
        if (reviewsContainer) reviewsContainer.innerHTML = '';
    });
    
    // 3. Delegation for Clicks (Share and Modal-Open)
    document.body.addEventListener('click', async (e) => { // Added async
        
        // Modal Open Click (Clicking anywhere on the card opens the modal, but prioritize buttons)
        const reviewCard = e.target.closest('.review-card');
        if (reviewCard && !e.target.closest('button')) {
            e.preventDefault();
            const id = reviewCard.id.split('-')[1]; // review-123 -> 123
            if (id) {
                 const reviewRef = ref(rtdb, `reviews/${id}`);
                 // Fetch latest data for modal
                 onValue(reviewRef, (snapshot) => {
                    const review = snapshot.val();
                    if (review) {
                        populateModal(review, id);
                    }
                 }, { onlyOnce: true });
            }
            return; // Stop processing
        }

        // Like Button Click (in the list or modal)
        const likeBtn = e.target.closest('.like-button');
        if (likeBtn) {
            e.preventDefault();
            const rid = likeBtn.getAttribute('data-review-id');
            if (rid) incrementReviewLike(rid);
            return; // Stop processing
        }

        // Share Button
        const shareBtn = e.target.closest('.share-button');
        if (shareBtn) {
            e.preventDefault();
            const url = shareBtn.getAttribute('data-share-url');
            if (!url) return; // Make sure URL exists

            // Find the review content for the share sheet (only if sharing from the list view)
            const card = shareBtn.closest('.review-card') || document.getElementById('review-modal-content');
            
            let reviewText = "Check out this review!";
            let reviewUser = "A Player";

            if (card.querySelector('.review-text-bubble')) {
                reviewText = card.querySelector('.review-text-bubble p')?.textContent?.trim() || "Check out this review!";
                reviewUser = card.querySelector('h4')?.textContent?.trim() || "A Player";
            }
            
            const shareData = {
                title: `Review for Quiz for Survival by ${reviewUser}`,
                text: `Check out this review: "${reviewText.substring(0, 150)}..."`,
                url: url
            };

            // Try using the Web Share API first
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Share failed:', err);
                    }
                }
            } else {
                // Fallback to clipboard if Web Share API is not available (silent copy as requested)
                navigator.clipboard.writeText(url).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
            return; // Stop processing
        }
        
        // Modal Close Button
        const closeBtn = e.target.closest('#review-modal-close-button');
        if (closeBtn) {
            e.preventDefault();
            const modal = document.getElementById('review-modal-backdrop');
            const modalContent = document.getElementById('review-modal-content');
            
            modal.classList.add('opacity-0', 'pointer-events-none');
            modalContent.classList.add('scale-90');
            document.body.classList.remove('modal-open');
            
            // Clear the reviewId from the URL without reloading the page
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('reviewId');
            history.replaceState(null, '', newUrl.toString());
            return;
        }
    });
};

// --- STATIC PAGE POPULATION FUNCTIONS ---

const populateChangelog = (data) => {
    const container = document.getElementById('changelog-container');
    if (!container) return;

    let html = '';
    data.changelog.forEach(entry => {
        const changesList = entry.changes.map(change => `<li class="changelog-entry-item text-white/80">${change}</li>`).join('');
        html += `
            <div class="changelog-card p-6 sm:p-8 rounded-2xl shadow-lg bg-card-bg">
                <h3 class="text-3xl font-bold text-button-primary mb-2">${entry.version}</h3>
                <p class="text-sm text-white/50 mb-4">${entry.date}</p>
                <ul class="space-y-1 pl-0">
                    ${changesList}
                </ul>
            </div>
        `;
    });
    container.innerHTML = html;
    document.getElementById('changelog-loader').style.display = 'none';
};

const populateAbout = (data) => {
    const container = document.getElementById('about-tools-container');
    if (!container) return;
    
    let html = '';
    data.tools.forEach(tool => {
        html += `
            <div class="info-bubble space-y-3">
                <h4 class="text-xl font-bold text-link-primary">${tool.title}</h4>
                <p class="text-white/80">${tool.content}</p>
            </div>
        `;
    });
    container.innerHTML = html;
    document.getElementById('about-loader').style.display = 'none';
};

const populateDatabase = (data) => {
    const container = document.getElementById('database-container');
    if (!container) return;

    let html = `
        <div class="space-y-6">
            <div class="card-glass p-6 sm:p-8 rounded-2xl shadow-xl">
                <h3 class="text-2xl font-bold text-button-primary border-b border-button-primary/50 pb-3 flex items-center">
                    <i class="fas fa-chart-bar mr-3 text-2xl"></i> Key Statistics
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div class="info-bubble">
                        <h4 class="text-xl font-bold text-link-primary">Total Questions</h4>
                        <p class="text-3xl font-extrabold text-white">${data.database.totalQuestions}</p>
                    </div>
                    <div class="info-bubble">
                        <h4 class="text-xl font-bold text-link-primary">Main Categories</h4>
                        <p class="text-white/80">${data.database.categories.join(', ')}</p>
                    </div>
                </div>
            </div>

            <div class="card-glass p-6 sm:p-8 rounded-2xl shadow-xl">
                <h3 class="text-2xl font-bold text-button-primary border-b border-button-primary/50 pb-3 flex items-center">
                    <i class="fas fa-trophy mr-3 text-2xl"></i> Rewards & Achievements
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    ${data.database.rewards.map(r => `
                        <div class="info-bubble reward-bubble space-y-1">
                            <h4>${r.name}</h4>
                            <p class="bubble-description text-white/80">${r.desc}</p>
                            <span class="text-sm font-semibold text-link-primary">${r.bonus}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="card-glass p-6 sm:p-8 rounded-2xl shadow-xl">
                <h3 class="text-2xl font-bold text-button-primary border-b border-button-primary/50 pb-3 flex items-center">
                    <i class="fas fa-bolt mr-3 text-2xl"></i> Difficulty Modes
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    ${data.database.difficultyModes.map(d => `
                        <div class="info-bubble difficulty-bubble space-y-1">
                            <h4>${d.name}</h4>
                            <p class="text-white/80">${d.desc}</p>
                            <p class="text-sm">Score Multiplier: <span class="difficulty-score">${d.scoreMultiplier}</span></p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;
    document.getElementById('database-loader').style.display = 'none';
};


// --- WINDOW LOAD & MAIN EXECUTION ---
window.addEventListener('load', async () => {
    // 1. Initial Setup
    await initFirebase();
    
    // Set up navigation menu toggle for mobile
    const menuButton = document.getElementById('menu-button');
    const navMenu = document.getElementById('nav-menu');
    const menuIcon = document.getElementById('menu-icon');
    if (menuButton && navMenu && menuIcon) {
        menuButton.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            if (isActive) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            } else {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    }

    // 2. Reviews Page Logic
    if (document.getElementById('content-reviews')) {
        startReviewListener();
    }

    // 3. Static Data Pages
    if (gameData) {
        // NEW: Add artificial delay so the loading skeletons are visible
        // You can remove this for production, but it's good for demonstrating the loader
        await delay(600); 
        populateChangelog(gameData);
        populateAbout(gameData);
        populateDatabase(gameData);
    }
});
