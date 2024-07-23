document.addEventListener("DOMContentLoaded", function () {
    fetch('/build-info')
        .then(response => response.json())
        .then(data => {
            console.log('Build Info:', data);
        })
        .catch(error => {
            console.error('Error fetching build info:', error);
        });
});
