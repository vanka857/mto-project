document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('search-form');
    const resultsContainer = document.getElementById('search-results-container');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Предотвращаем отправку формы

        const formData = new FormData(form);

        fetch('/navigator/search', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            resultsContainer.innerHTML = ''; // Очищаем контейнер

            if (data.error) {
                resultsContainer.innerHTML = `<p>${data.error}</p>`;
            } else {
                const [table_html, table] = createTable(data.inventories[0], 0, 'inventory-table', false);

                const inventoryTableContainer = document.createElement('div');
                inventoryTableContainer.className = 'inventory-table-container';
                inventoryTableContainer.appendChild(table_html);
                resultsContainer.appendChild(inventoryTableContainer);
            }
        })
        .catch(error => {
            resultsContainer.innerHTML = `<p>Ошибка: ${error.message}</p>`;
        });
    });
});
