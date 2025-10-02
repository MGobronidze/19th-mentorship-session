// === A. გლობალური კონფიგურაცია ===
// უსაფრთხოების მიზნით, ფრონტენდ პროექტებში გამოიყენება DEMO_KEY.
// DEMO_KEY-ს აქვს დაბალი მოთხოვნების ლიმიტი.
const NASA_API_KEY = 'DEMO_KEY'; 
const BASE_APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
const SESSION_KEY = 'hasGreeted'; // sessionStorage-ის გასაღები სესიის მისალმებისთვის
const LOCAL_KEY = 'apodFavorites'; // localStorage-ის გასაღები რჩეულების შესანახად

// === B. DOM ელემენტების აღება ===
const loadingIndicator = document.getElementById('loading-indicator');
const photoContainer = document.getElementById('photo-container');
const photoTitle = document.getElementById('photo-title');
const photoImage = document.getElementById('photo-image');
const photoExplanation = document.getElementById('photo-explanation');
const saveButton = document.getElementById('save-button');
const delayedInfo = document.getElementById('delayed-info'); // setTimeout ფიდბექი
const sessionMessage = document.getElementById('session-message');
const favoritesList = document.getElementById('favorites-list');
const favCount = document.getElementById('fav-count');
const clearFavoritesButton = document.getElementById('clear-favorites-button');
const noFavoritesMessage = document.getElementById('no-favorites-message');
const dateInput = document.getElementById('apod-date');
const searchButton = document.getElementById('search-button');
const errorMessage = document.getElementById('error-message');


// ----------------------------------------------------------------------
// 1. მონაცემების ასინქრონული მოტანა (FETCH API, ASYNC/AWAIT, PROMISES)
// ----------------------------------------------------------------------

/**
 * ასინქრონულად იღებს APOD მონაცემებს.
 * იყენებს async/await-ს promise-ების სამართავად.
 * @param {string|null} date - თარიღი YYYY-MM-DD ფორმატში.
 */
async function getDailyPhoto(date = null) {
    loadingIndicator.classList.remove('hidden');
    photoContainer.classList.add('hidden');
    errorMessage.classList.add('hidden'); 
    
    let requestUrl = BASE_APOD_URL; 

    // თუ თარიღი მოწოდებულია, ვამატებთ მას URL-ს
    if (date) {
        requestUrl = `${BASE_APOD_URL}&date=${date}`;
    }

    try {
        // 1. fetch API ზარი, რომელიც აბრუნებს Promise-ს
        const response = await fetch(requestUrl); 

        if (!response.ok) {
            // თუ პასუხი არ არის OK (მაგალითად, 400 Bad Request)
            const errorData = await response.json();
            // ვყრით შეცდომას, რომ try...catch-მა დაიჭიროს
            throw new Error(errorData.msg || `HTTP შეცდომა! სტატუსი: ${response.status}`);
        }

        // 2. response.json() ასევე აბრუნებს Promise-ს
        const data = await response.json();
        
        displayPhoto(data); // მონაცემების ჩვენება
        
    } catch (error) {
        // შეცდომის დამუშავება (მაგ. ქსელის შეცდომა ან API შეცდომა)
        console.error('შეცდომა APOD-ის მოძიებისას:', error);
        errorMessage.textContent = `მონაცემების მოტანა ვერ მოხერხდა: ${error.message}`;
        errorMessage.classList.remove('hidden');
        
    } finally {
        // ეს ყოველთვის შესრულდება ჩატვირთვის ინდიკატორის დასამალად
        loadingIndicator.classList.add('hidden');
    }
}

/**
 * მიღებული მონაცემების DOM-ში ჩვენება.
 */
function displayPhoto(data) {
    if (data.media_type === 'image') {
        photoTitle.textContent = data.title;
        photoImage.src = data.url;
        photoImage.alt = data.title;
        photoExplanation.textContent = data.explanation;
        photoContainer.classList.remove('hidden');
        
        // setTimeout-ის გამოყენება
        displayDelayedFeedback();

    } else {
        // ვიდეოს შემთხვევაში
        photoContainer.innerHTML = `<p><strong>${data.title}</strong><br>დღევანდელი APOD არის ვიდეო. იხილეთ ორიგინალი ბმულზე: <a href="${data.url}" target="_blank">${data.url}</a></p><p>${data.explanation}</p>`;
        photoContainer.classList.remove('hidden');
        // ვიდეოს შემთხვევაში ღილაკის დამალვა
        saveButton.classList.add('hidden');
        delayedInfo.classList.add('hidden');
    }
}


// ----------------------------------------------------------------------
// 2. დროის მენეჯმენტი (SET TIMEOUT)
// ----------------------------------------------------------------------

/**
 * აჩვენებს ფიდბექს 3 წამით და შემდეგ მალავს მას, ავლენს შენახვის ღილაკს.
 */
function displayDelayedFeedback() {
    delayedInfo.textContent = 'რჩეულებში შენახვის ღილაკი გამოჩნდება 3 წამში...';
    delayedInfo.classList.remove('hidden');
    saveButton.classList.add('hidden');

    // setTimeout გამოიყენება ფუნქციის შესრულების დაგვიანებისთვის
    setTimeout(() => {
        delayedInfo.classList.add('hidden');
        saveButton.classList.remove('hidden'); // ღილაკის ჩვენება
    }, 3000); // 3000 მილიწამი = 3 წამი
}


// ----------------------------------------------------------------------
// 3. მონაცემების პერსისტენტული შენახვა (LOCALSTORAGE)
// ----------------------------------------------------------------------

/**
 * ინახავს მიმდინარე სურათის მონაცემებს localStorage-ში.
 */
function saveFavorite(title, url) {
    // 1. არსებული მონაცემების მოტანა (JSON-ის სტრიქონი)
    const favoritesJSON = localStorage.getItem(LOCAL_KEY);
    // JSON.parse() - სტრიქონის JS ობიექტად/მასივად გადაქცევა
    let favorites = favoritesJSON ? JSON.parse(favoritesJSON) : [];

    // 2. დუბლიკატების შემოწმება
    const isDuplicate = favorites.some(fav => fav.title === title);
    if (isDuplicate) {
        alert('ეს სურათი უკვე შეინახეთ.');
        return;
    }

    // 3. ახალი ობიექტის დამატება
    favorites.push({ title, url, date: new Date().toLocaleDateString() });

    // 4. განახლებული მასივის შენახვა (JSON.stringify() - ობიექტის სტრიქონად გადაქცევა)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(favorites));

    alert(`'${title}' წარმატებით შეინახა!`);
    renderFavorites(); // რჩეულების სიის განახლება
}

/**
 * localStorage-დან შენახული სურათების ჩატვირთვა და ჩვენება.
 */
function renderFavorites() {
    favoritesList.innerHTML = ''; 
    const favoritesJSON = localStorage.getItem(LOCAL_KEY);
    const favorites = favoritesJSON ? JSON.parse(favoritesJSON) : [];
    
    favCount.textContent = favorites.length;
    
    if (favorites.length === 0) {
        noFavoritesMessage.classList.remove('hidden');
    } else {
        noFavoritesMessage.classList.add('hidden');
        
        favorites.forEach(fav => {
            const item = document.createElement('div');
            item.className = 'fav-item';
            item.innerHTML = `
                <h4>${fav.title}</h4>
                <p>შენახულია: ${fav.date}</p>
                <a href="${fav.url}" target="_blank">სურათის ნახვა</a>
            `;
            favoritesList.appendChild(item);
        });
    }
}

/**
 * ასუფთავებს ყველა რჩეულს localStorage-დან.
 */
function clearFavorites() {
    if (confirm('ნამდვილად გსურთ ყველა რჩეულის წაშლა?')) {
        localStorage.removeItem(LOCAL_KEY);
        renderFavorites();
    }
}


// ----------------------------------------------------------------------
// 4. სესიის მართვა (SESSIONSTORAGE)
// ----------------------------------------------------------------------

/**
 * ამოწმებს, ნანახი აქვს თუ არა მომხმარებელს მისალმება მიმდინარე სესიაზე.
 */
function checkSessionGreeting() {
    // sessionStorage-ს შენახული ინფორმაცია იკარგება ბრაუზერის/ტაბის დახურვისას.
    const hasGreeted = sessionStorage.getItem(SESSION_KEY);

    if (!hasGreeted) {
        // თუ პირველი ნახვაა ამ სესიაზე
        sessionMessage.textContent = 'მოგესალმებით! ეს სესიის მისალმებაა. ის გაქრება ბრაუზერის დახურვისას.';
        sessionMessage.classList.remove('hidden');

        // ვინახავთ მონაცემს, რომ მომხმარებელს უკვე მივესალმეთ
        sessionStorage.setItem(SESSION_KEY, 'true');

        // ვაჩვენებთ შეტყობინებას 7 წამის განმავლობაში
        setTimeout(() => {
            sessionMessage.classList.add('hidden');
        }, 7000);
    }
}


// ----------------------------------------------------------------------
// 5. ინიციალიზაცია და Event Listeners
// ----------------------------------------------------------------------

// რჩეულებში შენახვის ლოგიკა
saveButton.addEventListener('click', () => {
    const title = photoTitle.textContent;
    const url = photoImage.src;
    saveFavorite(title, url);
});

// რჩეულების გასუფთავების ლოგიკა
clearFavoritesButton.addEventListener('click', clearFavorites);

// თარიღის მიხედვით ძებნის ლოგიკა
searchButton.addEventListener('click', () => {
    const selectedDate = dateInput.value;
    
    if (selectedDate) {
        getDailyPhoto(selectedDate);
    } else {
        errorMessage.textContent = 'გთხოვთ, აირჩიოთ თარიღი.';
        errorMessage.classList.remove('hidden');
    }
});


// გვერდის ჩატვირთვისას შესრულებადი ფუნქციები
document.addEventListener('DOMContentLoaded', () => {
    // 1. ვაყენებთ მაქსიმალურ თარიღს დღევანდელზე
    const today = new Date().toISOString().split('T')[0];
    dateInput.max = today;
    
    // 2. ვამოწმებთ სესიას (sessionStorage)
    checkSessionGreeting(); 
    
    // 3. ვტვირთავთ დღევანდელ სურათს (fetch, async/await)
    getDailyPhoto(); 
    
    // 4. ვტვირთავთ რჩეულებს (localStorage)
    renderFavorites(); 
});
