document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('resultsContainer');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const datasetFilter = document.getElementById('datasetFilter');
    const resultsInfo = document.getElementById('resultsInfo');

    let allDocs = [];

    // 1. Load data and setup the Dataset Filter
    async function loadData() {
        // Fetch all documents from your Supabase table
        const { data, error } = await _supabase
            .from('documents')
            .select('*');

        if (error) {
            console.error("Error loading library data:", error);
            return;
        }

        allDocs = data || [];

        // Populate the Dataset Filter dropdown with unique names from the DB
        const uniqueDatasets = [...new Set(allDocs.map(d => d.dataset))].sort();
        uniqueDatasets.forEach(ds => {
            if (ds) {
                const opt = new Option(ds, ds);
                datasetFilter.appendChild(opt);
            }
        });

        renderResults();
    }

    // 2. Requirement #4 & #5: Search and Filtering Logic
    function renderResults() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedDs = datasetFilter.value;

        resultsContainer.innerHTML = "";

        const filtered = allDocs.filter(doc => {
            // Search across ID, Title, and Content body
            const matchesSearch =
                doc.content.toLowerCase().includes(query) ||
                doc.title.toLowerCase().includes(query) ||
                doc.exhibit_id.toLowerCase().includes(query);

            // Filter by the selected Dataset
            const matchesDataset = (selectedDs === "all" || doc.dataset === selectedDs);

            return matchesSearch && matchesDataset;
        });

        filtered.forEach(doc => {
            const div = document.createElement('div');
            div.className = "result-item";

            // Requirement: Highlight the Exhibit ID if it matches the search query
            let displayID = doc.exhibit_id;
            let displayTitle = doc.title;

            if (query && query.length > 1) {
                const regex = new RegExp(`(${query})`, 'gi');
                displayID = displayID.replace(regex, `<span class="highlight">$1</span>`);
                displayTitle = displayTitle.replace(regex, `<span class="highlight">$1</span>`);
            }

            // Create a preview snippet of the body text
            let preview = doc.content.substring(0, 250) + "...";
            if (query && query.length > 2) {
                const regex = new RegExp(`(${query})`, 'gi');
                preview = preview.replace(regex, `<span class="highlight">$1</span>`);
            }

            // High-contrast, structured layout for the results
            div.innerHTML = `
                <div class="result-header">
                    <a href="viewer.html?id=${doc.id}" class="exhibit-link">${displayID}</a>
                    <span class="dataset-tag">${doc.dataset}</span>
                </div>
                <div class="result-title">${displayTitle}</div>
                <p class="result-preview">${preview}</p>
            `;
            resultsContainer.appendChild(div);
        });

        resultsInfo.innerText = `Showing ${filtered.length} results from the Rexstein Library.`;
    }

    // Event Listeners
    searchBtn.onclick = renderResults;
    datasetFilter.onchange = renderResults;
    searchInput.ononinput = renderResults; // Real-time search update

    // Support "Enter" key for searching
    searchInput.onkeyup = (e) => { if (e.key === "Enter") renderResults(); };

    loadData();
});