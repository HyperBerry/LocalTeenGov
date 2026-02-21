document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('resultsContainer');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const datasetFilter = document.getElementById('datasetFilter');
    const resultsInfo = document.getElementById('resultsInfo');

    let allDocs = [];

    async function loadData() {
        const { data, error } = await _supabase
            .from('documents')
            .select('*');

        if (error) {
            console.error("Error loading library data:", error);
            return;
        }

        allDocs = data || [];

        const uniqueDatasets = [...new Set(allDocs.map(d => d.dataset))].sort();
        uniqueDatasets.forEach(ds => {
            if (ds) {
                const opt = new Option(ds, ds);
                datasetFilter.appendChild(opt);
            }
        });

        renderResults();
    }

    function renderResults() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedDs = datasetFilter.value;

        resultsContainer.innerHTML = "";

        const filtered = allDocs.filter(doc => {
            const matchesSearch =
                doc.content.toLowerCase().includes(query) ||
                doc.title.toLowerCase().includes(query) ||
                doc.exhibit_id.toLowerCase().includes(query);

            const matchesDataset = (selectedDs === "all" || doc.dataset === selectedDs);

            return matchesSearch && matchesDataset;
        });

        filtered.forEach(doc => {
            const div = document.createElement('div');
            div.className = "result-item";

            let displayID = doc.exhibit_id;
            let displayTitle = doc.title;

            if (query && query.length > 1) {
                const regex = new RegExp(`(${query})`, 'gi');
                displayID = displayID.replace(regex, `<span class="highlight">$1</span>`);
                displayTitle = displayTitle.replace(regex, `<span class="highlight">$1</span>`);
            }

            let preview = doc.content.substring(0, 250) + "...";
            if (query && query.length > 2) {
                const regex = new RegExp(`(${query})`, 'gi');
                preview = preview.replace(regex, `<span class="highlight">$1</span>`);
            }

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

        const totalResults = filtered.length;
        let resultsText = "";

        if (totalResults === 0) {
            resultsText = "Showing 0 to 0 of 0 Results.";
        } else {
            resultsText = `Showing 1 to ${totalResults} of ${totalResults} Results.`;
        }

        resultsInfo.innerText = resultsText;
    }

    searchBtn.onclick = renderResults;
    datasetFilter.onchange = renderResults;
    searchInput.ononinput = renderResults;

    searchInput.onkeyup = (e) => { if (e.key === "Enter") renderResults(); };

    loadData();
});