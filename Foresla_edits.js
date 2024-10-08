function handleSuggestChanges() {
    // Dölj startrutan
    document.getElementById('mainSelection').style.display = 'none';

    // Definiera de GeoJSON-filer som ska laddas in
    const geojsonFiles = {
        'Mässor': ['https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bottom_panel/Upptack/geojsonfiler/Massor.geojson'],
        'Jaktkort': ['https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bottom_panel/Upptack/geojsonfiler/jaktkort.geojson'],
        'Jaktskyttebanor': ['https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bottom_panel/Upptack/geojsonfiler/jaktskyttebanor.geojson']
    };

    // Definiera ikoner och fallback-stilar för varje kategori
    const icons = {
        'Mässor': {
            iconUrl: 'https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bilder/upptack/ikoner/ikon_massor.png',
            iconSize: [40, 40],
            fallbackStyle: {
                fallbackIconUrl: 'https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bilder/upptack/ikoner/punkt_massor.png',
                fallbackIconSize: [15, 15]
            }
        },
        'Jaktkort': {
            iconUrl: 'https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bilder/upptack/ikoner/ikon_jaktkort.png',
            iconSize: [40, 40],
            fallbackStyle: {
                fallbackIconUrl: 'https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bilder/upptack/ikoner/punkt_jaktkort.png',
                fallbackIconSize: [15, 15]
            }
        },
        'Jaktskyttebanor': {
            iconUrl: 'https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bilder/upptack/ikoner/ikon_jaktskyttebanor.png',
            iconSize: [40, 40],
            fallbackStyle: {
                fallbackIconUrl: 'https://raw.githubusercontent.com/jaktkartan/jaktkartan/main/bilder/upptack/ikoner/punkt_jaktskyttebanor.png',
                fallbackIconSize: [15, 15]
            }
        }
    };

    // Ladda och lägg till varje GeoJSON-fil på kartan
    for (let category in geojsonFiles) {
        fetch(geojsonFiles[category])
            .then(response => response.json())
            .then(data => {
                L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        let icon = L.icon({
                            iconUrl: icons[category].iconUrl,
                            iconSize: icons[category].iconSize,
                        });

                        // Skapa en markör med fallback-ikonen om den huvudsakliga ikonen inte kan laddas
                        let marker = L.marker(latlng, { icon: icon }).on('error', function() {
                            this.setIcon(L.icon({
                                iconUrl: icons[category].fallbackStyle.fallbackIconUrl,
                                iconSize: icons[category].fallbackStyle.fallbackIconSize
                            }));
                        });

                        // Lägg till en popup med attribut och ett formulär för att föreslå ändringar
                        marker.on('click', function() {
                            openEditForm(feature.properties, latlng);
                        });

                        return marker;
                    }
                }).addTo(map);  // 'map' antas vara den globala Leaflet-kartan definierad i din script.js
            })
            .catch(error => console.error('Fel vid laddning av GeoJSON-fil:', error));
    }
}

function openEditForm(properties, latlng) {
    // Lägg till latitud och longitud till properties om de inte redan finns
    if (!properties.lat || !properties.lng) {
        properties.lat = latlng.lat.toFixed(6);
        properties.lng = latlng.lng.toFixed(6);
    }

    // Rensa eventuell tidigare inmatning i formuläret
    const formContainer = document.getElementById('editFormContainer');
    formContainer.innerHTML = '';

    // Begränsa höjden till 70 % av skärmhöjden och gör den skrollbar vid behov
    formContainer.style.maxHeight = '70vh';
    formContainer.style.overflowY = 'auto';

    // Flytta formuläret längre ned på sidan
    formContainer.style.marginTop = '50px';

    // Lista över fält som ska exkluderas från redigering
    const excludedFields = ["Bild_jaktkort", "id", "Bild_jaktskyttebanor", "Bild_massor", "AKTUALITET", "lat", "lng"];

    // Skapa ett formulär med befintliga attribut som text och ett fält för föreslagna ändringar
    for (let key in properties) {
        if (excludedFields.includes(key)) {
            continue; // Hoppa över fält som inte ska visas
        }

        const fieldContainer = document.createElement('div');
        fieldContainer.style.marginBottom = '10px';

        // Skapa etikett för fältet
        const originalLabel = document.createElement('label');
        originalLabel.innerHTML = `<strong>Fält:</strong> ${key}`;

        // Skapa etikett och innehåll för befintlig text på samma rad
        const originalValueLabel = document.createElement('label');
        originalValueLabel.innerHTML = `<strong>Befintlig text:</strong> ${properties[key]}`;

        // Skapa textfält för att föreslå ändring
        const suggestionInput = document.createElement('textarea');
        suggestionInput.name = key;
        suggestionInput.placeholder = `Föreslå ändring av ${key} här...`;
        suggestionInput.rows = 3;
        suggestionInput.style.width = '100%';

        // Lägg till etikett och inmatningsfält till det nya fältets container
        fieldContainer.appendChild(originalLabel);
        fieldContainer.appendChild(document.createElement('br')); // Radbrytning
        fieldContainer.appendChild(originalValueLabel);
        fieldContainer.appendChild(document.createElement('br')); // Radbrytning
        fieldContainer.appendChild(suggestionInput);

        // Lägg till det nya fältet till formulärcontainern
        formContainer.appendChild(fieldContainer);
    }

    // Lägg till en knapp för att föreslå ny position
    const changePositionButton = document.createElement('button');
    changePositionButton.textContent = 'Ändra objektets position';
    changePositionButton.onclick = function() {
        hideFormAndEnablePositionChange(properties, formContainer);
    };
    formContainer.appendChild(changePositionButton);

    // Lägg till en knapp för att skicka in ändringsförslag
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Skicka föreslagen ändring';
    submitButton.onclick = function() {
        submitEditSuggestions(properties);
    };

    formContainer.appendChild(submitButton);

    // Visa formuläret
    formContainer.style.display = 'block';
}

function hideFormAndEnablePositionChange(properties, formContainer) {
    // Dölj formuläret
    formContainer.style.display = 'none';

    alert('Välj en ny position genom att klicka på kartan.');
    
    // Låt användaren klicka på kartan för att välja ny position
    map.once('click', function(event) {
        const newLatLng = event.latlng;

        // Uppdatera properties med den nya positionen
        properties.newLat = newLatLng.lat.toFixed(6);
        properties.newLng = newLatLng.lng.toFixed(6);

        // Placera en ny markör på den valda platsen för visuell feedback
        if (properties.tempMarker) {
            map.removeLayer(properties.tempMarker);
        }
        properties.tempMarker = L.marker(newLatLng).addTo(map);

        alert(`Ny position vald: ${newLatLng.lat.toFixed(6)}, ${newLatLng.lng.toFixed(6)}`);

        // Visa formuläret igen
        formContainer.style.display = 'block';
    });
}

function submitEditSuggestions(originalProperties) {
    const formContainer = document.getElementById('editFormContainer');
    const inputs = formContainer.getElementsByTagName('textarea');
    let suggestions = {};

    // Samla in alla ändringsförslag från formuläret
    for (let input of inputs) {
        const key = input.name;
        const newValue = input.value;

        if (newValue.trim() !== "") {
            suggestions[key] = newValue;
        }
    }

    // Lägg till latitud och longitud till originalProperties om de finns
    let extractedData = {};
    for (let key in originalProperties) {
        if (originalProperties.hasOwnProperty(key) && typeof originalProperties[key] !== 'object') {
            extractedData[key] = originalProperties[key];
        }
    }

    // Inkludera latitud och longitud om de är nödvändiga
    if (originalProperties.lat) extractedData.lat = originalProperties.lat;
    if (originalProperties.lng) extractedData.lng = originalProperties.lng;
    if (suggestions.newLat) extractedData.newLat = suggestions.newLat;
    if (suggestions.newLng) extractedData.newLng = suggestions.newLng;

    // Fyll i de dolda fälten i formuläret
    document.getElementById('originalDataInput').value = JSON.stringify(extractedData);
    document.getElementById('suggestionsDataInput').value = JSON.stringify(suggestions);

    // Skicka formuläret utan omdirigering
    fetch(document.getElementById('editSuggestionForm').action, {
        method: "POST",
        body: new FormData(document.getElementById('editSuggestionForm'))
    }).then(response => {
        if (response.ok) {
            alert("Tack för ditt förslag!");
            window.location.href = "https://jaktkartan.github.io/Jaktkartan_upptack_objektskartan/"; // Omdirigera till startsidan efter att användaren trycker på "OK"
        } else {
            alert("Något gick fel, försök igen.");
        }
    }).catch(error => {
        console.error("Nätverksfel:", error);
        alert("Ett nätverksfel uppstod. Försök igen senare.");
    });
}
