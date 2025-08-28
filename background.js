let switching = false;
let scrollTimer = null;
let switchInterval = null;
let currentIndex = 0;

// Function to scroll the current page
function startScrolling(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            let scrollPos = 0;
            let scroller = setInterval(() => {
                window.scrollBy(0, 100); // scroll down
                scrollPos += 100;
                if (scrollPos > document.body.scrollHeight) {
                    window.scrollTo(0, 0); // loop back to top
                }
            }, 500); // scroll every 0.5 sec

            setTimeout(() => clearInterval(scroller), 60000); // stop after 1 min
        }
    });
}

// Start switching tabs
function startSwitching() {
    if (!switchInterval) {
        switchInterval = setInterval(() => {
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                if (tabs.length > 1) {
                    currentIndex = (currentIndex + 1) % tabs.length;
                    chrome.tabs.update(tabs[currentIndex].id, { active: true });
                }
            });
        }, 5000); // every 5 sec
    }
}

// Stop everything
function stopAll() {
    if (scrollTimer) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
    }
    if (switchInterval) {
        clearInterval(switchInterval);
        switchInterval = null;
    }
    switching = false;
}

// Handle idle state
chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === "idle" && !switching) {
        switching = true;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                // Step 1: Scroll active tab for 1 min
                startScrolling(tabs[0].id);
                // Step 2: After 1 min, start tab switching
                scrollTimer = setTimeout(startSwitching, 60000);
            }
        });
    } else if (newState === "active") {
        stopAll(); // user is back
    }
});

// Set idle detection threshold = 60 sec
chrome.idle.setDetectionInterval(60);
