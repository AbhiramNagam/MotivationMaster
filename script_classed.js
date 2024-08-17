// All about the fetching and storing of the image and quote from the server and updating the UI.
class FetchAndUpdate_quote_image{
    constructor(url) {
        this.url = 'https://api-motivationmaster.spokeneagle.com/extension/everyday.json';
        this.dateSet = new Set(JSON.parse(localStorage.getItem('dateSet')));

        let dateObj=new Date();

        let date=dateObj.getDate().toString();
        // Add 0 at the beginning if the date is single digit
        date = date < 10 ? '0' + date : date;

        let month=(dateObj.getMonth()+1).toString();  // +1 is because in js, months are indexed from 0 to 11
        // Add 0 at the beginning if the month is single digit
        month = month < 10 ? '0' + month : month;

        let year=dateObj.getFullYear().toString();
        this.currentDate = date + "-" + month + "-" + year;
        console.log("var -->",this.currentDate);
    }

    // Function to fetch image and convert it to Base64
    fetchImageAndStore(url){
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => response.blob()) // Get the image as a Blob
                .then(blob => {
                    // Create a FileReader to convert the Blob into a Base64 string
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        // Get the Base64 string
                        const base64String = reader.result;

                        // Store the Base64 string in localStorage
                        localStorage.setItem('image_', base64String);

                        // Resolve the promise
                        resolve();
                    };
                    reader.readAsDataURL(blob); // Convert the Blob to Base64
                })
                .catch(error => {
                    console.error('Error fetching and storing image:', error);

                    // Reject the promise
                    reject(error);
                });
        });
    }


    // Function to set the background of body from the image in localStorage
    setBackgroundImageOfBody() {
        // Retrieve the Base64 image string from localStorage
        const base64String = localStorage.getItem('image_');

        if (base64String) {
            // Set the background image of the body
            document.body.style.backgroundImage = `url('${base64String}')`;
            document.body.style.backgroundSize = 'cover'; // Cover the entire body
            // document.body.style.backgroundPosition = 'center'; // Center the background image
        } else {
            console.error('No image found in localStorage');
        }
    }

    fetchDataAndStore(url){
        // Get the current timestamp
        let timestamp = Date.now();

        // Append the timestamp to the URL to prevent caching
        url += `?timestamp=${timestamp}`;
        console.log(url);

        // Return a new promise
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    const quote = data.quote;
                    const author = data.author;
                    const imageLink = data.image;

                    // Add quote and author to localStorage
                    localStorage.setItem('quote_', quote);
                    localStorage.setItem('author_',author);

                    console.log('Fetched from API');
                    console.log(quote);
                    console.log(author);
                    console.log(imageLink);
                    console.log("--------------------");
                    this.fetchImageAndStore(imageLink)
                        .then(() => {
                            console.log('Image fetched and stored');

                            // Resolve the promise
                            resolve();
                        })
                        .catch(error => {
                            console.error('Error fetching and storing image:', error);

                            // Reject the promise
                            reject(error);
                        });

                })
                .catch(error => {
                    console.error('Error fetching and storing data:', error);

                    // Reject the promise
                    reject(error);
                });
        });
    }

    updateQuoteAndImage(){
        document.getElementById('quote').innerHTML = localStorage.getItem('quote_');
        document.getElementById('author').innerHTML=localStorage.getItem('author_');

        this.setBackgroundImageOfBody();

        console.log(this.calculateLocalStorageUsage() + " MB");
    }


    calculateLocalStorageUsage() {
        let total = 0;
        for(let x in localStorage) {
            let amount = (localStorage[x].length * 2) / 1024 / 1024; // x's length in bytes, convert to MB
            if (!isNaN(amount) && localStorage.hasOwnProperty(x)) {
                total += amount;
            }
        }
        return total.toFixed(2);
    }


    runEveryTime() {
        // Check if the date is in the set
        if (this.dateSet.has(this.currentDate)) {
            console.log('present');
            this.updateQuoteAndImage();
        }
        else {
            let dateSetSize = this.dateSet.size;
            if(dateSetSize === 0){
                console.log("First time");

                // to show the fetching image only for the first time
                document.getElementById('fetchingImage').style.display = 'block';

                // to show the fetching quote only for the first time
                document.getElementById('quote').innerHTML = 'Fetching quote from server...';

                // Hide the search bar and shortcuts for the first time
                document.querySelector('.searchStuff').style.visibility = 'hidden';
                document.querySelector('.shortcutsDiv').style.visibility = 'hidden';

            }
            else {
                // to have the previous day's image and quote until the new one is fetched.
                this.updateQuoteAndImage();
            }
            console.log('not present');
            this.fetchDataAndStore(this.url)
                .then(() => {
                    if(dateSetSize === 0){
                        document.getElementById('fetchingImage').style.display = 'none';

                        document.querySelector('.searchStuff').style.visibility = 'visible';
                        document.querySelector('.shortcutsDiv').style.visibility = 'visible';
                    }
                    // else it will always be 'none' (in css)

                    // Call the updateQuoteAndImage() function after the new data is stored in the local storage.
                    this.updateQuoteAndImage();

                    // Add the current date to the set.
                    this.dateSet.add(this.currentDate);

                    // Store the updated dateSet in the local storage.
                    localStorage.setItem('dateSet', JSON.stringify(Array.from(this.dateSet)));
                })
                .catch(error => {
                    console.error('Error fetching and storing data:', error);
                });
        }
    }
}


// ========================================================================================================


// All about Container, SearchBar and recent searches.
class SearchBar {
    constructor() {
        this.searchBar = document.querySelector('.search-input');
        this.recentSearches = document.getElementById('recent-searches');
        this.searchHistoryKey = 'searchHistory';
        this.maxSearches = 5;

        this.addEventListeners();

        // this is necessary for the go-button to work
        this.searchForm=document.getElementById('search-form');

        this.currentSuggestionIndex=-1;

    }

    addEventListeners() {
        document.addEventListener('keydown',(event)=>{
            if(event.key==='/'){
                if(document.activeElement!==this.searchBar){
                    event.preventDefault();
                    this.searchBar.focus();
                }
            }
            else if(event.key==='Escape'){
                if (this.recentSearches.style.display === 'block') {
                    event.preventDefault();
                    this.hideSuggestions();
                }
                else if (document.activeElement === this.searchBar) {
                    event.preventDefault();
                    this.searchBar.blur();
                }
            }
            else if(event.key==='ArrowDown' || event.key==='ArrowUp'){
                const suggestions = Array.from(this.recentSearches.children);
                if (suggestions.length > 0) {
                    if (event.key === 'ArrowDown' && this.recentSearches.style.display === 'block') {
                        event.preventDefault();
                        if (this.currentSuggestionIndex >= 0 && this.currentSuggestionIndex < suggestions.length) {
                            suggestions[this.currentSuggestionIndex].classList.remove('selected');
                        }
                        this.currentSuggestionIndex = (this.currentSuggestionIndex + 1) % suggestions.length;
                        suggestions[this.currentSuggestionIndex].classList.add('selected');

                        // Update the value of the search bar to the text content of the currently selected suggestion
                        // Exclude the delete button text
                        this.searchBar.value = suggestions[this.currentSuggestionIndex].firstChild.textContent.trim();
                    }
                    else if (event.key === 'ArrowUp' && this.recentSearches.style.display === 'block') {
                        event.preventDefault();
                        if (this.currentSuggestionIndex >= 0 && this.currentSuggestionIndex < suggestions.length) {
                            suggestions[this.currentSuggestionIndex].classList.remove('selected');
                        }
                        this.currentSuggestionIndex = (this.currentSuggestionIndex - 1 + suggestions.length) % suggestions.length;
                        suggestions[this.currentSuggestionIndex].classList.add('selected');

                        // Update the value of the search bar to the text content of the currently selected suggestion
                        // Exclude the delete button text
                        this.searchBar.value = suggestions[this.currentSuggestionIndex].firstChild.textContent.trim();
                    }
                }
            }
        });

        this.searchBar.addEventListener('input', () => {
            this.loadSearches();
            this.recentSearches.style.display = 'block';
        });

        this.searchBar.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if(this.searchBar.value.trim()!==''){
                    this.performSearch(this.searchBar.value);
                    this.searchForm.submit();
                }
            }
        });

        this.searchBar.addEventListener('focus', () => {
            this.loadSearches();
            this.recentSearches.style.display = 'block';
        });

        document.addEventListener('mousedown', (event) => {
            const searchBarAndSuggestions = document.querySelector('.searchBarAndSuggestions');
            if (!searchBarAndSuggestions.contains(event.target)) {
                this.hideSuggestions();
            }
        });

        const goButton = document.getElementById('go-button');
        goButton.addEventListener('click', (event) => {
            event.preventDefault();
            if(this.searchBar.value.trim() === ''){
                return;
            }
            this.performSearch(this.searchBar.value);
            this.searchForm.submit();
        });

        //  to show recent searches when search bar is clicked (even after the search bar is focused)
        this.searchBar.addEventListener('click', () => {
            if (this.recentSearches.style.display !== 'block') {
                this.loadSearches();
                this.recentSearches.style.display = 'block';
            }
        });

        // Add a mouseover event listener to the suggestions div
        this.recentSearches.addEventListener('mouseover', (event) => {
            // Get the closest .search-item to the event.target
            const item = event.target.closest('.search-item');

            if (item) {
                // Get the index of the hovered suggestion
                const hoveredSuggestionIndex = Array.from(this.recentSearches.children).indexOf(item);

                // Set the current suggestion index to the index of the hovered suggestion
                this.currentSuggestionIndex = hoveredSuggestionIndex;

                // Remove the 'selected' class from all suggestions
                const suggestions = Array.from(this.recentSearches.children);
                suggestions.forEach(suggestion => suggestion.classList.remove('selected'));

                // Add the 'selected' class to the hovered suggestion
                item.classList.add('selected');
            }
        });


        // Add a mouseout event listener to each suggestion
        this.recentSearches.addEventListener('mouseout', (event) => {
            if (event.target.classList.contains('search-item')) {
                // Remove the 'selected' class from the suggestion
                event.target.classList.remove('selected');
            }
        });
    }

    performSearch(searchText) {
        searchText= searchText.trim();
        if (!searchText) return;
        this.addSearchToHistory(searchText);

    }
    addSearchToHistory(searchText) {
        const searches = this.getSearchHistory();
        const searchIndex = searches.indexOf(searchText);
        if (searchIndex !== -1) {
            // If the search text already exists in the search history, remove it
            searches.splice(searchIndex, 1);
        }
        // Add the search text to the beginning of the search history
        searches.unshift(searchText);
        // if (searches.length > this.maxSearches) searches.pop();
        localStorage.setItem(this.searchHistoryKey, JSON.stringify(searches));
    }
    getSearchHistory() {
        return JSON.parse(localStorage.getItem(this.searchHistoryKey)) || [];
    }

    getSuggestions(input) {
        const searches = this.getSearchHistory();
        if (!input) return searches.slice(0, 5);
        return searches.filter(search => search.toLowerCase().includes(input.toLowerCase())).slice(0, 5);
    }

    loadSearches() {
        this.recentSearches.innerHTML = '';
        const input = this.searchBar.value.toLowerCase();
        const suggestions = this.getSuggestions(input);

        // add changeCurvature class to searchBar so it's curvatures at bottom changes
        if(suggestions.length>0){
            this.searchBar.classList.add('changeCurvature');
            console.log('changeCurvature added');
        }
        else{
            this.searchBar.classList.remove('changeCurvature');
            console.log('changeCurvature removed');
        }

        suggestions.forEach((search, index) => {
            const item = this.createSearchItem(search, index);
            if (!search.toLowerCase().includes(input)) {
                item.classList.add('unmatched');
            }
            this.recentSearches.appendChild(item);
        });
        if (suggestions.length > 0) {
            // Initially set the max-height of the suggestions div to 0
            this.recentSearches.style.maxHeight = '0';
            // Display the suggestions div
            this.recentSearches.style.display = 'block';
            // Animate the max-height of the suggestions div to its scroll height
            setTimeout(() => {
                this.recentSearches.style.maxHeight = this.recentSearches.scrollHeight + 'px';
            }, 0);
        }


    }
    createSearchItem(search, index) {
        const item = document.createElement('div');
        item.className = 'search-item';

        const textContainer = document.createElement('div');
        textContainer.style.flexGrow = '1';

        const input = this.searchBar.value.toLowerCase();
        const searchLower = search.toLowerCase();

        if (searchLower.includes(input)) {
            // Split the search text into the matched and unmatched parts
            const start = searchLower.indexOf(input);
            const end = start + input.length;
            const matchedPart = search.substring(start, end);
            const beforeMatch = search.substring(0, start);
            const afterMatch = search.substring(end);

            // Create spans for the matched and unmatched parts
            const beforeMatchSpan = document.createElement('span');
            beforeMatchSpan.className = 'unmatched';
            beforeMatchSpan.textContent = beforeMatch;

            const matchedSpan = document.createElement('span');
            matchedSpan.className = 'matched';
            matchedSpan.textContent = matchedPart;

            const afterMatchSpan = document.createElement('span');
            afterMatchSpan.className = 'unmatched';
            afterMatchSpan.textContent = afterMatch;

            // Create a temporary container and add the unmatched and matched parts to it
            const tempContainer = document.createElement('div');
            tempContainer.appendChild(beforeMatchSpan);
            tempContainer.appendChild(matchedSpan);
            tempContainer.appendChild(afterMatchSpan);

            // Set the innerHTML of the textContainer to the innerHTML of the temporary container
            textContainer.innerHTML = tempContainer.innerHTML;
        } else {
            textContainer.textContent = search;
        }

        item.appendChild(textContainer);

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            this.deleteSearch(index);
        });

        item.appendChild(deleteBtn);
        item.addEventListener('click', (event) => {
            console.log('Click event triggered on search item:', search); // Add this line
            event.stopPropagation(); // Stop the propagation of the click event
            console.log("Search item clicked:",search)
            this.searchBar.value = search;
            // this.performSearch(search);

            this.currentSuggestionIndex = index;
            // to point the cursor on search-bar after selecting one of suggestions
            this.searchBar.focus();
        });

        // console.log('Event listener added to search item:', search);
        return item;
    }
    deleteSearch(index) {
        const searches = this.getSearchHistory();
        searches.splice(index, 1);
        localStorage.setItem(this.searchHistoryKey, JSON.stringify(searches));
        this.loadSearches();

        // Update the max-height of the suggestions div to its new scroll height
        this.recentSearches.style.maxHeight = this.recentSearches.scrollHeight + 'px';
    }
    hideSuggestions() {
        // Animate the max-height of the suggestions div to 0
        this.recentSearches.style.maxHeight = '0';

        setTimeout(() => {
            this.recentSearches.style.display = 'none';
            this.currentSuggestionIndex = -1;

            // Reset the max-height of the suggestions div after it's hidden
            this.recentSearches.style.maxHeight = '';

            // to make the search bar's corners to curve
            this.searchBar.classList.remove('changeCurvature');
            console.log('changeCurvature removed');
        }, 150);
    }
}


// ========================================================================================================


// All about the shortcuts
class Shortcuts {
    constructor() {
        this.shortcutsDiv = document.querySelector('.shortcutsDiv');
        this.addShortcutButton = document.createElement('button');
        this.addShortcutButton.textContent = 'Add Shortcut';
        this.addShortcutButton.classList.add('add-shortcut-button');
        this.addShortcutButton.innerHTML = `
            <div class="shortcut">
                <a href="#">
                    <img src="icons/add_icon_128.png" alt="add-shortcut" class="add-shortcut-icon">
                    Add Shortcut
                </a>
            </div>
        `;

        // Load shortcuts from localStorage or initialize with default shortcuts
        this.shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [
            { name: 'Google', url: 'https://www.google.com' },
            { name: 'Gmail', url: 'https://mail.google.com/' },
            { name: 'YouTube', url: 'https://www.youtube.com' },
            { name: 'Twitter', url: 'https://www.twitter.com' }
        ];

        this.initEventListeners();

        if(navigator.onLine){
            this.renderShortcuts();
        }
        else{
            this.renderShortcuts(true);
        }
    }

    saveShortcuts() {
        localStorage.setItem('shortcuts', JSON.stringify(this.shortcuts));
    }

    initEventListeners() {
        this.shortcutsDiv.addEventListener('click', (event) => {
            const anchor = event.target.closest('a');
            if (anchor && !event.target.classList.contains('ellipsis-icon')) {
                event.preventDefault();
                event.stopPropagation();
                const url = anchor.getAttribute('data-url');
                chrome.tabs.update({url: url});
            }
        });

        // adding new shortcut
        this.addShortcutButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.saveShortcut(null, true);
        });

        this.shortcutsDiv.addEventListener('click', (event) => {
            if (event.target.classList.contains('ellipsis-icon')) {
                const dropdownMenu = event.target.nextElementSibling;
                dropdownMenu.classList.toggle('show');
            } else if (event.target.classList.contains('edit-shortcut')) {
                const index = parseInt(event.target.closest('.shortcut').getAttribute('data-index'));
                this.saveShortcut(index, false);
            } else if (event.target.classList.contains('delete-shortcut')) {
                const index = parseInt(event.target.closest('.shortcut').getAttribute('data-index'));
                this.deleteShortcut(index);
            }
        });

        document.addEventListener('click', (event) => {
            if (!event.target.matches('.ellipsis-icon')) {
                const dropdownMenus = document.querySelectorAll('.dropdown-menu');
                dropdownMenus.forEach(menu => menu.classList.remove('show'));
            }
        });
    }

    async renderShortcuts(isOfflineForSure = false) {
        console.log(isOfflineForSure);
        this.shortcutsDiv.innerHTML = '';
        const cache = await caches.open('favicons');

        for (const shortcut of this.shortcuts) {
            const shortcutElement = document.createElement('div');
            shortcutElement.classList.add('shortcut');
            shortcutElement.setAttribute('data-index', this.shortcuts.indexOf(shortcut));

            // Example shortcut.url : https://127.0.0.1/users/

            const urlWithoutProtocol = shortcut.url.replace(/(^\w+:|^)\/\//, '');
            // Example urlWithoutProtocol : 127.0.0.1/users/

            const isIpAddress = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/.*)?$/i.test(urlWithoutProtocol);
            // Example isIpAddress : true

            const isPrivateIp = (ip) => {
                const parts = ip.split('.').map(Number);
                return (
                    (parts[0] === 10) ||
                    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
                    (parts[0] === 192 && parts[1] === 168) ||
                    // Handling Non-Standard Private IP Ranges
                    (parts[0] === 191 && parts[1] === 168)
                );
            };

            console.log("navigator ", navigator.onLine);
            let faviconUrl;
            if (isIpAddress) {
                const ipMatch = urlWithoutProtocol.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                const ipAddress = ipMatch[0];
                // Example ipMatch[0] : 127.0.0.1
                faviconUrl = isPrivateIp(ipAddress) ? `${shortcut.url}/favicon.ico` : `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(urlWithoutProtocol)}`;
            } else {
                faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(urlWithoutProtocol)}`;
            }

            // special case for Gmail
            if (shortcut.url.includes("mail.google.com")){
                faviconUrl="https://mail.google.com/favicon.ico";
            }

            shortcutElement.innerHTML = `
            <a href="#" data-url="${shortcut.url}">
                <span class="default-favicon"><img src="icons/globe-32.png"></span>
                <span>${shortcut.name}</span>
            </a>
            <div class="shortcut-actions"> 
                <span class="ellipsis-icon">&#8942;</span>
                <div class="dropdown-menu"> 
                    <div class="dropdown-item edit-shortcut">Edit</div>
                    <div class="dropdown-item delete-shortcut">Delete</div>
                </div>
            </div>
        `;

            // Check if the favicon is in cache
            const match = await cache.match(faviconUrl);
            if (match) {
                console.log(`Favicon found in cache for ${shortcut.name}`);
                faviconUrl = URL.createObjectURL(await match.blob());
                shortcutElement.querySelector('.default-favicon').style.display = 'none';
                shortcutElement.querySelector('a').insertAdjacentHTML('afterbegin', `<img src="${faviconUrl}" alt="${shortcut.name} favicon">`);
                this.shortcutsDiv.appendChild(shortcutElement);
            }
            else {
                console.log(`Favicon not found in cache for ${shortcut.name}`);
                // important line
                // Show the loading symbol
                shortcutElement.querySelector('.default-favicon').innerHTML = '🔄';
                shortcutElement.querySelector('.default-favicon').classList.add('loading-emoji');

                this.shortcutsDiv.appendChild(shortcutElement);

                if(isOfflineForSure){
                    continue;
                }
                let fileNotFound = false;
                try {
                    const response = await fetch(faviconUrl);
                    if (!response.ok) {
                        console.log("Log: response was not ok","favicon url : ",faviconUrl);
                        if (response.status === 404) {
                            fileNotFound = true;
                            console.log('File not found');
                        } else {
                            console.log('Other error');
                        }
                        // It executes when the URL is wrong/doesn't exist/File not found
                        throw new Error('Network response was not ok');
                    }
                    else{
                        console.log("Log: response was ok");
                        await cache.put(faviconUrl, response.clone());
                        faviconUrl = URL.createObjectURL(await response.blob());
                        shortcutElement.querySelector('.default-favicon').style.display = 'none';

                        // Just for this function call, and from next call it will take image from cache.
                        shortcutElement.querySelector('a').insertAdjacentHTML('afterbegin', `<img src="${faviconUrl}" alt="${shortcut.name} favicon">`);
                    }
                }
                catch (error) {
                    console.log('catch!');
                    // error.message of ERR_CONNECTION_TIMED_OUT is 'Failed to fetch'
                    if (fileNotFound || error.message === 'Failed to fetch') {
                        try {
                            const globeIcon='icons/globe-32.png';
                            const response = await fetch(globeIcon);
                            if (!response.ok) throw new Error('File response was not ok');
                            const blob = await response.blob();
                            await cache.put(faviconUrl, new Response(blob, { headers: { 'Content-Type': 'image/png' } }));
                            faviconUrl = URL.createObjectURL(blob);
                            shortcutElement.querySelector('.default-favicon').style.display = 'none';
                            shortcutElement.querySelector('a').insertAdjacentHTML('afterbegin', `<img src="${globeIcon}" alt="${shortcut.name} favicon">`);
                        } catch (error) {
                            console.error('Failed to fetch and cache the icon:', error);
                        }
                    }
                }
            }
        }

        if (this.shortcuts.length < 10) {
            this.shortcutsDiv.appendChild(this.addShortcutButton);
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async saveShortcut(shortcutIndex, isNew) {
        let name;
        let url;

        if (isNew) {
            if (this.shortcuts.length >= 10) {
                alert('Maximum limit of 10 shortcuts reached.');
                return;
            }

            name = prompt('Enter the shortcut name:');
            if (name === null || !name) {
                alert('Name cannot be empty');
                return;
            }

            url = prompt('Enter the shortcut URL:');
            if (url === null || !url) {
                alert('URL cannot be empty');
                return;
            }
        }
        else {
            name = prompt('Enter the new shortcut name:', this.shortcuts[shortcutIndex].name);
            if (name === null || !name) {
                alert('Name cannot be empty');
                return;
            }

            url = prompt('Enter the new shortcut URL:', this.shortcuts[shortcutIndex].url);
            if (url === null || !url) {
                alert('URL cannot be empty');
                return;
            }
        }

        if (!url.includes('://')) {
            url = 'https://' + url;
        }

        if(!this.isValidUrl(url)){
            alert('Please enter a valid URL.');
            return;
        }

        if (isNew) {
            this.shortcuts.push({ name, url });
        } else {
            this.shortcuts[shortcutIndex].name = name;
            this.shortcuts[shortcutIndex].url = url;
        }

        this.saveShortcuts();

        // Update the favicons asynchronously
        if (navigator.onLine) {
            await this.renderShortcuts();
        }
        else{
            await this.renderShortcuts(true);
        }
    }

    async deleteShortcut(index) {
        const shortcut = this.shortcuts[index];
        this.shortcuts.splice(index, 1);
        this.saveShortcuts();

        // Delete the favicon from the cache
        const cache = await caches.open('favicons');
        const urlWithoutProtocol = shortcut.url.replace(/(^\w+:|^)\/\//, '');
        const isIpAddress = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/.*)?$/i.test(urlWithoutProtocol);
        let faviconUrl = isIpAddress ? `${shortcut.url}/favicon.ico` : `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(urlWithoutProtocol)}`;

        console.log(`Attempting to delete favicon: ${faviconUrl}`);

        const cachedRequests = await cache.keys();
        console.log('Cached Requests:', cachedRequests.map(request => request.url));

        const normalizeUrl = (url) => {
            const urlObj = new URL(url);
            return `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;
        };
        const normalizedFaviconUrl = normalizeUrl(faviconUrl);

        for (const request of cachedRequests) {
            const requestUrl = normalizeUrl(request.url);

            console.log(`Checking cached request: ${request.url}`);
            console.log(`Comparing ${requestUrl} with ${normalizedFaviconUrl}`);

            if (requestUrl === normalizedFaviconUrl) {
                console.log(`Deleting cached request: ${request.url}`);
                await cache.delete(request);
                break;
            }
        }

        if (navigator.onLine) {
            await this.renderShortcuts();
        }
        else {
            await this.renderShortcuts(true);
        }
    }
}


// ========================================================================================================


// All about the ShareButton
class ShareButton {
    constructor() {
        this.shareButton = document.getElementById("shareButton");
        this.shareMessage = document.getElementById("shareMessage");
        this.textToCopy = "Temp............";

        this.shareButton.addEventListener('click', () => this.handleClick());
    }

    handleClick() {
        this.copyText();
        this.displayMessage();
    }

    copyText() {
        // Create a textarea element to copy the text to the clipboard
        var textarea = document.createElement('textarea');
        textarea.value = this.textToCopy;
        document.body.appendChild(textarea);

        // Select the text
        textarea.select();

        // Copy the text
        document.execCommand('copy');

        // Remove the textarea element
        document.body.removeChild(textarea);
    }

    displayMessage() {
        // Display the message
        this.shareMessage.style.display = 'block';

        // Hide the message after 2 seconds
        // Even if this is not written, the message will disappear after 2 seconds, but it will only work once so don't remove this.
        setTimeout(() => {
            this.shareMessage.style.display = 'none';
        }, 2000);
    }
}


// ========================================================================================================

// Calling
const image_quote = new FetchAndUpdate_quote_image();
image_quote.runEveryTime();

document.addEventListener('DOMContentLoaded', () => new SearchBar());

document.addEventListener('DOMContentLoaded', () => new Shortcuts());

document.addEventListener('DOMContentLoaded', () => new ShareButton());
