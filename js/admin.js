document.addEventListener('DOMContentLoaded', async () => {
    const uploadForm = document.getElementById('uploadForm');
    const datasetSelect = document.getElementById('dataset');
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');


    (function () {
        const accessKey = prompt("Rexstein Library | Restricted Access\nPlease enter Admin Key:");

        if (accessKey !== "rexsteinFilesPswd1!") {
            alert("Invalid Key. Returning to Search.");
            window.location.href = "index.html";
        }
    })();
    async function loadDatasets() {
        const { data } = await _supabase.from('documents').select('dataset');
        if (data) {
            const unique = [...new Set(data.map(d => d.dataset))].sort();
            unique.forEach(ds => {
                if (ds) datasetSelect.add(new Option(ds, ds));
            });
        }
    }
    loadDatasets();

    uploadForm.onsubmit = async (e) => {
        e.preventDefault();

        let datasetName = datasetSelect.value;
        const files = document.getElementById('fileUpload').files;
        const title = document.getElementById('docTitle').value;
        const content = document.getElementById('docContent').value;

        // Reset status for new attempt
        status.className = ""; // Remove hidden class
        status.style.display = "block";
        status.style.backgroundColor = "#e1f5fe"; // Neutral Blue
        statusText.innerText = "Initiating upload...";

        try {
            // Requirement #6: Calculate next DataSet number
            if (datasetName === "NEW") {
                const { data } = await _supabase.from('documents').select('dataset');
                const uniqueCount = new Set(data.map(d => d.dataset)).size;
                datasetName = `DataSet ${uniqueCount + 1}`;
            }

            // Generate Exhibit ID (RKFTA###)
            const { count } = await _supabase.from('documents').select('*', { count: 'exact', head: true });
            const exhibitId = `RKFTA${String(count + 1).padStart(3, '0')}`;

            let urls = [];
            let types = [];

            // Multi-file upload loop
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const ext = f.name.split('.').pop();
                const path = `public/${exhibitId}_${i}.${ext}`;

                statusText.innerText = `Uploading file ${i + 1} of ${files.length}...`;

                const { error: uploadErr } = await _supabase.storage.from('files').upload(path, f);
                if (uploadErr) throw uploadErr;

                const { data: pUrl } = _supabase.storage.from('files').getPublicUrl(path);
                urls.push(pUrl.publicUrl);
                types.push(f.type);
            }

            // Save record to Supabase
            const { error: dbErr } = await _supabase.from('documents').insert([{
                exhibit_id: exhibitId,
                title: title,
                content: content,
                dataset: datasetName,
                file_url: urls,  // Must be _text array in DB
                file_type: types // Must be _text array in DB
            }]);

            if (dbErr) throw dbErr;

            // SUCCESS STATE: Turn Green
            status.style.backgroundColor = "#d4edda";
            status.style.color = "#155724";
            status.style.border = "1px solid #c3e6cb";
            statusText.innerText = `Successfully Generated ${exhibitId} in ${datasetName}`;

            setTimeout(() => location.reload(), 2500);

        } catch (err) {
            // ERROR STATE: Turn Red
            status.style.backgroundColor = "#f8d7da";
            status.style.color = "#721c24";
            status.style.border = "1px solid #f5c6cb";
            statusText.innerText = "Upload Failed: " + err.message;
        }
    };
});