let lastPlaceName = "";

async function fetchWikivoyagePage(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "fetchWikivoyagePage", url }, (response) => {
            if (response && response.success) {
                resolve(response.html);
            } else {
                reject(response.error || "Failed to fetch Wikivoyage page.");
            }
        });
    });
}

function extractLatLonFromGoogleMaps(url) {
    const match = url.match(/@([-0-9.]+),([-0-9.]+),([-0-9.]+)/);
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lon: parseFloat(match[2]),
            height: parseFloat(match[3])
        };
    }
    return null;
}

async function extractLatLonFromWikivoyage(wikivoyageUrl) {
    try {
        // Await the result of fetchWikivoyagePage to get the HTML content
        const html = await fetchWikivoyagePage(wikivoyageUrl);

        // Parse the HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Find the map link in the Wikivoyage page
        const mapLink = doc.querySelector('a[href*="//wikivoyage.toolforge.org/w/poimap2.php"]');

        if (mapLink) {
            const href = mapLink.getAttribute("href");
            const match = href.match(/lat=([-0-9.]+)&lon=([-0-9.]+)/);
            if (match) {
                return {
                    lat: parseFloat(match[1]),
                    lon: parseFloat(match[2]),
                };
            }
        } else {
            console.warn("Map link not found in the Wikivoyage page.");
        }
    } catch (error) {
        console.error("Error fetching or parsing Wikivoyage page:", error);
    }
    return null;
}

function areCoordinatesClose(latLonGoogle, latLonWiki) {

    // Calculate the threshold based on the height value
    //const threshold = Math.min(5, latLonGoogle.height / 10000); // Scale the threshold, max value is 5

    if (latLonGoogle.height < 9) {
        return true
    }

    if (latLonGoogle.height > 300000) {
        return true
    }

    const threshold = 3;

    const latDiff = Math.abs(latLonGoogle.lat - latLonWiki.lat);
    const lonDiff = Math.abs(latLonGoogle.lon - latLonWiki.lon);
    return latDiff <= threshold && lonDiff <= threshold;
}

/**
 * Extracts the place name from the Google Maps URL.
 * @param {string} url - The current Google Maps URL.
 * @returns {string|null} - The extracted place name or null if not found.
 */
function extractPlaceName(url) {
    const match = url.match(/place\/([^\/]+)/);
    if (match) {
        return decodeURIComponent(match[1].replace(/\+/g, " "));
    }
    return null;
}

/**
 * Fetches the corresponding Wikivoyage URL for a given place name.
 * @param {string} place - The name of the place.
 * @returns {Promise<string|null>} - The Wikivoyage URL or null if not found.
 */
async function getWikivoyageUrl(place) {
    const wikidataQueryUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(place)}&language=en&format=json&origin=*`;
    try {
        const response = await fetch(wikidataQueryUrl);
        const data = await response.json();

        const googleLatLon = await getAccurateLatLonFromUrl();

        if (data.search && data.search.length > 0) {
            for (let i = 0; i < 10; i++) {
                const wikidataId = data.search[i].id;
                const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;

                const entityResponse = await fetch(entityUrl);
                const entityData = await entityResponse.json();

                const wikivoyage = entityData.entities[wikidataId]?.sitelinks?.enwikivoyage;
                if (wikivoyage) {
                    const wikivoyageLatLon = await extractLatLonFromWikivoyage(wikivoyage.url);
                    if (areCoordinatesClose(googleLatLon, wikivoyageLatLon)) {
                        return wikivoyage.url;
                    }
                }
            }
        }

        return null;
    } catch (error) {
        console.error("Error fetching Wikidata:", error);
    }
}

function getAccurateLatLonFromUrl() {
    return new Promise((resolve) => {
        let lastUrl = window.location.href;

        // Poll the URL every 100ms until it stabilizes
        const interval = setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl === lastUrl) {
                clearInterval(interval);
                const latLon = extractLatLonFromGoogleMaps(currentUrl);
                resolve(latLon);
            } else {
                lastUrl = currentUrl;
            }
        }, 200);
    });
}

async function placeToURL(place) {

    // const googleMapsUrl = window.location.href;
    // const googleLatLon = extractLatLonFromGoogleMaps(googleMapsUrl);

    wikivoyageUrl = await getWikivoyageUrl(place.split(",")[0].trim());
    if (wikivoyageUrl) {
        return wikivoyageUrl;
    }


    var wikivoyageUrl = await getWikivoyageUrl(place);
    if (wikivoyageUrl) {
        return wikivoyageUrl;
    }

    wikivoyageUrl =  await getWikivoyageUrl(place.split(" ")[0].trim());
    if (wikivoyageUrl) {
        return wikivoyageUrl;
    }

    return null;
}

let isAddingButton = false;

async function addWikivoyageButton() {
    if (isAddingButton) {
        console.log("addWikivoyageButton is already running. Skipping...");
        return;
    }

    isAddingButton = true;

    try {
        const googleMapsUrl = window.location.href;
        const placeName = extractPlaceName(googleMapsUrl);

        if (!placeName) {
            return;
        }

        if (placeName === lastPlaceName) {
            console.log("Place name hasn't changed:", placeName);
            return;
        }

        lastPlaceName = placeName;

        const existingButton = document.querySelector(".wikivoyage-button");
        if (existingButton) {
            console.log("Wikivoyage button already exists. Skipping creation.");
            return;
        }

        const wikivoyageUrl = await placeToURL(placeName);
        if (!wikivoyageUrl) {
            console.warn("No Wikivoyage URL found for place:", placeName);
            return;
        }

        console.log("Found Wikivoyage URL:", wikivoyageUrl);

        // Create and add the button (existing code)
        const wikivoyageButton = document.createElement("button");
        wikivoyageButton.classList.add("wikivoyage-button");
        wikivoyageButton.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: transparent;
            border: none;
            padding: 5px;
            margin: 5px;
            cursor: pointer;
            border-radius: 4px;
        `;

        const buttonImage = document.createElement("img");
        buttonImage.src = chrome.runtime.getURL("/images/wiki.png");
        buttonImage.alt = "Wikivoyage";
        buttonImage.style.cssText = `
            width: 24px;
            height: 24px;
            margin-bottom: 12px;
        `;
        wikivoyageButton.appendChild(buttonImage);

        const buttonText = document.createElement("span");
        buttonText.textContent = "Wiki";
        buttonText.style.cssText = `
            font-size: 12px;
            color: #0957d0;
            text-align: center;
        `;
        wikivoyageButton.appendChild(buttonText);

        wikivoyageButton.dataset.wikivoyageUrl = wikivoyageUrl;

        wikivoyageButton.addEventListener("click", (event) => {
            const url = event.currentTarget.dataset.wikivoyageUrl;
            if (url) {
                window.open(url, "_blank");
            } else {
                alert("No Wikivoyage page found for the current place.");
            }
        });

        const shareButton = document.querySelector('[aria-label="Share"]');
        if (shareButton) {
            const shareMenuParent = shareButton.parentElement.parentElement;
            if (shareMenuParent) {
                console.log("Appending Wikivoyage button.");
                shareMenuParent.appendChild(wikivoyageButton);
            }
        } else {
            console.error("Share button not found.");
        }
    } finally {
        isAddingButton = false;
    }
}

/**
 * Ensures the Wikivoyage button is always present by observing DOM changes.
 */
function observeDomChanges() {
    const targetNode = document.body; // Replace with the correct selector for the side panel

    if (!targetNode) {
        console.error("Target node for MutationObserver not found.");
        return;
    }

    const observer = new MutationObserver(() => {
        const existingButton = document.querySelector(".wikivoyage-button");
        if (!existingButton) {
            addWikivoyageButton(); // Add the button only if it doesn't exist
        }
    });

    observer.observe(targetNode, { childList: true, subtree: true });
}
// Run the script when the page loads
window.onload = () => {
    addWikivoyageButton();
    observeDomChanges();
};
