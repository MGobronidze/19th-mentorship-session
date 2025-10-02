// A. გლობალური ცვლადები და API კონფიგურაცია
// !!! ჩაანაცვლეთ ეს თქვენი რეალური გასაღებით
const NASA_API_KEY = 'DEMO_KEY'; // NASA-ს საცდელი გასაღები;
const APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
const SESSION_KEY = 'hasGreeted'; // sessionStorage-ის გასაღები
const LOCAL_KEY = 'apodFavorites'; // localStorage-ის გასაღები

// DOM ელემენტების აღება
const loadingIndicator = document.getElementById('loading-indicator');
const photoContainer = document.getElementById('photo-container');
const photoTitle = document.getElementById('photo-title');
const photoImage = document.getElementById('photo-image');
const photoExplanation = document.getElementById('photo-explanation');
const saveButton = document.getElementById('save-button');
const saveFeedback = document.getElementById('save-feedback');
const sessionMessage = document.getElementById('session-message');
const favoritesList = document.getElementById('favorites-list');
const favCount = document.getElementById('fav-count');
const clearFavoritesButton = document.getElementById('clear-favorites-button');
const noFavoritesMessage = document.getElementById('no-favorites-message');


// ----------------------------------------------------------------------
// 1. მონაცემების ასინქრონული მოტანა (FETCH API, ASYNC/AWAIT, PROMISES)
// ----------------------------------------------------------------------

/**
 * ასინქრონულად იღებს დღევანდელი სურათის მონაცემებს NASA APOD API-დან.
 * იყენებს async/await-ს promise-ების სამართავად.
 */
async function getDailyPhoto() {
    loadingIndicator.classList.remove('hidden'); // ჩვენება
    photoContainer.classList.add('hidden'); // დამალვა

    try {
        // fetch API აბრუნებს Promise-ს
        const response = await fetch(APOD_URL);

        // await ელოდება promise-ის შესრულებას (პასუხის მიღებას)
        if (!response.ok) {
            // შეცდომის დამუშავება
            throw new Error(`HTTP შეცდომა! სტატუსი: ${response.status}`);
        }

        // response.json() ასევე აბრუნებს Promise-ს მონაცემების გაანალიზების შემდეგ
        const data = await response.json();
        
        displayPhoto(data); // მონაცემების ჩვენება
        
    } catch (error) {
        console.error('შეცდომა APOD-ის მოძიებისას:', error);
        
        // მომხმარებლისთვის შეცდომის ჩვენება
        photoContainer.innerHTML = `<p style="color: red;">შეცდომა მონაცემების მოტანისას. გთხოვთ, შეამოწმეთ თქვენი API გასაღები ან ქსელი.</p>`;
        photoContainer.classList.remove('hidden');
        
    } finally {
        // ეს ბლოკი ყოველთვის შესრულდება, მიუხედავად try/catch შედეგისა
        loadingIndicator.classList.add('hidden');
    }
}


/**
 * მიღებული მონაცემების DOM-ში ჩვენება.
 * @param {object} data - APOD მონაცემები
 */
function displayPhoto(data) {
    if (data.media_type === 'image') {
        photoTitle.textContent = data.title;
        photoImage.src = data.url;
        photoImage.alt = data.title;
        photoExplanation.textContent = data.explanation;
        photoContainer.classList.remove('hidden');
        
        // B. setTimeout: ვაჩვენებთ უკუკავშირს 3 წამის შემდეგ
        displayDelayedFeedback();

    } else {
        // ვიდეოს შემთხვევაში (APOD შეიძლება იყოს ვიდეოც)
        photoContainer.innerHTML = `<p>დღევანდელი APOD არის ვიდეო. იხილეთ ორიგინალი ბმულზე: <a href="${data.url}" target="_blank">${data.title}</a></p>`;
        photoContainer.classList.remove('hidden');
    }
}

// ----------------------------------------------------------------------
// 2. დროის მენეჯმენტი (SET TIMEOUT)
// ----------------------------------------------------------------------

/**
 * აჩვენებს მოკლე შეტყობინებას და შემდეგ მალავს მას.
 */
function displayDelayedFeedback() {
    saveFeedback.textContent = 'გამოჩნდება შენახვის ღილაკი 5 წამში!';
    saveFeedback.classList.remove('hidden');
    saveButton.classList.add('hidden');

    // setTimeout გამოიყენება კონკრეტული დროის შემდეგ ფუნქციის შესასრულებლად
    setTimeout(() => {
        saveFeedback.classList.add('hidden');
        saveButton.classList.remove('hidden'); // ღილაკის ჩვენება დაყოვნებით
    }, 5000); // 5000 მილიწამი = 5 წამი
}


// ----------------------------------------------------------------------
// 3. მონაცემების პერსისტენტული შენახვა (LOCALSTORAGE)
// ----------------------------------------------------------------------

/**
 * ინახავს მიმდინარე სურათის მონაცემებს localStorage-ში.
 */
function saveFavorite(title, url) {
    // 1. localStorage-დან არსებული რჩეულების მასივის მოძიება
    const favoritesJSON = localStorage.getItem(LOCAL_KEY);
    // JSON.parse() - სტრიქონის ობიექტად გადაქცევა. თუ არაფერია, ვიყენებთ ცარიელ მასივს ([])
    let favorites = favoritesJSON ? JSON.parse(favoritesJSON) : [];

    // 2. დუბლიკატების შემოწმება
    const isDuplicate = favorites.some(fav => fav.title === title);
    if (isDuplicate) {
        alert('ეს სურათი უკვე არის თქვენს რჩეულებში!');
        return;
    }

    // 3. ახალი ობიექტის დამატება
    favorites.push({ title, url, date: new Date().toLocaleDateString() });

    // 4. განახლებული მასივის localStorage-ში შენახვა
    // JSON.stringify() - ობიექტის სტრიქონად გადაქცევა, რადგან localStorage მხოლოდ სტრიქონებს ინახავს.
    localStorage.setItem(LOCAL_KEY, JSON.stringify(favorites));

    alert(`'${title}' წარმატებით შეინახა!`);
    renderFavorites(); // რჩეულების სიის განახლება
}

/**
 * localStorage-დან შენახული სურათების ჩატვირთვა და ჩვენება.
 */
function renderFavorites() {
    favoritesList.innerHTML = ''; // სიის გასუფთავება
    const favoritesJSON = localStorage.getItem(LOCAL_KEY);
    const favorites = favoritesJSON ? JSON.parse(favoritesJSON) : [];
    
    favCount.textContent = favorites.length;
    
    // შეტყობინების ჩვენება/დამალვა
    if (favorites.length === 0) {
        noFavoritesMessage.classList.remove('hidden');
    } else {
        noFavoritesMessage.classList.add('hidden');
    }

    // თითოეული რჩეულისთვის HTML ელემენტის შექმნა
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

/**
 * ასუფთავებს ყველა რჩეულს localStorage-დან.
 */
function clearFavorites() {
    if (confirm('ნამდვილად გსურთ ყველა რჩეულის წაშლა?')) {
        localStorage.removeItem(LOCAL_KEY);
        renderFavorites(); // სიის განახლება
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
        sessionMessage.textContent = 'მოგესალმებით! ეს თქვენი პირველი ნახვაა ამ სესიაზე. მონაცემები სესიის დასრულებისას გაქრება.';
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
// 5. ინიციალიზაცია (EVENT LISTENERS)
// ----------------------------------------------------------------------

// ღილაკზე დაჭერის Event Listener
saveButton.addEventListener('click', () => {
    // მონაცემების აღება და შენახვის ფუნქციის გამოძახება
    const title = photoTitle.textContent;
    const url = photoImage.src;
    saveFavorite(title, url);
});

clearFavoritesButton.addEventListener('click', clearFavorites);


// გვერდის ჩატვირთვისას შესრულებადი ფუნქციები
document.addEventListener('DOMContentLoaded', () => {
    checkSessionGreeting(); // sessionStorage-ის შემოწმება
    getDailyPhoto(); // API-დან სურათის მოტანა
    renderFavorites(); // localStorage-დან რჩეულების ჩატვირთვა
});