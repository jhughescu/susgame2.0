// Check for session expiration every 5 minutes
//const checkInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
const checkInterval = 10 * 1000; // 5 minutes in milliseconds

setInterval(function () {
//    console.log('checking');
    fetch('/admin/check-session')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.expired) {
                window.location.href = '/admin/loggedout'; // Redirect to the logged out page if session expired
            }
        })
        .catch(error => {
            console.error('Error checking session timeout:', error);
        });
}, checkInterval);
