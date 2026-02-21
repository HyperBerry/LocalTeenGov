// js/viewer.js
async function loadViewer() {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');

    if (!docId) return;

    // Use _supabase from your db.js
    const { data: doc, error } = await _supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();

    if (doc) {
        // Requirement #1: ID shown in the blue header area
        document.getElementById('viewExhibit').innerText = doc.exhibit_id;

        // Requirement: Justice.gov style title and content first
        document.getElementById('viewTitle').innerText = doc.title;
        document.getElementById('viewContent').innerText = doc.content;

        const displayArea = document.getElementById('fileDisplayArea');
        displayArea.innerHTML = "";

        // Requirement #3: Sort files vertically (Vertical Stack)
        if (doc.file_url && Array.isArray(doc.file_url)) {
            doc.file_url.forEach((url, index) => {
                const type = doc.file_type[index];
                const fileWrapper = document.createElement('div');
                fileWrapper.className = "file-wrapper"; // Styled in CSS for verticality

                if (type.includes('image')) {
                    fileWrapper.innerHTML = `<img src="${url}" alt="Document Page ${index + 1}">`;
                } else if (type.includes('pdf')) {
                    fileWrapper.innerHTML = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
                }
                displayArea.appendChild(fileWrapper);
            });
        }
    }
}

loadViewer();